---
name: integration-testing
description: Guides writing integration tests against real dependencies — disposable containers for database/services instead of mocks, test data setup/teardown, and automated multi-tenant isolation checks. Framework-agnostic. Use when user asks about integration tests, testing against a real database, mocking vs. real dependencies, testcontainers, or test data isolation.
---

# Integration Testing

An integration test exercises the boundary between the code and a real dependency
— database, queue, cache, external API — without mocking it. The point is to prove
the contract holds: the query, the constraint, the serialization, the transaction.
Not that internal logic is correct in isolation (that is a unit test), and not
that a whole journey works through the UI (that is E2E — see `e2e-testing`).

## Why not mock the data layer

A mocked repository or ORM tests your assumption about how the database behaves,
not the database. A badly written query, a violated constraint, an incompatible
type, an encoding problem, a transaction that never commits — all of it passes
clean against the mock and explodes in production.

```
// ❌ mocked repository — only proves the service called the right method
const repo = { findByEmail: jest.fn().mockResolvedValue(null) };
const service = new UserService(repo);
await service.create({ email: "a@b.com" });
expect(repo.create).toHaveBeenCalled();
// proves nothing about the unique constraint, the column type, or the index

// ✅ real database (disposable container) — proves the contract
const service = new UserService(realRepo); // wired to an ephemeral Postgres container
await service.create({ email: "a@b.com" });
await expect(service.create({ email: "a@b.com" }))
  .rejects.toThrow(/unique constraint/i);
// proves the uniqueness constraint exists and works
```

Rule of thumb: if you comment out the query implementation and the test still
passes, it is not testing integration. It is testing the mock.

## Disposable container, not a shared database

Every run of the suite brings up its own isolated instance of the dependency — an
ephemeral Docker container, an equivalent in-memory database, a local emulator, or
`supabase start` for Supabase — and tears it down at the end. A database shared
across runs, machines or CI is a source of flakiness and of "it works on my
machine".

```
// ❌ points at a shared dev/staging database
DATABASE_URL=postgres://dev-shared-db/app_dev

// ✅ bring up an isolated container per run, migrate, run, destroy
beforeAll ->  startContainer("postgres:16")
              runMigrations()
afterAll  ->  destroyContainer()
```

- One container per suite, rather than per test, is a fair cost trade — as long as
  the data inside it is isolated per test (next section).
- CI and the local machine use the same mechanism. "Mock in CI, real locally" — or
  the reverse — is exactly the arrangement that hides bugs.
- A third-party service with no viable local version (a payment gateway, an SMS
  provider) becomes a fake server you control — WireMock, a local HTTP server
  speaking the same contract — not an in-process mock. The goal is to exercise
  real serialization and network I/O, replacing only the far side of the wire.

## Test data setup and teardown

```
The pattern, in any stack:
1. create the minimum data the test needs, inside the test or its setup
2. run the behaviour under test
3. assert on the resulting state — database, response, side effect
4. clean up what was created, even when the test fails
```

- Data is created by the test, never a fixed fixture loaded once for the whole
  suite and reused: reuse couples tests together and makes execution order matter.
- A transaction rolled back at the end of each test is the fastest isolation where
  the driver or framework supports it — no manual `DELETE`/`TRUNCATE`, and it
  survives a test that dies halfway.
- Without automatic rollback: explicit teardown in `afterEach`/`finally`, never
  only on the happy path.
- A unique identifier per run (uuid) when tests run in parallel against the same
  container, so concurrent tests cannot collide on a unique key.

## Where the boundaries are

| Layer | Depends on | Proves | Speed |
|---|---|---|---|
| Unit | Nothing external — all in memory or mocked | Pure logic, one business rule | Milliseconds |
| Integration | A real database or service, no UI | The contract between code and dependency: query, constraint, transaction, serialization | Seconds |
| E2E | The whole system through a real browser | The user's journey end to end | Minutes |

Integration is slower than unit (real I/O takes time) and faster than E2E (no
browser, no rendering). If the behaviour can be proven without real I/O, it is a
unit test — do not pay the integration cost for nothing. If it can only be proven
by bringing up the whole UI (a multi-screen flow, client-side JS), it is E2E; see
`e2e-testing`. Business rule plus persistence is integration's natural territory.

