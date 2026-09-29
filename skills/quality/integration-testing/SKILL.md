---
name: integration-testing
description: Guides writing integration and API end-to-end tests against real dependencies — a disposable database instead of mocks (the local Supabase database for Supabase repos), pgTAP for SQL and RLS, factories for test data, automated multi-tenant isolation checks, and the file names that keep each level separate. Use when user asks about integration tests, testing against a real database, mocking vs. real dependencies, testcontainers, pgTAP, RLS tests, or test data isolation. The browser tier (Playwright) is e2e-testing.
---

# Integration Testing

An integration test exercises the boundary between the code and a real dependency
— database, queue, cache, external API — without mocking it. The point is to prove
the contract holds: the query, the constraint, the serialization, the transaction.

## Levels and file names

The level is the **highest** thing a file touches. A file that seeds through the
database and then calls the API is `e2e`: seeding is setup, not what is under test.

| File | Level | Runs against | Script |
|---|---|---|---|
| `x.test.ts` | unit | nothing outside the module | `test:unit` |
| `x.integration.test.ts` | integration | one real dependency | `test:integration` |
| `x.e2e.test.ts` | end-to-end | the API through the app (`app.handle()`, supertest) | `test:e2e` |
| `supabase/tests/x.test.sql` | database | SQL and RLS inside Supabase | `test:db` |
| `x.browser.ts` | browser | the served app in a real browser | `test:browser` — see `e2e-testing` |

- Tests sit **next to the code they test**, never in a mirrored `test/` tree: an
  untested file must be visible from its own folder.
- Qualifiers go between subject and level: `order.rls.integration.test.ts`,
  `payment.live.integration.test.ts` (`.live.` calls a real external service and
  is excluded from the default run).
- **Separate the levels by subtraction**: unit is "every test file minus the
  other levels", so no file is left unclaimed. In Vitest, `test.projects` with
  `unit` excluding `**/*.integration.test.ts` and `**/*.e2e.test.ts`. In Bun, one
  script per level, and the database preload passed with `--preload` only in the
  integration and e2e scripts, never in `bunfig.toml`, which would make every
  unit run need Docker.
- Titles are behavior sentences, present tense, no "should":
  `it('rejects a duplicate email')`.

## Why not mock the data layer

A mocked repository or ORM tests your assumption about how the database behaves,
not the database. A badly written query, a violated constraint, an incompatible
type, a transaction that never commits — all of it passes clean against the mock
and explodes in production.

```
// ❌ mocked repository — only proves the service called the right method
const repo = { findByEmail: vi.fn().mockResolvedValue(null) };
await new UserService(repo).create({ email: "a@b.com" });
expect(repo.create).toHaveBeenCalled();

// ✅ real database (disposable) — proves the unique constraint exists and works
const service = new UserService(realRepo);
await service.create({ email: "a@b.com" });
await expect(service.create({ email: "a@b.com" })).rejects.toThrow(/unique/i);
```

Rule of thumb: if you comment out the query and the test still passes, it tests
the mock.

## A disposable database, never a shared one

- **Plain Postgres repos:** a container per run, created and destroyed by the
  suite (Testcontainers, or a tmpfs `postgres` on a dedicated port).
- **Supabase repos: the local Supabase database** (`supabase db start`), never a
  plain Postgres container. Plain Postgres has no `auth` schema, no
  `anon`/`authenticated` roles and no `auth.uid()`, so an RLS test there proves
  nothing. CI uses the `supabase/postgres` image alone (see `ci-cd-pipeline`).
- **Never a dev, staging or dev/hml database.** Shared state across runs is where
  "it works on my machine" and order-dependent failures come from.
- CI and local both use a real, disposable database. "Mock in CI, real locally"
  is exactly the arrangement that hides bugs.
- An external provider (payments, SMS, email) gets a **fake**: a working
  in-memory implementation of its interface, or a local server speaking its
  contract. Not a mock of each call, which only replays what you assumed.

