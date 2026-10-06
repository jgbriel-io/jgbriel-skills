---
name: ci-cd-pipeline
description: Defines the CI jobs (checks, tests, browser, sonar, mutation), where they run (self-hosted runner for private repos, GitHub-hosted for public ones), throwaway database containers, and deploys through the host's git integration instead of an Actions deploy step. Use when the user asks about pipeline stages, GitHub Actions workflows, runners, CI caching, databases or migrations in CI, SonarQube in CI, previews, or what gates a merge. GitLab CI and Jenkins map the same jobs. Git hooks are setup-pre-commit; undoing a bad deploy is rollback-runbook.
---

# CI/CD Pipeline

CI proves on a clean checkout what the local hooks already ran; CD is the
host's job, not the pipeline's. The shape is tool-independent, GitHub Actions
is the worked example.

## 1. Jobs

| Job | Trigger | Runs |
|---|---|---|
| `checks` | every PR and push | typecheck, lint, the shared check (`project-standard check --base`) |
| `tests` | every PR and push | unit, integration, e2e, coverage threshold — against a throwaway database container |
| `browser` | every PR and push | Playwright; traces and report uploaded as artifacts |
| `sonar` | push to `main` only | after `tests`, reusing its coverage; waits on the quality gate |
| `mutation` | nightly schedule | Stryker on the critical modules only |

- `checks` is cheap and fails fast; it does not gate the others, because on a
  one-job-at-a-time runner a `needs:` chain only adds queue.
- **Full history on checkout** (`fetch-depth: 0`): `turbo run --affected` breaks
  on a shallow clone, and Sonar needs blame data.
- **Never `continue-on-error` on a test step.** It turns a suite decorative: it
  keeps running, stays green, and verifies nothing.
- A repo with a lint baseline also runs `oxlint --prune-suppressions` in
  `checks` and fails when that changed the file
  (`git diff --exit-code -- oxlint-suppressions.json`), so the baseline only
  shrinks.
- `browser` must actually run. A Playwright suite that exists but is never
  wired into CI is the common failure, not a flaky one.
- A scheduled workflow is disabled by GitHub after 60 days without commits;
  the nightly job dies silently on a quiet repo.

## 2. Runners

| Repo | `runs-on` | Why |
|---|---|---|
| Private | `self-hosted` | Spends none of the plan's shared Actions minutes; on a Free plan they run out mid-month and private CI stops |
| Public | `ubuntu-latest` | Free for public repos. A self-hosted runner on a public repo lets any fork's PR run code on your machine |

On a self-hosted runner, a job that starts Docker `services:` has root-level
reach over the host. Run each runner as a dedicated user with rootless Docker
and a memory ceiling, so a job can reach neither production's containers,
secrets or files nor another runner.

## 3. Databases and migrations

- **Throwaway service container, dying with the job:** `postgres` in a plain
  Postgres repo, `supabase/postgres` alone in a Supabase repo, so pgTAP and the
  RLS suite still run. Whether the bare image runs a given repo's migrations is
  proven per repo, not assumed.
- The one place a full Supabase CLI stack is worth it: the `browser` job of a
  Supabase repo whose specs sign in through Supabase Auth — started with the
  unneeded services excluded (`supabase start -x ...`).
- **Never the project's dev/hml database.** A schema-changing PR would apply
  its migration to a shared database before anyone approved it, and parallel
  runs write into the same tables.
- CI applies migrations only to its own container. Production migrations run
  inside the host's production deploy, never in CI and never in a preview
  build (see `safe-migrations`).
