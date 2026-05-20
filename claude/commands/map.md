---
description: Mapa de um diretório — listagem por arquivo com responsabilidade detectada. Invoca agent researcher.
argument-hint: "<diretório, default = src/>"
allowed-tools: Read, Grep, Glob
---

Invoque o agent `researcher` para mapear o diretório: $ARGUMENTS

Se vazio, default para `src/`. Se não existir, pedir path correto.

## Briefing pro agent

```
Mapear diretório: $ARGUMENTS

Para cada arquivo (e subdiretório), produzir 1 linha com:
- Path relativo ao diretório alvo.
- Tipo (arquivo de código, teste, config, doc).
- Responsabilidade principal em ≤10 palavras.

Para subdiretórios profundos, recursão 2 níveis. Resumir resto em "(...) + N arquivos."

Output:
### <dir>/
- `arquivo.ts` — descrição curta
- `sub/`
  - `outro.ts` — descrição
  - (...) + 3 arquivos

Sob 400 palavras. Sem prosa adicional.
```

## Output

Repasse o mapa verbatim ao usuário.
