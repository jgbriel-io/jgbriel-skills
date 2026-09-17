---
name: ci-cd-pipeline
description: Defines standard CI/CD pipeline stages (lint, type-check, test, build), dependency caching, running migrations in CI, and merge-blocking quality gates — stack-agnostic, with GitHub Actions as the default example. Use when user asks about pipeline stages, GitHub Actions workflows, .gitlab-ci.yml, Jenkinsfiles, CI caching, or quality gates for merge.
---

# CI/CD Pipeline

The pipeline is a concept independent of the tool — GitHub Actions, GitLab CI,
Jenkins, CircleCI. Only the configuration syntax changes.

## Standard stages, in order

```
lint → type-check → test → build → deploy
```

| Stage | What it verifies | Cost | On failure |
|---|---|---|---|
| lint | Style, dead code, static rules | Seconds | Blocks the merge |
| type-check | Types (TS, mypy, Go build, javac) | Seconds | Blocks the merge |
| test | Unit plus integration | Medium | Blocks the merge |
| build | Compiles or packages the production artifact | Medium to high | Blocks the merge |
| deploy | Publishes the artifact | High, with real effects | Manual gate in production |

**Fail fast**: order from cheapest to most expensive. Running a test suite for
minutes before a lint that takes seconds makes no sense — if lint fails, the rest
should never start. Each stage runs only when the previous one passed.

Stages independent of each other — backend lint and frontend lint in a monorepo —
run in parallel rather than in series.

## Dependency caching

Without a cache, every run reinstalls everything from scratch, wasting minutes per
run.

- The cache key is a hash of the lockfile (`package-lock.json`, `pnpm-lock.yaml`,
  `poetry.lock`, `go.sum`, `Gemfile.lock`) plus the runtime version.
- It changes only when the dependencies change, not on every commit.
- Restore at the start of the job, save at the end — and only when the install
  succeeded.
- Cache the resolved dependency folder (`node_modules`, `.venv`, `vendor`, `~/.m2`),
  never the final build artifact: that is the `build` stage's output, not an input.
- A wrong or fixed key silently pins old versions. Always include the lockfile hash;
  never a constant like `cache-v1`.

## Migrations in CI

- **In the `test` stage**: apply migrations to an ephemeral database — a disposable
  container, or `supabase start` locally, created and destroyed inside the job.
  Never against a shared database or another environment's.
- **In the `deploy` stage**: migrations run as their own job, before the new
  application version ships, against the target environment's real database.
- Migrations have to be idempotent and reversible. CI does not fix a broken
  migration; it only exposes one.
- Never run a test migration against production, not even "just to check".
- In production, a destructive migration (dropping a column or table) goes through a
  manual gate, never automatically, however green the pipeline is (see
  `safe-migrations`).

## Quality gates: what blocks a merge

The branch-protection checklist:

- [ ] Lint passes with no errors — whether warnings block is a conscious decision, not a default
- [ ] Type-check passes
- [ ] Tests pass, with no skipped test (`.skip`/`xit`) left unexplained in the PR
- [ ] Coverage does not regress below the agreed threshold, where the project uses one
- [ ] The production build completes
- [ ] No committed secret or credential (a secret scan)
- [ ] The branch is up to date with its base before merging

A green pipeline is a prerequisite for merging, not a suggestion. Configure it as a
**required status check** on the protected branch rather than leaving it
"recommended".

## Variables and secrets

- Secrets are never hardcoded in the `.yml` or `Jenkinsfile`, and never in a
  committed `.env`. They live in the CI tool's secret store — GitHub Actions
  secrets, GitLab's protected and masked variables.
- Scope them per environment: a production secret is not reachable from a job
  running on a feature branch.
- A build-time variable baked into the bundle (`VITE_*`, `NEXT_PUBLIC_*`) is not the
  same as a runtime secret. Never put a sensitive key in a variable that ships to
  the client (see `secrets-management`).

## Artifacts between stages

- `build` produces the artifact once, and `deploy` reuses it. Never rebuild inside
  the deploy job.
- Artifacts have a short life — days, not accumulated storage.
- Matrix builds: one suite across several runtime versions or browsers runs as
  parallel jobs, with results aggregated at the end.

## By stack

### GitHub Actions

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint && npm run type-check

  test:
    needs: lint
    runs-on: ubuntu-latest
    services:
      postgres: { image: postgres:16, ports: ["5432:5432"] }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run migrate:up
      - run: npm test -- --coverage

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci && npm run build
      - uses: actions/upload-artifact@v4
        with: { name: dist, path: dist/, retention-days: 1 }

  deploy_production:
    needs: build
    runs-on: ubuntu-latest
    environment: production   # the manual gate: required reviewers on the environment
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@v4
        with: { name: dist }
      - run: ./deploy.sh
```

### GitLab CI

```yaml
stages: [lint, test, build, deploy]

.node_cache:
  cache:
    key:
      files: [package-lock.json]
    paths: [node_modules/]

lint:
  stage: lint
  extends: .node_cache
  script: [npm ci, npm run lint, npm run type-check]

test:
  stage: test
  extends: .node_cache
  services: [postgres:16]
  variables:
    DATABASE_URL: postgres://postgres:postgres@postgres:5432/test
  script:
    - npm ci
    - npm run migrate:up
    - npm run test -- --coverage

build:
  stage: build
  script: [npm ci, npm run build]
  artifacts:
    paths: [dist/]
    expire_in: 1 day

deploy_production:
  stage: deploy
  script: [npm run migrate:up:prod, ./deploy.sh]
  environment: production
  when: manual
  only: [main]
```

Python (pytest, mypy, ruff), Go (`go vet`, `go test`, `go build`) and wrangler for
Cloudflare Workers and Pages (see the `wrangler` skill) use the same stages. Only
the command inside `run`/`script` changes.

## Anti-patterns

- ❌ Running tests before lint and type-check, spending minutes on a commit that would fail in seconds
- ❌ A fixed cache key that never invalidates when the lockfile changes
- ❌ Test migrations running against a shared or production database
- ❌ A secret in a committed environment file, or hardcoded in the pipeline
- ❌ Merging with a red pipeline, or with the check marked "recommended" rather than required
- ❌ Rebuilding the artifact inside the deploy job instead of reusing the one `build` produced
- ❌ A skipped test (`.skip`/`xit`) merged with no explanation
- ❌ Automatic production deploys with no manual gate for a destructive migration
