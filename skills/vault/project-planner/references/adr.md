# ADR — template e critério

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
