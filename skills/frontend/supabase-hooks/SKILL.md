---
name: supabase-hooks
description: Client data layer for Supabase + TanStack Query — custom hooks, mutations, queries, real-time subscriptions, error handling. Use when the user asks about data fetching, hooks architecture, Supabase client patterns, or reviewing the data layer. SQL, schema and RLS are supabase-postgres; the boundary between server, UI and URL state is client-state-management.
---

# Supabase & Hooks

For projects on Supabase (PostgreSQL, Auth, Storage, Real-time). Every call goes
through a custom hook in `src/hooks/`.

This is the client's data layer: **server state**, on the boundary
`client-state-management` defines. UI state and URL state do not belong in a query
hook. Schema, RLS and indexes are `supabase-postgres`.

## A query hook

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

## A mutation

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

The toast strings stay in Portuguese: they are interface text, and the product's
users read them.

## Queries

- Select only the columns you need: `.select('id, name, email')`
- `.single()` when exactly one row is expected
- `.maybeSingle()` when it may be null
- Pagination: `.range(from, to)` for long lists
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

return () => supabase.removeChannel(channel); // always clean up
```

## Error handling

```ts
const { data, error } = await supabase.from('resource').select('*').single();
if (error) throw error;
if (!data) throw new Error('Not found');
return data;
```

## Anti-patterns

- ❌ Calling Supabase directly from a component
- ❌ Ignoring the `error` object
- ❌ N+1 queries
- ❌ `useState` holding server state
- ❌ `useEffect` for data fetching
- ❌ Importing the Supabase client outside `src/integrations/`
