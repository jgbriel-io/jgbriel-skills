---
name: project-kickoff
description: Orchestrates a project from scratch — idea to spec, design system and implementation plan — invoking each phase's skill in the right order. Use when the user says "novo projeto", "vou começar um projeto", "quero criar X do zero", "fluxo completo de projeto", or starts describing an idea they want to build properly.
---

# project-kickoff

Walks the user through starting a project, phase by phase, so nothing gets
skipped. The point is to avoid rework: the decisions that cost most to reverse —
design system, schema, scope — are made before any code is written.

---

## Phase 1 — Ideation and scope

**Goal:** understand what the project is, and what it is not.

1. Invoke `/discuss` to build the direction — one decision at a time, until
   intent, audience, scenarios, precedents, options and boundaries close into a
   confirmed brief. This is where an idea becomes a defensible direction.
   - If the idea is already formed and only needs pressure, `/grill-me` is the
     cheap path: it works the boundary in rounds. `/discuss` builds from nothing
     and costs accordingly.

2. Invoke `/project-planner` to turn the brief into the vault pages under
   `wiki/Projetos/<name>/`.
   - It takes its fields from the `discuss` brief and asks for whatever is missing.
   - It leaves `index.md` and the subpage stubs in place.

3. **Write down what is out of scope.** Create a `## Fora do escopo (v1)` section
   in `index.md`, as plain text without emoji (a vault rule). This is what keeps
   scope creep out during development.

**Phase 1 deliverables:**
- A complete `wiki/Projetos/<name>/index.md`
- Out of scope, documented
- An idea that has been stress-tested

---

## Phase 2 — Spec

**Goal:** write down what the system must do, before any code.

Create `wiki/Projetos/<name>/<Name> - Spec.md` covering:

### 2.1 Functional requirements
The behaviours the system MUST have, as checkboxes:
```markdown
- [ ] A user can do X without logging in
- [ ] On finishing Y, the system does Z automatically
```

### 2.2 Non-functional requirements
Performance, SEO, accessibility, LGPD, security, mobile-first. Always include LGPD
when the product collects user data.

### 2.3 Route map
A table of every URL, its type (SSR or static) and what it renders. No implicit
routes — name them all.

### 2.4 UX flows per screen
For each main route: what the user sees, what they do, what happens. Three to five
bullets per screen. Not a wireframe — prose about intent.

### 2.5 The business engine
The product's central logic: scoring, calculation, business rules. If there is an
algorithm, write it as pseudocode or TypeScript before implementing it.

### 2.6 Component inventory
The Astro/React/Vue components that will exist. Listing them exposes duplication
before anything is built.

### 2.7 Invoke `/domain-modeling`
To fix the vocabulary before naming variables, routes, tables and types.
Inconsistent names turn into refactors.

**Phase 2 deliverables:**
- A complete `<Name> - Spec.md`
- Terminology fixed by domain-modeling

---

## Phase 3 — Design

**Goal:** settle the visual identity BEFORE writing any frontend.

Changing the design system later means refactoring the whole project's CSS.

### 3.1 Visual direction
Ask the user:
- Which aesthetic? (clean and minimal, warm, dark and premium, editorial…)
- Visual references — sites, apps, brands
- Audience and tone (young or formal, tech or mainstream)

### 3.2 Settle the direction
Pick one with the user and record it in a sentence: the main reference, what to
take from it, and what not to take. Without that sentence, Phase 4 guesses.

### 3.3 Document the design tokens
Create a `## Design system` section in the spec, or its own file:

```css
:root {
  --color-primary: ;
  --color-background: ;
  --color-surface: ;
  --color-text: ;
  --color-text-muted: ;
  --font-heading: ;
  --font-body: ;
  --radius-card: ;
}
```

**Phase 3 deliverables:**
- Design tokens defined
- The visual direction written down in the wiki

---

## Phase 4 — Implementation

**Goal:** build on a solid foundation, one feature at a time.

### 4.1 Scaffold, with quality gates from day one
```bash
# scaffold the project (Next, Astro, etc.), then:
```
Invoke `/setup-pre-commit` — lint, type-check and tests on pre-commit. Not later.

### 4.2 Order of work
1. **Database schema first.** Migrations change and break everything downstream,
   so settle the schema before writing any query.
2. **Types and domain layer** — the TypeScript interfaces that model the domain.
   Still no UI.
3. **Feature by feature, end to end.** One route working completely before
   starting the next; never all routes in parallel.
4. **Edge cases last.** A working MVP beats rare cases handled early.

### 4.3 Skills during implementation
- `/supabase-hooks` — Supabase/TanStack hooks, mutations, queries
- `/supabase-postgres` — schema, RLS, indexes, migrations
- `/react-best-practices` — performance, bundle, re-renders
- `/tdd` — when a feature carries real logic

**Phase 4 deliverables:**
- The project running locally
- Pre-commit configured
- The database schema in versioned migrations

---

## Phase 5 — Maintenance

**Goal:** keep the wiki in sync with the real code.

- Invoke `/project-sync` whenever the project's `docs/` changes.
- Move `status:` in the index frontmatter along as the project matures
  (`seed` → `developing` → `evergreen`).
- Record non-obvious architectural decisions in the wiki — why X became Y.

---

## Phase checklist

```
Phase 1 — Ideation
  [ ] /discuss closed — brief confirmed
  [ ] /project-planner run — wiki stubs created
  [ ] Out of scope documented in index.md

Phase 2 — Spec
  [ ] Functional requirements (checkboxes)
  [ ] Non-functional requirements
  [ ] Complete route map
  [ ] UX flows per screen
  [ ] Business engine documented
  [ ] /domain-modeling done — terminology fixed

Phase 3 — Design
  [ ] Visual direction settled
  [ ] Design tokens documented

Phase 4 — Implementation
  [ ] /setup-pre-commit configured
  [ ] Schema settled before any query
  [ ] Feature by feature, end to end

Phase 5 — Maintenance
  [ ] /project-sync in place
  [ ] status: current in the wiki
```

---

## What generates the most rework, in order

1. A design system settled late — refactors the whole project's CSS
2. A schema designed without the flows in mind — migrations that break everything
3. Scope never bounded — constant creep
4. Inconsistent terminology — refactors types, variables and routes

---

## When to skip phases

- A one-day or throwaway project → skip phases 3 and 5
- A project with no UI → skip phase 3
- A project that already has docs on disk → replace phase 1 with `/project-sync`
- Refactoring something that exists → start at phase 4, and use `/project-sync` to
  bring the wiki up to date
