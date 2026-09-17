---
name: rate-limiting
description: Stack-agnostic rate limiting and throttling — token bucket vs sliding/fixed window algorithms, where to enforce limits (gateway, middleware, per-endpoint), keying strategy (IP/user/API key), 429 response shape, distributed limiting with shared store. Use when user asks about rate limiting, throttling, API abuse protection, 429 responses, or brute-force/DoS mitigation on endpoints.
---

# Rate Limiting

Rate limiting protects capacity (against overload) and protects against abuse
(brute force, scraping, third-party cost). Those two motives call for different
limits, so do not use one number for everything.

## Algorithms

| Algorithm | How it works | Burst | Memory | When |
|---|---|---|---|---|
| Fixed window | A counter resets every N seconds | Allows 2× the limit across a window edge | Low | Simple cases where an approximate limit is fine |
| Sliding window (log or counter) | Considers a moving window rather than resetting in blocks | Smooth, no edge spike | Medium | The recommended default for public APIs |
| Token bucket | The bucket refills at a fixed rate; each request spends a token | Absorbs bursts up to the bucket size | Low | Traffic with legitimate bursts, such as a batch upload |
| Leaky bucket | A queue drained at a constant rate, excess dropped or queued | Smooths output; does not absorb input bursts | Low | Protecting a fixed-rate downstream, like a third-party API |

```
// ❌ Fixed window: 100 req/min resetting at HH:MM:00
// A client sends 100 in the window's last second and 100 in the next window's first
// = 200 requests in about a second, "within the limit"

// ✅ Sliding window or token bucket: an edge burst does not escape the real limit
```

There is no best algorithm. Token bucket for traffic with expected bursts, sliding
window for a strict limit per unit of time, fixed window when simplicity matters
more than precision.

## Where to apply it

```
Client → CDN/WAF → API Gateway → Load Balancer → App (middleware) → Service/handler
           ↑              ↑                            ↑                  ↑
       coarse limit   per API key                per-route limit    per-action limit
       (DDoS, L3/L4)  (usage contract)           (endpoint cost)    (business rule)
```

- **The edge (gateway, CDN, WAF)**: the first line, cheap, and it keeps malicious
  traffic away from the application.
- **Application middleware**: per-route limits, sensitive to the endpoint's real
  cost. Login, search and upload cost differently from `GET /health`.
- **Inside the handler or use case**: a specific business rule — three OTP
  attempts, one export per hour per account — which cannot be generalised into
  middleware.
- The layers are not exclusive: a coarse limit at the edge plus a fine one per
  endpoint is the production norm.

## Where limits matter most

| Endpoint | Why | Typical limit |
|---|---|---|
| Login / authentication | The target of brute force and credential stuffing | Low, per IP and per account |
| Password reset / OTP | Single-use tokens, but the endpoint costs money (SMS, email) | Very low, per account and per phone or email |
| Search or listing with free-form filters | Expensive queries, easy to overload without malice | Medium, per user |
| An endpoint calling a paid third-party service | Direct cost per call | Low, with a queue and backoff rather than rejection |
| Inbound webhooks | The sender may loop if you answer with an error | Medium, with deduplication by idempotency key |
| Bulk writes and imports | One request produces N internal operations | Low, or limited by "cost" rather than by request |

## Keying

```
// ❌ Limiting by IP alone
// Corporate NAT, VPNs and mobile carrier NAT put thousands of users behind one IP
if (requestsByIp[ip] > limit) return 429;

// ✅ Combine keys according to the authentication context
const key = user ? `user:${user.id}` : `ip:${ip}`;
// a sensitive endpoint: a composite key, e.g. login = ip + the email attempted
const loginKey = `login:${ip}:${email}`;
```

- Authenticated: by `user_id` or API key. Fairer, and it does not punish neighbours
  behind a NAT.
- Anonymous: by IP, accepting false positives on shared NAT.
- Endpoints exposed to targeted abuse (login, OTP): a composite key of IP plus the
  target identifier, which catches both "one IP attacking many accounts" and "many
  origins attacking one account".
- Multi-tenant: always scope the limit by tenant as well as by user, so one tenant
  cannot exhaust another's quota.

## The response when a limit is hit

