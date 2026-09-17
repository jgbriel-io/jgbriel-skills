# The `docs/` folder

Every project has `docs/` at its root, in tiers.

### Tier 1 — always

- `docs/README.md` — the index. Links to the other docs, their status, last update.

### Tier 2 — when applicable

- `docs/architecture.md` — layers, diagrams, main flows, macro decisions.
- `docs/database.md` — schema, migrations, indexes, views, RLS, where there is a database.
- `docs/deployment.md` — CI/CD, infrastructure, environments, where deploys are automated.

### Tier 3 — optional (large or team projects)

- `docs/frontend.md` — UI stack, patterns, design system.
- `docs/backend.md` — APIs, services, external integrations.
- `docs/security.md` — auth, RLS, secrets policy, LGPD/GDPR.
- `docs/adr/NNNN-title.md` — architecture decision records.
- `docs/runbooks/*.md` — operational playbooks: deploy rollback, incident response.

### Folder conventions

- Files in lowercase **kebab-case** (`deployment.md`, not `Deployment.md`).
- One topic per file. Mixing pollutes: database content inside `architecture.md`
  makes both harder to find.
- Diagrams inline (Mermaid in the markdown) or under `docs/diagrams/`.
- Large schemas under `docs/schemas/` (SQL, JSON Schema, OpenAPI).
- The project's root README links to `docs/README.md` when it exists.

### Template for `docs/README.md`

````md
# Documentation — <Project Name>

## Index

- [Architecture](./architecture.md) — layers, flows
- [Database](./database.md) — schema, migrations
- [Deployment](./deployment.md) — CI/CD, environments
- [ADRs](./adr/) — architectural decisions

## Status

| Doc              | Last reviewed  | Status        |
|------------------|----------------|---------------|
| architecture.md  | YYYY-MM-DD     | ✅ current    |
| database.md      | YYYY-MM-DD     | 🟠 partial    |
| deployment.md    | YYYY-MM-DD     | 🔴 pending    |
````

### Structural anti-patterns

- ❌ `docs/notes/`, `docs/misc/`, `docs/tmp/` — a dumping ground that turns into litter.
- ❌ A single `docs/everything.md` holding all of it.
- ❌ Mirroring the code tree inside `docs/` (`docs/src/components/...`) — the code is already that documentation.
- ❌ Versioning generated PDFs. Version the source (`.md`, `.tex`).
- ❌ A `docs/` folder with no `README.md`: nobody knows where to start.

### Domain subfolder pattern (projects with several docs per domain)

Once a domain has three or more files, give it a subfolder. Every subfolder has an
`overview.md` as its entry point.

```
docs/
├── README.md                  ← index, status table, quick guide
├── project/
│   └── overview.md            ← what, for whom, the problem, stack, status
├── architecture/
│   ├── overview.md            ← required entry point
│   ├── patterns.md
│   ├── decisions.md           ← ADRs
│   ├── flows.md
│   ├── troubleshooting.md
│   └── technical-debt.md
├── backend/
│   ├── overview.md
│   ├── bugs.md
│   └── ...
├── database/
│   ├── overview.md
│   ├── schema.md
│   ├── migrations.md
│   └── rls.md
├── security/
│   ├── overview.md
│   └── ...
├── frontend/
│   ├── overview.md
│   ├── components.md
│   ├── design-tokens.md
│   └── hooks.md
├── git/
│   ├── overview.md
│   ├── workflow.md
│   └── conventions.md
└── sprints/
    ├── README.md              ← index with the status table
    ├── TEMPLATE.md
    ├── historico-completo.md
    └── sprint-NN-type-description.md
```

Rules:
- Stay on a single file (Tier 2) until a domain genuinely needs three or more
  documents; only then split it into a subfolder.
- Every `docs/README.md` carries: links by domain, a status table (domain | files |
  status), and a quick guide with commands, stack and conventions.
