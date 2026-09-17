---
name: supabase-postgres
description: Apply Postgres conventions through the Supabase client — column selection, single vs maybeSingle, range pagination, RPCs for multi-table transactions, RLS policies, schema design. Use when the user asks about Supabase schema, RLS policies, or writing queries against Supabase. Plain Postgres without the Supabase client is postgres-conventions; migrations are safe-migrations; a slow query is query-performance; the client hooks around it are supabase-hooks.
---

# Supabase Postgres

> The same conventions as `postgres-conventions`, written against the Supabase
> client instead of raw SQL. Migrations are `safe-migrations`, a slow query is
> `query-performance`, and the hooks consuming this are `supabase-hooks`.

## Queries

```ts
// ❌
supabase.from('users').select('*')

// ✅ Select only the columns you need
supabase.from('users').select('id, name, email, status')
```

```ts
// .single() — throws when nothing is found (PGRST116)
.eq('user_id', id).single()

// .maybeSingle() — returns null silently
.eq('user_id', id).maybeSingle()
```

Pagination: `.range(page * size, (page + 1) * size - 1).order('created_at', { ascending: false })`

RPCs for transactional operations: `supabase.rpc('fn_name', { p_owner_id: id })`

## Indexes

```sql
-- FKs used in WHERE/JOIN
CREATE INDEX idx_table_column ON table(column);

-- Frequent ORDER BY
CREATE INDEX idx_table_created_at ON table(created_at DESC);

-- Combined filters
CREATE INDEX idx_table_owner_status ON table(owner_id, status);
```

## RLS

```sql
-- Always enable it on new tables
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Owner policy (tenant isolation)
CREATE POLICY "owner_own_data" ON new_table
  FOR ALL TO authenticated
  USING (owner_id = (SELECT owner_id FROM profiles WHERE user_id = auth.uid()));

-- Admin policy
CREATE POLICY "admin_all" ON new_table
  FOR ALL TO authenticated
  USING ((SELECT is_admin()));
```

Helper functions like `is_admin()` need `SECURITY DEFINER`. Without it they
recurse infinitely inside the policy that calls them, and the table becomes
unreadable rather than merely slow.

## Schema design

- PKs: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- Timestamps: `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`
- Soft delete: `deleted_at TIMESTAMPTZ`
- Status: `TEXT CHECK (status IN ('active', 'inactive'))`
- Money: `NUMERIC(10,2)`, never `FLOAT`

## Functions

```sql
CREATE OR REPLACE FUNCTION my_function()
RETURNS void LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- logic
END;
$$;
```

Always `SET search_path`: without it the function resolves names against
whatever schema the caller has in scope, which is a schema-injection hole.

## Anti-patterns

- ❌ `SELECT *` on large tables
- ❌ N+1 queries
- ❌ Functions without `SET search_path`
- ❌ Tables without RLS
- ❌ Sequential PKs (INTEGER/SERIAL)
- ❌ Computing in the frontend what a view or database function should compute
- ❌ Policies calling recursive functions without `SECURITY DEFINER`
