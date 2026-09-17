---
name: health-checks-metrics
description: Apply health check (readiness vs. liveness) and basic metrics practices — what each probe verifies, failure blast radius, dependency-check depth, and RED/USE metrics without label cardinality explosion. Use when user asks about health check, readiness probe, liveness probe, /healthz endpoint, orchestrator restart loop, or basic service metrics.
---

# Health Checks and Basic Metrics

Two different questions every orchestrator — Kubernetes, ECS, Nomad, systemd, PM2,
App Service — asks a process, with different consequences:

| Question | Probe | Failure causes |
|---|---|---|
| "Is this process stuck or dead and in need of a restart?" | Liveness | The orchestrator **kills and restarts** it |
| "Is this process ready to take traffic right now?" | Readiness | The orchestrator **removes it from load balancing**, without restarting |

Conflating the two is the commonest cause of self-inflicted outages: using one
check for both, or putting an external dependency in liveness, takes the whole
service down over something that only needed a moment's wait.

## Liveness

It answers: "is this process in a state it will not recover from on its own?" —
deadlock, an infinite loop, corrupted memory, a stuck main thread.

- It must be **cheap and local**: no network I/O, no database query, no external
  call.
- A false positive is expensive: it restarts a healthy process, drops in-flight
  connections, and can start a crash loop.
- If the process responds at all — slowly, or with a business error — it is alive.
  Liveness is not about "everything is fine", it is about "not stuck".

```
// ❌ liveness calling the database
GET /livez -> ping(database) -> 200/500

// ✅ liveness only confirms the runtime still answers
GET /livez -> 200 whenever the process can handle the request
```

## Readiness

It answers: "is this process ready to take useful traffic now?" — database
connections established, cache warm, migrations applied, boot-critical
dependencies available.

- It may check dependencies **that are direct and essential to the process working**:
  the database connection, the queue it consumes.
- Failing readiness is cheap: it only leaves the rotation. The process stays alive
  and can become ready again on its own.
- It also gates rollouts: a new pod receives traffic only once readiness passes,
  which is what avoids 502s during a deploy.

```
// ✅ readiness confirms the direct dependencies of serving a request
GET /readyz -> {
  db: pingDatabase(),        // the connection every request uses
  queue: checkConnection(),  // needed if this process consumes the queue
} -> 200 when all pass, 503 when any fails
```

## How deep to check

The most expensive mistake in a health check is **checking too much**. Propagating
the check along the whole transitive chain until it reaches a slow external
service takes down the entire cluster, not just one call.

| Check | Do not check |
|---|---|
| Your own database or queue connection, used directly | A third-party service outside your control: a payment gateway, a postcode API |
| Schema migrations applied at boot | A sibling service that is not this instance's direct dependency |
| A local cache initialised, where the process needs it to answer | The whole transitive chain: A checks B checks C checks D |
| Disk or memory, where a shortage stops the process working | Artificial latency "just to be sure" — a health check is not a full smoke test |

```
// ❌ cascading readiness: when the external payment service is slow,
// EVERY instance goes not-ready and the whole cluster stops
GET /readyz -> checkExternalPaymentGateway() -> 503 when slow

// ✅ an external dependency that is not boot-critical belongs behind a circuit
// breaker in the business code, not in the health check
GET /readyz -> checkOwnDatabaseConnection() -> 200
// the payment gateway call has its own timeout, retry and fallback,
// and a degraded gateway does not take the instance down
```

Rule of thumb: readiness covers "what this process needs to do its job", not "the
world is fine". If a dependency has its own resilience — retry, timeout, fallback —
it does not belong in the health check.

## Startup probes

Processes with a slow boot — a JVM warming up, a heavy migration, a large cold
cache — benefit from a third check, separate from liveness and readiness: it
confirms initialisation **finished**, with a more generous timeout, before liveness
starts counting failures. Without it, a slow boot looks like a stuck process and
the orchestrator restarts in a loop.

## Basic metrics: RED or USE

Two equivalent conventions; pick one per kind of component.

**RED** — for anything serving requests (an API, a queue worker, an endpoint):
- **Rate** — requests or events per second
- **Errors** — the error *rate*, not an absolute count. A count with no denominator
  says nothing
- **Duration** — latency, always in percentiles (p50, p95, p99). An average hides
  the outlier

**USE** — for a resource (CPU, memory, disk, a connection pool):
- **Utilization** — the percentage of time or capacity in use
- **Saturation** — work queued waiting for the resource, such as connections
  waiting on the pool
- **Errors** — the resource's own failures, such as a refused connection