## Multi-tenant isolation as an automated test

In a multi-tenant system — the usual shape of SaaS with several client accounts —
isolation between tenants is exactly the kind of contract a mock can never catch.
RLS, a `tenant_id`/`owner_id` filter, schema-per-tenant: all of them are only
proven against the real database. Treat each isolation policy as an ordinary
integration test rather than a manual checklist item.

```
The isolation test, against a real database:
1. create tenant A and tenant B
2. create resource R as tenant A
3. authenticate and query as tenant B
4. assert: denied or empty — never A's data
```

See `multi-tenant-isolation-audit` for the full inventory of where isolation leaks
— joins, cache, jobs, storage, exports — and the audit checklist. The point here
is only that every item on that list becomes a versioned integration test instead
of a check somebody repeats by hand at review time.

## Checklist

- [ ] Tests run against a real, disposable instance of the dependency — never a mocked data layer
- [ ] The instance is ephemeral, created and destroyed by the suite itself, and CI and local use the same mechanism
- [ ] Test data is created by the test or its setup, not loaded from a shared fixed fixture
- [ ] Teardown guaranteed on failure (transaction rollback, `afterEach`/`finally`) — no orphaned data accumulating between runs
- [ ] Each test passes alone and inside the full suite, in any order
- [ ] Constraints, indexes, transactions and queries are genuinely exercised, not just the method call
- [ ] A third-party service with no local version uses a controlled fake server, not an in-process mock
- [ ] Every multi-tenant isolation policy has its own integration test: tenant A cannot reach tenant B's resource
- [ ] The integration suite runs in CI, not only locally before a merge
- [ ] No integration test is doing E2E's job (opening a browser) or a unit test's (mocking the very dependency it should exercise)

## Anti-patterns

- ❌ Mocking the repository, ORM or database client and calling it an integration test
- ❌ Pointing integration tests at a dev or staging database shared across runs
- ❌ A fixture loaded once and reused suite-wide, coupling tests to execution order
- ❌ Teardown missing, or only on the happy path — orphaned data contaminates the next run
- ❌ CI mocking while local uses a real database, or the reverse: divergence that hides bugs until production
- ❌ Trusting a manual multi-tenant isolation checklist instead of automating it as a test
- ❌ Writing a full UI E2E to prove something a direct API call against the real database proves faster
- ❌ An integration suite so slow that nobody runs it locally and it becomes CI's problem alone

## By stack

**Node/TypeScript (Testcontainers + Postgres):**
```ts
let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16").start();
  await runMigrations(container.getConnectionUri());
});
afterAll(() => container.stop());

test("rejects a duplicate email", async () => {
  const repo = new UserRepository(container.getConnectionUri());
  await repo.create({ email: "a@b.com" });
  await expect(repo.create({ email: "a@b.com" })).rejects.toThrow();
});
```

**Supabase local (`supabase start`):**
```ts
beforeAll(async () => {
  // supabase start brings up Postgres, Auth and Storage locally through Docker
  supabase = createClient(LOCAL_URL, LOCAL_ANON_KEY);
});

test("RLS blocks cross-tenant reads", async () => {
  await supabase.auth.signInWithPassword({ email: userA, password });
  const { data } = await supabase.from('orders').select().eq('id', ordersOfB.id);
  expect(data).toHaveLength(0); // the policy blocked it; no other owner's data came back
});
```

**Python (pytest + testcontainers):**
```python
@pytest.fixture(scope="module")
def pg_container():
    with PostgresContainer("postgres:16") as pg:
        run_migrations(pg.get_connection_url())
        yield pg

def test_unique_email(pg_container):
    repo = UserRepository(pg_container.get_connection_url())
    repo.create(email="a@b.com")
    with pytest.raises(IntegrityError):
        repo.create(email="a@b.com")
```

**Go (dockertest or testcontainers-go):**
```go
func TestCreateUser_DuplicateEmail(t *testing.T) {
    db := setupPostgresContainer(t) // starts the container, migrates, returns *sql.DB
    repo := NewUserRepository(db)

    require.NoError(t, repo.Create(ctx, User{Email: "a@b.com"}))
    err := repo.Create(ctx, User{Email: "a@b.com"})
    require.ErrorContains(t, err, "duplicate key")
}
```
