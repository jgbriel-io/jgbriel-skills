---
name: e2e-testing
description: Guides writing reliable browser tests (Playwright, `.browser.ts`) — one spec per screen with an axe accessibility floor, programmatic auth with one account per parallel worker, per-run data isolation, role/label locators, `@flaky` quarantine instead of silent skips. Use when user asks about E2E or browser tests, flaky tests, test selectors, login fixtures for tests, accessibility checks in tests, Playwright, Cypress, or Selenium. API-level end-to-end tests (`.e2e.test.ts`) are integration-testing.
---

# E2E Testing (browser tier)

## Where the browser tier sits

| File | Proves | Skill |
|---|---|---|
| `x.test.ts` | Pure logic, one module | `tdd` |
| `x.integration.test.ts` | The contract with one real dependency | `integration-testing` |
| `x.e2e.test.ts` | The API end to end, through the app, no browser | `integration-testing` |
| `x.browser.ts` | The served app in a real browser | this one |

- **`.browser.ts`, never `.spec.ts`.** Vitest and Bun discover `.test` and
  `.spec` with zero configuration; neither discovers `.browser.ts`, so a
  Playwright file can never be swallowed by a unit run.
- **Every screen gets a spec** that renders it, drives it and asserts what the
  user sees. A type check never opens the page, so a component that renders
  nothing passes it. Long multi-screen journeys stay for the critical flows.
- If the behaviour can be proven without a browser, it belongs a level down —
  the browser tier is the slowest and most fragile.

## Config

```ts
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.browser.ts',
  retries: process.env.CI ? 2 : 0,
  use: { trace: 'on-first-retry' },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    { name: 'app', dependencies: ['setup'] },
  ],
})
```

- `testDir` pins whatever folder the repo already uses; migrating renames only
  the suffix.
- One project per surface (a public site and a logged-in app are two).
- Script `test:browser`. `test:e2e` is the API level, never Playwright.

## Authentication

Logging in through the UI in every test makes every test inherit the login
screen's fragility. Authenticate through the API, save the storage state, open
the page under test. The login flow itself goes through the UI once, in its own
spec.

- **One account per parallel worker** when tests change server state (a CRM,
  an ERP). Two workers editing as the same user race on the same records, and
  the failure looks like a flaky test.
- A single shared account from the setup project only for read-only surfaces.
- Storage state lives in `playwright/.auth/`, **gitignored**: it holds live
  session cookies.

```ts
export const test = base.extend<{}, { workerStorageState: string }>({
  storageState: ({ workerStorageState }, use) => use(workerStorageState),
  workerStorageState: [async ({ browser }, use) => {
    const index = test.info().parallelIndex;
    const file = `playwright/.auth/worker-${index}.json`;
    const page = await browser.newPage({ storageState: undefined });
    await signInViaApi(page.request, testAccounts[index]);
    await page.context().storageState({ path: file });
    await page.close();
    await use(file);
  }, { scope: 'worker' }],
});
```

## Accessibility floor

Every screen's spec runs axe and allows **zero serious or critical**
violations. It is the automated floor; keyboard and screen-reader checks still
apply (see `accessibility-audit`).

```ts
import AxeBuilder from '@axe-core/playwright';

test('customer list has no serious accessibility violations', async ({ page }) => {
  await page.goto('/customers');
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
});
```

## Data isolation

Each test creates and cleans up its own data, through the API or a factory,
never through the UI and never by relying on a fixed record somebody created by
hand. A unique id per run (uuid) keeps parallel runs from colliding; teardown
runs on failure too.

## Locators

By role and accessible name — the contract users and screen readers depend on,
so it survives a visual refactor and pushes the UI to be accessible:

```ts
page.getByRole('button', { name: 'Save' })
page.getByLabel('Email')
```

Never a CSS class, a positional XPath or DOM structure. `getByTestId` only where
no role or label exists, and even then prefer fixing the component. A spec that
breaks on a copy change is reporting that the copy moved.

## Flaky tests: quarantine, never silence

- Never a fixed `waitForTimeout`; wait for the real condition (visible element,
  settled request, URL change).
- Retries only in CI, with a trace on the first retry. A retry is a net for
  unstable infrastructure, not a fix.
- A test that fails intermittently gets the `@flaky` tag, **an owner and a
  deadline**, and keeps running. It is never `test.skip`ped quietly: a skipped
  test stops reporting the bug it found.
- `@smoke` marks the fast subset.

## Out of scope

- **Third parties are not tested**: external sites and services are stubbed at
  the network layer (`page.route`).
- **Visual regression is not used** unless CI and local run the same Docker
  image; font rendering differs between machines and every run goes red.

## Other runners

Cypress and Selenium follow the same rules: programmatic auth (`cy.session`,
cookies injected before navigation), Testing Library role queries, per-run data,
no fixed waits.

## Anti-patterns

- ❌ A `.spec.ts` Playwright file picked up by the unit runner
- ❌ UI login in every test that is not about login
- ❌ Several workers mutating data as the same account
- ❌ Committing `playwright/.auth/`
- ❌ A screen with no spec, signed off by a type check
- ❌ `test.skip` on a flaky test instead of `@flaky` with an owner
- ❌ Selecting by CSS class or DOM position
- ❌ A browser suite that exists but never runs in CI
