# Claude Code — Workflows

Recipes: which skills to chain, in what order, and why. What each one does is in
the generated table in [STRUCTURE.md](STRUCTURE.md) — only the order belongs here.

A recipe is a known path, not a rail. Skipping a step that does not pay is
expected; what you do not do is reverse the order without a reason, because each
step consumes the output of the previous one.

---

## New work, undefined scope

```
/discuss     → one decision at a time, until the direction closes into a confirmed brief
/research    → only what the brief left as a factual question
/plan        → the brief becomes ordered steps, each with a mechanical proof
/implement   → slice by slice, verifying through the surface being touched
/commit
```

`discuss` is expensive on purpose. An idea that already has shape and only needs
pressure goes to `grill-me` — the same decision tree, one round at a time instead
of one question at a time.

## Work already decided

```
/plan        → straight here, when the decision already exists in an issue, PRD or conversation
/implement
/code-review → Claude Code's built-in; finds defects in the diff
/commit
```

## Bug

```
/diagnose    → tier 0/1/2 by the cost of the proof; feedback loop before any hypothesis
/where <X>   → locates the definition and its uses
/why         → git blame + log for the line
  ↓ fix + regression test that fails before and passes after
/commit
```

`diagnose` demands proof by toggle before declaring a root cause. A symptom
patched without that comes back.

## Architecture decision

```
/codebase-memory   → structural map: who calls what, fan-in/fan-out, impact
/domain-modeling   → validates against the domain model and records the ADR
/codebase-design   → where to cut the seam, the module's interface
```

## Refactoring

```
/codebase-memory   → the real scope: callers, dead code
/codebase-design   → decide the boundary before touching anything
/plan              → verifiable slices, each with its proof
/tdd               → red-green-refactor where there is logic
/implement         → slice by slice
```

## Pull request

```
/pr-acceptance accept   → does the PR deliver what was asked? criterion by criterion
/code-review            → the correctness axis, built-in; accept mode folds its result in
/pr-acceptance resolve  → applies what a human reviewer asked for, one commit per change
```

The three axes are distinct: requirement (`pr-acceptance accept`), defect
(`code-review`), answer to the reviewer (`pr-acceptance resolve`). The mode is
always explicit: `accept` writes nothing, `resolve` commits and pushes.

## TCC — writing a chapter

The TCC is Brazilian by nature, so its skills speak Portuguese — the triggers
below are the literal ones.

```
/tcc-fragmentos          → captures raw material
/tcc-rascunho            → fragments become an ABNT section, paragraph by paragraph
/tcc-revisao-impessoal   → sweep: first person, cliché, orphan citation, uncalled figure
/tcc-revisar             → feedback as a severe advisor (tcc-orientador agent)
/tcc-status              → progress across chapters 1-10
```

## TCC — before the board

```
/tcc-auditoria-banca   → written opinion: a grade per criterion, requirements vs suggestions
/tcc-grill             → oral questioning, one question at a time
/tcc-defesa            → preparing the presentation
```

`tcc-auditoria-banca` judges the document; `tcc-grill` tests whether you can
defend what you wrote. They are different things and both pay off before
submission.

## New project

```
/project-kickoff   → orchestrates idea → spec → design → plan, calling each phase's skill
/stack-scaffold    → technical bootstrap with the standard stack
/setup-pre-commit  → quality hooks before the first real commit
```

## New skill

```
/writing-great-skills   → the theory: invocation, hierarchy, pruning, leading words
  ↓ write the new skill (the creation itself is anthropic-skills:skill-creator)
/skill-audit            → rubric against the reference, blockers, collisions between siblings
/skill-sync             → pulls upstream without losing the local adaptation
```

Publishing is the step nobody remembers: the folder goes into the `skills` list
in `plugin.json`, `version` goes up, and only then does `claude plugin update`
carry it to the machine. Without the bump the new skill exists nowhere.

---

## Agents

They run in an isolated context: what they read never enters the main session.

| Agent | When to call it directly |
|---|---|
| `researcher` | "where is X defined?", "which files use Y?" |
| `planner` | an ordered plan before a feature with several parts |
| `tcc-orientador` | severe academic feedback on a chapter or section |