- **Leave nothing on the runner.** GitHub Actions removes a `services:`
  container without its volumes (actions/runner#1885), and the Postgres image
  declares its data dir as a `VOLUME`, so every run on a self-hosted runner
  leaks one anonymous volume. Mount the data dir as tmpfs with a size taken
  from the repo's measured peak database size
  (`--tmpfs /var/lib/postgresql/data:size=<n>m`; the example's `512m` is a
  placeholder, not a recommendation). A Supabase CLI stack stops with
  `supabase stop --no-backup` under `if: always()`; a one-off `docker run`
  uses `--rm`. A weekly `docker volume prune -f` on the runner's own daemon is
  a backstop, never the fix, and never on a daemon that also runs production.

## 4. Deploy and previews: the host, not Actions

- **A merge to `main` deploys production through the host's git integration**
  (Cloudflare Workers Builds or Pages, Hostinger, Netlify). The host builds on
  its side, so no deploy token sits in GitHub; green CI on the PR is the check.
- **No production credential and no deploy token in Actions secrets.** Anyone
  who can push a branch can read them. Test and tool tokens (a Sonar analysis
  token, an auth provider's test instance, a non-production database branch)
  are allowed only when worthless outside CI.
- **Staging is a preview per PR**, not a long-lived branch: non-production
  branch builds that comment the URL on the PR, behind an access gate (the
  preview alias is guessable from the branch name). Preview data is synthetic
  (faker.js), never a copy of production. A host with no previews uses the
  local stack plus the browser spec instead.

## 5. What gates a merge

- A PR merges only on green CI; a red job is a stop.
- **On a free GitHub plan, CI is advisory**: required status checks on private
  repos are paid. The pre-push hook (`setup-pre-commit`) is the real gate, and
  CI is the clean-checkout proof behind it. Where a paid plan exists, make the
  jobs required checks.
- No skipped test without its reason in the PR.

## 6. SonarQube

- **CI-based analysis only.** Automatic analysis ignores
  `sonar-project.properties`, imports no coverage and cannot handle monorepos.
- **Push to `main` only on Community Build**: it keeps one branch per project,
  so a PR scan overwrites the main analysis.
- `sonar.qualitygate.wait=true`, so the job goes red with the gate.
- Cap SonarJS's Node bridge with `sonar.javascript.node.maxspace` (MB) under
  the runner's memory ceiling; uncapped, it grew until the runner was OOM-killed.
- Not re-running the full suite on `main` just to feed Sonar: download the
  coverage artifact `tests` produced.

## 7. Caching

- The key is the lockfile hash plus the runtime version, never a constant like
  `cache-v1`, which silently pins old dependencies.
- Cache the resolved dependencies, never the build output.
- Pin the runtime once, in `package.json` (`packageManager`, `engines`), and
  point the setup action at it: `bun-version-file: package.json` for
  `oven-sh/setup-bun`, `node-version-file: package.json` for `actions/setup-node`.
  Without that input, the action falls back to whatever the runner has.

## 8. GitHub Actions

```yaml
on:
  pull_request:
  push:
    branches: [main]

jobs:
  checks:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v5
        with: { fetch-depth: 0 }
      - uses: oven-sh/setup-bun@v2
        with: { bun-version-file: package.json }
      - run: bun install --frozen-lockfile
      - run: bun run typecheck
      - run: bun run lint
      - run: bunx --bun project-standard check --base ${{ github.event_name == 'pull_request' && 'HEAD^1' || github.event.before || 'HEAD^' }}

  tests:
    runs-on: self-hosted
    services:
      postgres:
        image: postgres:17
        env: { POSTGRES_PASSWORD: postgres }
        ports: ["5432"]
        options: >-
          --health-cmd pg_isready --health-interval 5s --health-timeout 5s --health-retries 10
          --tmpfs /var/lib/postgresql/data:size=512m
    steps:
      - uses: actions/checkout@v5
        with: { fetch-depth: 0 }
      - uses: oven-sh/setup-bun@v2
        with: { bun-version-file: package.json }
      - run: bun install --frozen-lockfile
      - run: bun run test:coverage
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:${{ job.services.postgres.ports['5432'] }}/postgres
      - uses: actions/upload-artifact@v4
        with: { name: coverage, path: coverage/, retention-days: 1 }

  browser:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v5
      - uses: oven-sh/setup-bun@v2
        with: { bun-version-file: package.json }
      - run: bun install --frozen-lockfile
      - run: bunx playwright install chromium
      - run: bun run test:browser
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with: { name: playwright-report, path: playwright-report/, retention-days: 7 }

  sonar:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: tests
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v5
        with: { fetch-depth: 0 }
      - uses: actions/download-artifact@v4
        with: { name: coverage, path: coverage/ }
      - uses: SonarSource/sonarqube-scan-action@v5
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ vars.SONAR_HOST_URL }}
```

No `deploy` job: the host deploys on merge (§4). The service container takes a
random host port (`ports: ["5432"]`), read back through `job.services`: a fixed
`5432:5432` collides when two runners on one host run jobs at once, and the
health check keeps tests from starting before Postgres accepts connections. On a public repo, every
`runs-on` is `ubuntu-latest`. On a self-hosted runner, the browsers' system
libraries are installed on the host once; `--with-deps` needs root the job
should not have.

GitLab CI maps the same jobs: `services:` for the container, `cache:key:files:`
for the lockfile key, `rules:` for the main-only Sonar job.

## Anti-patterns

- `runs-on: ubuntu-latest` on a private repo, spending shared minutes
- A self-hosted runner serving a public repo
- A deploy step or a production credential in Actions
- Tests or migrations against a shared dev/hml database
- A Sonar scan on every PR on Community Build
- `continue-on-error` on a test step
