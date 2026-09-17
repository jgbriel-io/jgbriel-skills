---
name: tcc-revisao-impessoal
description: Final sweep of a TCC chapter looking for first person, academic clichés, informality, weak vocabulary, orphan citations, figures and tables never called out in the text, and technical terms not expanded at first occurrence. Produces a report with locations (line, excerpt, problem, suggestion) and optionally applies the fixes. Use when the user says "revisar capítulo X", "revisão impessoal", "passar o pente fino no TCC", "preparar capítulo pra entrega", or marks a chapter as done and wants it validated before sending it to the advisor. The chapter and the report are in Portuguese.
allowed-tools: Read, Edit, Glob, Grep
---

# TCC Revisão Impessoal

Mechanical sweep of a finished chapter. Finds violations of academic norms that survived drafting. Not a creative skill — a QA skill for the text.

## When to use

- The chapter is a complete draft and the user wants it validated before marking it ✅.
- Before sending the chapter to the advisor.
- Periodic audit of finished chapters (regression).
- The user says: "revisar", "pente fino", "checar voz impessoal", "tá pronto pra enviar?".

## When NOT to use

- The chapter is still being built → use `tcc-rascunho`.
- Changing the argument or the structure of the text → out of scope. This skill handles **form**, never **content**.
- Validating a citation against the original source → out of scope. It only checks that the citation appears in the references.

## Process

### 1. Locate the file to review

Default question when the user did not say: "Qual capítulo? (ex: `docs/tcc/cap3-metodologia.md`)"

Or accept a direct argument (chapter number or full path).

### 2. Run the checks in order

For each check below, use `Grep` or `Read` on the file and build the report in this format:

```
LINHA: N
TRECHO: "<excerto problemático>"
PROBLEMA: <descrição curta>
SUGESTÃO: <correção proposta>
```

### Check 1 — First person, singular and plural

Patterns to search (case-insensitive, whole word):

- `\beu\b` (pronoun)
- `\bnós\b`, `\bnos\b` (object pronoun — careful: "nos" is also the contraction em+os ("nos sistemas", "nos dias"); report only the reflexive/object pronoun, e.g. "nos deparamos", "apresenta-nos")
- `\bminha\b`, `\bmeu\b`, `\bminhas\b`, `\bmeus\b`
- `\bnossa\b`, `\bnosso\b`, `\bnossas\b`, `\bnossos\b`
- `\bme\b` (reflexive context: "me parece", "me convém")
- First-person verbs: `\bfiz\b`, `\bfizemos\b`, `\bfaço\b`, `\bfazemos\b`, `\bimplementei\b`, `\bimplementamos\b`, `\bescolhi\b`, `\bescolhemos\b`, `\bdesenvolvi\b`, `\bdesenvolvemos\b`, `\bcriei\b`, `\bcriamos\b`, `\bdecidi\b`, `\bdecidimos\b`, `\boptei\b`, `\boptamos\b`, `\bachei\b`, `\bachamos\b`, `\bconsiderei\b`, `\bconsideramos\b`, `\butilizei\b`, `\butilizamos\b`, `\busei\b`, `\busamos\b`, `\bvou\b` (in "vou explicar"), `\bvamos\b` (in "vamos analisar"), `\bpretendo\b`, `\bpretendemos\b`

**Legitimate exception:** a literal direct quote from an author in first person — keep it inside the quotation marks.

**Automatic suggestions:**
- "Eu desenvolvi X" → "Desenvolveu-se X" / "X foi desenvolvido"
- "Nós escolhemos Y" → "Optou-se por Y" / "Y foi adotado"
- "Achei melhor" → "Considerou-se mais adequado"
- "Vou explicar" → "Explica-se" / "Será apresentado"
- "A gente fez" → "Realizou-se" / "O projeto contemplou"
- "Minha pesquisa" → "A presente pesquisa" / "O presente trabalho"

### Check 2 — Academic clichés

Empty phrases that add no information:

- `é importante (notar|destacar|ressaltar|frisar|salientar)`
- `é (crucial|vital|fundamental|essencial)` (usually empty)
- `atualmente`, `nos dias de hoje`, `no mundo atual`, `na sociedade contemporânea`
- `cada vez mais`
- `com o avanço (da tecnologia|tecnológico)`
- `desde os primórdios`
- `vale (lembrar|ressaltar|destacar|mencionar)`
- `não restam dúvidas (que|de que)`
- `é sabido que`, `como é sabido`

**Default suggestion:** cut the introductory phrase, go straight to the claim.

> "É importante notar que o Supabase oferece RLS nativo." → "O Supabase oferece RLS nativo."

### Check 3 — Informality

- `\btipo\b` (as a connector, e.g. "tipo assim")
- `\ba gente\b`
- `\brolou\b`, `\brolar\b`
- `\bdeu certo\b`, `\bdeu errado\b`
- `\bpra\b`, `\bpro\b`, `\bpros\b`, `\bpras\b` (in formal prose — keep inside a literal quote)
- `\btá\b`, `\btô\b`
- `\bné\b`
- `\bcoisa\b` (vague — "uma coisa importante")
- `\bmuito\b` (intensifier — "muito rápido", "muito bom" → quantify instead)
- `\bbem\b` (intensifier — "bem rápido" → same)

