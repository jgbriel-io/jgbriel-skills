---
name: structured-logging
description: Apply structured (JSON) logging practices — log levels, request/tenant correlation IDs, context propagation, and what must never be logged (PII, secrets, tokens). Use when user asks about logging, log format, correlation ID, request tracing, or what data is safe to log.
---

# Structured Logging

A log line is data, not loose text. Each one is a JSON event with fixed fields,
searchable and correlatable — never an interpolated sentence.

```
// ❌ free-text logging
log("User 123 logged in at 14:32 on tenant acme")

// ✅ structured
log.info("user_login", { user_id: "123", tenant_id: "acme", ts: "2026-07-14T14:32:00Z" })
```

## Why structured

- Free text needs regex and grep to extract anything; JSON can be queried directly
  in the aggregator (Loki, Datadog, CloudWatch Insights, ELK).
- A field with a fixed name (`user_id`, not "user" and "uid" alternating) is what
  makes a dashboard or an alert trustworthy.
- Without structure every developer invents a format, and correlation across
  services becomes impossible.

## Anatomy of an event

Every event carries at least:

| Field | Required | Example |
|---|---|---|
| `timestamp` | Yes | `2026-07-14T14:32:00.123Z` (ISO 8601, UTC) |
| `level` | Yes | `info`, `warn`, `error` |
| `message` | Yes | A short, stable event key: `"order_created"` |
| `request_id` | Yes, where there is a request | The request's correlation id |
| `tenant_id`/`owner_id` | Yes, in multi-tenant systems | Isolation and per-client filtering |
| `service` | Yes | The emitting service or process |
| Context fields | As the event needs | `order_id`, `duration_ms`, `status_code` |

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

## Levels

- `debug` — development detail, off in production by default
- `info` — meaningful business events: a creation, a state change, an external call
- `warn` — something unexpected but recoverable: a retry, a fallback, missing config
  that fell back to a default
- `error` — a failure that stops the flow, always with a stack trace and enough
  context to reproduce it
- Never `error` for user input validation. That is `info` or `warn`; the system did
  not fail.
- Never log at `info` what belongs at `debug` — that is the main source of noise
  and of aggregator cost.

## Correlation: request id and tenant id

Every request entering the system receives, or propagates from upstream, a
`request_id`. That id:

1. Is generated or read at the boundary — middleware or an interceptor — once per
   request
2. Travels in the execution context, not in a global and not as a manual parameter
   on every function
3. Reaches downstream services through a header (`X-Request-Id` or `traceparent`)
4. Appears in **every** log emitted during that request, without exception

```
// ❌ the correlation id passed by hand to every log
function processOrder(orderId, requestId) {
  log.info("processing", { requestId, orderId })
  validate(orderId, requestId)   // and forwarded on every call
}

// ✅ the correlation id lives in the request context — thread-local, contextvar,
// AsyncLocalStorage, request-scoped DI — and the logger injects it
function processOrder(orderId) {
  log.info("processing", { orderId })   // request_id is already in context
}
```

`tenant_id`/`owner_id` follows the same rule in multi-tenant systems: extracted
once at auth or middleware, propagated in the same context as the `request_id`.
Without it, debugging one client's incident means grepping by hand through
millions of lines.

Without correlation, a production error becomes archaeology: there is no way to
know which of service B's logs belong to the request that failed in service A.

## What must NEVER be logged

This is where logging meets security directly: PII in a log is a security
incident, not an observability bug.

- ❌ Passwords, tokens, API keys, secrets, session cookies — not even partially
  masked
- ❌ CPF/CNPJ, card numbers, full bank details
- ❌ An end user's email, phone or full address — use a `user_id` or a hash instead
- ❌ A full request or response body with no sanitisation; signup and payment
  payloads carry PII
- ❌ Authorization headers (`Authorization`, `Cookie`, `X-Api-Key`), not even in an
  integration error log
- ✅ To correlate a user, log `user_id` — the internal identifier, never the personal
  data itself
- ✅ To debug a payload, log the keys present, or a redacted version
  (`{ email: "[REDACTED]" }`)

```
// ❌
log.error("login_failed", { email: "joao@client.com", password: "abc123" })

// ✅
log.error("login_failed", { user_id: "usr_442", reason: "invalid_credentials" })
```

Configuring automatic redaction in the logger — a list of sensitive keys masked
before serialisation — is safer than relying on every `log.info` being written
carefully. Every stack has the mechanism; see the examples below.

## Errors

Always log an error with its stack trace and root cause, never the message alone:

```
// ❌
log.error("something went wrong")

// ✅
log.error("order_processing_failed", {
  error: err.message,
  stack: err.stack,
  order_id: orderId,
  request_id: requestId,
})
```

An expected error (a 4xx, a business rule) and an unexpected one (a 5xx, an
unhandled exception) deserve different levels. Treating both as a generic `error`
turns the error alert into constant noise.

## Volume and performance

- Logging in production costs I/O, ingestion and storage. Do not log inside a tight
  loop, or once per item of a large collection.
- Sample very high-volume, low-individual-value events — one in a hundred
  health-check requests.
- Synchronous blocking logging on the hot path is an anti-pattern; use an
  asynchronous or buffered transport.

## Review checklist

- [ ] Logs are structured JSON, not interpolated strings
- [ ] `request_id` present on every log within one request
- [ ] `tenant_id`/`owner_id` present in multi-tenant systems
- [ ] No PII, secret or token in any log, including error logs
- [ ] The level (`debug`/`info`/`warn`/`error`) matches real severity
- [ ] Errors always carry a stack trace and context, not just a message
- [ ] Automatic redaction configured in the logger, rather than relying on discipline

## By stack

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

The pattern — JSON, correlation, redaction, levels — is identical across stacks.
Only the library changes: pino, structlog, Serilog, Logback/SLF4J with MDC,
zerolog in Go.

## Anti-patterns

- ❌ Interpolated free-text logs (`console.log("user " + id + " logged in")`)
- ❌ No `request_id` or `tenant_id` correlating events across services
- ❌ PII, a password, a token or an auth header in any log, errors included
- ❌ Using `error` for user input validation
- ❌ `console.log`/`print` in production instead of the configured logger
- ❌ Propagating the correlation id by parameter instead of through context
- ❌ Logging a full request or response body with no sanitisation
- ❌ `debug` enabled in production by default
