---
name: tcc-defesa
description: Builds the defense presentation for the SyncClass TCC out of the written chapters — narrative arc, slide-by-slide script with timings, speaking script, what to cut, and a rehearsal plan. Use when the user says "preparar a defesa", "montar apresentação do TCC", "slides da defesa", "roteiro da banca", "o que apresentar na defesa". Not question drilling (that is tcc-grill) and not a report on the document (tcc-auditoria-banca) — this builds the presentation itself. Output is written in Portuguese.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# TCC — Defesa

Turns the written TCC into a defense presentation. The document runs ~100
pages; the board sees 15–20 minutes. This skill decides what survives the
compression and in what order — not how to summarize everything.

tcc-* family: `tcc-fragmentos` → `tcc-rascunho` → `tcc-revisao-impessoal` →
`tcc-auditoria-banca` → **this one** → `tcc-grill` (question drilling, run it
once the script is ready).

The script and slides are written in Portuguese.

## Process

### 1. Gather the material

- Read the final chapters (ask for the path if nothing is under
  `**/capitulos-final/` or `**/projeto-escrito/`).
- Project metrics: read the canonical ones in the vault/project `CLAUDE.md`
  ("Métricas canônicas" section) and ALWAYS use those numbers — the board
  compares them against the text. Never quote from memory: there is one source.
- Ask: speaking time set by FEPI? (assume 20 min if unknown, confirm). Defense
  date? Format (in person or remote, slides mandatory?).

### 2. Define the arc

Default defense arc (adapt it, do not freeze it):

1. Problema e contexto (who suffers, why) — short, the board read the text
2. Objetivos e hipóteses (H1/H2/H3) — literal, exactly as in the document
3. Método (why Pesquisa-Ação + sprints; 1 slide, not a chapter)
4. O que foi construído (demo or SyncClass screenshots — the strong moment)
5. Resultados por hipótese (evidence → verdict: confirmada/parcial/refutada)
6. Limitações (raise them before they ask — it disarms the board)
7. Conclusão e trabalhos futuros

Timing rule: ~1 min per slide. 20 min → 15–18 useful slides + cover/thanks.

### 3. Slide-by-slide script

For each slide, deliver:

```
Slide N — <título curto>
Conteúdo: <bullets do que aparece na tela — máximo 4 por slide>
Fala: <2-3 frases do que dizer, linguagem falada, não texto do TCC>
Tempo: <min>
```

- One idea per slide. A slide with two subjects becomes two slides or loses one.
- Canonical numbers appear ONCE each, on the right slide — repeating dilutes them.
- Figures from the TCC (DER, architecture) are worth more than text: name which
  chapters hold reusable figures.

### 4. What NOT to present

List explicitly what stays out and why (long literature review, implementation
details, large tables). The board asks about what is in the text — the
presentation does not have to cover everything, it has to hold the narrative.

### 5. Rehearsal

- Read the script aloud against a timer — over time means cutting a slide,
  never speaking faster.
- Transition quiz: "o que vem depois do slide de metodologia?" until it flows.
- Close by offering: "roteiro pronto — quer treinar as perguntas da banca?
  (`/tcc-grill`)".

## Limits

- Does not generate the slide file (PowerPoint/Canva belongs to the author) —
  it generates the **script** that becomes slides.
- Invents no results and no numbers — only what is in the chapters and in the
  canonical metrics.
