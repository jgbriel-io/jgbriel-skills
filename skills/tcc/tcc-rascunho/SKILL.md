---
name: tcc-rascunho
description: Turns raw fragments into a formal TCC section, paragraph by paragraph, applying ABNT/FEPI norms, impersonal voice and citations. Use when the user already has material accumulated and says "vamos escrever a seção X do capítulo Y", "transformar esses fragmentos em texto", "rascunhar capítulo do TCC". The final sweep is tcc-revisao-impessoal. The chapter text is written in Brazilian Portuguese.
allowed-tools: Read, Write, Edit, Glob
---

# TCC Rascunho

A shaping session that takes a file of raw fragments and produces a TCC chapter section under ABNT/FEPI norms. **Paragraph by paragraph**, arguing the format of each block.

Prerequisite: a fragments file exists (the output of `tcc-fragmentos`) or the user has their own notes in any format.

Talk to the user in Portuguese; the chapter text is always Brazilian Portuguese.

## When to use

- The user has `docs/tcc/_fragmentos/cap{N}-fragmentos.md` full and wants to start writing.
- The user has loose notes in any format and wants them turned into formal text.
- The user says "vamos rascunhar a seção X.Y do capítulo X".
- The chapter is partially drafted and the user wants to continue.

## When NOT to use

- Capturing the initial raw material → use `tcc-fragmentos`.
- Reviewing voice and clichés in a finished chapter → use `tcc-revisao-impessoal`.
- One-off rewrite of an existing paragraph → edit directly, no loop.
- Applying ABNT formatting to a finished document → the project's `tcc-writing`, if it exists; otherwise FEPI's official template.

## Mandatory norms (non-negotiable)

The full norms live in `tcc-writing`, a skill **local to the SyncClass project** —
it is not part of this fleet and may not be available in the session. Look for it
under the project's `.claude/skills/` before starting. If it is not there, say so
and follow the rules below, which are the ones that matter while drafting; any
norm beyond them is asked of the user rather than invented.

- **Absolute impersonal voice** — passive voice or third person singular. Never "eu", "nós", "implementei", "fizemos".
- **Brazilian Portuguese** — always.
- **ABNT citations** — short direct quote in quotation marks inline + `(AUTOR, ano, p. X)`. Long direct quote (>3 lines) indented 4cm, font 10, no quotation marks, `(AUTOR, ano, p. X)` at the end. Indirect with paraphrase + `(AUTOR, ano)`.
- **Figures and tables** — cited in the text **before** they appear. Caption above ("Figura X – Título"), source below ("Fonte: O autor (2026).").
- **Technical glossary** — the first occurrence of a technical term in the chapter gets a brief explanation.
- **No clichés** — "é importante", "é crucial", "atualmente", "nos dias de hoje".

Full detail, when the project skill is available: `tcc-writing`.

## Process

### 1. Read the fragment pile

Read the fragments file **end to end** before writing anything. Build the mental map:
- Which main claims show up?
- Which citations are already collected?
- Which technical decisions still need a formal justification?
- Which gaps exist (a claim without support, a decision with no alternatives compared)?

If there are obvious gaps, **name them** to the user before starting: "Faltam citações de apoio para a afirmação sobre Kanban — quer adicionar, ou cortamos essa parte?"

### 2. Locate the chapter file

SyncClass convention: `docs/tcc/cap{N}-{slug}.md`.

If the section to be written is not in the file yet, create the right heading:
```markdown
## N.X Título da Seção
```

No punctuation at the end of titles (except a question mark).

### 3. Propose 2–3 candidate openings

For the section, propose **2 or 3 different opening paragraphs**. Each implying a distinct angle or thesis. Show **all of them** to the user before writing to the file.

**Example (Capítulo 3 — Metodologia, seção 3.1):**

> **Opção A** (contextualização ampla):
> "A escolha metodológica em projetos de desenvolvimento de software fundamenta-se em critérios que extrapolam preferências técnicas individuais, abrangendo a natureza do problema investigado, o grau de participação do pesquisador e a flexibilidade exigida ao longo da execução. No presente trabalho, adotou-se a Pesquisa-Ação..."
>
> **Opção B** (entrada direta na decisão):
> "Adotou-se, neste trabalho, a Pesquisa-Ação como abordagem metodológica principal. A justificativa repousa em três fatores que dialogam com a natureza do projeto SyncClass..."
>
> **Opção C** (citação como abertura):
> "Conforme define Thiollent (2011, p. 14), 'a pesquisa-ação é um tipo de pesquisa social com base empírica que é concebida e realizada em estreita associação com uma ação'. Esta caracterização sintetiza a postura metodológica adotada no desenvolvimento do projeto SyncClass..."

Wait for the user to choose (or to compose a hybrid).

### 4. Write **only** the chosen opening

