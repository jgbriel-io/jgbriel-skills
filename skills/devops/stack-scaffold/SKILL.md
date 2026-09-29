---
name: stack-scaffold
description: Scaffold a new project on the user's default stack — a system (Bun + Turborepo, Next 16 on Cloudflare via OpenNext, an Elysia API in a Worker, Neon + Drizzle, Clerk, R2) or a content site (Astro on Cloudflare) — with the engineering standard wired in from the first commit: Oxlint and Oxfmt, TypeScript 7 strict, a pinned runtime, t3-env, the docs/ tree and AGENTS.md, test levels and hooks, CI on the right runner, deploy through the host. Use when the user says "cria o projeto com meu stack", "scaffold do projeto", "monta o boilerplate", "novo repo", or when project-kickoff reaches Phase 4. Not the planning workflow — that is project-kickoff. Never used to move an existing project to another stack.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Stack Scaffold

Technical bootstrap of a **new** project. The point: the first commit already
obeys the rules the hooks, CI and review skills check later — no retrofit.
Existing projects never change stack because of this skill; they adopt the
tooling at their own migration.

## 1. Ask (one at a time, skip what is known)

1. **Type** — a system (data, login, business rules) or a content site (almost
   pure content).
2. **Name, target folder, owning GitHub org, private or public.** Visibility
   decides the CI runner.
3. **Deviations from the default below.** Do not walk the stack layer by layer:
   the default holds unless the user or the client names a constraint. Each
   deviation becomes a decision in `docs/decisions/`, with its reason.

## 2. The default stack

### System

**Logic lives in an API, in git, with tests; the database is plain managed
Postgres; the browser never talks to the database.** The failure this prevents
was lived: a v1 system with 73 functions and 18 triggers applied straight to
production with no tracked migration, and 107 RLS policies that were never the
real enforcement point because its automation ran with the service role.

| Layer | Default | Options already in use |
|---|---|---|
| Package manager, monorepo | Bun workspaces + Turborepo | npm, pnpm; no monorepo |
| Web | Next 16 + React 19 on Cloudflare via OpenNext | React + Vite, Astro, TanStack Start |
| UI | Tailwind + Radix, lucide icons | |
| Data fetching, forms | TanStack Query + Eden client; react-hook-form + zod in a shared package | Supabase client hooks |
| API | Elysia on Bun, in a Cloudflare Worker | NestJS, Next API routes, Express |
| Database | Neon Postgres | Supabase as managed Postgres, self-hosted Postgres, SQLite |
| ORM, driver | Drizzle + drizzle-kit, `postgres.js` | Prisma, MikroORM |
| Auth | Clerk | Supabase Auth, next-auth |
| File storage | Cloudflare R2 | Supabase Storage |
| Hosting | Cloudflare Workers | Hostinger, Netlify, Render |
| Tests | Bun test (unit, integration, e2e) + Playwright (`.browser.ts`) | Vitest, `node --test` |

### Content site

| Layer | Default | Options already in use |
|---|---|---|
| Framework | Astro, React islands only where there is interactivity | Next.js static export |
| Hosting | Cloudflare; Hostinger when the client requires it | Netlify |
| Package manager | Bun | npm, pnpm |

Astro because a static page ships about 9 KB of JavaScript against about 463 KB
with Next.js. Bun here follows the system default; it was not chosen on
separate evidence.

## 3. Base scaffold

Check each command's output before the next: scaffolder prompts and flags change
between versions.

**System:**

```bash
mkdir {name} && cd {name} && git init -b main
bun init -y
bun add -d turbo
bun create cloudflare@latest apps/web --framework=next --no-git --no-deploy
bun create elysia apps/api
mkdir -p packages/shared
```

Root `package.json`: `"private": true`, `"workspaces": ["apps/*", "packages/*"]`,
and root scripts that call `turbo run <script>`; each package defines the ones it
has.

- `apps/api` — Elysia on the Worker adapter, exporting its type for Eden:
  ```ts
  import { Elysia } from 'elysia'
  import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'

  export const app = new Elysia({ adapter: CloudflareAdapter })
    .get('/health', () => ({ ok: true }))
    .compile()

  export type App = typeof app
  export default app
  ```
  Drizzle schema and migrations live here (the API is the only database
  client). `wrangler.jsonc` gets `nodejs_compat` for `postgres.js` and an R2
  binding when storage is needed.
