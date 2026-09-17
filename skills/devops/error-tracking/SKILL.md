---
name: error-tracking
description: Apply production error tracking patterns — unhandled exception capture, contextual metadata, release/version tagging, triage and grouping. Use when user asks about error monitoring, exception capture, Sentry/Datadog/Rollbar/New Relic setup, alert noise, or debugging production crashes.
---

# Production Error Tracking

Error tracking is one pattern, independent of the tool — Sentry, Datadog, Rollbar,
New Relic, Bugsnag, GlitchTip. Four pillars: capture, context, release tagging,
triage.

## 1. Capturing unhandled exceptions

Every process needs three capture points. Without all three, errors vanish
silently:

| Point | What it covers | What goes missing without it |
|---|---|---|
| The process's global handler | Exceptions outside any try/catch | The process dies with no log; the container restarts leaving no trace |
| The framework's middleware or boundary | Errors inside the request lifecycle | A generic 500 with no stack trace anywhere |
| The UI boundary (frontend) | A render error that breaks the component tree | A blank screen and no recorded event |

Minimum checklist per process:

- [ ] A global uncaught-exception handler registered at bootstrap, before any route or listener
- [ ] A global handler for unhandled promise rejections (`unhandledRejection`, "Task exception was never retrieved")
- [ ] The HTTP framework's error middleware captures and reports before responding
- [ ] Queue, worker and job errors have their own capture point; they do not inherit the HTTP handler
- [ ] An error caught and **suppressed on purpose** (an expected retry) still leaves a `captureMessage` or a breadcrumb, never total silence

```
# Pseudocode — the same in any runtime
on_process_start:
  register_global_exception_handler(report_to_tracker)
  register_unhandled_rejection_handler(report_to_tracker)

on_http_request_error:
  report_to_tracker(error, context=request_context)
  respond_generic_error_to_client()  # never a raw stack trace to the client

on_background_job_error:
  report_to_tracker(error, context=job_context)
  decide_retry_or_dead_letter()
```

The hard rule: **never swallow a catch**. If the error is expected and handled,
record it as a low-severity event anyway. Total silence is what stops you noticing
when "expected" becomes frequent.

## 2. Attached context

Without context, a stack trace is noise. Every reported event carries:

- **A request or trace id** — the same one used in structured logs, so log and
  error correlate
- **Tenant or owner** — the id, never a name or domain if that is personal data
- **User** — the internal id, never an email, name, CPF or phone number
- **Environment and release** — production or staging, and the deployed version
- **Route or operation** — the endpoint, the job's name, the command
- **Breadcrumbs** — the steps before the error: queries, external calls, state
  changes

```
# Pseudocode: enrichment per request
on_request_start:
  tracker.set_context({
    request_id: req.id,          # the same id the structured log uses
    tenant_id: req.tenant.id,
    user_id: req.user.id,        # never req.user.email
    route: req.route,
  })
```

The PII rule: what cannot appear in a structured log cannot appear in error
context. Same policy, same scrubber. Tracking tools offer a sanitisation hook
before sending (`beforeSend`, `before_send`, `ScrubData`) — use it, rather than
trusting scattered manual care.

## 3. Release and version tagging

Every event must point at exactly which build it came from, or triage becomes
archaeology.

- [ ] `release` is a short commit SHA, or `semver+build`. Never "latest", never empty
- [ ] The deploy pipeline injects the release into the tracker, through a build or deploy environment variable rather than hardcoding it
- [ ] Source maps and debug symbols are uploaded in the same deploy step, tied to the same release; without them a minified frontend stack trace is unreadable
- [ ] Each deploy marks the release's start in the tracker, so error rates before and after can be compared

```
# A CI/CD step — the same shape in any stack
export RELEASE_ID=$(git rev-parse --short HEAD)
tracker-cli releases new "$RELEASE_ID"
tracker-cli releases set-commits "$RELEASE_ID" --auto
build_app()
tracker-cli releases upload-artifacts "$RELEASE_ID" ./dist
tracker-cli releases finalize "$RELEASE_ID"
deploy(RELEASE_ID)
tracker-cli releases deploys new "$RELEASE_ID" --env production
```

Without release tagging, "did this error start with today's deploy, or was it
already there?" has no answer.

## 4. Triage — severity, grouping, signal vs noise

**Severity** is proportional to real impact, not to the kind of exception:

| Level | Criterion | Action |
|---|---|---|
| Critical | Payment or auth flow broken, error rate spiking | Immediate alert |
| Error | An unhandled exception affecting users, short of a total crash | Alert to a channel, reviewed the same day |
| Warning | A handled, recoverable error that still signals degradation — retries, timeouts, a fallback firing | Reviewed in batch, no synchronous alert |
| Info | An expected event recorded for audit | No alert, visibility only |

**Grouping** happens by a stable signature — the error type, its location and a
normalised stack — not by the literal message:

- ❌ Grouping by the raw message (`"Cannot read property 'id' of undefined at line 42"`): every data value spawns a new group
- ✅ A custom fingerprint when the tool groups badly: normalise dynamic ids and values out of the message before grouping

**Signal vs noise** — before any synchronous alert, ask:

- Is this actionable now, or is it third-party noise already covered by a retry?
- Does it repeat at high, constant volume (a structural bug) or is it an isolated
  spike (a bad deploy, an external incident)?
- Is there a silencing or grouping rule for known, already-triaged errors — an
  external library bug with no fix — so triage does not reopen every time?

Periodic triage checklist:

- [ ] No uncategorised exceptions piling up without a severity or an owner
- [ ] Synchronous alerts fire only for critical and error; warning and info never wake anyone
- [ ] Known errors with no immediate fix carry a linked ticket and an "accepted" status rather than reopening alerts
- [ ] Error rate per release compared against the previous one, separating a regression from background noise

## Correlation with logging

The `request_id`/`trace_id` is the one the logs use; its format and propagation are
`structured-logging`, and what must never be logged applies here unchanged. The
error tracker and the structured logs share that id. An error event with no
matching log — or the reverse — breaks the investigation, so when configuring the
tracker, make sure the correlation field is exactly what the application's logger
emits.

## By stack

**Vite/React or Next.js (Sentry)**
```ts
// instrumentation.ts
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_RELEASE_ID,
  beforeSend(event) {
    delete event.user?.email; // scrub PII, keep user.id
    return event;
  },
});
```

**NestJS (Sentry plus a global filter)**
```ts
@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    Sentry.captureException(exception, {
      tags: { request_id: host.switchToHttp().getRequest().id },
    });
    // ... generic response to the client
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

- ❌ An empty catch, or a `console.log` with nothing reported to the tracker
- ❌ Context carrying raw PII (email, name, CPF) instead of ids
- ❌ A release tag that is missing, empty or pinned to "latest"
- ❌ A deploy with no source maps or debug symbols tied to the release
- ❌ Grouping by literal message instead of a normalised fingerprint
- ❌ Synchronous alerts firing on warning or info severity
- ❌ Job and worker errors with no capture point of their own
- ❌ The tracker's `request_id` differing from the one in the structured logs
- ❌ Known, untriaged errors reopening alerts repeatedly with no linked ticket