Append it to the chapter file. Do not write the next paragraph.

### 5. Argue the next block

Ask: "Dado este parágrafo, o que o leitor precisa ler em seguida?"

Pull the relevant fragment from the pile. Argue the **format**:

#### Format decisions to make at every block

**Prose vs. list**
- Prose carries an argument. A list carries parallel items.
- If the items are *truly* parallel (same syntactic structure, same nature), list. Otherwise, prose with connectives.
- Lists in a formal TCC preferably use a hyphen or the default bullet, or `(i)`, `(ii)`, `(iii)` inline in the paragraph.

**Table vs. repeated structure in prose**
- Same shape repeating 3+ times with the same fields? Table.
- Otherwise, prose with bold leads.
- Every table: caption above, source below, cited in the text **before** it appears.

**Figure vs. textual description**
- A figure when the visual structure IS the point (DER, UML diagram, flow, architecture).
- Prose when the point is an argument about something.
- Every figure: caption above, source below, cited in the text **before** it appears.

**Direct quote vs. paraphrase**
- Direct: when the author's exact words matter. Short inline in quotation marks. Long (>3 lines) indented.
- Paraphrase: when only the idea matters. Usually more fluid, recommended as the default.

**Code inline vs. appendix**
- Snippet ≤5 lines, illustrative: it can go inline in a code block.
- More than that → Appendix. Reference it with "(Apêndice A)".
- Never paste a whole file into the body of the TCC.

**Technical justification — the tripod**
For every non-trivial technical decision:
1. **Context** — which problem or need existed?
2. **Alternatives** — which options were considered?
3. **Criteria** — why does the chosen one fit better?

### 6. Write the block and stop

Append to the file. Re-read the file from disk before each write — the user may have edited between turns. Never overwrite earlier blocks.

### 7. Loop 5–6 until the section closes

The user decides when the section is complete. Do not try to finish it autonomously.

## Conversational stance

Push back actively. Do not let weak transitions through:

- "Esse parágrafo faz o quê pelo leitor que o anterior não fez?"
- "Se eu cortar isso, o que quebra na cadeia argumentativa?"
- "Esse trecho está fazendo dois trabalhos — separar ou escolher um?"
- "A abertura prometeu falar sobre X. Estamos derivando para Y. Re-amarrar ou mudar a abertura?"
- "Tem afirmação aqui sem citação de apoio. Tem fragmento que cobre? Senão, ressalvar ou cortar."
- "Esse vocabulário ('fiz', 'achei melhor') é da fase de fragmentos. Vamos converter para voz impessoal antes de salvar."

## The pile is a quarry, not a script

Fragments are **raw material**. It is fine to:
- Turn a fragment into a paragraph, split it into two, merge two fragments into one, paraphrase, or quote literally.
- Reorder by the chapter's logic, not by capture order.
- Leave fragments unused — that is the point of having more material than needed.

If the pile lacks what the section needs, **name the gap explicitly**: "Precisamos de um exemplo aqui e a pilha não tem — me dá um agora, ou cortamos esta subseção."

## Academic transition vocabulary

Formal connectives to keep the prose fluid:

- **Causalidade:** "em virtude de", "decorrente de", "uma vez que", "tendo em vista que"
- **Adversidade:** "no entanto", "todavia", "em contrapartida", "por outro lado"
- **Conclusão:** "portanto", "desta forma", "conclui-se que", "depreende-se que"
- **Adição:** "ademais", "além disso", "outrossim", "soma-se a isso"
- **Exemplificação:** "a título de exemplo", "como ilustração", "verifica-se em"
- **Comparação:** "analogamente", "de maneira semelhante", "em contraste"

## Free → impersonal conversion, in real time

When a fragment is in first person or informal, **convert it on the spot** while writing into the chapter:

| Fragmento bruto | Texto formal |
|---|---|
| "Eu escolhi Supabase porque..." | "Optou-se pelo Supabase em razão de..." |
| "A gente fez 31 sprints" | "O projeto contemplou 31 sprints" |
| "Achei melhor usar RLS" | "Considerou-se mais adequado o uso de Row Level Security (RLS)" |
| "Deu certo a abordagem" | "A abordagem apresentou resultado satisfatório" |
| "Tem 25 migrations" | "O projeto contempla 25 migrações SQL versionadas" |
| "É importante notar que" | (cut — cliché. Reformulate as a direct claim) |

## Closing the session

When the user says the section is complete:
1. Re-read the whole chapter file.
2. Check quickly:
   - Is every figure and table cited before it appears?
   - Does every in-text citation have an entry in the project's references?
   - Glossary: are technical terms explained at first occurrence?
   - Did any first person slip through?
3. Suggest the next step: another section, or running `tcc-revisao-impessoal` over the whole chapter.

Do not declare the section "done" — only the user can.