## Test data

- **Factories, not shared fixtures.** Each test builds the minimum it needs; a
  fixture loaded once for the suite couples tests to execution order.
- A transaction rolled back after each test is the fastest isolation where the
  driver allows it, and it survives a test that dies halfway. Otherwise,
  teardown in `afterEach`/`finally`, never only on the happy path.
- A unique id per run (uuid) when tests share a database in parallel, so they
  cannot collide on a unique key.

## Multi-tenant isolation as a test

Isolation between tenants is exactly the contract a mock can never catch. RLS, a
`tenant_id` filter, schema-per-tenant: each policy becomes an ordinary versioned
test, not a checklist item repeated at review time.

```
1. create tenant A and tenant B
2. create resource R as tenant A
3. query as tenant B
4. assert: denied or empty — never A's data
```

Name it with the qualifier (`board.isolation.integration.test.ts`) so the suite
shows at a glance which boundaries are covered. `multi-tenant-isolation-audit`
has the inventory of where isolation leaks — joins, cache, jobs, storage, exports.

## pgTAP: SQL and RLS where they live

Policies, triggers and functions are tested inside the database with pgTAP, in
`supabase/tests/`, run by `supabase test db`. Impersonate a user the way
PostgREST does — claims plus role — inside a transaction that rolls back:

```sql
begin;
select plan(1);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
set local role authenticated;
select is_empty(
  $$ select id from orders where tenant_id = '00000000-0000-0000-0000-00000000000a' $$,
  'tenant B sees none of tenant A''s orders'
);
select * from finish();
rollback;
```

## Checklist

- [ ] Every file's suffix names the highest level it touches
- [ ] Real, disposable database; in Supabase repos, the local Supabase database, not plain Postgres
- [ ] No test points at a shared dev, staging or dev/hml database
- [ ] Data from factories inside each test; teardown guaranteed on failure
- [ ] Each test passes alone and in the full suite, in any order
- [ ] External providers behind a fake, not per-call mocks
- [ ] Every isolation policy has its own test: tenant A cannot reach tenant B
- [ ] RLS and SQL functions covered by pgTAP where the repo is on Supabase
- [ ] The suite runs in CI, and in the pre-push hook

## Anti-patterns

- ❌ Mocking the repository, ORM or database client and calling it an integration test
- ❌ RLS tests against a plain Postgres container, where `auth.uid()` does not exist
- ❌ A `.test.ts` file that silently needs Docker, breaking the unit run
- ❌ `bunfig.toml` `[test] preload` starting the database for every run
- ❌ A fixture loaded once and reused suite-wide
- ❌ A browser test proving what a direct API call against the real database proves faster

## By stack

**Node/TypeScript (Testcontainers + Postgres):**
```ts
let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:17").start();
  await runMigrations(container.getConnectionUri());
});
afterAll(() => container.stop());

test("rejects a duplicate email", async () => {
  const repo = new UserRepository(container.getConnectionUri());
  await repo.create({ email: "a@b.com" });
  await expect(repo.create({ email: "a@b.com" })).rejects.toThrow();
});
```

**Supabase local database, RLS from TypeScript (`postgres.js`):**
```ts
test("RLS hides another tenant's orders", async () => {
  await sql.begin(async (tx) => {
    await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: userB.id, role: "authenticated" })}, true)`;
    await tx`set local role authenticated`;
    const rows = await tx`select id from orders where id = ${orderOfA.id}`;
    expect(rows).toHaveLength(0);
  });
});
```

**Python (pytest + testcontainers):**
```python
@pytest.fixture(scope="module")
def pg_container():
    with PostgresContainer("postgres:17") as pg:
        run_migrations(pg.get_connection_url())
        yield pg

def test_unique_email(pg_container):
    repo = UserRepository(pg_container.get_connection_url())
    repo.create(email="a@b.com")
    with pytest.raises(IntegrityError):
        repo.create(email="a@b.com")
```
