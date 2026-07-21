---
name: error-tracking
description: Apply production error tracking patterns — unhandled exception capture, contextual metadata, release/version tagging, triage and grouping. Use when user asks about error monitoring, exception capture, Sentry/Datadog/Rollbar/New Relic setup, alert noise, or debugging production crashes.
---

# Error Tracking em Produção

Rastreamento de erro é um padrão único, independente da ferramenta (Sentry, Datadog, Rollbar, New Relic, Bugsnag, GlitchTip...). Quatro pilares: captura, contexto, release tagging, triagem.

## 1. Captura de exceção não tratada

Todo processo tem 3 pontos de captura obrigatórios — sem os três, erros somem silenciosamente:

| Ponto | O que cobre | Exemplo de falha se ausente |
|---|---|---|
| Global handler do processo | Exceções fora de qualquer try/catch | Processo Node/Python morre sem log; container reinicia sem rastro |
| Middleware/boundary do framework | Erros dentro do request/response lifecycle | Erro 500 genérico sem stack trace no client |
| Boundary de UI (frontend) | Erro de render que quebra a árvore de componentes | Tela branca sem nenhum evento registrado |

Checklist mínimo por processo:

- [ ] Handler global de exceção não capturada registrado no bootstrap (antes de qualquer rota/listener)
- [ ] Handler global de promise/rejeição não tratada (ex: `unhandledRejection`, `Task exception was never retrieved`)
- [ ] Middleware de erro do framework HTTP captura e reporta antes de responder ao cliente
- [ ] Erro de fila/worker/job assíncrono tem seu próprio ponto de captura — não herda o handler HTTP
- [ ] Erro capturado e **suprimido de propósito** (ex: retry esperado) usa `captureMessage`/breadcrumb, nunca silêncio total

```
# Pseudocódigo — vale para qualquer runtime
on_process_start:
  register_global_exception_handler(report_to_tracker)
  register_unhandled_rejection_handler(report_to_tracker)

on_http_request_error:
  report_to_tracker(error, context=request_context)
  respond_generic_error_to_client()  # nunca stack trace cru pro cliente

on_background_job_error:
  report_to_tracker(error, context=job_context)
  decide_retry_or_dead_letter()
```

Regra dura: **nunca engolir um catch vazio**. Se o erro é esperado e tratado, ainda assim registra como evento de baixa severidade (breadcrumb/info) — silêncio total impede detectar quando o "esperado" vira frequente.

## 2. Contexto anexado

Sem contexto, um stack trace é só ruído. Todo evento reportado precisa carregar:

- **Identificador de request/trace** — mesmo ID usado no log estruturado (correlação log ↔ erro)
- **Tenant/owner** — id, nunca nome/domínio se for PII
- **Usuário** — id interno, nunca email/nome/CPF/telefone
- **Ambiente e release** — production/staging, versão do deploy
- **Rota/operação** — endpoint, nome do job, nome do comando
- **Breadcrumbs** — passos anteriores ao erro (queries, chamadas externas, mudanças de estado)

```
# Pseudocódigo de enriquecimento por request
on_request_start:
  tracker.set_context({
    request_id: req.id,          # mesmo id do log estruturado
    tenant_id: req.tenant.id,
    user_id: req.user.id,        # nunca req.user.email
    route: req.route,
  })
```

Regra de PII: se o dado não pode aparecer em log estruturado, não pode aparecer em contexto de erro. Mesma política, mesmo `scrubber`/`beforeSend` de filtro. Ferramentas de tracking geralmente oferecem hook de sanitização antes do envio (`beforeSend`, `before_send`, `ScrubData`) — usar sempre, nunca confiar em "não vou logar isso" manual espalhado no código.

## 3. Release / version tagging

Todo evento precisa apontar exatamente para qual build/commit ele veio — senão triagem vira arqueologia.

- [ ] `release` = commit SHA curto ou `versao-semver+build` (não "latest", não vazio)
- [ ] Deploy pipeline injeta o release no tracker (env var no build/deploy step, não hardcoded)
- [ ] Source maps / debug symbols enviados no mesmo passo do deploy, associados ao mesmo release — sem isso, stack trace de frontend minificado é ilegível
- [ ] Cada deploy marca o "início" do release no tracker (permite comparar taxa de erro antes/depois)