- `apps/web` — hooks call the Eden client (`treaty<App>(apiUrl)`) through
  TanStack Query; components never fetch. Page files only compose components and
  UI text lives in `*.content.ts` (see `frontend-conventions`). Clerk on both
  sides: the web signs in, the API verifies the token.
- `packages/shared` — the zod schemas both sides validate with, so a form and
  its endpoint cannot disagree (see `forms-validation`).

**Content site:**

```bash
bun create astro@latest {name}
cd {name} && bunx astro add cloudflare
bunx astro add react
```

The last line only when an island needs it.

## 4. The engineering standard, wired in

Generate each item; the detail lives in the skill named, not here. When the
fleet's `project-standard/templates/` carries a template for an item, copy it
instead of writing one.

| Item | What goes in | Detail |
|---|---|---|
| Runtime pin | Exact `packageManager` (`bun@1.x.y`) and `engines` in `package.json`; no version manager to install | — |
| TypeScript | TypeScript 7 for `typecheck`; `@typescript/typescript6` alongside for tools that still need the compiler API (Astro, MDX). `strict` plus `noUncheckedIndexedAccess` and `noImplicitOverride`; not `exactOptionalPropertyTypes` (fights zod and react-hook-form types), not `noUnused*` (Oxlint covers them) | Confirm `next build` and `astro check` pass with both installed |
| Lint, format, hooks | Oxlint + Oxfmt pinned exactly; lint-staged + typecheck on pre-commit, `test:coverage` on pre-push | `setup-pre-commit` |
| Env | t3-env with zod, one schema per app; `.env.example` with every key | `environment-config` |
| Tests | Level suffixes, the standard script names, 80% coverage from day one (`coverageThreshold` in `bunfig.toml`), Playwright on `.browser.ts` | `integration-testing`, `e2e-testing` |
| Docs and agent config | `docs/README.md` and only the folders with content, `AGENTS.md`, the `CLAUDE.md` stub, `.mcp.json`, `.claude/settings.json`, `.socraticodeignore`, `.github/pull_request_template.md` from `project-standard/templates/`; `project-standard` pinned as a dev dependency to its `standard-vX.Y.Z` tag, then `project-standard sync` | `docs-writing` |
| CI | `checks`, `tests`, `browser` on `self-hosted` when private, `ubuntu-latest` when public; `sonar` on `main` only; no deploy job | `ci-cd-pipeline` |
| Dependencies | `.github/dependabot.yml`, grouped monthly plus security updates | `dependency-audit` |
| Secrets | Gitleaks through `project-standard check`; deny rules name secret files exactly (`.env`, `.env.local`), never `.env*`, which would block `.env.example` | `secrets-management` |
| Database | Drizzle migrations that only add or widen; `db:migrate` runs only in the production deploy command | `safe-migrations` |

**Git and GitHub.** `main` is the only long-lived branch; work goes on
`type/slug` branches. Squash merge only, with the squash message set to the PR
title and description, merge commits and rebase merges off, branches deleted on
merge. These are repository settings on GitHub — show the command and ask before
running it:

```bash
gh repo edit --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false --delete-branch-on-merge
gh api -X PATCH repos/{owner}/{repo} -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=PR_BODY
```

**Deploy.** A merge to `main` deploys through the host's git integration
(Workers Builds or Pages), connected in the host's dashboard by the user. The
system's production deploy command is `bun run db:migrate && npx wrangler deploy`;
the build command never migrates, because it also runs for previews. Previews
stay behind an access gate with synthetic data.

**Before the first real user** (not at scaffold time; a stub file now would be
empty): `docs/engineering/runbook.md`, the backup and weekly restore check, the
uptime monitor and the error tracker — `rollback-runbook`, `backup-restore`,
`error-tracking`. A content site with no database carries only rollback, the
uptime monitor, Dependabot and Gitleaks.

## 5. Done

- [ ] A fresh `bun install` then `lint`, `typecheck`, `test` and `build` are green
- [ ] `project-standard check --all` is green
- [ ] The first commit went through the pre-commit hook, not around it
- [ ] The first screen has a browser spec that renders it — a type check never
      opens the page (`e2e-testing`)
- [ ] Every deviation from the default is a decision in `docs/decisions/`

Report what was created, what waits on the user (connecting the host, creating
the Neon project and the Clerk instance, the host's secrets), and the next step
— inside project-kickoff, back to Phase 4.2 (schema first, then feature by
feature).
