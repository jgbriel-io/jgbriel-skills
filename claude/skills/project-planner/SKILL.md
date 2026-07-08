---
name: project-planner
description: Conversational project planning: asks one question at a time (grill-me style), suggests technical details when user doesn't know, and scaffolds wiki pages in wiki/Projetos/ after confirmation. Use when user says "quero planejar um projeto", "tenho uma ideia de projeto", "documenta esse projeto", "cria página do projeto X", "novo projeto no wiki", "vou começar um projeto", or starts describing a project idea — even casually. User can share what they already know; Claude fills gaps with suggestions. Does NOT apply to projects with existing docs/ on disk — use wiki-ingest for those.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# project-planner

Entrevista o usuário sobre um projeto novo e cria as páginas wiki em `wiki/Projetos/` seguindo a convenção do vault.

## Quando usar

- Usuário descreve ideia de projeto e quer documentar
- Usuário quer criar estrutura wiki para projeto ainda não documentado
- Usuário diz "vamos planejar X", "tenho ideia de Y", "cria projeto Z no wiki"

Não usar quando: projeto tem `docs/` existente em disco → usar `wiki-ingest` em vez disso.

---

## Passo 1 — Diálogo (estilo grill-me, não questionário fixo)

Fluxo conversacional: Claude pergunta **uma coisa por vez**, sugere quando o usuário não souber, avança quando o usuário já trouxer a info. Não despeja lista de perguntas.

### Regras do diálogo

- Usuário trouxe a info → aceitar, não perguntar de novo.
- Usuário não sabe / não mencionou → **sugerir** com base no contexto e perguntar se confirma.
- Nunca fazer mais de 1-2 perguntas por turno.
- Se o usuário quiser avançar logo → respeitar, preencher o resto como `> [!gap]`.

### Sequência de tópicos (ordem flexível, adaptar ao que o usuário já trouxe)

1. **Nome** — se ainda não foi dito, sugerir baseado na descrição.
2. **Objetivo** — o que resolve / entrega em 1 frase. Sugerir se não estiver claro.
3. **Stack** — perguntar ou sugerir camada a camada (frontend, backend, banco, infra). Sugerir stack comum pro tipo de projeto se o usuário não souber.
4. **Status** — sem código (`seed`), em desenvolvimento (`developing`), em produção (`evergreen`).
5. **Subpáginas** — propor as que fazem sentido pro projeto e confirmar.
6. **Docs em disco?** — perguntar só se parecer projeto já iniciado.

### Exemplo de turno bom

```
Usuário: "quero fazer um app de rastreamento de hábitos, ainda é ideia"

Claude: "Nome de trabalho: **Habit Tracker**. Objetivo: rastrear hábitos diários e ver progresso ao longo do tempo.

Pra stack — você tem preferência ou quer sugestão?"

Usuário: "sugestão"

Claude: "Para app web simples: Next.js + Supabase (auth + DB) + Tailwind. Faz sentido ou prefere mobile/outra abordagem?"
```

### Encerrar diálogo

Quando tiver: nome, objetivo, stack (mesmo que parcial) e subpáginas → apresentar resumo final:

```
Resumo antes de criar:

**Nome**: <nome>
**Objetivo**: <frase>
**Stack**: Frontend: X · Backend: Y · Banco: Z · Infra: W
**Status**: seed
**Subpáginas**: Arquitetura · Backend · Frontend · Database

Crio os arquivos?
```

Só criar após confirmação explícita. Se o usuário der "sim" / "pode" / "vai" → criar.

---

## Passo 2 — Criar index.md

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

### Corpo do index.md

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

## Comandos

```bash
# setup local
```

## Conexões

- [[Projetos]] — domínio pai
- [[<tech-relacionada>]] — conceito relacionado
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

## Passo 4 — Reportar o que foi criado

Após criar os arquivos, listar:

```
Criado:
- wiki/Projetos/<nome>/index.md
- wiki/Projetos/<nome>/architecture/<Nome> - Arquitetura.md
- ...

Próximos passos:
- Preencher seções marcadas com > [!gap]
- Se tiver docs em D:/Projetos/..., rodar wiki-ingest pra enriquecer
```

---

## Convenções do vault (não violar)

- Nunca criar `.md` na raiz do vault
- Alias no frontmatter deve ser único — checar com `Grep` se alias já existe
- `related:` usa aspas duplas: `"[[Nome]]"`, não `[[Nome]]`
- Nome de arquivo: Title Case com espaços (`<Nome> - Backend.md`)
- Nome de pasta: lowercase com hífens (`backend/`, `architecture/`)
- Wikilinks em tabelas: `[[X|display]]` sem barra invertida (nunca `[[X\|display]]`)
