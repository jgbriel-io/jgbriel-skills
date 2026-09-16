---
name: supabase-hooks
description: Data-layer patterns for Supabase + TanStack Query — custom hooks, mutations, queries, real-time subscriptions, error handling. Use when the user asks about data fetching, hooks architecture, Supabase client patterns, or reviewing the data layer. SQL/schema/RLS side is supabase-postgres.
---

# Senior Backend — Supabase & Hooks

Para projetos com Supabase (PostgreSQL + Auth + Storage + Real-time). Toda comunicação passa por hooks customizados em `src/hooks/`.

## Hook com Query

```ts
export const useResource = (ownerId?: string) => {
  return useQuery({
    queryKey: ['resource', ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resource')
        .select('*')
        .eq('owner_id', ownerId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!ownerId,
    staleTime: 2 * 60 * 1000,
  });
};
```

## Mutation

```ts
export const useCreateResource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ResourceInsert) => {
      const { data: result, error } = await supabase
        .from('resource').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource'] });
      toast.success('Criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar.'),
  });
};
```

## Queries

- Selecionar apenas colunas necessárias: `.select('id, name, email')`
- `.single()` quando espera exatamente um registro
- `.maybeSingle()` quando pode ser null
- Paginação: `.range(from, to)` para listas grandes
- RPCs: `supabase.rpc('fn_name', { ... })`

## Real-time

```ts
const channel = supabase
  .channel('resource-updates')
  .on('postgres_changes', {
    event: 'UPDATE', schema: 'public', table: 'resource',
    filter: `owner_id=eq.${ownerId}`
  }, handleUpdate)
  .subscribe();

return () => supabase.removeChannel(channel); // sempre limpar
```

## Tratamento de erros

```ts
const { data, error } = await supabase.from('resource').select('*').single();
if (error) throw error;
if (!data) throw new Error('Não encontrado');
return data;
```

## Anti-patterns

- ❌ Supabase chamado direto em componentes
- ❌ Ignorar o objeto `error`
- ❌ Queries N+1
- ❌ `useState` para server state
- ❌ `useEffect` para data fetching
- ❌ Cliente Supabase importado fora de `src/integrations/`
