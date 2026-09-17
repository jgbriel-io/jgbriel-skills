# ADR — template and criterion

One per relevant decision captured in the interview (architecture, monorepo vs
polyrepo, hosting choice, and so on). Do not create an ADR for a trivial choice
or one already covered by the plain `## Decisões` table.

Path: `wiki/Projetos/<nome>/architecture/<Nome> - ADR-NNN-slug-da-decisao.md`

The templates below are written into the user's vault and stay in Portuguese —
a Brazilian reader consumes them.

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

Fill in only what the interview produced; a section with no information becomes
`> [!gap]`.

---
