# Claude Code — Workflows

Receitas: quais skills encadear, em que ordem, e por quê. O que cada uma faz está
na tabela gerada em [STRUCTURE.md](STRUCTURE.md) — aqui só entra a ordem.

Uma receita é um caminho conhecido, não um trilho. Pular etapa que não paga é
esperado; o que não se faz é inverter a ordem sem motivo, porque cada passo
consome a saída do anterior.

---

## Trabalho novo, escopo indefinido

```
/discuss     → uma decisão por vez, até a direção fechar num brief confirmado
/research    → só o que ficou como pergunta factual no brief
/plan        → brief vira passos ordenados, cada um com prova mecânica
/implement   → slice por slice, verificando pela superfície tocada
/commit
```

`discuss` é caro de propósito. Ideia já formada, que só precisa de pressão, vai
pra `grill-me` — mesma árvore de decisão, uma rodada por vez em vez de uma
pergunta por vez.

## Trabalho já decidido

```
/plan        → pula direto, quando a decisão já existe em issue, PRD ou conversa
/implement
/code-review → nativo do Claude Code, acha defeito no diff
/commit
```

## Bug

```
/diagnose    → tier 0/1/2 conforme o custo da prova; loop de feedback antes de hipótese
/where <X>   → localiza definição e usos
/why         → git blame + log da linha
  ↓ fix + teste de regressão que falha antes e passa depois
/commit
```

`diagnose` exige prova por toggle antes de declarar causa raiz. Sintoma
remendado sem isso volta.

## Decisão de arquitetura

```
/codebase-memory   → mapa estrutural: quem chama o quê, fan-in/fan-out, impacto
/domain-modeling   → valida contra o modelo de domínio e registra o ADR
/codebase-design   → onde cortar o seam, interface do módulo
```

## Refactoring

```
/codebase-memory   → escopo real: callers, dead code
/codebase-design   → decidir a fronteira antes de mexer
/plan              → slices verificáveis, cada uma com prova
/tdd               → red-green-refactor onde há lógica
/implement         → slice por slice
```

## Pull request

```
/pr-acceptance   → o PR entrega o que foi pedido? critério a critério
/code-review     → eixo de correção, nativo; pr-acceptance já dobra o resultado dentro
/resolve-review  → aplica o que um revisor humano pediu, um commit por mudança
```

Os três eixos são distintos: requisito (`pr-acceptance`), defeito
(`code-review`), resposta ao revisor (`resolve-review`).

## TCC — escrever capítulo

```
/tcc-fragmentos          → captura matéria-prima bruta
/tcc-rascunho            → fragmentos viram seção ABNT, parágrafo a parágrafo
/tcc-revisao-impessoal   → varredura: 1ª pessoa, clichê, citação órfã, figura sem chamada
/tcc-revisar             → feedback como orientador severo (agent tcc-orientador)
/tcc-status              → progresso dos capítulos 1-10
```

## TCC — antes da banca

```
/tcc-auditoria-banca   → parecer escrito: conceito por critério, exigências vs sugestões
/tcc-grill             → interrogatório oral, uma pergunta por vez
/tcc-defesa            → preparação da apresentação
```

`tcc-auditoria-banca` avalia o documento; `tcc-grill` testa se você defende o que
escreveu. São coisas diferentes e as duas valem antes da entrega.

## Projeto novo

```
/project-kickoff   → orquestra ideia → spec → design → plano, chamando as skills de cada fase
/stack-scaffold    → bootstrap técnico com o stack padrão
/setup-pre-commit  → hooks de qualidade antes do primeiro commit de verdade
```

## Skill nova

```
/skill-creator   → cria ou melhora uma skill
/skill-audit     → rubric C1-C11, blockers, colisão de gatilho entre irmãs
/skill-sync      → puxa atualização dos upstreams sem perder adaptação local
```

---

## Agents

Rodam em contexto isolado: o que eles leem não entra na sessão principal.

| Agent | Quando chamar direto |
|---|---|
| `researcher` | "onde está X definido?", "quais arquivos usam Y?" |
| `planner` | plano ordenado antes de uma feature com várias partes |
| `tcc-orientador` | feedback acadêmico severo de capítulo ou seção |
