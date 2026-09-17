---
name: safe-migrations
description: Explains zero-downtime schema migrations for relational databases — expand-contract pattern, batch data backfills, lock avoidance, safe column add/rename/drop/type-change. Use when user asks about migrations, ALTER TABLE, schema changes, downtime, locks, backfill, or rollback strategy.
---

# Safe Migrations — Zero Downtime

In a rolling deploy, old code and new code run at the same time against the same
schema. A migration that only works with one version of the code breaks the
other. This holds for any relational database and any tool: Supabase CLI, Flyway,
Liquibase, Prisma, Alembic, ActiveRecord, goose, EF Core.

## Expand-Contract (Parallel Change)

Every destructive migration — rename, drop, type change, a new `NOT NULL` — takes
three deploys, never one:

1. **Expand** — add the new thing without touching the old one. Old and new code
   coexist.
2. **Migrate** — backfill the data and deploy code that reads and writes the new
   column, dual-writing where needed.
3. **Contract** — remove the old thing, only once all traffic uses the new one.

```sql
-- ❌ One deploy: renaming a column in use breaks the old code in production
ALTER TABLE orders RENAME COLUMN amount TO total_amount;

-- ✅ Deploy 1 (expand): new column, nullable
ALTER TABLE orders ADD COLUMN total_amount NUMERIC(10,2);

-- ✅ Deploy 2 (migrate): batched backfill (below) and new code dual-writing
UPDATE orders SET total_amount = amount WHERE total_amount IS NULL;

-- ✅ Deploy 3 (contract): only once every path reads and writes total_amount
ALTER TABLE orders DROP COLUMN amount;
```

## Rules by change type

| Change | Risk | Strategy |
|---|---|---|
| Add nullable column | Low | Straight through, one deploy |
| Add `NOT NULL` column | High — lock, and it fails on existing rows | Nullable → backfill → `NOT VALID` constraint → separate `VALIDATE CONSTRAINT` |
| Rename column or table | High — breaks old code | Full expand-contract |
| Drop column | Medium — old code may still read or write it | Remove the usage → deploy → wait → only then drop |
| Change type | High — table rewrite plus lock | New column of the right type, backfill, swap |
| Add index | Medium — write lock on the whole table | Concurrent/online variant; never a plain `CREATE INDEX` on a large table |
| Add FK or CHECK | Medium — lock while existing data is validated | `NOT VALID` on creation, `VALIDATE CONSTRAINT` as its own step |

## Locks

- `ALTER TABLE` without `NOT VALID` can block reads and writes for the whole
  operation. The lock's name differs per engine; the effect — the whole table
  blocked — exists in all of them.
- Creating an index the naive way blocks writes across the table. Use the
  non-blocking variant: `CONCURRENTLY` on Postgres and Supabase,
  `pt-online-schema-change`/`gh-ost` or `ALGORITHM=INPLACE` on MySQL.
- Set lock and statement timeouts in the migration so it fails fast instead of
  holding the application while it waits:

```sql
SET lock_timeout = '2s';
SET statement_timeout = '30s';
```

- Never run the schema migration inside the same transaction that backfills
  millions of rows. The transaction stays open, holds locks, and grows the
  transaction log (WAL, undo, binlog).

## Batched backfills

```sql
-- ❌ One giant UPDATE: locks the table, long transaction, log explodes
UPDATE orders SET total_amount = amount;

-- ✅ Small batches, each in its own transaction, with a pause between them
DO $$
DECLARE
  affected INT;
BEGIN
  LOOP
    UPDATE orders SET total_amount = amount
    WHERE id IN (SELECT id FROM orders WHERE total_amount IS NULL LIMIT 1000);
    GET DIAGNOSTICS affected = ROW_COUNT;
    EXIT WHEN affected = 0;
    PERFORM pg_sleep(0.1); -- eases load, lets other queries through
  END LOOP;
END $$;
```

Rules:

- Small batches (500–5000 rows), never the whole table in one transaction.
- Idempotent: re-running the job must not duplicate or corrupt anything. Filter on
  `WHERE column IS NULL` rather than on an external counter.
- Off-peak when the table is large — tens of millions of rows.
- The backfill job runs outside the versioned migration: a separate script with a
  checkpoint so it can resume if it dies halfway.
- Watch replica or CDC lag while it runs.

## Reversibility

- Every migration has an `up` and a `down`, even when the `down` is "documented,
  not fully executable" — data removed by `DROP COLUMN` does not come back.
- Rolling back code is fast; rolling back schema is slow and risky. That is why
  expand-contract exists: the schema never has to be reverted mid-deploy.
- Take a backup or snapshot before any `DROP COLUMN` or `DROP TABLE` in
  production.

## Checklist

- [ ] Destructive migration split into expand → migrate → contract, never one deploy
- [ ] New `NOT NULL` applied through `NOT VALID` plus a separate `VALIDATE CONSTRAINT`
- [ ] New index created with the concurrent/online variant
- [ ] Backfill batched, outside the migration transaction, idempotent
- [ ] `lock_timeout` and `statement_timeout` set in the migration
- [ ] Tested against a production dump or copy at real volume, not an empty dev database
- [ ] Old and new code both exercised against the post-migration schema
- [ ] Backup taken before any destructive operation

## Anti-patterns

- ❌ Renaming or dropping a column in the same deploy that removes its usage in code
- ❌ `ALTER TABLE ... ADD COLUMN ... NOT NULL` straight onto a table with data
- ❌ `CREATE INDEX` without the concurrent variant on a large production table
- ❌ Backfilling millions of rows in a single transaction
- ❌ A migration with no `down` and no documented rollback strategy
- ❌ Running a migration by hand in production, outside the versioned pipeline
- ❌ Testing only against an empty dev database, never at production volume

## By stack

**Supabase CLI** — `supabase migration new add_total_amount`, then edit the
generated SQL to follow expand-contract. The backfill is a separate script, never
inside the versioned migration.

**Prisma (Node/TS)** — generate the SQL and edit it before applying
(`prisma migrate dev --create-only`):
```prisma
model Order {
  amount      Decimal
  totalAmount Decimal? @map("total_amount") // expand: nullable
}
```
The backfill runs as its own script (`ts-node scripts/backfill.ts`), never inside
the generated migration file.

**Alembic (Python/SQLAlchemy)**:
```python
def upgrade():
    op.add_column('orders', sa.Column('total_amount', sa.Numeric(10, 2), nullable=True))
    # backfill here only for a small table; otherwise a separate batched job

def downgrade():
    op.drop_column('orders', 'total_amount')
```

**Flyway/Liquibase (Java) and Rails ActiveRecord** follow the same shape — one
versioned migration per phase. `V2__add_total_amount.sql` →
`V3__backfill_total_amount.sql` → `V4__drop_amount.sql` in Flyway;
`AddTotalAmountToOrders` → backfill job → `RemoveAmountFromOrders` in Rails. Never
one migration doing all of it at once.
