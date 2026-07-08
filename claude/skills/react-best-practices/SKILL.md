---
name: react-best-practices
description: React 18 + Vite performance rules — bundle size, re-renders, waterfalls, subscriptions. Use when the user asks about React performance, slow pages, bundle size, imports, useEffect misuse, or re-render debugging. Not a general review checklist — that is code-reviewer; writing conventions are senior-frontend.
---

# React — Performance e Boas Práticas

Para projetos React 18 + Vite (SPA). Regras de RSC/Server Components não se aplicam.

## Bundle Size (CRÍTICO)

**Evitar barrel imports:**
```tsx
// ❌ Carrega biblioteca inteira
import { Button, Card } from '@/components/ui'

// ✅ Import direto
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
```

**Lazy loading de páginas pesadas:**
```tsx
const HeavyPage = lazy(() => import('./pages/HeavyPage'));

<Suspense fallback={<Spinner />}>
  <HeavyPage />
</Suspense>
```

## Waterfalls (CRÍTICO)

**Paralelizar queries independentes:**
```ts
// ❌ Sequencial
const user = await fetchUser(id);
const orders = await fetchOrders(id);

// ✅ Paralelo
const [user, orders] = await Promise.all([fetchUser(id), fetchOrders(id)]);
```

TanStack Query paraleliza automaticamente múltiplos `useQuery` no mesmo componente.

## Re-renders

```tsx
// ❌ Novo objeto a cada render
<UserList filters={{ status: 'active' }} />

// ✅ Memoizar
const filters = useMemo(() => ({ status: 'active' }), []);
<UserList filters={filters} />
```

Não usar `useMemo`/`useCallback` preventivamente — só com evidência de problema.

## Rendering

```tsx
// ❌ Pode renderizar "0"
{items.length && <List />}

// ✅ Explícito
{items.length > 0 && <List />}
```

```tsx
// ❌ Recriado a cada render
const EmptyState = () => <p>Nenhum item</p>;

// ✅ Fora do componente
const EMPTY_STATE = <p className="text-muted-foreground">Nenhum item</p>;
```

## Subscriptions

```ts
useEffect(() => {
  const sub = client.subscribe(channel, handler);
  return () => sub.unsubscribe(); // sempre limpar
}, []);
```

## Anti-patterns

- ❌ `useEffect` para data fetching (usar TanStack Query/SWR)
- ❌ `useState` para server state
- ❌ Barrel imports
- ❌ Objects/arrays inline em props
- ❌ `useMemo`/`useCallback` sem evidência
