---
name: project-planner
description: Scaffolds a project's wiki pages in wiki/Projetos/ — index.md with frontmatter, subpage stubs and ADRs — from a direction that is already settled, collecting any missing field first. Use when user says "documenta esse projeto", "cria página do projeto X", "novo projeto no wiki", or wants a project recorded in the vault. Thinking the idea through before it gets written is `discuss`; this is Phase 1 of project-kickoff; for projects with existing docs/ on disk use project-sync.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
disable-model-invocation: true
---

# project-planner

Interview the user about a new project and create its wiki pages under
`wiki/Projetos/`, following the vault's conventions.

## When to use

- The user describes a project idea and wants it documented
- The user wants the wiki structure for a project nobody has written up yet
- The user says "vamos planejar X", "tenho ideia de Y", "cria projeto Z no wiki"

Not for a project that already has `docs/` on disk — that is `project-sync`.

---

## Depth

Two levels, chosen from the project's stage rather than asked about:

| Level | When | What changes |
|-------|------|--------------|
| **Minimum** | A loose idea, a side project, no stack decided | Essential topics only (Step 1); a lean index.md and stub subpages |
| **Full** | A project with architecture, a stack, or existing repos | Essential topics plus architecture — domains, user roles, decisions — and the relevant decisions become ADRs |

The signal for full: the user mentions a stack, repos, modules, a migration, or an
architectural decision.

---

## Step 1 — Inputs

**The conversation belongs to `discuss`.** It builds the direction one decision at
a time — intent, audience, scenarios, precedents, options, boundaries — and closes
on a confirmed brief, which goes deeper than this skill needs to on its own. If
the user arrives with a `discuss` brief, take these fields from it and do not ask
again.

Without a brief, collect what is missing yourself: the user has the information →
take it; does not know → **suggest** from context and confirm; wants to move fast →
respect that and mark the rest `> [!gap]`. Never more than one or two questions per
turn. An idea still too raw to become a page goes to `discuss` first.

### Fields the scaffold requires (every project)

1. **Name** — suggest one from the description if it has not been said.
2. **Goal** — what it solves or delivers, in one sentence. Suggest if unclear.
3. **Stack** — ask or suggest layer by layer (frontend, backend, database,
   infrastructure). Offer a common stack for that kind of project when the user
   does not know.
4. **Status** — no code yet (`seed`), under development (`developing`), in
   production (`evergreen`).
5. **Subpages** — propose the ones that make sense and confirm.
6. **Docs or repo on disk?** — ask only when it looks like a project already
   underway. If a folder exists (or is planned) in the projects folder on disk,
   record the path in the frontmatter's `sources:` — that is what `project-sync`
   reads later.
7. **Out of scope (v1)** — what the project will NOT do in its first version.
   Suggest two or three candidates from the goal (integrations, mobile, an admin
   panel, multi-tenancy) and confirm. This is a required deliverable of
   project-kickoff's Phase 1: without it, scope creep is free.

### Architecture topics (full level only, when the signal above appears)

8. **Domains and modules** — the areas of the system and what each is responsible
   for. If the user has not thought about it, propose a split from the goal.
9. **User roles** — roles and permissions, when the system has auth.
10. **Decisions already made** — architecture, monorepo vs polyrepo, hosting. Each
    relevant, non-obvious one becomes an **ADR** (see Step 3b).

### Confirm before writing

With name, goal, stack (even partial) and subpages in hand, present the summary:

```
Resumo antes de criar:

**Nome**: <name>
**Objetivo**: <sentence>
**Stack**: Frontend: X · Backend: Y · Banco: Z · Infra: W
**Status**: seed
**Subpáginas**: Arquitetura · Backend · Frontend · Database
**Fora do escopo (v1)**: A · B · C
[full level] **Domínios**: ... **Papéis de usuário**: ... **Decisões a virar ADR**: ...

Crio os arquivos?
```

Create only after an explicit yes.

---

## Step 2 — Create index.md and the subpages

Required frontmatter, the index body per level, the stub subpage template and the
sections that only appear at full level:
[references/templates.md](references/templates.md). Write in that order — it is
what makes two project pages comparable.

## Step 4 — Report what was created

After writing the files, list them:

```
Criado:
- wiki/Projetos/<name>/index.md
- wiki/Projetos/<name>/architecture/<Name> - Arquitetura.md
- [if any] wiki/Projetos/<name>/architecture/<Name> - ADR-001-slug.md
- ...

Próximos passos:
- Preencher seções marcadas com > [!gap]
- Se tiver docs no disco, rodar project-sync pra enriquecer
- [if it did not come from a brief] Fechar a direção: /discuss · ou pressionar o que já existe: /grill-me
- Fluxo completo (spec → design → implementação): project-kickoff — esta skill foi a Fase 1
```

---

## Vault conventions (do not violate)

- Never create a `.md` at the vault root
- The frontmatter alias must be unique — `Grep` for it before writing
- `related:` uses double quotes: `"[[Name]]"`, not `[[Name]]`
- File names in Title Case with spaces (`<Name> - Backend.md`)
- Folder names lowercase with hyphens (`backend/`, `architecture/`)
- Wikilinks inside tables escape the display pipe — `[[path\|Text]]` — otherwise
  the `|` splits the cell and breaks both the link and the table (the vault's own
  `CLAUDE.md` rule)
