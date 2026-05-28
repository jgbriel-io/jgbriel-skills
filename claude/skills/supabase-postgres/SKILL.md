---
name: supabase-postgres
description: Apply Supabase/Postgres best practices — indexes, RLS, schema design, queries, connection pooling. Use when user asks about Supabase schema, RLS policies, migrations, or SQL performance.
---

# Supabase Postgres — Boas Práticas

## Queries

```ts
// ❌
supabase.from('users').select('*')

// ✅ Selecionar apenas colunas necessárias
supabase.from('users').select('id, name, email, status')
```

```ts
// .single() — lança erro se não encontrar (PGRST116)
.eq('user_id', id).single()

// .maybeSingle() — retorna null silenciosamente
.eq('user_id', id).maybeSingle()
```

Paginação: `.range(page * size, (page + 1) * size - 1).order('created_at', { ascending: false })`

RPCs para operações transacionais: `supabase.rpc('fn_name', { p_owner_id: id })`

## Índices

```sql
-- FKs usadas em WHERE/JOIN
CREATE INDEX idx_tabela_coluna ON tabela(coluna);

-- ORDER BY frequente
CREATE INDEX idx_tabela_created_at ON tabela(created_at DESC);

-- Filtros combinados
CREATE INDEX idx_tabela_owner_status ON tabela(owner_id, status);
```

## RLS

```sql
-- Sempre habilitar em novas tabelas
ALTER TABLE nova_tabela ENABLE ROW LEVEL SECURITY;

-- Policy de owner (tenant isolation)
CREATE POLICY "owner_own_data" ON nova_tabela
  FOR ALL TO authenticated
  USING (owner_id = (SELECT owner_id FROM profiles WHERE user_id = auth.uid()));

-- Policy de admin
CREATE POLICY "admin_all" ON nova_tabela
  FOR ALL TO authenticated
  USING ((SELECT is_admin()));
```

**CRÍTICO:** Funções helpers como `is_admin()` DEVEM ter `SECURITY DEFINER` — sem isso causam recursão infinita em policies.

## Schema Design

- PKs: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- Timestamps: `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`
- Soft delete: `deleted_at TIMESTAMPTZ`
- Status: `TEXT CHECK (status IN ('ativo', 'inativo'))`
- Valores monetários: `NUMERIC(10,2)` não `FLOAT`

## Funções

```sql
CREATE OR REPLACE FUNCTION minha_funcao()
RETURNS void LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- lógica
END;
$$;
```

Sempre `SET search_path` — sem isso é vulnerável a injection de schema.

## Anti-patterns

- ❌ `SELECT *` em tabelas grandes
- ❌ N+1 queries
- ❌ Funções sem `SET search_path`
- ❌ Tabelas sem RLS
- ❌ PKs sequenciais (INTEGER/SERIAL)
- ❌ Cálculos no frontend que poderiam ser views/funções no banco
- ❌ Policies com funções recursivas sem `SECURITY DEFINER`
