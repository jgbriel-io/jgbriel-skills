---
name: project-sync
description: Reads docs/ from a project on D:/Projetos and creates or updates wiki/Projetos/<name>/ pages in the Obsidian vault. Use when user says "sincroniza projeto X", "atualiza wiki do projeto", "ingesta docs do X", "cria página pro X", "documenta o X no vault", "bate no D: do projeto", or names a known project (SyncClass, her-website, jgabriel.dev, Getfy, Baruk CRM, epagpos, etc.). Also use when user points to a D:/Projetos path directly. Creates index.md + subpages mirroring docs/ structure. Updates existing pages without overwriting manual content. Only for project docs/ folders — loose sources (transcripts, URLs, single files) belong to the claude-obsidian wiki-ingest skill.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# project-sync

Lê `docs/` de um projeto em `D:/Projetos/` e cria ou atualiza `wiki/Projetos/<nome>/` seguindo as convenções do vault.

---

## Catálogo de projetos conhecidos

| Nome wiki | Path em D: | Status |
|-----------|-----------|--------|
| SyncClass | `D:/Projetos/projetos-pessoais/tcc/SyncClass-Plataforma-SaaS/` | evergreen |
| her-website | `D:/Projetos/Freelas/HER/her-website/` | evergreen |
| jgabriel.dev | `D:/Projetos/projetos-pessoais/jgbriel-dev/` | developing |
| Getfy | `D:/Projetos/Freelas/BARUK/getfy/` | active |
| Baruk CRM | `D:/Projetos/Freelas/BARUK/HubLabel - n8n/` | active |
| epagpos-front | `D:/Projetos/B2ml/epag/epagpos-front/` | active |
| new-epag-website | `D:/Projetos/B2ml/epag/new-epag-website/` | active |
| timer-b2ml | `D:/Projetos/B2ml/timer-b2ml/timer-b2ml-api/` | active |
| bom-cristao | `D:/Projetos/Freelas/SMARTX/bom-cristao/` | active |
| fast-brain-check | `D:/Projetos/Freelas/SMARTX/fast-brain-check/` | active |

Se projeto não estiver na tabela, pedir o path D: ao usuário.

---

## Passo 1 — Resolver projeto e path

1. Identificar projeto pelo nome na mensagem do usuário.
2. Confirmar path D: via catálogo acima ou input do usuário.
3. Verificar se `docs/` existe:
   ```bash
   ls "<D_PATH>/docs/" 2>/dev/null || echo "NO_DOCS"
   ```
4. Se `NO_DOCS`: buscar `README.md` na raiz do projeto como fonte alternativa. Informar usuário.
5. Verificar se `wiki/Projetos/<nome>/` já existe → determinar modo CREATE vs UPDATE.

---

## Passo 2 — Ler docs/

Escanear estrutura completa:
```bash
find "<D_PATH>/docs" -name "*.md" | sort
```

Mapear subpastas de `docs/` para subpáginas wiki:

| docs/ subpasta | wiki/ subpasta | arquivo |
|----------------|----------------|---------|
| `architecture/` ou `arch/` | `architecture/` | `<Nome> - Arquitetura.md` |
| `backend/` ou `api/` | `backend/` | `<Nome> - Backend.md` |
| `frontend/` ou `ui/` | `frontend/` | `<Nome> - Frontend.md` |
| `database/` ou `db/` | `database/` | `<Nome> - Database.md` |
| `security/` ou `auth/` | `security/` | `<Nome> - Segurança.md` |
| `deployment/` ou `deploy/` ou `infra/` | `deployment/` | `<Nome> - Deploy.md` |

Se docs/ sem subpastas → conteúdo vai pro `index.md`, subpáginas viram stubs com `> [!gap]`.

---

## Passo 3 — index.md

Path: `wiki/Projetos/<nome>/index.md`

### CREATE

```yaml
---
type: entity
title: "<Nome>"
aliases:
  - <Nome>
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
tags:
  - projeto
  - <tag-stack>
entity_type: repository
status: <seed|developing|evergreen>
related:
  - "[[Projetos]]"
sources:
  - "<D_PATH>/docs/"
---
```

### UPDATE

Ler arquivo existente primeiro. Atualizar apenas:
- `updated:` → hoje
- `sources:` → garantir path D: listado
- `## Stack` se mudou
- Tabela de subpáginas (adicionar novas)

**Nunca sobrescrever** conteúdo manual existente.

---

## Passo 4 — Subpáginas

Frontmatter padrão:

```yaml
---
type: reference
title: "<Nome> — <Seção>"
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
tags: [projeto, <nome-kebab>, <tag-secao>]
status: <seed|developing|evergreen>
related:
  - "[[<Nome>]]"
sources:
  - "<D_PATH>/docs/<arquivo>.md"
---
```

**CREATE**: extrair conteúdo do arquivo fonte. Marcar lacunas com `> [!gap]`.

**UPDATE**: ler antes de editar. Só atualizar seções com fonte direta. Preservar anotações manuais. Atualizar `updated:`.

---

## Passo 5 — Reportar

```
Projeto: <Nome> | <D_PATH>
Modo: CREATE | UPDATE

Criado: wiki/Projetos/<nome>/index.md
         wiki/Projetos/<nome>/backend/<Nome> - Backend.md
         ...
Atualizado: ...
Stubs (> [!gap]): ...
```

---

## Convenções (não violar)

- Alias único — checar com Grep antes de criar.
- `related:` com aspas duplas: `"[[Nome]]"`.
- Wikilinks em tabelas: `[[X|display]]` sem barra invertida.
- Nomes de arquivo: Title Case com espaços.
- Nomes de pasta: lowercase com hífens.
- `sources:` sempre lista o path D: de origem.
