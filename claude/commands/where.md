---
description: Localiza onde símbolo, função, classe ou string é definido/usado. Invoca agent researcher.
argument-hint: "<símbolo ou string>"
allowed-tools: Read, Grep, Glob
---

Invoque o agent `researcher` para localizar: $ARGUMENTS

## Briefing pro agent

```
Localizar: $ARGUMENTS

Reportar:
1. Onde é definido (declaração principal): path:line + tipo (function, class, const, type, interface).
2. Onde é usado (call sites, imports, references): lista path:line agrupada por arquivo.
3. Testes relacionados (se houver arquivo `*.test.*` ou `*.spec.*` cobrindo): path:line.

Output em tabela ou bullet list compacto.
Sob 400 palavras.
Se não encontrado, listar os padrões/paths que foram buscados.
```

## Output

Repasse o resultado do agent verbatim ao usuário.
