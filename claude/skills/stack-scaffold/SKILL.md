---
name: stack-scaffold
description: Scaffold a new project with the user's standard stack — React 18 + TypeScript + Tailwind + shadcn/ui, on Vite + Supabase by default (personal projects) or Next.js / NestJS when a client project calls for it — pre-wired with his conventions (hooks-only data layer, folder structure, pre-commit hooks, RLS-first schema). Use when the user says "cria o projeto com meu stack", "scaffold do projeto", "monta o boilerplate", or when project-kickoff reaches Phase 4. Not the planning workflow — that is project-kickoff; this is the technical bootstrap only.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Stack Scaffold

Technical bootstrap of the user's standard stack. Invoked standalone or by
`project-kickoff` Phase 4.1. The point: day-1 codebase already obeys the
conventions the review skills check later — no retrofit.

## Before scaffolding

Ask (one at a time, skip what's already known from context):

1. **Stack** — default to Vite + Supabase for personal/side projects; ask
   explicitly for freela/client work since the client's constraints decide it:
   - **Vite + React + Supabase** (default) — SPA/painel, side projects, quick freelas
   - **Next.js** (App Router) — sites institucionais, landing pages, apps fullstack leves pra cliente
   - **NestJS** — backend/API dedicado (cliente já tem frontend, ou precisa de serviço separado)
2. Project name + target dir (default `D:/Projetos/projetos-pessoais/<name>` for personal; ask for freela client work)
3. Package manager (default pnpm; detect global availability first)
4. Data layer: Supabase (new via `supabase init` or existing project ref), plain PostgreSQL, or client already has a backend/API?
5. Frontend only: router needed? (React Router vs single-page — Vite only; Next.js has file-based routing)

## Steps

### 1. Base scaffold (per stack)

```bash
# Vite + React + Supabase (default)
pnpm create vite <name> --template react-ts
cd <name>
pnpm add @tanstack/react-query @supabase/supabase-js
pnpm add -D tailwindcss @tailwindcss/vite
npx shadcn@latest init

# Next.js
pnpm create next-app <name> --typescript --tailwind --app
cd <name> && pnpm add @tanstack/react-query
npx shadcn@latest init

# NestJS
pnpm dlx @nestjs/cli new <name> --package-manager pnpm
cd <name>   # add ORM/client conforme data layer escolhido
```

Adjust for the chosen package manager. Check each command's output before the
next — scaffolder prompts change between versions; don't assume flags.

### 2. Folder structure (frontend stacks — the conventions the stack skills expect)

Supabase data layer (default):

```
src/
├── components/        (UI only — no data fetching)
│   └── ui/            (shadcn)
├── hooks/             (ALL data access lives here, use* prefix)
├── integrations/
│   └── supabase/
│       └── client.ts  (singleton — the only place the client is created)
├── lib/
└── types/             (domain types; DB types from codegen)
```

Rule wired in from day 1: components render, hooks fetch, the Supabase client
is imported only inside `src/integrations/` (see the supabase-hooks skill —
this structure is what its patterns assume).

Non-Supabase data layer (client has own API, or plain Postgres via REST):

```
src/
├── components/        (UI only — no data fetching)
│   └── ui/            (shadcn)
├── hooks/             (hooks call services, use* prefix)
├── services/          (services call apiClient — all data access starts here)
├── lib/
│   └── api-client.ts  (Axios singleton — the only place the client is created)
└── types/             (domain types; DB types from codegen when an ORM is used)
```

Use the tanstack-query-patterns skill for this variant's hook/service pattern.

For NestJS, use the standard module-per-domain layout (`src/<domain>/`
with module, controller, service) and validation at the boundary
(class-validator DTOs or Zod pipes).

### 3. Database

- Supabase: `supabase init` + first migration with the base conventions from
  the supabase-postgres skill: UUID PKs (`gen_random_uuid()`), `created_at`/
  `updated_at TIMESTAMPTZ`, RLS enabled on every table from the start.
- Plain Postgres (no Supabase): same conventions, see the postgres-conventions
  skill.
- `.env.example` with placeholders only — never real keys (`VITE_SUPABASE_URL`
  / `VITE_SUPABASE_ANON_KEY` or `DATABASE_URL` depending on data layer);
  `.env` in `.gitignore`.
- Generate DB types when a schema exists:
  `supabase gen types typescript --local > src/types/database.ts` (Supabase)
  or ORM codegen (e.g. `prisma generate`) otherwise.

### 4. Query client + providers

`QueryClientProvider` wrapping the app (`src/main.tsx`, or a `"use client"`
provider component in Next.js); sensible default `staleTime` (2 min). One
example hook in `src/hooks/` (Supabase: supabase-hooks pattern; non-Supabase:
tanstack-query-patterns service + hook pattern) as the template to copy.

### 5. Quality gates

- Invoke `/setup-pre-commit` (husky + lint-staged + typecheck + tests).
- `pnpm build` + `tsc --noEmit` must pass before declaring done — that is the
  sign-off (UI validation is the user's).

### 6. Hand back

Report: created structure, commands to run (`pnpm dev` / `pnpm start:dev`),
what's stubbed (keys pending), and the next step — if inside project-kickoff,
back to Phase 4.2 (schema first, then feature-by-feature).
