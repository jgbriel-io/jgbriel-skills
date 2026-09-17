---
name: project-sync
description: Reads a project's `docs/` folder and creates or updates its pages under `wiki/Projetos/` in the Obsidian vault, mirroring the structure and preserving whatever was written by hand. Use when the user says "sincroniza projeto X", "atualiza wiki do projeto", "documenta o X no vault", or points at a project path directly. A loose source — a transcript, a URL, a single file — is obsidian-vault.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# project-sync

Reads a project's `docs/` and creates or updates `wiki/Projetos/<name>/`
following the vault's conventions.

---

## The project catalogue

The map from project to folder on disk to folder in the vault is **machine data,
not skill data**: it changes when a client arrives or a repo is renamed, and it
does not belong in a public repository. It lives in `~/.claude/projects-map.md`,
outside this repo.

Read that file first. Each line is `<name> | <project path> | <vault folder>`. If
the file does not exist, or the requested project is not in it, **ask the user for
the path** and offer to append the line — never guess a path, and never write the
map back into this file.

---

## Step 1 — Resolve the project and its path

1. Identify the project from the user's message.
2. Confirm its path from the catalogue or from the user.
3. Check that `docs/` exists:
   ```bash
   ls "<PROJECT_PATH>/docs/" 2>/dev/null || echo "NO_DOCS"
   ```
4. On `NO_DOCS`: fall back to the root `README.md` as the source, and say so.
5. Check whether `wiki/Projetos/<category>/<name>/` already exists — the
   categories are `Clientes/`, `Pessoais/` and `Backlog/`, per the catalogue's
   vault-folder column — to decide between CREATE and UPDATE. On CREATE, confirm
   the category with the user when it is not obvious.

---

## Step 2 — Read docs/

Scan the whole structure:
```bash
find "<PROJECT_PATH>/docs" -name "*.md" | sort
```

Map `docs/` subfolders onto wiki subpages:

| docs/ subfolder | wiki/ subfolder | file |
|----------------|-----------------|------|
| `architecture/` or `arch/` | `architecture/` | `<Name> - Arquitetura.md` |
| `backend/` or `api/` | `backend/` | `<Name> - Backend.md` |
| `frontend/` or `ui/` | `frontend/` | `<Name> - Frontend.md` |
| `database/` or `db/` | `database/` | `<Name> - Database.md` |
| `security/` or `auth/` | `security/` | `<Name> - Segurança.md` |
| `deployment/`, `deploy/` or `infra/` | `deployment/` | `<Name> - Deploy.md` |

A `docs/` with no subfolders sends its content to `index.md`, and the subpages
become stubs marked `> [!gap]`.

---

## Step 3 — index.md

Path: `wiki/Projetos/<name>/index.md`

### CREATE

```yaml
---
type: entity
title: "<Name>"
aliases:
  - <Name>
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
tags:
  - projeto
  - <stack-tag>
entity_type: repository
status: <seed|developing|evergreen>
related:
  - "[[Projetos]]"
sources:
  - "<PROJECT_PATH>/docs/"
---
```

### UPDATE

Read the existing file first. Update only:
- `updated:` → today
- `sources:` → make sure the project path is listed
- `## Stack`, if it changed
- The subpage table, adding new entries

**Never overwrite** content written by hand.

---

## Step 4 — Subpages

Standard frontmatter:

```yaml
---
type: reference
title: "<Name> — <Section>"
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
tags: [projeto, <name-kebab>, <section-tag>]
status: <seed|developing|evergreen>
related:
  - "[[<Name>]]"
sources:
  - "<PROJECT_PATH>/docs/<file>.md"
---
```

**CREATE**: extract the content from the source file. Mark gaps with `> [!gap]`.

**UPDATE**: read before editing. Only refresh sections that have a direct source,
preserve hand-written notes, and bump `updated:`.

---

## Step 5 — Report

```
Projeto: <Name> | <PROJECT_PATH>
Modo: CREATE | UPDATE

Criado: wiki/Projetos/<name>/index.md
         wiki/Projetos/<name>/backend/<Name> - Backend.md
         ...
Atualizado: ...
Stubs (> [!gap]): ...
```

---

## Conventions (do not violate)

- Aliases are unique — `Grep` before creating one.
- `related:` uses double quotes: `"[[Name]]"`.
- Wikilinks in tables: `[[X|display]]`, no backslash.
- File names in Title Case with spaces.
- Folder names lowercase with hyphens.
- `sources:` always lists the originating path on disk.
