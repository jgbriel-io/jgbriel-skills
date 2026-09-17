---
name: query-performance
description: Diagnoses slow SQL queries by reading execution plans and picking the right index strategy — composite, partial, covering. Use when user asks about slow queries, query optimization, EXPLAIN/execution plans, missing indexes, N+1 queries, or database performance tuning.
---

# Query Performance

Applies to any relational engine — Postgres, MySQL, SQL Server, Oracle. The
operator names change; the reasoning does not.

## Diagnosis flow

1. Identify the slow query from evidence — slow-query log, APM, Query Store.
   Never optimize blind.
2. Run the execution plan **with real execution**, not the estimate alone.
3. Look for a full or sequential scan on a large table.
4. Compare estimated rows against actual rows. A large gap means stale statistics,
   and the whole plan is suspect.
5. Look at the join algorithm and the sort operations — they are usually the real
   cost, not the scan.
6. Create or adjust the index, re-run the plan, and compare cost before and after.
7. Measure the write cost. Every new index is paid for on INSERT, UPDATE and DELETE.

## Reading an execution plan

Every plan has the same elements, whatever the engine:

- **Cost** (startup..total, or estimated subtree cost) — a relative number, not a
  time
- **Estimated vs actual rows** — when the optimizer misjudges this, the whole plan
  can be wrong
- **Table access**:
  - full/sequential scan — reads the whole table
  - index scan / index seek — uses an index to locate rows
  - index-only scan / covering — answers from the index without touching the table
- **Join strategy**:
  - nested loop — good when one side is small
  - hash join — good for large unsorted datasets
  - merge join — good when both inputs already arrive sorted, usually by index
- **Sort and aggregation** — often more expensive than the scan itself. If they
  show up in a query that runs constantly, consider an index that is already in
  the required order

```sql
-- ❌ Reading the estimate only
EXPLAIN SELECT * FROM orders WHERE customer_id = 123;

-- ✅ Real execution: actual rows, actual time, buffers
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 123;
```

## Which index to use

| Situation | Index type |
|---|---|
| One column used in `WHERE`/`JOIN` | Simple index |
| Two or more columns always filtered together | Composite (equality columns before range ones) |
| Recurring filter on a subset (`status = 'active'`, `deleted_at IS NULL`) | Partial index |
| The query reads only columns the index can hold | Covering index, which avoids the table lookup |
| Filter on a function or expression (`LOWER(email)`, `date_trunc('day', ...)`) | Expression index |

```sql
-- Composite: equality column first, range column after
CREATE INDEX idx_orders_customer_date ON orders (customer_id, created_at);

-- Partial: smaller and faster, but only used when the query repeats the filter
CREATE INDEX idx_orders_active ON orders (customer_id) WHERE status = 'active';

-- Expression: without it, WHERE LOWER(email) = ... forces a full scan
CREATE INDEX idx_users_email_lower ON users (LOWER(email));
```

Column order in a composite index matters: the engine uses it efficiently only
left to right. `(customer_id, created_at)` serves `WHERE customer_id = ?` and
`WHERE customer_id = ? AND created_at > ?`, but does little for
`WHERE created_at > ?` on its own.

## What stops an index from being used

```sql
-- ❌ A function over the indexed column cancels the index
WHERE LOWER(email) = 'a@b.com'  -- without an expression index, this is a full scan

-- ❌ A leading wildcard cannot use a B-tree index
WHERE name LIKE '%silva'

-- ❌ Implicit type cast (INT column compared against a string)
WHERE code = '123'  -- if code is INT, this can invalidate the index

-- ❌ OR across columns with no combined index and no UNION
WHERE customer_id = 1 OR seller_id = 1
```

## Slowness that is not about indexes

- N+1: one query per item in a list instead of a single `JOIN` or `IN`
- `SELECT *` when only a few columns are used — more I/O, and it rules out an
  index-only scan
- Unbounded pagination, or a large `OFFSET`: the engine still walks and discards
  every skipped row
- Stale statistics. The optimizer picks a plan from cardinality estimates, so
  without `ANALYZE` it chooses badly even when the right index exists

## Checklist

- [ ] Plan captured with real execution, against real data
- [ ] Any full scan on a large table identified and either justified or removed
- [ ] Estimated rows close to actual rows, or statistics refreshed
- [ ] The candidate index measurably reduces plan cost
- [ ] The new index does not duplicate an existing one with the same leading column
- [ ] Write impact considered — a write-heavy table does not get indexes casually
- [ ] Pagination avoids a large `OFFSET`; keyset or cursor at volume

## By stack

**Postgres** (Supabase included) — `EXPLAIN (ANALYZE, BUFFERS)` shows cost, actual
rows and buffer I/O; partial indexes and `CREATE INDEX CONCURRENTLY` avoid locking
production:
```sql
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM orders WHERE customer_id = 123;
CREATE INDEX CONCURRENTLY idx_orders_customer ON orders (customer_id);
```

**MySQL** — `EXPLAIN ANALYZE` (8.0+) shows the real plan; composite indexes follow
the same column-order rule, and there is no native partial index:
```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 123 AND status = 'active';
CREATE INDEX idx_orders_customer_status ON orders (customer_id, status);
```

**SQL Server** — real plan via `SET STATISTICS IO, TIME ON` or "Include Actual
Execution Plan"; a covering index uses `INCLUDE` to carry extra columns without
putting them in the key:
```sql
SET STATISTICS IO ON;
SELECT id, name FROM orders WHERE customer_id = 123;

CREATE INDEX idx_orders_customer ON orders (customer_id) INCLUDE (name, status);
```

## Anti-patterns

- ❌ Creating an index without comparing the plan before and after
- ❌ A composite index whose leading column does not match the common filter
- ❌ Indexing every column "to be safe" — each one costs writes and space
- ❌ Trusting the estimated plan without running a real execution
- ❌ Papering over a slow query with an application cache before finding the cause
- ❌ Ignoring a large `OFFSET` when paginating a large table
- ❌ Leaving statistics stale after a big data load
