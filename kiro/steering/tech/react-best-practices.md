---
inclusion: fileMatch
fileMatchPattern: ['**/*.tsx', '**/*.ts']
description: Performance React — barrel imports, Promise.all, lazy loading, re-renders, bundle size. Para projetos com Vite/CRA (não Next.js/RSC)
---

# React — Performance e Boas Práticas

Para projetos React 18 + Vite (ou similar SPA). Regras de RSC/Server Components não se aplicam.

## Bundle Size (CRÍTICO)

**Evitar barrel imports:**
```tsx
// ❌ Carrega biblioteca inteira
import { Button, Card, Input } from '@/components/ui'

// ✅ Import direto
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
```

**Lazy loading de páginas pesadas:**
```tsx
const HeavyPage = lazy(() => import('./pages/HeavyPage'));

// Wrap em <Suspense> no roteamento
<Suspense fallback={<Spinner />}>
  <HeavyPage />
</Suspense>
```

## Waterfalls (CRÍTICO)

**Paralelizar queries independentes:**
```ts
// ❌ Sequencial — lento
const user = await fetchUser(id);
const orders = await fetchOrders(id);

// ✅ Paralelo
const [user, orders] = await Promise.all([
  fetchUser(id),
  fetchOrders(id),
]);
```

**TanStack Query já paraleliza automaticamente** quando múltiplos `useQuery` são chamados no mesmo componente.

## Re-renders (MÉDIO)

**Não criar objetos/arrays inline em props:**
```tsx
// ❌ Novo objeto a cada render
<UserList filters={{ status: 'active', role: 'admin' }} />

// ✅ Memoizar ou extrair
const filters = useMemo(() => ({ status: 'active', role: 'admin' }), []);
<UserList filters={filters} />
```

**Não usar `useMemo`/`useCallback` preventivamente** — só quando há evidência de problema de performance.

## Rendering

**Conditional rendering explícito:**
```tsx
// ❌ Pode renderizar "0" na tela
{items.length && <List />}

// ✅ Explícito
{items.length > 0 && <List />}
```

**Hoist elementos JSX estáticos fora do componente:**
```tsx
// ❌ Recriado a cada render
const EmptyState = () => <p>Nenhum item</p>;

// ✅ Fora do componente
const EMPTY_STATE = <p className="text-muted-foreground">Nenhum item</p>;
```

## JavaScript

```ts
// ✅ Imutável (ES2023)
const sorted = items.toSorted((a, b) => a.name.localeCompare(b.name));

// ❌ Mutável (copia + sort)
const sorted = [...items].sort(...);

// ✅ Set para lookups O(1)
const ids = new Set(items.map(i => i.id));
if (ids.has(id)) { ... }
```

## Subscriptions / WebSockets

```ts
// Sempre limpar subscription no cleanup
useEffect(() => {
  const subscription = client.subscribe(channel, handler);
  return () => subscription.unsubscribe();
}, []);
```

## Anti-patterns

- ❌ `useEffect` para data fetching (usar TanStack Query/SWR)
- ❌ `useState` para server state
- ❌ Barrel imports (`@/components/ui`)
- ❌ Objects/arrays inline em props (re-renders)
- ❌ `useMemo`/`useCallback` sem evidência de problema
