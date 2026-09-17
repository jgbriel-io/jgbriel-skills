---
name: tanstack-query-patterns
description: Client data layer with TanStack Query 5 + Axios — service pattern, module-prefixed query keys, mutations, cache invalidation, error handling. Use when the user asks about data fetching, TanStack Query, hooks architecture, mutations or cache invalidation on a non-Supabase backend. With Supabase it is supabase-hooks; the boundary between server, UI and URL state is client-state-management.
---

# TanStack Query — Data Layer Patterns

The data layer for backends that are not Supabase: a client's own API, NestJS, and
so on, with TanStack Query 5 plus an HTTP client (Axios).

Two layers: **services** call the `apiClient`, **hooks** call the services.
Components only consume hooks, and never call a service or the `apiClient`
directly.

## The service pattern

```ts
// src/services/resource.service.ts
import { apiClient } from '@/lib/api-client';

export const resourceService = {
  list: async (ownerId: string): Promise<Resource[]> => {
    const { data } = await apiClient.get('/resources', { params: { ownerId } });
    return data;
  },
  create: async (payload: ResourceInsert): Promise<Resource> => {
    const { data } = await apiClient.post('/resources', payload);
    return data;
  },
};
```

- `apiClient` is a single Axios instance created in one place
  (`src/lib/api-client.ts`), where the baseURL and the auth and error interceptors
  live.
- A service knows nothing about React: a pure, typed async function, easy to test.

## Query keys, prefixed per module

```ts
// src/hooks/use-resources.ts
export const resourceKeys = {
  all: ['resources'] as const,
  list: (ownerId: string) => ['resources', 'list', ownerId] as const,
  detail: (id: string) => ['resources', 'detail', id] as const,
};
```

Every key in the module starts with the same prefix, so invalidating
`['resources']` clears the module in one call. Never assemble keys inline inside
the hooks.

## A query hook

```ts
export const useResources = (ownerId?: string) => {
  return useQuery({
    queryKey: resourceKeys.list(ownerId ?? ''),
    queryFn: () => resourceService.list(ownerId!),
    enabled: !!ownerId,
    staleTime: 2 * 60 * 1000,
  });
};
```

- Use `enabled` for dependencies that are not resolved yet, never a `queryFn` that
  returns early.
- Set `staleTime` explicitly per hook; the global default belongs on the
  `QueryClient`.

## A mutation, with invalidation

```ts
export const useCreateResource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resourceService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.all });
      toast.success('Criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar.'),
  });
};
```

The toast strings stay in Portuguese: they are interface text, read by the
product's users.

- Invalidate by the module prefix rather than guessing specific keys.
- Every mutation handles `onError`. An error is never swallowed silently.

## Queries

- Always paginate: long lists take page and limit parameters. Never an unbounded
  list.
- Avoid N+1: one endpoint returning the relation embedded, rather than a loop of
  requests.
- Fetch only the fields you need where the API supports projection (`fields`).
- Columns used in frequent filters or ordering need an index in the database — see
  `postgres-conventions`.

## Loading and error states

```tsx
const { data, isPending, isError, error } = useResources(ownerId);

if (isPending) return <Skeleton />;
if (isError) return <ErrorState message={error.message} />;
return <ResourceList items={data} />;
```

- TanStack Query 5 distinguishes `isPending` (the first load) from `isFetching` (a
  background refetch).
- Handle all three states. A component assuming `data` is defined breaks in
  production.

## Error handling

- A response interceptor on the `apiClient` normalises API errors, extracting the
  message and status.
- Errors thrown in a service propagate to the hook's `error` — never a `try/catch`
  that swallows them.
- Global errors (401, 5xx) are handled in the interceptor; domain errors in the
  mutation's `onError`.

## Security (review checklist)

- [ ] Inputs validated against a schema (Zod, class-validator) at the boundary — never trust the payload
- [ ] The backend filters by the authenticated user's id for tenant isolation, never accepting `userId` from the client
- [ ] No sensitive data in logs
- [ ] Every API error handled, never swallowed
- [ ] The auth token lives only in the `apiClient` interceptor, never spread across manual headers

## Anti-patterns

- ❌ Calling `apiClient` or Axios directly from a component
- ❌ A hook calling `apiClient` and skipping the service layer
- ❌ A query key assembled inline instead of through the module's factory
- ❌ N+1 queries
- ❌ `useState` holding server state
- ❌ `useEffect` for data fetching
- ❌ A `try/catch` that swallows the error with no rethrow and no feedback
