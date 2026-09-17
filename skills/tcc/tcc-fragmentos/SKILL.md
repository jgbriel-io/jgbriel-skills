---
name: tcc-fragmentos
description: Captures raw TCC material — reading notes, technical decisions, quotations, loose ideas — into a fragments file, before it becomes formal text. Use when the user mentions "fragmentos do TCC", "anotações para o capítulo X", "matéria-prima", "vou anotar pra escrever depois". Feeds tcc-rascunho; writes no chapter prose. The conversation and the captured material are in Portuguese.
allowed-tools: Read, Write, Edit
---

# TCC Fragmentos

An interview session that mines the user for fragments — heterogeneous pieces of text that **may** end up in the final TCC chapter: claims, vignettes, sharp sentences, quotations found while reading, observations about the project's own code, recorded technical decisions. Everything goes into a single raw-material file.

This skill applies **no** ABNT norms, demands no impersonal voice, structures nothing. Structure belongs to the next phase (`tcc-rascunho`). Here the goal is to **accumulate material** the author can revisit.

Talk to the user in Portuguese and write the fragments in Portuguese.

## When to use

- The user says "vou anotar fragmentos pro capítulo X".
- The user just read a paper or book and wants to save relevant passages.
- The user saw something in the project code (`src/`, `supabase/migrations/`, `docs/`) that has to become TCC text.
- The user had a loose idea and wants it stored before it is forgotten.
- Start of a new chapter, with no material accumulated.

## When NOT to use

- Rewriting an existing section → edit the chapter directly.
- Applying ABNT norms → `tcc-writing`, a local skill of the SyncClass project (outside this fleet; may not be in the session).
- Shaping fragments into formatted paragraphs → use `tcc-rascunho`.
- Reviewing impersonal voice and clichés → use `tcc-revisao-impessoal`.

## Process

### 1. Locate the fragments file

SyncClass project convention:
```
docs/tcc/_fragmentos/cap{N}-fragmentos.md
```

Where `N` is the chapter number (1–10). If the user did not name the chapter, ask **once** and remember it for the rest of the session.

If the file does not exist, create it with an H1 holding the chapter's working title. Nothing else — no TOC, no date, no metadata.

First write example:
```markdown
# Fragmentos — Capítulo 3 Metodologia

```

### 2. Capture fragments on every message

For each thing the user says, identify what can become a fragment. Append it to the file quietly. Mention it in passing ("adicionei isso"), without breaking the flow.

**Before every write:** re-read the file from disk. The user may have edited, reordered or deleted fragments between turns. Never overwrite — only append (unless the user asks for an in-place edit).

### 3. Fragment format

Separator: `---` on its own line, with a blank line before and after.

A fragment can be:
- A single sharp sentence.
- A short paragraph.
- A direct quotation (with its reference, even if incomplete).
- A technical observation about the code.
- A list of points that belong together by feel.
- An analogy, a vignette, a memory from an advisor meeting.

**Impose no structure.** Do not number. Do not add headings inside the body. The order is the order of arrival — the user reorganizes later if they want.

### 4. Typical fragment types in the TCC

#### Reading excerpt
```markdown
> "A pesquisa-ação é um tipo de pesquisa social com base empírica que é
> concebida e realizada em estreita associação com uma ação."
> (THIOLLENT, 2011, p. 14)

Bom pra abertura da seção de metodologia. Confirmar página.

---
```

#### Observation about code
```markdown
Em `src/integrations/supabase/client.ts` o cliente é instanciado uma
única vez como singleton. Vale destacar no capítulo 6 — mostra que
projeto evita múltiplas conexões redundantes.

---
```

#### Technical decision
```markdown
Supabase escolhido sobre Firebase porque:
- RLS nativo no PostgreSQL (Firebase não tem nada equivalente).
- Schema SQL versionável (Firebase é NoSQL e versioning é doloroso).
- Custo previsível (Firebase escala em $$ rápido).

Material pra justificativa do capítulo 5.

---
```

#### Loose idea
```markdown
Algo sobre como "IA como copiloto" é diferente de "IA como ferramenta".
Copiloto sugere parceria contínua, ferramenta sugere uso pontual.
Trabalhar isso melhor no capítulo 3.

---
```

#### Quotation that has to become a reference
```markdown
NIST tem definição canônica de Cloud Computing — 5 características essenciais.
Procurar o documento oficial (era SP 800-145?) e citar formal no cap. 2.

---
```

## Conversational stance

This is a **grill-me session**. Interview the user about what they are thinking:

- "Que parte do código você acha que merece destaque no capítulo?"
- "Que decisão técnica ainda não tem justificativa registrada?"
- "Esse livro que você leu — qual frase ficou? Vamos guardar."
- "Reunião com orientador semana passada — alguma observação que precisa virar texto?"

Ask **one at a time**. Wait for the answer. Capture the fragment that emerges from the answer before asking the next question.

If the user answers short ("não sei", "passa"), change angle — do not insist.

## Closing

The session ends when:
- The user says that is enough.
- 15+ fragments were captured (enough to start `tcc-rascunho`).
- The user starts repeating fragments already recorded.

On closing, show the count: "Capítulo X agora tem N fragmentos. Pronto pra entrar em `tcc-rascunho` quando quiser."

## The fragment bar

It is not "this is ready for the TCC". It is **"will this serve me when I come back?"**.

A bad fragment is one the author will not understand a month later — not enough context. A good fragment is raw text that the author can still decode.

Voice at this phase is **free** — the author may write in first person, slang, abbreviations. The move to impersonal academic voice happens in `tcc-rascunho`, never here.
