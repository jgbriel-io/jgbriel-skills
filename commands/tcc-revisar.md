---
description: Academic review of a TCC chapter through the tcc-orientador agent. Argument, evidence, cohesion, structure, adherence to SyncClass. Feedback is written in Portuguese.
argument-hint: "<chapter number, e.g. 3>"
allowed-tools: Task, Read, Grep, Glob
---

Call the `tcc-orientador` agent to review chapter $ARGUMENTS of the TCC.

## Resolving the target

1. Accept these forms: `3`, `cap3`, `cap 3`, `capítulo 3`, or a direct path.
2. Locate the file with Glob: `docs/tcc/cap${N}-*.md`.
3. On multiple matches, ask which one.
4. On no match, say "Capítulo N não encontrado em docs/tcc/."

## Briefing for the agent

```
Revisar capítulo N do TCC SyncClass: <path>

Contexto disponível:
- Hipóteses do projeto: docs/tcc/cap1-introducao.md
- Referência: docs/tcc/tcc-referencia.md
- Outros capítulos: <listar paths via Glob docs/tcc/cap*.md>
- Código real do projeto: src/, supabase/migrations/, package.json
- Skill local de normas, se existir neste projeto: .claude/skills/tcc-writing.md
  (não faz parte da frota — se não estiver lá, siga sem ela e diga isso)

Aplique sua heurística padrão:
- Argumento, evidência, coesão, estrutura, aderência ao SyncClass.
- Postura de orientador severo — perguntas duras, sem suavização.
- Cite localizações específicas (seção, parágrafo, linha).
- Não corrija normas mecânicas (escopo da skill tcc-revisao-impessoal).
- Português brasileiro.

Antes de escrever feedback, LER o capítulo inteiro, ler cap1, ler tcc-referencia.md,
e conferir afirmações sobre código no projeto real.
```

## Output

Pass the agent's report back to the user. Close with:

> Quer que eu aplique alguma das sugestões diretamente, ou prefere revisar manualmente?

Apply no changes automatically.
