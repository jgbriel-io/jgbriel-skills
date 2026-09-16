---
name: structured-logging
description: Apply structured (JSON) logging practices — log levels, request/tenant correlation IDs, context propagation, and what must never be logged (PII, secrets, tokens). Use when user asks about logging, log format, correlation ID, request tracing, or what data is safe to log.
---

# Structured Logging

Log é dado, não texto solto. Cada linha de log é um evento JSON com campos fixos, pesquisável e correlacionável — nunca uma frase interpolada.

```
// ❌ log de texto livre
log("Usuário 123 fez login às 14:32 no tenant acme")

// ✅ log estruturado
log.info("user_login", { user_id: "123", tenant_id: "acme", ts: "2026-07-14T14:32:00Z" })
```

## Por que estruturado

- Texto livre exige regex/grep para extrair dado; JSON permite query direta no agregador (Loki, Datadog, CloudWatch Insights, ELK)
- Campo com nome fixo (`user_id`, não "usuário" ou "uid" alternando) permite dashboard e alerta confiável
- Sem estrutura, cada dev inventa um formato — correlação entre serviços fica impossível

## Anatomia do log

Todo evento carrega, no mínimo:

| Campo | Obrigatório | Exemplo |
|---|---|---|
| `timestamp` | sim | `2026-07-14T14:32:00.123Z` (ISO 8601, UTC) |
| `level` | sim | `info`, `warn`, `error` |
| `message` | sim | chave de evento, curta e estável: `"order_created"` |
| `request_id` | sim (se houver request) | id de correlação da requisição |
| `tenant_id`/`owner_id` | sim (se multi-tenant) | isolamento e filtro por cliente |
| `service` | sim | nome do serviço/processo emissor |
| campos de contexto | conforme o evento | `order_id`, `duration_ms`, `status_code` |

```json
{
  "timestamp": "2026-07-14T14:32:00.123Z",
  "level": "error",
  "message": "payment_failed",
  "request_id": "8f3e1c2a-...",
  "tenant_id": "acme",
  "service": "billing-api",
  "order_id": "ord_9182",
  "error_code": "card_declined",
  "duration_ms": 412
}
```

## Níveis de log

- `debug` — detalhe de desenvolvimento, desligado em produção por padrão
- `info` — eventos de negócio relevantes (criação, mudança de estado, integração externa chamada)
- `warn` — algo inesperado mas recuperável (retry, fallback usado, config ausente com default)
- `error` — falha que impede o fluxo; sempre inclui stack trace e contexto suficiente pra reproduzir
- Nunca usar `error` para validação de input do usuário (isso é `info`/`warn` — não é falha do sistema)
- Nunca logar em `info` o que deveria ser `debug` — isso é o principal causador de ruído e custo de agregador

## Correlação: request-id e tenant-id

Todo request que entra no sistema recebe (ou propaga, se já vier de upstream) um `request_id`. Esse id:

1. É gerado/lido na borda (middleware/interceptor), uma vez por requisição
2. É propagado no contexto de execução (não em variável global nem parâmetro manual em cada função)
3. Viaja para serviços downstream via header (`X-Request-Id` ou `traceparent`)
4. Aparece em **todo** log emitido durante aquela requisição, sem exceção

```
// ❌ id de correlação como parâmetro manual em cada log
function processOrder(orderId, requestId) {
  log.info("processing", { requestId, orderId })
  validate(orderId, requestId)   // precisa repassar em toda chamada
}

// ✅ id de correlação vive no contexto da requisição (thread-local, contextvar,
// AsyncLocalStorage, request-scoped DI) e o logger o injeta automaticamente
function processOrder(orderId) {
  log.info("processing", { orderId })   // request_id já está no contexto
}
```

`tenant_id`/`owner_id` segue a mesma lógica em sistemas multi-tenant: extraído uma vez (auth/middleware) e propagado no mesmo contexto do `request_id`. Sem isso, debugar um incidente de um cliente específico exige grep manual em milhões de linhas.

Sem correlação, um erro em produção vira arqueologia: não dá pra saber que log de "serviço B" pertence à mesma requisição que gerou o erro em "serviço A".

## O que NUNCA logar

