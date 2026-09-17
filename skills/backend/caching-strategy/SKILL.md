---
name: caching-strategy
description: Applies stack-agnostic caching strategy — layers (client, server, CDN), invalidation policy, cache-aside vs write-through vs write-behind. Use when user asks about caching, cache invalidation, stale data, TTL, cache-aside, write-through, ETags, or reducing load on a database/API.
---

# Caching Strategy

Applies to any caching technology — Redis, Memcached, a CDN, HTTP caching,
in-memory. The hard part is never storing the value; it is knowing when to throw
it away.

## Layers

```
Client (browser/app) → CDN/edge → Server (app cache) → Database
```

| Layer | What it holds | Invalidated by |
|---|---|---|
| Client | API responses, static assets | `Cache-Control`, `ETag`, the build version |
| CDN/edge | Public HTTP responses, assets | TTL, manual or API purge |
| Server (app) | Query results, sessions, expensive computations | TTL, a write event |
| Database (query cache, buffer pool) | Plans and data pages | Managed by the engine |

Rule: cache as close to the consumer as you can — client before CDN before server
before database. Each layer skipped is one network hop avoided.

## Read and write patterns

**Cache-aside (lazy loading)** — the common one; the application controls
everything:

```
// read
value = cache.get(key)
if missing:
    value = db.fetch(key)
    cache.set(key, value, ttl)
return value

// write
db.save(data)
cache.delete(key)  // invalidate rather than update; the next read repopulates
```

- Simple, and the cache only holds what is actually read
- Cost: the first read after invalidation always hits the database — a predictable
  miss

**Write-through** — writes to cache and database in the same synchronous
operation:

```
db.save(data)
cache.set(key, data, ttl)  // always current, never a miss right after a write
```

- The cache is never stale relative to the last write
- Writes get slower: two synchronous operations

**Write-behind (write-back)** — writes to the cache, and the database catches up
asynchronously:

```
cache.set(key, data)
queue.enqueue(persistToDatabase, data)  // processed later
```

- Very fast writes, absorbs spikes
- Risk of data loss if the process dies before persisting. Only for data that
  tolerates that window

| Pattern | Write latency | Consistency | When |
|---|---|---|---|
| Cache-aside | Low | Eventual, until the next miss | Read-dominant, and the data tolerates milliseconds or seconds of staleness |
| Write-through | Medium to high | Strong | A read right after a write must always be correct |
| Write-behind | Very low | Eventual, with a loss window | High write volume, data that tolerates small losses |

## Invalidation

> "There are only two hard things in Computer Science: cache invalidation and
> naming things." The line is a cliché because it is true: most cache bugs are not
> about storing, they are about forgetting to invalidate.

| Strategy | How | Risk |
|---|---|---|
| TTL | Expires on its own after N seconds | A window of stale data until it does |
| Event-based | A write triggers an explicit delete or update of the key | Easy to miss one write path |
| Key versioning | The key carries a version (`user:42:v3`); a write bumps it and the old key just expires | The old key lingers until its TTL, occupying space |
| Purge by tag | Invalidate a group (`tag:orders`) rather than one key | Needs support from the cache technology |

```
// ❌ A long TTL "for performance" on data that changes often
cache.set(`price:${sku}`, price, { ttl: 86400 })  // a day of stale prices

// ✅ A TTL that matches how volatile the data really is
cache.set(`price:${sku}`, price, { ttl: 60 })

// ✅ or event-based invalidation, rather than relying on the TTL alone
async function updatePrice(sku, newPrice) {
  await db.update(sku, newPrice);
  await cache.delete(`price:${sku}`);
}
```

Every cache key needs an owner: whoever writes the underlying data is responsible
for invalidating it, or for publishing the event that does. A key with no owner
becomes silently stale data.

## What to cache, and what not to

- Cache: expensive and repeated reads, data that changes rarely, results that are
  deterministic for the same parameters.
- Do not cache: per-user sensitive data without a key that isolates the user, data
  that changes on every request, results depending on external state the key does
  not capture.

