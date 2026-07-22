---
name: project-planner
description: Conversational project planning: asks one question at a time (grill-me style), suggests technical details when user doesn't know, and scaffolds wiki pages in wiki/Projetos/ after confirmation. Use when user says "quero planejar um projeto", "tenho uma ideia de projeto", "documenta esse projeto", "cria página do projeto X", "novo projeto no wiki", "vou começar um projeto", or starts describing a project idea — even casually. User can share what they already know; Claude fills gaps with suggestions. This is Phase 1 of project-kickoff — for the full idea-to-implementation workflow use project-kickoff instead; for projects with existing docs/ on disk use project-sync.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# project-planner

Entrevista o usuário sobre um projeto novo e cria as páginas wiki em `wiki/Projetos/` seguindo a convenção do vault.

## Quando usar

- Usuário descreve ideia de projeto e quer documentar
- Usuário quer criar estrutura wiki para projeto ainda não documentado
- Usuário diz "vamos planejar X", "tenho ideia de Y", "cria projeto Z no wiki"

Não usar quando: projeto tem `docs/` existente em disco → usar `project-sync` em vez disso.

---

## Profundidade adaptável

Dois níveis — decidir pelo estágio do projeto, não perguntar:

| Nível | Quando | O que muda |
|-------|--------|-----------|
| **Mínimo** | Ideia solta, side-project, sem stack definida | Só os tópicos essenciais (Passo 1); index.md enxuto, subpáginas como stub |
| **Completo** | Projeto com arquitetura, stack ou repos existentes | Tópicos essenciais + arquitetura (domínios, papéis de usuário, decisões); decisões relevantes viram ADR |

Sinal para nível completo: usuário menciona stack, repos, módulos, migração, ou decisão arquitetural.

---

## Passo 1 — Diálogo (estilo grill-me, não questionário fixo)

Fluxo conversacional: Claude pergunta **uma coisa por vez**, sugere quando o usuário não souber, avança quando o usuário já trouxer a info. Não despeja lista de perguntas.

### Regras do diálogo

- Usuário trouxe a info → aceitar, não perguntar de novo.
- Usuário não sabe / não mencionou → **sugerir** com base no contexto e perguntar se confirma.
- Nunca fazer mais de 1-2 perguntas por turno.
- Se o usuário quiser avançar logo → respeitar, preencher o resto como `> [!gap]`.

### Tópicos essenciais (todo projeto)

1. **Nome** — se ainda não foi dito, sugerir baseado na descrição.
2. **Objetivo** — o que resolve / entrega em 1 frase. Sugerir se não estiver claro.
3. **Stack** — perguntar ou sugerir camada a camada (frontend, backend, banco, infra). Sugerir stack comum pro tipo de projeto se o usuário não souber.
4. **Status** — sem código (`seed`), em desenvolvimento (`developing`), em produção (`evergreen`).
5. **Subpáginas** — propor as que fazem sentido pro projeto e confirmar.
6. **Docs/repo em disco?** — perguntar só se parecer projeto já iniciado. Se
   existir (ou estiver planejada) pasta em `D:/Projetos/...`, registrar o
   caminho em `sources:` do frontmatter — é o que o project-sync usa depois.
7. **Fora do escopo (v1)** — o que o projeto NÃO vai fazer na primeira versão.
   Sugerir 2–3 candidatos com base no objetivo (integrações, mobile, admin,
   multi-tenant...) e confirmar. Entregável obrigatório da Fase 1 do
   project-kickoff — sem isso, scope creep entra de graça.

### Tópicos de arquitetura (nível completo — só quando o sinal acima aparecer)

8. **Domínios/módulos** — quais as áreas do sistema e a responsabilidade de cada uma. Se o usuário não pensou nisso, propor divisão a partir do objetivo.
9. **Papéis de usuário** — roles e permissões, se o sistema tiver auth.
10. **Decisões já tomadas** — arquitetura, monorepo vs polyrepo, hosting… Cada decisão relevante e não-óbvia vira **ADR** (ver Passo 3b).

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
**Fora do escopo (v1)**: A · B · C
[se nível completo] **Domínios**: ... **Papéis de usuário**: ... **Decisões a virar ADR**: ...

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

## Passo 3b — ADR (nível completo, só decisões não-óbvias)

Uma por decisão relevante capturada na entrevista (arquitetura, monorepo vs polyrepo, escolha de hosting, etc). Não criar ADR pra escolha trivial ou já coberta na tabela `## Decisões` simples.

Caminho: `wiki/Projetos/<nome>/architecture/<Nome> - ADR-NNN-slug-da-decisao.md`

```yaml
---
type: reference
title: "<Nome> — ADR-NNN — <Título curto>"
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
tags:
  - project
  - adr
  - <nome-kebab>
status: <proposta|accepted|rejected|superseded>
related:
  - "[[<Nome do Projeto>]]"
---
```

```markdown
# ADR-NNN — <Título da decisão>

Parte de [[<Nome do Projeto>]].

## Contexto

Escala, time, domínio, estado atual, problema central — fatos, não opinião.

## Alternativas consideradas

| Alt | Descrição | Esforço | Risco |
|---|---|---|---|

Marcar a escolhida com ✅.

## Decisão

Alternativa escolhida + justificativa + "por que não X" para cada rejeitada.

## Consequências

**Ganhos:** / **Custos:** — listas honestas, custos incluídos.

## Revisão

Gatilhos concretos que justificariam revisitar (escala, requisito novo, etc).
```

Preencher só o que a entrevista deu; seção sem info vira `> [!gap]`.

---

## Passo 4 — Reportar o que foi criado

Após criar os arquivos, listar:

```
Criado:
- wiki/Projetos/<nome>/index.md
- wiki/Projetos/<nome>/architecture/<Nome> - Arquitetura.md
- [se houver] wiki/Projetos/<nome>/architecture/<Nome> - ADR-001-slug.md
- ...

Próximos passos:
- Preencher seções marcadas com > [!gap]
- Se tiver docs em D:/Projetos/..., rodar project-sync pra enriquecer
- Stress-testar a ideia agora: /grill-me
- Fluxo completo (spec → design → implementação): project-kickoff — esta skill foi a Fase 1
```

---

## Convenções do vault (não violar)

- Nunca criar `.md` na raiz do vault
- Alias no frontmatter deve ser único — checar com `Grep` se alias já existe
- `related:` usa aspas duplas: `"[[Nome]]"`, não `[[Nome]]`
- Nome de arquivo: Title Case com espaços (`<Nome> - Backend.md`)
- Nome de pasta: lowercase com hífens (`backend/`, `architecture/`)
- Wikilinks em tabelas: escapar o pipe do display — `[[caminho\|Texto]]` — senão o `|` parte a célula e quebra link e tabela (regra do CLAUDE.md do vault)
