---
inclusion: fileMatch
fileMatchPattern: ['src/integrations/**', 'src/hooks/**', 'supabase/**']
description: Boas práticas Postgres/Supabase — índices, RLS, schema design, queries performáticas e connection pooling
---

# Supabase Postgres — Boas Práticas

## Queries

**Selecionar apenas colunas necessárias:**
```ts
// ❌
supabase.from('users').select('*')

// ✅
supabase.from('users').select('id, name, email, status, owner_id')
```

**Usar `.single()` vs `.maybeSingle()`:**
```ts
// .single() — lança erro se não encontrar (PGRST116)
const { data } = await supabase.from('profiles').select('role').eq('user_id', id).single();

// .maybeSingle() — retorna null se não encontrar
const { data } = await supabase.from('profiles').select('role').eq('user_id', id).maybeSingle();
```

**Paginação para listas grandes:**
```ts
const { data } = await supabase
  .from('logs')
  .select('*')
  .range(page * pageSize, (page + 1) * pageSize - 1)
  .order('created_at', { ascending: false });
```

**RPCs para operações complexas:**
```ts
// Operação transacional ou com múltiplas tabelas — usar RPC
const { data } = await supabase.rpc('create_resource_with_dependencies', {
  p_owner_id: ownerId,
  p_data: payload,
});
```

## Índices

Ao criar nova tabela, sempre indexar:
```sql
-- FKs que serão usadas em WHERE/JOIN
CREATE INDEX idx_<tabela>_<coluna> ON <tabela>(<coluna>);

-- Colunas usadas em ORDER BY frequente
CREATE INDEX idx_<tabela>_created_at ON <tabela>(created_at DESC);

-- Índice composto quando filtros combinados
CREATE INDEX idx_<tabela>_owner_status ON <tabela>(owner_id, status);
```

## RLS

```sql
-- Sempre habilitar em novas tabelas
ALTER TABLE nova_tabela ENABLE ROW LEVEL SECURITY;

-- Padrão de policy para owner (tenant isolation)
CREATE POLICY "owner_own_data" ON nova_tabela
  FOR ALL TO authenticated
  USING (owner_id = (SELECT owner_id FROM profiles WHERE user_id = auth.uid()));

-- Padrão de policy para admin
CREATE POLICY "admin_all" ON nova_tabela
  FOR ALL TO authenticated
  USING ((SELECT is_admin()));
```

**CRÍTICO:** Funções helpers como `is_admin()` DEVEM ter `SECURITY DEFINER` — sem isso causam recursão infinita ao serem chamadas dentro de policies da própria tabela.

## Schema Design

- PKs sempre UUID: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()` (ou `gen_random_uuid()`)
- Timestamps: `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`
- Soft delete: `is_deleted BOOLEAN DEFAULT FALSE` ou `deleted_at TIMESTAMPTZ`
- Status como TEXT com CHECK constraint: `CHECK (status IN ('ativo', 'inativo'))`
- Valores monetários: `NUMERIC(10,2)` não `FLOAT` (precisão decimal)

## Views

Views para queries complexas reutilizáveis:
```sql
CREATE VIEW <nome>_with_stats AS
SELECT u.*, COUNT(o.id) AS total_orders, SUM(o.value) AS total_value
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id;
```

Views têm `SECURITY INVOKER` por padrão — herdam permissões do usuário autenticado (respeitam RLS das tabelas base).

## Funções

```sql
-- Sempre definir search_path para segurança
CREATE OR REPLACE FUNCTION minha_funcao()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- lógica
END;
$$;
```

## Anti-patterns

- ❌ `SELECT *` em tabelas grandes
- ❌ N+1 queries (buscar lista e depois cada item)
- ❌ Funções sem `SET search_path` (vulnerável a injection de schema)
- ❌ Tabelas sem RLS habilitado
- ❌ PKs sequenciais (INTEGER/SERIAL) — usar UUID
- ❌ Cálculos no frontend que poderiam ser views/funções no banco
- ❌ Policies que chamam funções recursivas sem `SECURITY DEFINER`
