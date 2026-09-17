---
name: e2e-testing
description: Guides writing reliable end-to-end tests — programmatic auth fixtures instead of UI login, per-run data isolation, accessible selectors (role/label), and when E2E is the right layer vs. integration/unit. Use when user asks about E2E tests, flaky tests, test selectors, login fixtures for tests, Playwright, Cypress, or Selenium.
---

# E2E Testing

## When E2E is the right layer

| Layer | What it proves | Cost | When |
|---|---|---|---|
| Unit | Pure logic, one function | Very low | Always — the first line of defence |
| Integration | The contract between modules, real API plus database | Low to medium | Business rules, service/API/repository layer |
| E2E | A whole journey through the real UI | High | Critical flows only: login, checkout, sign-up, payment |

Rule of thumb: if the behaviour can be proven without a browser, it is not E2E.
E2E does not replace integration — it is the slowest and most fragile layer of the
pyramid, so spend it sparingly. See `tdd` for the red-green-refactor cycle and
`integration-testing` for the layer below.

## Authentication fixtures

Logging in through the UI in every test is slow and flaky: each test inherits the
fragility of the login screen even when login is not what is under test.
Authenticate programmatically — call the auth API directly, or reuse a session or
token already obtained — and only then open the page you care about.

```
// ❌ UI login in every test
open("/login")
fill("#email", "user@test.com")
fill("#password", "123456")
click("Sign in")
waitForUrl("/dashboard")
// ... the real test only starts here

// ✅ authenticate through the API, session ready before the page opens
authenticateViaApi("user@test.com", "123456")  // injects cookie/token/localStorage
open("/profile")
// the test starts on the behaviour under test
```

- The login flow itself is exercised through the UI *once*, in the test dedicated
  to login.
- Reusing a session across tests for the same user (a `beforeAll` or a global
  fixture) is fine whenever the test does not need clean auth state.

## Per-run data isolation

Each test creates and cleans up its own data. Never depend on a fixed record in a
shared environment, or on another test having run first — both break under
parallelism and under re-runs.

```
// ❌ depends on fixed data somebody created by hand months ago
open("/customers/123/orders")

// ✅ creates and destroys its own data, with a per-run unique identifier
customer = api.createCustomer({ name: `E2E Customer ${uuid()}` })
api.createOrder(customer.id, { amount: 100 })
open(`/customers/${customer.id}/orders`)
// ...
api.deleteCustomer(customer.id)  // teardown, even when the test fails
```

Checklist:
- [ ] Data created through the API or a seed, not through the UI — UI setup is slow and is not what is under test
- [ ] A unique identifier per run (uuid or timestamp), so parallel runs cannot collide
- [ ] Teardown guaranteed on failure too (`afterEach`/`finally`, not just the happy path)
- [ ] The test passes alone and passes inside the full suite, in any order

## Accessible selectors

A CSS class or a positional XPath breaks on every style or DOM change, with no
relation to the behaviour under test. Selecting by role or accessible label is
stable because it is the same contract users and screen readers depend on — and
it pushes the UI to be genuinely accessible (see `accessibility-audit`).

```
// ❌ coupled to implementation and styling
select(".btn-primary.submit-form")
select("div > span:nth-child(2)")
select("//div[3]/button")

// ✅ the accessibility contract — survives a visual refactor
selectByRole("button", { name: "Save" })
selectByLabel("Email")
selectByText("Order created successfully")
```

`data-testid` is an acceptable fallback only where no natural role or label exists
— a purely visual element asserted for state, say. Even then, prefer fixing the
component to expose accessible semantics.

## Stability

```
// ❌ a fixed wait — either too short (flaky) or wasteful (slow)
wait(3000)
click("Save")

// ✅ wait for the real condition
waitVisible(selectByText("Order created successfully"))
click("Save")
```

- Never a fixed `sleep`/`waitForTimeout`. Wait for an element to be visible, a
  request to settle, a URL to change.
- A test that fails sometimes is not "flaky, run it again" — it is a bug, either
  in the test (race condition, shared data, ambiguous selector) or in the product.
  Find the cause rather than masking it with a retry.
- The runner's automatic retry is a safety net for unstable infrastructure, not an
  excuse for a badly written test.

## Structure

- Wrap repeated selectors and actions in page objects or helpers: it avoids
  copying `selectByRole(...)` across dozens of files and gives the UI change one
  place to land.
- One test, one journey. Stacking assertions from different flows into a single
  test makes it hard to tell what broke.
- The suite should run in parallel (workers or sharding). If it cannot, that is
  usually a symptom of unisolated data.

## By stack

**Playwright (TS)** — auth through `storageState`, reused across tests:
```ts
test.beforeAll(async ({ request }) => {
  await request.post('/api/auth/login', { data: { email, password } });
});
test.use({ storageState: 'auth.json' });

test('edits the profile', async ({ page }) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Save' }).click();
});
```

**Cypress** — programmatic auth through a custom command:
```js
Cypress.Commands.add('login', (email, password) => {
  cy.request('POST', '/api/auth/login', { email, password })
    .then(({ body }) => window.localStorage.setItem('token', body.token));
});

it('edits the profile', () => {
  cy.login('user@test.com', '123456');
  cy.visit('/profile');
  cy.findByRole('button', { name: 'Save' }).click();
});
```

**Selenium (Python)** — auth through the API, selection by accessibility attribute:
```python
def test_edits_profile(driver, api_client):
    token = api_client.login("user@test.com", "123456")
    driver.add_cookie({"name": "session", "value": token})
    driver.get(f"{BASE_URL}/profile")
    driver.find_element(By.CSS_SELECTOR, "[role='button'][aria-label='Save']").click()
```

## Anti-patterns

- ❌ UI login in every test that is not about login
- ❌ Depending on fixed data shared across tests or environments
- ❌ Selecting by CSS class, positional XPath or DOM structure
- ❌ A fixed `sleep`/`waitForTimeout` instead of waiting on a condition
- ❌ A test that only passes in one execution order
- ❌ Covering with E2E what an integration or unit test already proves
- ❌ Running the whole E2E suite, unparallelised, on every commit
- ❌ Hiding a flaky test behind a retry instead of finding the cause
- ❌ Teardown missing, or only on the happy path — orphaned data accumulates and contaminates later runs
