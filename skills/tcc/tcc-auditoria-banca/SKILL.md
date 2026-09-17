---
name: tcc-auditoria-banca
description: Simulates the written report an examining board issues on a finished TCC (Brazilian undergraduate thesis) — grade per criterion (norms, problem, literature review, methodology, results, writing), strengths, weaknesses, mandatory requirements separated from optional suggestions, and a final recommendation. Use when the user says "simular banca", "parecer de banca", "avalia meu TCC como examinador", "tá pronto pra banca?", before final submission or the defense. Oral interrogation is tcc-grill; form-level review is tcc-revisao-impessoal. Output is written in Portuguese.
allowed-tools: Read, Grep, Glob, Bash
---

# TCC — Auditoria de Banca

Produces the **examining board's report** on the written TCC. Not a friendly
review and not advisor feedback: it is the reading of an examiner who will
name everything that weakens the work at the defense. Severe, but fair and
grounded — every criticism carries its reason and the fix.

How this differs from the other TCC skills:
- `tcc-revisao-impessoal` → mechanical form (first person, academic clichés, orphan citations).
- `tcc-grill` → oral interrogation, one hard question at a time.
- `tcc-orientador` (agent) → advisor feedback during writing.
- **this one** → final evaluative report on the document, by criterion, with a grade.

The report itself is written in Portuguese. Criterion names, grade labels and
the output template below are fixed Portuguese strings — do not translate them.

## Process

1. **Locate the document.** Look for the final chapters (e.g.
   `**/capitulos-final/*.md`, `**/projeto-escrito/**`). If nothing is found, ask
   for the path. Read every chapter + appendices + abstract.
2. **Evaluate each criterion** against the real text — quote the passage or
   section as evidence, never judge in the abstract.
3. **Assign a grade per criterion** (scale below).
4. **Separate requirements from suggestions.** Requirement = the board would
   demand the fix before approving. Suggestion = optional improvement.
5. **Final recommendation** based on the whole.

## Criteria

Evaluate these nine, in this order. Each gets a grade + justification.

1. **Estrutura e normas (ABNT/FEPI)** — mandatory elements present and in the
   right order (capa, folha de rosto, folha de aprovação, resumo/abstract,
   sumário, textuais, referências, apêndices); numbering; coherent sumário.
2. **Problema, objetivos e hipóteses** — problem clear and bounded; objectives
   verifiable; hypotheses falsifiable and aligned with the problem.
3. **Referencial teórico** — sufficient coverage, relevant and current sources,
   connected to the problem (not a patchwork of loose concepts).
4. **Metodologia e validade** — method fits the objective; instruments
   described; traceability; threats to validity acknowledged (control group,
   bias, generalization, sample size).
5. **Resultados e discussão** — evidence consistent with the hypotheses;
   critical analysis, not description only; confronted with the literature.
6. **Conclusão** — answers the objectives and each hypothesis; does not repeat
   the introduction; honest limitations and future work.
7. **Qualidade da escrita** — impersonality, cohesion, clarity, formal
   vocabulary, no informality; captions/figures/tables called out in the text.
8. **Contribuição e relevância** — what the work adds; practical, social or
   academic justification actually sustained.
9. **Consistência geral** — coherence across chapters; no contradictions;
   uniform terminology; claims backed by evidence or citation.

## Grade scale

Per criterion and overall:

- **Excelente** — no reservations; would defend without difficulty.
- **Adequado** — solid; minor adjustments.
- **Suficiente com ressalvas** — passes, but the board would demand fixes.
- **Insuficiente** — weakness that compromises the work; needs revision before the defense.

## Report layout

Use exactly this structure:

```markdown
# Parecer de Banca — <título do TCC>

**Avaliado em:** <data>
**Documento:** <arquivos/caminho lidos>

## Síntese
<2-3 frases: impressão geral + recomendação em uma linha.>

## Avaliação por critério

### 1. Estrutura e normas (ABNT/FEPI) — <conceito>
**Pontos fortes:** ...
**Fragilidades:** ...
**Evidência:** <seção/trecho>

### 2. Problema, objetivos e hipóteses — <conceito>
... (mesmo formato para os 9 critérios)

## Exigências (corrigir antes de aprovar/defender)
1. ...
2. ...

## Sugestões (melhoram, não bloqueiam)
1. ...

## Perguntas que a banca provavelmente fará
- ...
- ...

## Recomendação final
**<Aprovado | Aprovado com ressalvas | Reprovar para revisão>** — <justificativa em 1-2 frases.>
```

## Stance

- **Ground every criticism.** "Weak" is not a verdict; say why and cite where.
- **Anticipate the oral defense.** The "Perguntas" section prepares the student
  for the worst the board could ask — aim at the real methodological weaknesses.
- **Separate norm from content.** An ABNT error is an objective requirement;
  the merit of an argument is judgement — state which one you are making.
- **Neither soften nor inflate.** If it is insufficient, say so; if it is solid,
  acknowledge it without flourish.
- **Do not rewrite the text.** The report points; the correction belongs to the
  author (use the writing skills for that).

## Limits

- Evaluates the document; does not validate external facts (it does not check
  whether a citation reflects the original source).
- Does not replace the real board — it is a rehearsal to anticipate it.
- If the document is incomplete (missing chapters, placeholders), evaluate what
  exists and list what is missing as a requirement.
