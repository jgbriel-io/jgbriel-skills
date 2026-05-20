---
description: Quebra tarefa em plano implementável ordenado via agent planner. Identifica deps, riscos, critérios de saída.
argument-hint: "<descrição da tarefa>"
allowed-tools: Read, Grep, Glob, Bash(git status:*), Bash(git log:*)
---

Invoque o agent `planner` para produzir plano de implementação para: $ARGUMENTS

## Briefing pro agent

Delegue via Task tool com prompt:

```
Tarefa: $ARGUMENTS

Contexto disponível:
- Diretório de trabalho: <cwd atual>
- Branch: <git branch atual, se houver>
- Estado: <git status resumido, se houver>

Aplique sua heurística padrão:
- Numerar passos com dependencies explícitas.
- Listar arquivos críticos por passo.
- Definir exit criteria verificável por passo.
- Flagar riscos e decision points.
- Decompor em vertical slices, não horizontais.
- Identificar coisas fora de escopo.

Se a tarefa for trivial (1 linha de código), dizer isso e não inventar plano.
Se for ampla demais pra planejar, pedir scope-down.
```

## Output

Repasse o plano do agent ao usuário verbatim. Pergunte ao final:

> Plano OK? Posso começar a executar, ajustar pontos específicos, ou quer rever decision points antes?

Não executar nenhum passo do plano automaticamente. Aguardar instrução.