**Exception:** a literal quote.

### Check 4 — Orphan citations

Search the pattern `\([A-Z][A-ZÁÉÍÓÚÂÊÔÃÕÇ]+,?\s*\d{4}` (uppercase author + year).

For each match, **check** whether the author appears in `docs/tcc/tcc-8-periodo/projeto-escrito/Referências Bibliográficas.md` (or the equivalent path — ask the user if unknown).

Report authors cited in the body and **missing** from the references.

Also report authors **in the references** but **never cited** in the chapter body (possible orphan references).

### Check 5 — Figures and tables with no prior call-out

Search `^Figura \d+ – ` and `^Tabela \d+ – ` (start of line).

For each figure or table `N`:
- Look in the paragraphs **before** the caption for a mention: `Figura N`, `Tabela N`, `(Figura N)`, `conforme Figura N`, `apresentada na Figura N`, etc.
- If there is no earlier mention, report: "Figura N aparece sem ter sido citada antes no texto."

**ABNT rule:** every figure and table has to be mentioned **before** it appears.

### Check 6 — Technical glossary (first occurrence)

Expected technical terms (adjust per chapter):
`SaaS`, `BaaS`, `RLS`, `MVP`, `IA`, `LGPD`, `ODS`, `ISO 25010`, `RNF`, `RF`, `UML`, `DER`, `CRUD`, `JWT`, `API`, `REST`, `JSON`, `SQL`, `CI/CD`, `MVC`, `DDD`, `ORM`, `PWA`, `SPA`, `SSR`, `CSR`.

For each term found in the chapter:
- Locate the **first occurrence**.
- Check for an expansion nearby: the pattern `Termo (Expansão)` or `Expansão (Termo)`.
- If the first occurrence is the bare acronym with no expansion, report: "Sigla X usada sem expansão na primeira ocorrência (linha N)."

**Suggestion:** "SaaS" → "Software como Serviço (SaaS)" or "SaaS (Software como Serviço)".

### Check 7 — Punctuation in headings

Markdown headings (`#`, `##`, `###`).

ABNT rule: headings take **no** final period. A question mark (`?`) is allowed in question headings.

Report every heading ending in `.`, `;` or `:`.

### Check 8 — Semantic formatting

This check is light in markdown (the real formatting is Word). Still verify:
- Blank line before and after a heading.
- One blank line between paragraphs, not two.
- Code snippets in a markdown block (` ``` `) with the language tagged.
- Long quotations: a quote block (`>`) with `(AUTOR, ano, p. X)` after it.

### 3. Produce the report

Format:
```markdown
# Relatório de Revisão — Capítulo N (path)

Gerado em: <data>

## Resumo
- N ocorrências de primeira pessoa
- N clichês acadêmicos
- N informalidades
- N citações órfãs (no corpo, ausentes nas Referências)
- N possíveis referências órfãs (nas Referências, ausentes no corpo)
- N figuras/tabelas sem chamada prévia
- N siglas sem expansão na primeira ocorrência
- N títulos com pontuação inadequada

## Ocorrências detalhadas

### Primeira pessoa
LINHA 47
TRECHO: "Eu desenvolvi a arquitetura..."
SUGESTÃO: "Desenvolveu-se a arquitetura..." / "A arquitetura foi desenvolvida..."

LINHA 89
TRECHO: "Nós escolhemos o Supabase..."
SUGESTÃO: "Optou-se pelo Supabase..." / "O Supabase foi adotado..."

### Clichês
LINHA 12
TRECHO: "É importante notar que..."
SUGESTÃO: cortar introdução, ir direto à afirmação.

(... etc)
```

Save the report to `docs/tcc/_revisoes/cap{N}-revisao-{data}.md` or show it inline, as the user prefers.

### 4. Offer to apply

After the report, ask:
1. **Apply every automatic suggestion** (pronouns, clichés, informality — mechanical fixes).
2. **Review one by one** (show the diff, confirm each).
3. **Report only, apply nothing** (the user fixes manually).

**Do not apply** changes to:
- Orphan citations (not a mechanical fix — it means researching the reference).
- Figures with no prior call-out (not a mechanical fix — it means rewriting the paragraph).
- Glossary (it takes an editorial decision about where the expansion goes).

These stay as recommendations only.

## Limits

- Does **not** validate the chapter's argument (that belongs to a human advisor or a creative skill).
- Does **not** validate whether a citation faithfully reflects the original source (presence only).
- Does **not** touch content — form only.
- Does **not** guarantee academic approval — it is the first QA layer, not a replacement for human review.

## Closing

Show the final summary:
```
Capítulo N revisado.
Antes: X ocorrências em 8 categorias.
Aplicadas: Y correções automáticas.
Pendentes para revisão humana: Z itens (citações órfãs, figuras, glossário).

Recomendação: ler o capítulo em voz alta uma vez antes de enviar — captura ritmo
e fluência que verificação mecânica não pega.
```
