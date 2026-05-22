---
inclusion: fileMatch
fileMatchPattern: ['src/hooks/**', 'src/integrations/**', 'supabase/**']
description: Padrões de hooks com TanStack Query, mutations, queries Supabase, real-time e tratamento de erros
---

# Senior Backend — Supabase & Hooks

Para projetos com Supabase (PostgreSQL + Auth + Storage + Real-time). Toda comunicação passa por hooks customizados em `src/hooks/`.

## Padrão de Hook com Query

```ts
// src/hooks/useResource.ts
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

## Padrão de Mutation

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

- Selecionar apenas colunas necessárias: `.select('id, name, email')` em vez de `.select('*')` quando possível
- `.single()` quando espera exatamente um registro (lança erro se não encontrar)
- `.maybeSingle()` quando pode ser null (retorna null silenciosamente)
- Paginação com `.range(from, to)` para listas grandes
- RPCs para operações complexas: `supabase.rpc('nome_funcao', { ... })`

## Real-time

```ts
const channel = supabase
  .channel('resource-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'resource',
    filter: `owner_id=eq.${ownerId}`
  }, handleUpdate)
  .subscribe();

// Sempre limpar
return () => supabase.removeChannel(channel);
```

## Tratamento de Erros

```ts
// Sempre verificar error antes de usar data
const { data, error } = await supabase.from('resource').select('*').single();
if (error) throw error;
if (!data) throw new Error('Não encontrado');
return data;
```

## Anti-patterns

- ❌ Supabase chamado direto em componentes (deve estar em hook)
- ❌ Ignorar o objeto `error`
- ❌ Queries N+1 (buscar lista e depois cada item separadamente)
- ❌ `useState` para server state (usar TanStack Query)
- ❌ `useEffect` para data fetching
- ❌ Cliente Supabase importado fora de `src/integrations/`