```
// ❌ a key with no tenant or user isolation — leaks data across contexts
cache.set('recent-orders', orders)

// ✅ the key carries every parameter that changes the result
cache.set(`recent-orders:${tenantId}:${userId}`, orders, { ttl: 30 })
```

## HTTP caching (client and CDN)

Standard headers, which work in any stack:

```
Cache-Control: public, max-age=3600, stale-while-revalidate=60
ETag: "a1b2c3"
```

- `max-age`: how long the client may serve without revalidating
- `stale-while-revalidate`: serves the old value while fetching a new one in the
  background, hiding the miss latency from the user
- `ETag`/`If-None-Match`: conditional revalidation — the server answers
  `304 Not Modified` without resending the body when nothing changed
- `private` vs `public`: `private` must never pass through a CDN or shared proxy,
  because the data belongs to one user

```
// ❌ per-user data marked public — the CDN serves one user's cache to another
Cache-Control: public, max-age=3600

// ✅
Cache-Control: private, max-age=60
```

## Side effects worth planning for

- **Thundering herd / cache stampede**: the TTL expires and N simultaneous requests
  hit the database to repopulate the same key. Mitigate with a lock or single-flight
  (one request recomputes, the others wait), or with jittered TTLs so keys do not
  all expire in the same second.
- **Cache warming**: critical data should not depend on the first user paying the
  miss. Pre-populate on deploy or startup where the miss is expensive.
- **Size and eviction**: a cache is not unlimited, and the eviction policy (LRU,
  LFU) decides what leaves when it fills. An undersized cache becomes constant
  churn.

## Checklist

- [ ] The chosen pattern (cache-aside, write-through, write-behind) matches the data's tolerance for staleness
- [ ] Every cache key has an explicit owner responsible for invalidating it
- [ ] TTLs match real volatility rather than a generic value copied from elsewhere
- [ ] Keys include every parameter that changes the result: tenant, user, locale, version
- [ ] Sensitive or per-user data is never marked `public` on a shared CDN or proxy
- [ ] High-traffic keys have a stampede strategy (lock, jitter, stale-while-revalidate)
- [ ] Invalidation is tested — the write and delete paths, not only the read

## By stack

**Redis (cache-aside, any runtime):**
```ts
async function getUser(id: string) {
  const cached = await redis.get(`user:${id}`);
  if (cached) return JSON.parse(cached);

  const user = await db.users.findById(id);
  await redis.set(`user:${id}`, JSON.stringify(user), 'EX', 300);
  return user;
}

async function updateUser(id: string, data: Partial<User>) {
  await db.users.update(id, data);
  await redis.del(`user:${id}`); // event-based invalidation
}
```

**Django (cache framework, Python):**
```python
def get_product(sku):
    key = f"product:{sku}"
    product = cache.get(key)
    if product is None:
        product = Product.objects.get(sku=sku)
        cache.set(key, product, timeout=60)
    return product

def update_product(sku, **fields):
    Product.objects.filter(sku=sku).update(**fields)
    cache.delete(f"product:{sku}")
```

**HTTP/CDN (language-independent):**
```
GET /api/catalog/sku-123
Cache-Control: public, max-age=300, stale-while-revalidate=60
ETag: "9f8b7a"

// the next request
If-None-Match: "9f8b7a"
→ 304 Not Modified (no body, no bandwidth)
```

## Anti-patterns

- ❌ A generic TTL ("an hour for everything") that ignores real volatility
- ❌ A cache key with no owner, so nothing invalidates it when the source changes
- ❌ A key with no tenant, user or locale isolation
- ❌ `Cache-Control: public` on a response carrying private data
- ❌ A write that updates the database and forgets the cache, leaving it stale until the TTL
- ❌ No stampede protection on a high-traffic key
- ❌ Caching a non-deterministic result, or one depending on state the key does not capture
- ❌ Using a cache to mask a slow query instead of finding the cause
