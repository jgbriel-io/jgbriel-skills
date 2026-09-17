# Templates — index.md e subpáginas

Caminho: `wiki/Projetos/<nome>/index.md`

### Frontmatter obrigatório

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
- `seed` → só ideia, sem código ainda
- `developing` → em desenvolvimento ativo
- `evergreen` → em produção / estável

### Corpo do index.md (nível mínimo)

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

### Seções adicionais (nível completo)

Inserir entre `## Stack` e `## Subpáginas`:

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

E trocar a tabela `## Decisões` por wikilinks pros ADRs, se algum foi criado (Passo 3b):

```markdown
## Decisões

- [[<Nome> - ADR-001-slug|ADR-001 — Título da decisão]]
```

---

## Passo 3 — Criar subpáginas stub

Criar apenas as subpáginas que o usuário marcou como relevantes. Caminho: `wiki/Projetos/<nome>/<secao>/<Nome> - <Seção>.md`

### Template de subpágina

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

Seções disponíveis e pastas:
| Seção | Pasta | Filename |
|-------|-------|----------|
| Arquitetura | `architecture/` | `<Nome> - Arquitetura.md` |
| Backend | `backend/` | `<Nome> - Backend.md` |
| Frontend | `frontend/` | `<Nome> - Frontend.md` |
| Database | `database/` | `<Nome> - Database.md` |
| Security | `security/` | `<Nome> - Segurança.md` |
| Deployment | `deployment/` | `<Nome> - Deploy.md` |

---

## Passo 3b — ADR (nível completo, só decisão não-óbvia)

Template e critério de quando um ADR se justifica:
[references/adr.md](references/adr.md). Decisão óbvia não vira ADR — vira linha na
página do projeto.
