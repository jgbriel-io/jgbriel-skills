# Kiro — Workflows

Receitas práticas com steering files e agents.

**Invocação:**
- Steering manual: `@nome-do-arquivo` no chat
- Agent: `@nome-do-agent` (researcher, reviewer, planner, tcc-orientador)
- Steering `global/` carrega automaticamente em toda conversa
- Steering `tech/` carrega por fileMatch (`.tsx`, `.ts`, SQL, migrations)

---

## Feature / Task Nova

```
@zoom-out      → contexto amplo antes de mergulhar
@planner       → plano ordenado com deps, riscos e exit criteria
  ↓ implementar (tech/ steering carrega por fileMatch)
@reviewer      → code review severity-tagged, sem praise
  ↓ commit via git
```

## Bug Difícil

```
@diagnose      → loop disciplinado: hipótese → evidência → fix
@researcher    → localiza definição/uso (path:line table, read-only)
  ↓ fix → commit
```

## Code Review

```
@reviewer      → severity-tagged, sem fluff, sem praise
```

## Banco de Dados (Supabase)

```
  ↓ steering tech/supabase-postgres.md carrega com SQL/migrations
@researcher    → mapear schema atual
  ↓ escrever migration
  ↓ supabase db push → supabase gen types
@reviewer      → revisar migration (RLS, indexes, constraints)
```

## Decisão de Arquitetura

```
@zoom-out                        → contexto amplo
@grill-with-docs                 → valida hipótese contra domain model
@improve-codebase-architecture   → deepening opportunities
  ↓ documentar ADR em docs/architecture/decisions.md
```

## Refactoring

```
@zoom-out      → entender escopo
@tdd           → red-green-refactor se há testes
  ↓ implementar
@reviewer      → revisar resultado
```

## Documentação de Sprint

```
@docs-writing  → ativa template e padrões de sprint
  ↓ escrever docs/sprints/sprint-NN-tipo-desc.md
  ↓ atualizar docs/sprints/README.md (status table)
```

## TCC — Escrever Capítulo

```
@tcc-fragmentos          → capturar matéria-prima via entrevista
@tcc-rascunho            → moldar em seção ABNT (parágrafo a parágrafo)
@tcc-revisao-impessoal   → varredura: 1ª pessoa, clichês, informalidade
@tcc-orientador          → feedback acadêmico severo (agent)
```

## TCC — Simulação de Banca

```
@grill-me-tcc   → stress-test: hipóteses, metodologia, escopo, literatura, resultados
                → uma pergunta por vez, indica fraqueza testada + resposta esperada
                → ao final lista as 3 fragilidades mais críticas
```

> Diferente do `tcc-orientador` (revisa texto), `grill-me-tcc` testa se você consegue **defender** o que escreveu.

## Criar Novo Steering

```
@steering-creator   → bootstrap interativo de novo steering file
  ↓ criar em subpasta adequada (core/tech/engineering/misc)
  ↓ testar com @nome-do-arquivo
```

## Novo Projeto com Supabase

```
1. Ativar power supabase-hosted
2. Criar .kiro/steering/core/ com project-context, behavior, security
3. Criar .kiro/steering/tech/ com database-patterns, ui-patterns, code-reviewer
4. @docs-writing → criar docs/ com estrutura domain subfolder
```

---

## Agents — Referência Rápida

| Agent | Papel | Read-only? |
|-------|-------|------------|
| `researcher` | Localiza código: "onde está X?", "o que usa Y?" | ✅ nunca edita |
| `reviewer` | Code review severity-tagged | ✅ nunca edita |
| `planner` | Plano ordenado com deps, riscos e exit criteria | ✅ nunca edita |
| `tcc-orientador` | Feedback acadêmico severo (argumento, evidência, ABNT) | ✅ nunca edita |

---

## Steering — Quando Ativar Manualmente

| Steering | Quando usar |
|----------|-------------|
| `@code-reviewer` | Review checklist completo antes de PR |
| `@frontend-design` | Feature com UI nova ou redesign |
| `@grill-with-docs` | Validar hipótese técnica contra documentação |
| `@improve-codebase-architecture` | Sessão de refactoring arquitetural |
| `@diagnose` | Bug que resistiu a tentativas simples |
| `@tdd` | Feature com lógica complexa que merece testes primeiro |
| `@docs-writing` | Escrita de docs/, README, ADRs, sprints |
| `@tcc-fragmentos` | Início de sessão de escrita de capítulo TCC |
| `@steering-creator` | Criar ou iterar novo steering file |
