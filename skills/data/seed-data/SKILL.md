---
name: seed-data
description: Explains reproducible seed data per environment — determinism, idempotency, dependency ordering, and masking real data for dev/test/staging. Database/ORM-agnostic. Use when user asks about seed data, fixtures, db seed, populate database, "dados de teste", or mocking a dev/staging database.
---

# Seed Data

Seed is data inserted on purpose to make an environment usable — distinct from a
migration, which changes schema, and from production data, which is real and
belongs to users. The problem is the same in any database or ORM: generate data
that is deterministic, idempotent, and the right size for the environment.

## Seed vs migration vs fixture

| Concept | What it is | When it runs |
|---|---|---|
| Migration | Changes structure | Every deploy, every environment |
| Seed | Populates reference or example data | Environment setup: dev, CI, staging |
| Fixture | Fixed data for one specific test | Only during that test |

```
// ❌ Seed mixed into a migration file
ALTER TABLE products ADD COLUMN category_id INT;
INSERT INTO products (name, category_id) VALUES ('Example', 1);

// ✅ The migration only changes structure; seed is its own versioned script
```

## Determinism

Seed that produces different data on every run breaks tests, breaks comparison
between environments, and makes debugging impossible — "it reproduces here and
not on your machine".

```ts
// ❌ Faker with no fixed seed — the data changes every run
const name = faker.person.fullName();

// ✅ RNG with a fixed seed — the same data on every machine and in CI
faker.seed(42);
const name = faker.person.fullName();
```

- Never call `now()`, `Date.now()` or `random()` directly in generated data. Fix a
  reference timestamp (`const NOW = new Date('2024-01-01')`) and derive dates from
  it.
- Predictable ids where possible — sequential, or UUIDs generated from a fixed
  seed — so a test can reference `WHERE id = 1` without querying first.

## Idempotency

Running the seed twice must not duplicate a row or fail on a unique or foreign key.

```sql
-- ❌ Plain INSERT — the second run duplicates or violates a unique constraint
INSERT INTO categories (name) VALUES ('Electronics');

-- ✅ Upsert — idempotent at any number of runs
INSERT INTO categories (id, name) VALUES (1, 'Electronics')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
```

Equivalents per tool: `findOrCreate`/`upsert` in an ORM,
`INSERT ... ON DUPLICATE KEY UPDATE` in MySQL, or truncating the seeded tables
before reinserting — non-production environments only, never against real data.

## Dependency order

Seeding a table with foreign keys has to respect insertion order (parent before
child) and, when clearing, the reverse (child before parent) — or temporarily
disable FK checking where the engine allows it.

```
// ❌ Seeding orders before customers exist — the FK fails
seedOrders(); seedCustomers();

// ✅ Follow the dependency graph: the referenced before the referencing
seedCustomers(); seedProducts(); seedOrders();
```

In larger databases, derive the order from the schema (a topological sort over the
FKs) rather than maintaining the list by hand.

## Seed per environment

| Environment | Volume | Source | Goal |
|---|---|---|---|
| Local dev | Small to medium, realistic | Fully synthetic (Faker or a generator) | A usable environment that depends on nobody |
| Test/CI | Minimal, only what the case needs | Fully synthetic, deterministic | Fast, reproducible tests |
| Staging | Close to real volume | **Masked** production copy, or synthetic at scale | Validate behaviour at real volume and distribution |
| Production | — | Never an automatic seed | Seeding belongs to non-production environments |

- Never run a seed script against production. Reference data that production
  genuinely needs — a status table, a fixed category list — is a data migration,
  and follows `safe-migrations`.
- Synthetic dev data should look real enough to catch formatting and length bugs:
  long names, accents, a deliberately invalid document number. It must never be a
  real person's data.

## Masking a production copy

When staging needs real volume and distribution, copy production but mask every
piece of personal data **before** it reaches any non-production environment —
name, email, phone, document, address replaced by consistent generated values, so
that the same `id` always maps to the same fake name and joins and regression
tests keep working. Reversible pseudonymisation (a hash) is not enough; see
`lgpd-checklist` for the masking and retention checklist.

```
// ❌ Production dump restored straight into staging
pg_restore production.dump

// ✅ The dump goes through a masking pipeline before staging sees it
pg_restore production.dump | mask-pii --config=masking.yml
```

## Volume and performance

- Dev seed: seconds, not minutes. If it is slow, cut the volume or batch the
  inserts (`COPY`/bulk insert instead of one INSERT per row).
- A load or performance seed is a separate script with a different goal: millions
  of rows, not readability.
- An automated test seeds only the minimum its case needs. One giant shared seed
  makes tests slow and brittle, and a change to it breaks tests that have nothing
  to do with it.

## Checklist

- [ ] Deterministic — the same run produces the same data on any machine and in CI (seeded RNG, fixed dates)
- [ ] Idempotent — running it N times neither duplicates nor breaks a constraint
- [ ] Respects FK dependency order, on insert and on cleanup
- [ ] Separate from migration files: its own versioned script or command
- [ ] No real personal data in dev, test or CI
- [ ] A production copy destined for staging is masked before any non-production access
- [ ] Automated tests seed only their own minimum, not the full dev dataset
- [ ] No seed script with production access enabled

## Anti-patterns

- ❌ `faker`/`random` with no fixed seed — data changes every run and tests go flaky
- ❌ Plain `INSERT` with no upsert or check, so the second run duplicates or fails
- ❌ Seed mixed into a versioned migration file
- ❌ Restoring a production dump into dev or staging without masking first
- ❌ Calling reversible pseudonymisation "masked" — it is still personal data
- ❌ One giant seed serving dev, test and staging, which want different things
- ❌ A seed script holding a reachable production connection string
- ❌ A hand-maintained insertion order that ignores the FK graph, and breaks whenever a table is added

## By stack

**Supabase (`supabase/seed.sql`)** — run automatically by `supabase db reset` in
local dev:
```sql
insert into categories (id, name) values (1, 'Electronics')
on conflict (id) do update set name = excluded.name;
```

**Prisma + Postgres (Node/TS)** — `prisma/seed.ts`, with a seeded Faker:
```ts
import { faker } from '@faker-js/faker';
faker.seed(42);

async function main() {
  const category = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Electronics' },
  });
  // ... the rest of the dependency graph, always upsert
}
```
Registered in `package.json` (`"prisma": { "seed": "ts-node prisma/seed.ts" }`)
and run through `prisma db seed` — never inside a generated migration.

**Python (SQLAlchemy/Django) with a seeded Faker**:
```python
from faker import Faker
fake = Faker()
Faker.seed(42)

def seed():
    category, _ = Category.objects.get_or_create(id=1, defaults={"name": "Electronics"})
    # get_or_create/update_or_create is what makes it idempotent
```
Django exposes this as a management command (`python manage.py seed`); plain
SQLAlchemy runs it as a script invoked from a `Makefile` or task runner.
