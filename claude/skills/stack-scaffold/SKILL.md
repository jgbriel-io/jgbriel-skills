---
name: stack-scaffold
description: Scaffold a new project with the user's standard stack — Vite + React 18 + TypeScript + Tailwind + shadcn/ui + Supabase + TanStack Query — pre-wired with his conventions (hooks-only data layer, folder structure, pre-commit hooks, RLS-first schema). Use when the user says "cria o projeto com meu stack", "scaffold do projeto", "monta o boilerplate", or when project-new reaches Phase 4. Not the planning workflow — that is project-new; this is the technical bootstrap only.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Stack Scaffold

Technical bootstrap of the user's standard stack. Invoked standalone or by
`project-new` Phase 4.1. The point: day-1 codebase already obeys the
conventions the review skills check later — no retrofit.

## Before scaffolding

Ask (one at a time, skip what's already known from context):

1. Project name + target dir (default `D:/Projetos/projetos-pessoais/<name>`)
2. Package manager (default pnpm; detect global availability first)
3. Supabase: new project via CLI (`supabase init`) or existing project ref?
4. Router needed? (React Router vs single-page)

## Steps

### 1. Base scaffold

```bash
pnpm create vite <name> --template react-ts
cd <name>
pnpm add @tanstack/react-query @supabase/supabase-js
pnpm add -D tailwindcss @tailwindcss/vite
npx shadcn@latest init
```

Adjust for the chosen package manager. Check each command's output before the
next — Vite/shadcn prompts change between versions; don't assume flags.

### 2. Folder structure (the conventions the stack skills expect)

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

### 3. Supabase

- `supabase init` + first migration with the base conventions from the
  supabase-postgres skill: UUID PKs (`gen_random_uuid()`), `created_at`/
  `updated_at TIMESTAMPTZ`, RLS enabled on every table from the start.
- `.env.example` with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
  (placeholders only — never real keys); `.env` in `.gitignore`.
- Generate DB types when a schema exists:
  `supabase gen types typescript --local > src/types/database.ts`

### 4. Query client + providers

`src/main.tsx`: `QueryClientProvider` wrapping the app; sensible default
`staleTime` (2 min). One example hook in `src/hooks/` following the
supabase-hooks query pattern, as the template to copy.

### 5. Quality gates

- Invoke `/setup-pre-commit` (husky + lint-staged + typecheck + tests).
- `pnpm build` + `tsc --noEmit` must pass before declaring done — that is the
  sign-off (UI validation is the user's).

### 6. Hand back

Report: created structure, commands to run (`pnpm dev`), what's stubbed
(Supabase keys pending), and the next step — if inside project-new, back to
Phase 4.2 (schema first, then feature-by-feature).
