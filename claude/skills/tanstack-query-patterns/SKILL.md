---
name: tanstack-query-patterns
description: Frontend data layer patterns with TanStack Query 5 + Axios — service pattern, module-prefixed query keys, mutations, cache invalidation, error handling. Use when user asks about data fetching, TanStack Query, hooks architecture, mutations, or cache invalidation on a non-Supabase backend. For a Supabase backend use the supabase-hooks skill instead.
---

# TanStack Query — Data Layer Patterns

Camada de dados para quando o backend não é Supabase (API própria do cliente, NestJS, etc): TanStack Query 5 + cliente HTTP (Axios).
Fluxo em duas camadas: **services** chamam o `apiClient`, **hooks** chamam os
services. Componentes só consomem hooks — nunca chamam service ou `apiClient`
direto.

## Service pattern

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

- `apiClient` é um singleton Axios criado num único lugar (`src/lib/api-client.ts`) —
  baseURL, interceptors de auth e de erro moram ali
- Service não conhece React: função async pura, tipada, fácil de testar

## queryKey prefixada por módulo

```ts
// src/hooks/use-resources.ts
export const resourceKeys = {
  all: ['resources'] as const,
  list: (ownerId: string) => ['resources', 'list', ownerId] as const,
  detail: (id: string) => ['resources', 'detail', id] as const,
};
```

Toda key do módulo começa com o mesmo prefixo — invalidar `['resources']`
derruba tudo do módulo de uma vez. Nunca montar keys inline nos hooks.

## Hook com Query

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

- `enabled` para dependências ainda não resolvidas — nunca `queryFn` que retorna cedo
- `staleTime` explícito por hook; o default global fica no `QueryClient`

## Mutation com invalidação

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

- Invalidar pelo prefixo do módulo — não adivinhar keys específicas
- Toda mutation trata `onError`; erro nunca é engolido silenciosamente

## Queries

- Paginação sempre: listas grandes usam parâmetros de página/limite na API — nunca lista sem limite
- Evitar N+1: um endpoint que retorna a relação embutida em vez de loop de requests
- Buscar apenas os campos necessários quando a API suporta (params de projeção/`fields`)
- Colunas usadas em filtro/ordenação frequente precisam de índice no banco (ver skill postgres-conventions)

## Estados de loading e erro

```tsx
const { data, isPending, isError, error } = useResources(ownerId);

if (isPending) return <Skeleton />;
if (isError) return <ErrorState message={error.message} />;
return <ResourceList items={data} />;
```

- TanStack Query 5: `isPending` (primeira carga) vs `isFetching` (refetch em background)
- Tratar os três estados sempre — componente que assume `data` definido quebra em produção

## Tratamento de erros

- Interceptor de resposta no `apiClient` normaliza erros da API (extrai mensagem, status)
- Erros lançados no service propagam para o `error` do hook — nunca `try/catch` que engole
- Erros globais (401, 5xx) tratados no interceptor; erros de domínio no `onError` da mutation

## Segurança (checklist de review)

- [ ] Inputs validados com schema (Zod, class-validator) na boundary — nunca confiar no payload
- [ ] Backend filtra pelo ID do usuário autenticado (tenant isolation) — nunca aceitar `userId` do client
- [ ] Sem dados sensíveis em logs
- [ ] Erro da API sempre tratado, nunca engolido
- [ ] Token de auth só no interceptor do `apiClient` — nunca espalhado em headers manuais

## Anti-patterns

- ❌ `apiClient`/Axios chamado direto em componentes
- ❌ Hook que chama `apiClient` pulando a camada de service
- ❌ queryKey montada inline sem o factory do módulo
- ❌ Queries N+1
- ❌ `useState` para server state
- ❌ `useEffect` para data fetching
- ❌ `try/catch` que engole erro sem rethrow nem feedback
