---
name: project-sync
description: Lê a pasta `docs/` de um projeto e cria ou atualiza as páginas dele em `wiki/Projetos/` no vault do Obsidian, espelhando a estrutura e preservando conteúdo manual já escrito. Use quando o usuário disser "sincroniza projeto X", "atualiza wiki do projeto", "documenta o X no vault", ou apontar o caminho de um projeto direto. Fonte solta — transcrição, URL, arquivo único — é obsidian-vault.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# project-sync

Lê a `docs/` de um projeto e cria ou atualiza `wiki/Projetos/<nome>/` seguindo as convenções do vault.

---

## Catálogo de projetos

O mapa projeto → pasta no disco → pasta no vault é **dado de máquina, não de
skill**: muda quando um cliente entra ou um repo é renomeado, e não pertence a um
repositório público. Ele vive em `~/.claude/projects-map.md`, fora deste repo.

Leia esse arquivo primeiro. Cada linha é `<nome> | <caminho do projeto> | <pasta no vault>`.
Se o arquivo não existir, ou o projeto pedido não estiver nele, **pergunte o
caminho ao usuário** e ofereça acrescentar a linha — nunca adivinhe um caminho
nem escreva o mapa aqui dentro.

---

## Passo 1 — Resolver projeto e path

1. Identificar projeto pelo nome na mensagem do usuário.
2. Confirmar path D: via catálogo acima ou input do usuário.
3. Verificar se `docs/` existe:
   ```bash
   ls "<D_PATH>/docs/" 2>/dev/null || echo "NO_DOCS"
   ```
4. Se `NO_DOCS`: buscar `README.md` na raiz do projeto como fonte alternativa. Informar usuário.
5. Verificar se `wiki/Projetos/<categoria>/<nome>/` já existe (categorias: `Clientes/`, `Pessoais/`, `Backlog/` — ver coluna "Pasta no vault" do catálogo) → determinar modo CREATE vs UPDATE. Em CREATE, confirmar a categoria com o usuário se não for óbvia.

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