Isso é o cruzamento direto com segurança — vazamento de PII em log é incidente de segurança, não bug de observabilidade.

- ❌ Senha, token, API key, secret, cookie de sessão — mesmo mascarado parcialmente, não logar
- ❌ CPF/CNPJ, número de cartão, dados bancários completos
- ❌ Email, telefone, endereço completo do usuário final (usar `user_id`/hash como referência)
- ❌ Corpo completo de request/response sem sanitização (payloads de cadastro, pagamento, etc. costumam carregar PII)
- ❌ Headers de autorização (`Authorization`, `Cookie`, `X-Api-Key`) — nem em log de erro de integração
- ✅ Se precisar correlacionar um usuário, logar `user_id` (identificador interno), nunca o dado pessoal em si
- ✅ Se precisar depurar um payload, logar apenas as chaves presentes ou uma versão redigida (`{ email: "[REDACTED]" }`)

```
// ❌
log.error("login_failed", { email: "joao@cliente.com", password: "abc123" })

// ✅
log.error("login_failed", { user_id: "usr_442", reason: "invalid_credentials" })
```

Configurar redaction automática no logger (lista de chaves sensíveis mascaradas antes de serializar) é mais seguro do que confiar em disciplina manual de cada `log.info` — todo stack tem esse mecanismo (ver exemplos abaixo).

## Erros

Sempre logar erro com stack trace e causa raiz, nunca só a mensagem:

```
// ❌
log.error("deu erro")

// ✅
log.error("order_processing_failed", {
  error: err.message,
  stack: err.stack,
  order_id: orderId,
  request_id: requestId,
})
```

Erro esperado (4xx de validação, negócio) e erro inesperado (5xx, exceção não tratada) merecem níveis diferentes — não tratar os dois como `error` genérico, senão alerta de erro vira ruído constante.

## Performance e volume

- Logar em produção tem custo (I/O, ingestão, armazenamento) — não logar em loop apertado ou por item de coleção grande
- Amostragem (sampling) para eventos de altíssimo volume e baixo valor individual (ex: 1 a cada 100 requisições de health-check)
- Log síncrono bloqueante na hot path é anti-pattern — usar transporte assíncrono/buffered

## Checklist de revisão

- [ ] Log é JSON estruturado, não string interpolada
- [ ] `request_id` presente em todo log de uma mesma requisição
- [ ] `tenant_id`/`owner_id` presente quando o sistema é multi-tenant
- [ ] Nenhum campo de PII/secret/token em nenhum log, nem em erro
- [ ] Nível (`debug`/`info`/`warn`/`error`) condiz com a severidade real
- [ ] Erro sempre com stack trace e contexto (não só mensagem)
- [ ] Redaction automática configurada no logger, não dependente de disciplina manual

## Exemplos por stack

**Node.js (pino):**
```js
const logger = pino({ redact: ['req.headers.authorization', 'password'] });
const child = logger.child({ request_id: requestId, tenant_id: tenantId });
child.info({ order_id: orderId }, 'order_created');
```

**Python (structlog):**
```python
logger = structlog.get_logger()
log = logger.bind(request_id=request_id, tenant_id=tenant_id)
log.info("order_created", order_id=order_id)
```

**.NET (Serilog):**
```csharp
Log.ForContext("RequestId", requestId)
   .ForContext("TenantId", tenantId)
   .Information("Order created {OrderId}", orderId);
```

O padrão (JSON, correlação, redaction, níveis) é idêntico entre stacks — muda apenas a biblioteca (pino, structlog, Serilog, Logback/SLF4J com MDC, zerolog em Go).

## Anti-patterns

- ❌ Log de texto livre interpolado (`console.log("user " + id + " logged in")`)
- ❌ Ausência de `request_id`/`tenant_id` correlacionando eventos entre serviços
- ❌ PII, senha, token ou header de auth em qualquer log, incluso em erro
- ❌ Usar `error` para validação de input do usuário
- ❌ `console.log`/`print` direto em produção em vez do logger configurado da aplicação
- ❌ Propagar id de correlação manualmente por parâmetro em vez de contexto/async-local
- ❌ Logar payload completo de request/response sem sanitização
- ❌ Nível `debug` habilitado em produção por padrão
