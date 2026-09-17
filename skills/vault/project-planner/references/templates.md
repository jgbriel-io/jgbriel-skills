# Templates — index.md and subpages

Path: `wiki/Projetos/<nome>/index.md`

The templates below are written into the user's vault and stay in Portuguese —
a Brazilian reader consumes them.

### Required frontmatter

```yaml
---
type: entity
title: "<Nome do Projeto>"
aliases:
  - <Nome do Projeto>
created: <YYYY-MM-DD hoje>
updated: <YYYY-MM-DD hoje>
tags:
  - projeto
  - <tag-de-stack-1>
  - <tag-de-stack-2>
entity_type: repository
status: <seed|developing|evergreen>
related:
  - "[[Projetos]]"
sources: []
---
```

Status mapping:
- `seed` → idea only, no code yet
- `developing` → under active development
- `evergreen` → in production / stable

### Body of index.md (minimum level)

```markdown
# <Nome do Projeto>

<Objetivo em 1 frase>

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | ... |
| Backend | ... |
| Banco | ... |
| Infra | ... |

## Subpáginas

| Página | Conteúdo |
|--------|---------|
| [[<Nome> - Arquitetura]] | decisões de arquitetura, diagramas |
| [[<Nome> - Backend]] | APIs, serviços, regras de negócio |
| ... | ... |

## Fora do escopo (v1)

- <item confirmado no diálogo>
- ...

## Decisões

| Decisão | Motivo |
|---|---|
| <escolha de stack/abordagem> | <por quê> |

## Comandos

```bash
# setup local
```

## Conexões

- [[Projetos]] — domínio pai
- [[<tech-relacionada>]] — conceito relacionado
```

### Extra sections (full level)

Insert between `## Stack` and `## Subpáginas`:

```markdown
## Domínios

| Domínio | Responsabilidade |
|---|---|
| <nome> | <o que cobre> |

## Papéis de usuário

| Role | Permissões |
|---|---|
| <role> | <o que pode fazer> |
```

Replace the `## Decisões` table with wikilinks to the ADRs when any was created (Step 3b):

```markdown
## Decisões

- [[<Nome> - ADR-001-slug|ADR-001 — Título da decisão]]
```

---

## Step 3 — Create stub subpages

Create only the subpages the user marked as relevant. Path: `wiki/Projetos/<nome>/<secao>/<Nome> - <Seção>.md`

### Subpage template

```yaml
---
type: reference
title: "<Nome> — <Seção>"
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
tags:
  - project
  - <nome-kebab>
status: seed
related:
  - "[[<Nome do Projeto>]]"
---
```

```markdown
# <Nome> — <Seção>

> [!gap] Stub — preencher conforme o projeto avança.

## Conexões

- [[<Nome do Projeto>]] — projeto pai
```

Available sections and folders:
| Seção | Pasta | Filename |
|-------|-------|----------|
| Arquitetura | `architecture/` | `<Nome> - Arquitetura.md` |
| Backend | `backend/` | `<Nome> - Backend.md` |
| Frontend | `frontend/` | `<Nome> - Frontend.md` |
| Database | `database/` | `<Nome> - Database.md` |
| Security | `security/` | `<Nome> - Segurança.md` |
| Deployment | `deployment/` | `<Nome> - Deploy.md` |

---

## Step 3b — ADR (full level, only a non-obvious decision)

Template and criterion for when an ADR is justified: [adr.md](adr.md). An obvious
decision does not become an ADR — it becomes a line on the project page.
