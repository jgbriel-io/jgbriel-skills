---
description: Revisão acadêmica de capítulo do TCC via agent tcc-orientador. Argumento, evidência, coesão, estrutura, aderência ao SyncClass.
argument-hint: "<número do capítulo, ex: 3>"
allowed-tools: Read, Grep, Glob
---

Invoque o agent `tcc-orientador` para revisar o capítulo $ARGUMENTS do TCC.

## Resolução do alvo

1. Aceitar formatos: `3`, `cap3`, `cap 3`, `capítulo 3`, ou path direto.
2. Localizar arquivo via Glob: `docs/tcc/cap${N}-*.md`.
3. Se múltiplos matches, pedir desambiguação.
4. Se nenhum, dizer "Capítulo N não encontrado em docs/tcc/."

## Briefing pro agent

```
Revisar capítulo N do TCC SyncClass: <path>

Contexto disponível:
- Hipóteses do projeto: docs/tcc/cap1-introducao.md
- Referência: docs/tcc/tcc-referencia.md
- Outros capítulos: <listar paths via Glob docs/tcc/cap*.md>
- Código real do projeto: src/, supabase/migrations/, package.json
- Skill local de normas: .claude/skills/tcc-writing.md

Aplique sua heurística padrão:
- Argumento, evidência, coesão, estrutura, aderência ao SyncClass.
- Postura de orientador severo — perguntas duras, sem suavização.
- Cite localizações específicas (seção, parágrafo, linha).
- Não corrija normas mecânicas (escopo de tcc-revisao-impessoal skill).
- Português brasileiro.

Antes de escrever feedback, LER o capítulo inteiro, ler cap1, ler tcc-referencia.md, e conferir afirmações sobre código no projeto real.
```

## Output

Repasse o relatório do agent ao usuário. Pergunte ao final:

> Quer que eu aplique alguma das sugestões diretamente, ou prefere revisar manualmente?

Não aplicar mudanças automaticamente.
