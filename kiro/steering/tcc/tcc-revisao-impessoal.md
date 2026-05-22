---
inclusion: manual
description: "Varredura final de capítulo de TCC procurando primeira pessoa, clichês acadêmicos, informalidade, citações órfãs, figuras/tabelas sem chamada, e siglas não explicadas. Gera relatório com localizações e opcionalmente aplica correções."
---

# TCC Revisão Impessoal

Varredura mecânica de capítulo concluído. QA do texto — não skill criativa. Encontra violações de normas que escaparam ao drafting.

## Processo

### 1. Localizar arquivo a revisar

Se usuário não disse: "Qual capítulo? (ex: `docs/tcc/cap3-metodologia.md`)"

### 2. Verificações em ordem

Formato de cada ocorrência:
```
LINHA: N
TRECHO: "<excerto>"
PROBLEMA: <descrição>
SUGESTÃO: <correção>
```

#### Verificação 1 — Primeira pessoa

Buscar: `\beu\b`, `\bnós\b`, `\bminha?\b`, `\bnoss[ao]s?\b`, `\bme\b` (reflexivo), verbos: `fiz`, `fizemos`, `implementei`, `escolhi`, `desenvolvi`, `criei`, `decidi`, `optei`, `achei`, `utilizei`, `usei`, `vou` (em "vou explicar"), `vamos` (em "vamos analisar"), `pretendo`.

Exceção: citação direta literal entre aspas.

Sugestões: "Eu desenvolvi X" → "Desenvolveu-se X" / "Nós escolhemos Y" → "Optou-se por Y"

#### Verificação 2 — Clichês acadêmicos

- `é importante (notar|destacar|ressaltar|frisar)`
- `é (crucial|vital|fundamental|essencial)`
- `atualmente`, `nos dias de hoje`, `no mundo atual`
- `cada vez mais`, `com o avanço tecnológico`
- `vale (lembrar|ressaltar|destacar)`, `não restam dúvidas`

Sugestão padrão: cortar introdução, ir direto à afirmação.

#### Verificação 3 — Informalidade

`tipo` (conector), `a gente`, `deu certo`, `pra`, `pro`, `tá`, `né`, `coisa` (vago), `muito`/`bem` (intensificadores).

#### Verificação 4 — Citações órfãs

Buscar padrão `\([A-Z]+,?\s*\d{4}`. Conferir autor em Referências Bibliográficas. Reportar: citados no corpo mas ausentes nas Referências; e nas Referências mas não citados no corpo.

#### Verificação 5 — Figuras/tabelas sem chamada prévia

Buscar `^Figura \d+ –` e `^Tabela \d+ –`. Para cada N, verificar menção anterior no texto. Se não houver, reportar.

#### Verificação 6 — Glossário (primeira ocorrência de siglas)

Siglas comuns: `SaaS`, `BaaS`, `RLS`, `MVP`, `IA`, `LGPD`, `ODS`, `ISO 25010`, `RNF`, `RF`, `UML`, `DER`, `CRUD`, `JWT`, `API`, `REST`, `JSON`, `SQL`, `CI/CD`, `MVC`, `PWA`, `SPA`.

Verificar se primeira ocorrência tem expansão. Se não: "Sigla X usada sem expansão na primeira ocorrência (linha N)."

#### Verificação 7 — Pontuação em títulos

Headings não levam ponto final (`.`, `;`, `:`). Interrogação `?` permitida.

### 3. Gerar relatório

```markdown
# Relatório de Revisão — Capítulo N

## Resumo
- N ocorrências de primeira pessoa
- N clichês
- N informalidades
- N citações órfãs
- N figuras/tabelas sem chamada
- N siglas sem expansão

## Ocorrências detalhadas
...
```

Salvar em `docs/tcc/_revisoes/cap{N}-revisao-{data}.md` ou exibir inline.

### 4. Oferecer aplicação

1. Aplicar todas as sugestões automáticas (pronomes, clichês, informalidades)
2. Revisar uma a uma
3. Só relatório, sem aplicar

**Não aplicar automaticamente:** citações órfãs, figuras sem chamada, glossário (exigem decisão editorial).

## Limites

- Não valida argumento do capítulo (escopo do tcc-orientador agent)
- Não valida se citação reflete fielmente a fonte original
- Não mexe em conteúdo — só em forma
