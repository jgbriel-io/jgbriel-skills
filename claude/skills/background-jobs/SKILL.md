---
name: background-jobs
description: Designs asynchronous background work — job queues, retry/backoff policies, idempotency keys, dead-letter handling — independent of language or queue library. Use when user asks about background jobs, task queues, async processing, retries, idempotency, dead-letter queues, or mentions BullMQ, Celery, Sidekiq, Hangfire, SQS, Supabase Edge Functions with pg_cron.
---

# Trabalho Assíncrono / Background Jobs

## Princípio

Se o processamento não precisa de resposta imediata pro usuário, ele não deve bloquear o request. Envio de email, geração de relatório, cobrança, sincronização com serviço externo — tudo isso vira job enfileirado, não chamada síncrona dentro do handler HTTP.

```
// ❌ Request espera o trabalho pesado terminar
handler(req):
  sendWelcomeEmail(user)       // chamada de rede lenta
  generateInvoicePdf(order)    // CPU-bound
  return 200(order)

// ✅ Request enfileira e responde na hora
handler(req):
  queue.enqueue('send-welcome-email', { userId: user.id })
  queue.enqueue('generate-invoice', { orderId: order.id })
  return 202(order)
```

Regra geral: se a operação pode falhar por causa de sistema externo, demora mais que ~1s, ou não afeta a resposta que o cliente precisa ver agora, ela é candidata a job.

## Anatomia de um job

| Elemento | Responsabilidade |
|---|---|
| Producer | Enfileira o job com payload mínimo (IDs, não objetos inteiros) |
| Fila/broker | Armazena, ordena, distribui pros workers |
| Worker/consumer | Processa, decide sucesso/retry/falha definitiva |
| Dead-letter queue (DLQ) | Guarda job que esgotou tentativas, pra investigação manual |

```
// ❌ Payload carrega o objeto inteiro — pode estar desatualizado quando o job rodar
queue.enqueue('process-order', { order: fullOrderObject })

// ✅ Payload carrega referência — worker busca o estado atual
queue.enqueue('process-order', { orderId: order.id })
```

## Idempotência

Job pode rodar mais de uma vez — broker reentrega por timeout, worker crasha depois de processar mas antes de confirmar, retry manual. Processar o mesmo job duas vezes não pode duplicar efeito.

```
// ❌ Rodar duas vezes cobra o cliente duas vezes
function processPayment(job):
  charge(job.customerId, job.amount)

// ✅ Chave de idempotência garante efeito único
function processPayment(job):
  if paymentLedger.exists(job.idempotencyKey):
    return paymentLedger.get(job.idempotencyKey)  // já processado, retorna resultado anterior
  result = charge(job.customerId, job.amount)
  paymentLedger.save(job.idempotencyKey, result)
  return result
```

- Toda operação com efeito colateral externo (cobrança, envio, criação de recurso) precisa de chave de idempotência — gerada pelo producer, não pelo worker.
- Guardar a chave num storage durável (tabela, Redis com TTL) antes de confirmar sucesso — não depois.
- Idempotência não é "só não rodar duas vezes ao mesmo tempo" (isso é lock/concorrência) — é "rodar N vezes tem o mesmo efeito de rodar 1 vez".

## Retries e backoff

Falha transitória (timeout de rede, rate limit, serviço externo fora do ar) merece retry automático. Falha permanente (payload inválido, recurso que não existe) não — retry só adia o inevitável e polui a fila.

```
// ❌ Retry imediato e infinito — amplifica outage em vez de aliviar
function onFailure(job):
  queue.enqueue(job)  // volta pro fim da fila na hora, sem limite

// ✅ Backoff exponencial com limite de tentativas
function onFailure(job, attempt):
  if attempt >= MAX_ATTEMPTS:
    deadLetterQueue.push(job, reason: lastError)
    return
  delay = min(baseDelay * 2 ** attempt, maxDelay) + jitter()
  queue.enqueueDelayed(job, delay)
```

- Backoff exponencial + jitter — sem jitter, todos os jobs que falharam juntos tentam de novo juntos (thundering herd).
- Distinguir erro retryable de não-retryable no worker: erro de validação/4xx não entra no ciclo de retry, vai direto pra DLQ ou é descartado com log.
- Limite de tentativas é obrigatório — sem ele, job problemático fica reprocessando pra sempre e mascara o alerta real.

## Dead-letter queue

Todo job que esgota as tentativas vai pra uma fila separada, não é descartado silenciosamente.

