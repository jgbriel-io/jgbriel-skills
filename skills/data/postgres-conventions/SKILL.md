---
name: postgres-conventions
description: Apply Postgres best practices — schema design, indexes, RLS policies, SQL queries, connection pooling. Use when user asks about Postgres schema, indexes, RLS policies, connection pooling, or SQL conventions on a plain Postgres backend (not Supabase). For Supabase use the supabase-postgres skill instead. Migrations are covered by the safe-migrations skill; slow-query diagnosis by query-performance.
---

# Postgres

> Migrations have their own skill (`safe-migrations`), and so does slow-query
> diagnosis (`query-performance`).

## Queries

```sql
-- ❌
SELECT * FROM users;

-- ✅ Select only the columns you need
SELECT id, name, email, status FROM users;
```

Pagination: `ORDER BY created_at DESC LIMIT :size OFFSET :page * :size`. For very
large lists, prefer keyset pagination (`WHERE created_at < :cursor`) — `OFFSET`
still walks every skipped row.

Multi-table transactional work: a database function, or an explicit transaction
in the application (`BEGIN ... COMMIT`). Never a loose sequence of statements.

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

Row Level Security is a native Postgres feature — use it for tenant isolation at
the database level, Supabase or not. A filter in application code is one forgotten
`WHERE` away from a leak; a policy is not.

```sql
-- Always enable it on new tables
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Owner policy (tenant isolation) — the app sets the context per transaction:
-- SET LOCAL app.current_user_id = '<uuid>';
CREATE POLICY "owner_own_data" ON new_table
  FOR ALL TO app_user
  USING (owner_id = current_setting('app.current_user_id')::uuid);

-- Admin policy
CREATE POLICY "admin_all" ON new_table
  FOR ALL TO app_user
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

Always `SET search_path`: without it the function resolves names against whatever
schema the caller has in scope, which is a schema-injection hole.

## Connection pooling

- The application never opens a connection per request. Use the driver's or ORM's
  pool with an explicit `max`, sized against the server's `max_connections`
- Many instances, or serverless: put an external pooler in front (PgBouncer in
  `transaction` mode)
- Under PgBouncer's `transaction` mode, avoid session state — `SET` without
  `LOCAL`, named prepared statements, session-level advisory locks
- Always return the connection. A connection leak takes the database down long
  before CPU does

## Anti-patterns

- ❌ `SELECT *` on large tables
- ❌ N+1 queries
- ❌ Functions without `SET search_path`
- ❌ Tables without RLS
- ❌ Sequential PKs (INTEGER/SERIAL)
- ❌ Computing in the frontend what a view or database function should compute
- ❌ Policies calling recursive functions without `SECURITY DEFINER`
- ❌ A connection per request, with no pool