```
# Passo de CI/CD — vale pra qualquer stack
export RELEASE_ID=$(git rev-parse --short HEAD)
tracker-cli releases new "$RELEASE_ID"
tracker-cli releases set-commits "$RELEASE_ID" --auto
build_app()
tracker-cli releases upload-artifacts "$RELEASE_ID" ./dist
tracker-cli releases finalize "$RELEASE_ID"
deploy(RELEASE_ID)
tracker-cli releases deploys new "$RELEASE_ID" --env production
```

Sem release tagging, a pergunta "esse erro começou no deploy de hoje ou já existia?" não tem resposta.

## 4. Triagem — severidade, agrupamento, ruído vs. sinal

**Severidade** — nível de alerta proporcional a impacto real, não ao tipo de exceção:

| Nível | Critério | Ação |
|---|---|---|
| Crítico | Fluxo de pagamento/auth quebrado, taxa de erro em pico | Alerta imediato |
| Erro | Exceção não tratada afetando usuário, sem crash total | Alerta em canal, revisão no dia |
| Warning | Erro tratado/recuperável, mas indica degradação (retry, timeout, fallback acionado) | Revisão em batch, sem alerta síncrono |
| Info | Evento esperado registrado para auditoria | Sem alerta, só visibilidade |

**Agrupamento** — eventos devem agrupar por assinatura estável (tipo + local do erro + stack normalizado), não por mensagem literal:

- ❌ Agrupar por mensagem crua (`"Cannot read property 'id' of undefined at line 42"`) — cada valor de dado gera um grupo novo
- ✅ Fingerprint customizado quando a ferramenta agrupa errado: normalizar IDs/valores dinâmicos da mensagem antes de gerar o grupo

**Ruído vs. sinal** — antes de qualquer alerta síncrono, perguntar:

- Esse erro é acionável agora, ou é ruído de terceiro (timeout de serviço externo já com retry)?
- Esse erro se repete em volume alto e constante (sinal de bug estrutural) ou é pico isolado (deploy ruim, incidente externo)?
- Existe uma regra de silenciamento/agrupamento para erros conhecidos e já triados (ex: erro de biblioteca externa sem fix disponível), para não reabrir triagem manual toda vez?

Checklist de triagem periódica:

- [ ] Zero exceções não categorizadas (sem severidade/assignee) acumulando
- [ ] Alertas síncronos só disparam para severidade crítico/erro — warning/info nunca acordam ninguém
- [ ] Erros conhecidos e sem fix imediato têm ticket vinculado e status "aceito", não ficam reabrindo alerta
- [ ] Taxa de erro por release comparada com o release anterior (regressão vs. ruído de fundo)

## Correlação com logging

Error tracker e logs estruturados devem compartilhar o mesmo `request_id`/`trace_id`. Um evento de erro sem log associado (ou vice-versa) quebra a investigação — ao configurar o tracker, garantir que o campo de correlação é o mesmo emitido no logger da aplicação (ver skill `structured-logging`).

## Exemplos por stack

**Vite/React ou Next.js (Sentry)**
```ts
// instrumentation.ts
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_RELEASE_ID,
  beforeSend(event) {
    delete event.user?.email; // scrub PII, mantém user.id
    return event;
  },
});
```

**NestJS (Sentry + filtro global)**
```ts
@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    Sentry.captureException(exception, {
      tags: { request_id: host.switchToHttp().getRequest().id },
    });
    // ... resposta genérica ao cliente
  }
}
```

**Python (Rollbar/Datadog)**
```python
import rollbar
rollbar.init(access_token, environment="production",
              code_version=os.environ["RELEASE_ID"])

try:
    process_job()
except Exception:
    rollbar.report_exc_info(extra_data={"tenant_id": tenant.id})
    raise
```

## Anti-patterns

- ❌ Catch vazio ou `console.log` sem reportar ao tracker
- ❌ Contexto com PII crua (email, nome, CPF) em vez de IDs
- ❌ Release tag ausente, vazia ou fixa em "latest"
- ❌ Deploy sem upload de source maps/debug symbols associado ao release
- ❌ Agrupamento por mensagem literal em vez de fingerprint normalizado
- ❌ Alerta síncrono disparando para severidade warning/info
- ❌ Erro de job/worker assíncrono sem ponto de captura próprio
- ❌ `request_id` do tracker divergente do `request_id` usado no log estruturado
- ❌ Erros conhecidos sem triagem reabrindo alerta repetidamente sem ticket vinculado