- DLQ existe pra ter visibilidade e permitir reprocessamento manual depois de corrigir a causa — não é lixeira.
- Alertar quando DLQ recebe item novo; DLQ crescendo sem ninguém olhar é falha de operação, não só de código.
- Job na DLQ guarda payload original + motivo da falha final + histórico de tentativas — sem isso a investigação vira arqueologia.

## Ordenação e concorrência

- Jobs relacionados que precisam rodar em ordem (ex.: eventos do mesmo pedido) vão pra uma fila/partição por chave de agrupamento — não confiar em ordem global da fila.
- Dois workers não podem processar o mesmo recurso ao mesmo tempo quando a operação não é idempotente por si só — usar lock distribuído ou fila particionada por `resourceId`.
- Concorrência do worker (quantos jobs em paralelo) é limitada de propósito — sem limite, um pico de fila derruba o serviço externo que os jobs chamam.

## Observabilidade mínima

- Cada job loga: id, tipo, tentativa atual, duração, resultado (ver `structured-logging`).
- Métricas de fila: tamanho da fila, idade do job mais antigo (lag), taxa de erro, taxa de item indo pra DLQ.
- Job que trava (nem sucesso nem falha por muito tempo) precisa de timeout explícito — sem timeout, ele ocupa o worker indefinidamente.

## Checklist

- [ ] Toda chamada lenta/externa/não-crítica-pra-resposta virou job enfileirado, não chamada síncrona no handler
- [ ] Payload do job carrega referência (ID), não o objeto inteiro
- [ ] Operação com efeito colateral externo tem chave de idempotência persistida antes de confirmar sucesso
- [ ] Retry com backoff exponencial + jitter, com limite máximo de tentativas
- [ ] Erro não-retryable (validação, 4xx) não entra no ciclo de retry
- [ ] Job que esgota tentativas vai pra DLQ com payload + motivo + histórico, nunca é descartado silenciosamente
- [ ] Alerta configurado para item novo na DLQ
- [ ] Jobs que dependem de ordem usam fila/partição por chave de agrupamento
- [ ] Worker tem timeout explícito por job
- [ ] Concorrência do worker é limitada, não ilimitada

## Exemplos por stack

**BullMQ (Node/TS, Redis)**
```ts
await queue.add('send-invoice', { orderId }, {
  jobId: `invoice-${orderId}`,        // idempotência: mesmo jobId não duplica
  attempts: 5,
  backoff: { type: 'exponential', delay: 2000 },
});
// job que falha 5x vai automaticamente pra fila de "failed", monitorada à parte
```

**Supabase (pg_cron + Edge Function, sem broker dedicado)**
```sql
-- pg_cron dispara periodicamente, a function processa fila em tabela própria
select cron.schedule('process-jobs', '*/1 * * * *',
  $$select net.http_post(url := 'https://<project>.supabase.co/functions/v1/process-jobs')$$
);
```
```sql
-- fila como tabela: status + tentativas + idempotency_key evitam duplicação
create table jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb not null,
  status text not null default 'pending', -- pending/processing/done/dead
  attempts int not null default 0,
  idempotency_key text unique
);
```

**Celery (Python, Redis/RabbitMQ)**
```python
@app.task(bind=True, max_retries=5, default_retry_delay=10)
def send_invoice(self, order_id):
    try:
        charge_and_send(order_id, idempotency_key=f"invoice-{order_id}")
    except TransientError as exc:
        raise self.retry(exc=exc, countdown=2 ** self.request.retries * 10)
```

**Sidekiq (Ruby)**
```ruby
class SendInvoiceJob
  include Sidekiq::Job
  sidekiq_options retry: 5

  def perform(order_id)
    key = "invoice-#{order_id}"
    return if InvoiceLedger.exists?(key)
    InvoiceLedger.record(key) { charge_and_send(order_id) }
  end
end
# job esgotado cai na Dead Set (sidekiq_options retry: 5), visível na UI/API do Sidekiq
```

## Anti-patterns

- ❌ Chamada lenta/externa dentro do request síncrono em vez de enfileirada
- ❌ Payload de job com objeto inteiro em vez de referência/ID
- ❌ Operação com efeito colateral sem chave de idempotência
- ❌ Retry imediato sem backoff, ou sem limite de tentativas
- ❌ Erro de validação (payload inválido) entrando no mesmo ciclo de retry de erro transitório
- ❌ Job esgotado descartado silenciosamente em vez de ir pra DLQ
- ❌ DLQ sem alerta — ninguém percebe que jobs estão falhando
- ❌ Worker sem timeout, travando em job que nunca termina
- ❌ Concorrência do worker sem limite, derrubando serviço externo dependente
- ❌ Jobs que dependem de ordem processados numa fila sem particionamento por chave
