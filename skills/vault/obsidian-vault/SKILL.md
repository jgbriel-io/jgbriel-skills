---
name: obsidian-vault
description: Cria, busca e conecta notas no vault pessoal do Obsidian seguindo as convenções da wiki — estrutura de pastas, wikilink por caminho, regras de alias, checagem de link órfão. Use quando o usuário disser "salva no vault", "anota no Obsidian", "cria nota na wiki", "adiciona no vault", de qualquer projeto ou diretório. Documentação de projeto inteira é project-sync.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Obsidian Vault

Personal knowledge base. All operations follow the conventions below — they
exist because this vault resolves wikilinks by **file path only**, and breaking
them creates ghost pages.

## Location and structure

The vault lives on the Windows machine, under the user's `Documents`. Resolve the
real path from the environment rather than hardcoding one — a path written here
is wrong on every other machine, and this skill does nothing useful without the
vault mounted. Say so and stop, instead of writing notes somewhere else.

Inside it, `WIKI.md` is the real root and is never touched. Everything else lives
under `wiki/<domain>/`, one folder per domain (learning, clients, college,
personal, projects, tools).

**Never create `.md` files at the vault root.** Every new page goes inside
`wiki/<domain>/`. If no domain fits, ask the user which one to use.

## Wikilinks

Links **never resolve by alias** in this vault — only by file name or path.
A link pointing at an alias renders dark and creates an empty ghost file when
clicked. Therefore:

- Link by path: `[[wiki/Projetos/X/index|Display Text]]` or by exact file name `[[File Name]]`
- Frontmatter `aliases:` are for search/identification only, never for linking
- Inside markdown tables, escape the display pipe: `[[path\|Text]]` — a raw `|`
  splits the cell and breaks both link and table

### Resolving a path before linking

**Never write a wikilink from memory.** A table of paths in this file goes stale
the first time a folder is renamed, and a link to a path that no longer exists is
exactly the ghost page this skill exists to prevent — it fails silently, looking
like a link until someone clicks it.

Glob the vault for the target's `index.md` and link the path that comes back. If
two candidates come back, the page has a duplicate and that is the bug to fix
first, not to route around.

### Anti-ghost rule

Two `index.md` with the same `title` + `aliases` conflict. If you find an empty
file at the root or in the wrong place, it is a ghost: delete it, find the
duplicated alias, fix the page that carries the wrong one.

## New page frontmatter

```yaml
---
type: reference        # or entity, concept
title: "Page Title"
aliases:
  - Page Title
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [domain, topic]
status: evergreen      # or seedling, budding
related:
  - "[[wiki/<domain>/index|Parent]]"
---
```

Body ends with a `## Conexões` section linking sibling/parent pages by path.

## Workflows

**Create a note:** pick domain folder → write file with frontmatter above →
add path-based links → append entry to the domain's `index.md` if one exists.

**Find notes:** Glob/Grep on `wiki/**/*.md`. Backlinks: grep for the page's
file name inside `[[...]]` across the vault.

**Editing existing pages:** preserve manual content; update the `updated:`
frontmatter date.
