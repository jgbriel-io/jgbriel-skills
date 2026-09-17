---
name: react-best-practices
description: React 18 + Vite performance rules — bundle size, re-renders, waterfalls, subscriptions. Use when the user asks about React performance, slow pages, bundle size, imports, useEffect misuse, or re-render debugging. This one reads the code; measuring a running page is web-perf. Not a general review checklist — that is code-reviewer; writing conventions are frontend-conventions.
---

# React — Performance

For React 18 + Vite SPAs. RSC and Server Component rules do not apply here.

## Bundle size

**Avoid barrel imports:**
```tsx
// ❌ Pulls in the whole library
import { Button, Card } from '@/components/ui'

// ✅ Import directly
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
```

**Lazy-load heavy pages:**
```tsx
const HeavyPage = lazy(() => import('./pages/HeavyPage'));

<Suspense fallback={<Spinner />}>
  <HeavyPage />
</Suspense>
```

## Waterfalls

**Parallelise independent queries:**
```ts
// ❌ Sequential — the second request waits for the first with no reason to
const user = await fetchUser(id);
const orders = await fetchOrders(id);

// ✅ Parallel
const [user, orders] = await Promise.all([fetchUser(id), fetchOrders(id)]);
```

TanStack Query parallelises several `useQuery` calls in the same component
automatically.

## Re-renders

```tsx
// ❌ A new object on every render, so the child re-renders every time
<UserList filters={{ status: 'active' }} />

// ✅ Memoise it
const filters = useMemo(() => ({ status: 'active' }), []);
<UserList filters={filters} />
```

Do not reach for `useMemo`/`useCallback` pre-emptively — only with evidence of a
real problem. Each one costs a comparison and a dependency array to keep correct.

## Rendering

```tsx
// ❌ Renders a literal "0" when the list is empty
{items.length && <List />}

// ✅ Explicit
{items.length > 0 && <List />}
```

```tsx
// ❌ Recreated on every render
const EmptyState = () => <p>Nenhum item</p>;

// ✅ Outside the component
const EMPTY_STATE = <p className="text-muted-foreground">Nenhum item</p>;
```

Interface strings stay in Portuguese: the product's users read them.

## Subscriptions

```ts
useEffect(() => {
  const sub = client.subscribe(channel, handler);
  return () => sub.unsubscribe(); // always clean up
}, []);
```

## Anti-patterns

- ❌ `useEffect` for data fetching — use TanStack Query or SWR
- ❌ `useState` holding server state
- ❌ Barrel imports
- ❌ Inline objects and arrays as props
- ❌ `useMemo`/`useCallback` with no evidence behind them
