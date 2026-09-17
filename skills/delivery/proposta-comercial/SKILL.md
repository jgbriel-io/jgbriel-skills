---
name: proposta-comercial
description: Turns a client briefing into a freelance commercial proposal — closed scope (included and excluded), deliverables, schedule, price and conditions. Interviews for whatever is missing, one question at a time, and saves the proposal in the client's vault folder. Use when the user says "faz a proposta pro cliente X", "monta o orçamento", "escopo pro freela", "proposta comercial", or pastes a briefing asking for pricing. It does not produce a legal contract, only the proposal.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Freelance Proposal

Briefing in, closed proposal out. The goal is scope without ambiguity: a vague
proposal becomes unpaid rework.

The proposal is written in Portuguese, because the client reads it. The
instructions here are not.

## Process

### 1. Extract from the briefing

From whatever the user pasted or described, pull out: the client, the project's
goal, the implied deliverables, any deadline mentioned, any budget signalled.
Whatever is not clear goes into the interview.

### 2. Interview for what is missing, one question at a time

In the order of what blocks the proposal most:

1. **Deliverables** — what exactly does the client receive? An N-page site, a
   dashboard, integration X. Propose a list and confirm it.
2. **Out of scope** — what the client may assume is included and is not: copy,
   photography, ongoing SEO, hosting, maintenance. The most important section of
   the proposal.
3. **Timeline** — in weeks, counted from what? Approval, or receipt of the
   client's material?
4. **Price** — always comes from the user. Ask for the closed figure or the hourly
   rate. If they ask for a suggestion, estimate hours per deliverable and multiply
   by the rate they give: the estimate is hours, the pricing is theirs.
5. **Conditions** — payment terms (a deposit plus delivery is the norm), how many
   revision rounds are included, what is billed separately, how long the proposal
   stands.

### 3. Build the proposal

```markdown
# Proposta — <Projeto> · <Cliente>

**Data:** <YYYY-MM-DD> · **Validade:** <X dias>

## Contexto
<2-3 frases: o problema do cliente e o que será feito.>

## Escopo

### Incluído
- <entregável 1>
- ...

### Não incluído
- <item> — <pode ser contratado à parte / responsabilidade do cliente>

## Cronograma
| Etapa | Entrega | Prazo |
|---|---|---|

## Investimento
**R$ <valor>** — <forma de pagamento (ex.: 50% na aprovação, 50% na entrega)>

## Condições
- <N> rodadas de revisão inclusas; adicionais a R$ <valor>/rodada
- Prazo conta a partir de <marco>
- Conteúdo (textos, imagens) fornecido pelo cliente até <marco>
```

### 4. Save and review

- Save to `wiki/Clientes/<client>/Proposta - <Project>.md`. Ask where it goes when
  the client has no folder yet, and never write to the vault root.
- Read it back with the client's eyes: is there a line they could read as "this is
  included" when it is not? Close that gap.
- Offer a short version for WhatsApp or email, five to eight lines, if the user
  wants one.

## Limits

- This is not a contract. Legal clauses, penalties and termination stay out.
- Pricing is the user's decision. The skill structures the proposal; it does not
  price it on its own.