```
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1752600000
```

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests, try again shortly"
  }
}
```

- `Retry-After` is always present. A well-behaved client uses it to back off
  instead of retrying immediately.
- `X-RateLimit-*` headers (or the emerging IETF `RateLimit-*`) on every response,
  not only the one that failed, so a client can self-regulate before hitting the
  limit.
- Never a `200` with an error in the body, and never `403` — that is authorization,
  not throttling.

## Distributed vs. in-memory

```
// ❌ A counter in process memory
// With N replicas behind a load balancer, the real limit becomes N × the configured one
let counter = 0; // per instance

// ✅ A shared store (Redis, Memcached) — one counter across replicas
await redis.incr(`rl:${key}`);
await redis.expire(`rl:${key}`, windowSeconds);
```

- In-memory only serves a single instance, or works as an extra local layer that
  fails fast before reaching the shared store.
- A shared store (Redis in practice) adds network latency. Use a pipeline or a Lua
  script to keep the check atomic — increment and evaluate in one operation, which
  removes the race.
- If the shared store goes down, decide explicitly between failing open
  (prioritising availability) and failing closed (prioritising protection). The
  right answer depends on the endpoint.

## The client side: backoff

Rate limiting is not only the server's responsibility; a well-written client or
SDK respects the signal:

```
// ✅ Exponential backoff with jitter, honouring Retry-After when present
async function callWithBackoff(fn, attempt = 0) {
  try {
    return await fn();
  } catch (err) {
    if (err.status === 429 && attempt < maxRetries) {
      const wait = err.retryAfter ?? (baseDelay * 2 ** attempt + jitter());
      await sleep(wait);
      return callWithBackoff(fn, attempt + 1);
    }
    throw err;
  }
}
```

Without jitter, every client that received a 429 at the same instant retries
together and rebuilds the spike.

## Checklist

- [ ] The algorithm was chosen deliberately (token bucket for bursts, sliding window for a strict limit), not taken as the library's default
- [ ] Limits applied at two layers at least: coarse at the edge, fine in the application per route or action
- [ ] Sensitive endpoints (login, OTP, password reset) carry their own, lower limit
- [ ] Keying by user or API key when authenticated, not by IP alone
- [ ] Multi-tenant: limits scoped by tenant, not only by global user
- [ ] The 429 response includes `Retry-After` and limit, remaining and reset headers
- [ ] The counter lives in a shared store rather than process memory whenever there are multiple replicas
- [ ] Increment and check are atomic, so concurrency cannot race past the limit
- [ ] Defined behaviour when the rate-limit store is down: fail open or fail closed
- [ ] Internal clients and SDKs use exponential backoff with jitter rather than immediate retries

## By stack

**NestJS (`@nestjs/throttler`, token bucket):**
```ts
@Throttle({ default: { limit: 5, ttl: 60_000 } })
@Post('login')
login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```

**Nginx (leaky bucket at the edge, before the application):**
```nginx
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

location /api/login {
  limit_req zone=login burst=3 nodelay;
  proxy_pass http://backend;
}
```

**Go (`golang.org/x/time/rate`, an in-memory token bucket per key):**
```go
limiter := rate.NewLimiter(rate.Every(time.Minute/5), 3) // 5 req/min, burst 3
if !limiter.Allow() {
    w.Header().Set("Retry-After", "12")
    http.Error(w, "rate limited", http.StatusTooManyRequests)
    return
}
```

**Redis (a generic sliding window, any language, through a Lua script):**
```
// ZADD + ZREMRANGEBYSCORE + ZCARD in one transaction or script:
// drop timestamps outside the window, count what remains, decide whether to allow
ZADD rl:user:42 <now> <now>-<random>
ZREMRANGEBYSCORE rl:user:42 -inf (<now> - window_ms)
ZCARD rl:user:42
```

## Anti-patterns

- ❌ One global limit for every endpoint, ignoring what each actually costs
- ❌ Limiting by IP alone on an authenticated API, punishing users behind one NAT
- ❌ Fixed window with no thought for the burst at a window edge
- ❌ An in-process counter with several replicas behind a load balancer
- ❌ A 429 with no `Retry-After`, leaving the client to retry blindly
- ❌ Increment and check as separate operations, racing under concurrency
- ❌ The same limit for login and for `GET /health`
- ❌ An internal client hammering immediate retries after a 429
- ❌ Treating rate limiting as access control — that is authorization, and it is 403, not 429