```
// ✅ RED per endpoint
http_requests_total{route="/orders", method="POST", status_class="2xx"}
http_request_duration_seconds{route="/orders", method="POST"}  // a histogram, not a gauge

// ✅ USE per resource
db_pool_connections_in_use / db_pool_connections_max
db_pool_wait_queue_length
```

Latency is **always** a histogram or summary with percentiles. An average lies
about the worst case, which is what the user feels.

## Cardinality: labels must not explode

Every unique combination of label values becomes a new time series. A
high-cardinality label — a user id, a request id, a timestamp, a UUID — multiplies
series until the metrics backend becomes unusable or unaffordable. That is
cardinality explosion.

| Safe label | Dangerous label |
|---|---|
| `route`, normalised (`/orders/:id`) | `route` with a raw id (`/orders/8f3e1c2a-...`) — one series per order |
| `status_class` (`2xx`, `4xx`, `5xx`) | A granular exact `status_code` with no need for it |
| `tenant_tier` (`free`, `pro`, `enterprise`) | `tenant_id` — one series per client, unbounded |
| `method` (`GET`, `POST`) | `user_id`, `request_id`, `session_id` — never metrics; those are logs or traces |

```
// ❌ cardinality explodes: a new series per order
http_requests_total{path="/orders/8f3e1c2a-9182-4b3e"}

// ✅ a normalised route, with fixed and known cardinality
http_requests_total{route="/orders/:id"}
```

Rule of thumb: if a label's value is unbounded, or grows with the number of business
entities (users, orders, sessions), it is not a metric label. It is a log field or
a trace attribute.

## Checklist

- [ ] Liveness performs no network or database I/O; it only confirms the process answers
- [ ] Readiness checks only direct, essential dependencies
- [ ] No external or transitive dependency cascades through readiness
- [ ] A slow-booting process has its own startup probe with its own timeout
- [ ] Latency metrics are histograms with percentiles (p50/p95/p99), not averages
- [ ] Error rate is measured as a proportion (errors/total), not an isolated count
- [ ] No metric label has unbounded cardinality (`user_id`, `request_id`, UUID, timestamp)
- [ ] Parameterised routes are normalised before becoming a label (`/orders/:id`)
- [ ] The metrics and health endpoints need no heavy authentication (or sit on an internal network) and leak no business data

## By stack

**Kubernetes (probes on the deployment)**
```yaml
livenessProbe:
  httpGet: { path: /livez, port: 8080 }
  periodSeconds: 10
  failureThreshold: 3
readinessProbe:
  httpGet: { path: /readyz, port: 8080 }
  periodSeconds: 5
  failureThreshold: 3
startupProbe:
  httpGet: { path: /readyz, port: 8080 }
  failureThreshold: 30
  periodSeconds: 5
```

**NestJS (@nestjs/terminus)**
```ts
@Get('livez')
livez() { return { status: 'ok' }; }

@Get('readyz')
@HealthCheck()
readyz() {
  return this.health.check([
    () => this.db.pingCheck('database'),   // a direct dependency, not a third party
  ]);
}
```

**Python (FastAPI plus prometheus_client)**
```python
@app.get("/livez")
def livez():
    return {"status": "ok"}

@app.get("/readyz")
def readyz():
    return {"status": "ok"} if db_pool.is_connected() else Response(status_code=503)

REQUEST_LATENCY = Histogram("http_request_duration_seconds", "latency", ["route", "method"])
```

A failing probe and a captured error are different signals: a probe measures
whether the process should receive traffic, `error-tracking` measures what broke
inside it, and `structured-logging` is where the `trace_id` joins the two.

The pattern — cheap local liveness, readiness on direct dependencies, RED/USE
metrics with bounded labels — is identical across stacks. Only the library changes:
Terminus, Spring Actuator, health-check middleware in Go or Ruby, a custom
`/health` in any runtime.

## Anti-patterns

- ❌ Liveness querying a database or calling an external service
- ❌ Readiness and liveness pointing at the same endpoint and check
- ❌ Readiness cascading down to a third party's transitive dependency
- ❌ Restarting the process through liveness when the real state is "not ready yet", which readiness would handle without a restart
- ❌ Latency measured only as an average, with no percentiles
- ❌ Error rate as an absolute count with no denominator
- ❌ A metric label carrying `user_id`, `request_id`, a UUID or a raw timestamp
- ❌ A route used as a label without normalising its parameter (`/orders/123` rather than `/orders/:id`)
- ❌ A slow-booting process with no startup probe, crash-looping on a liveness false positive
- ❌ A metrics endpoint exposing business data, or demanding authentication heavy enough to block scraping
