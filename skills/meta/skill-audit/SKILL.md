---
name: skill-audit
description: Audit Claude Code skills against the fleet's reference implementation — a mechanical sweep first, then criterion-by-criterion reading with a named exemplar for each, trigger-collision analysis across siblings, and fixes applied in the repo and published to the runtime. Use when the user says "auditar skills", "skill audit", "revisar as skills", "are my skills any good?", after importing skills from an external repo (an imported skill is never ready as it came), or as periodic maintenance. Audits one category at a time.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Skill Audit

The deliverable is a verdict per skill, the evidence behind it, and the fix for
whatever is cheap and unambiguous. Auditing without fixing produces a report;
fixing without measuring produces personal taste.

## The standard is an implementation, not an opinion

This fleet's core came from [`lucasmonstrox/utevo-lux`](https://github.com/lucasmonstrox/utevo-lux),
where every instruction is a claim about how a model behaves and the load-bearing
ones cite the benchmark behind them. **That is what this measures against.** Do
not invent a round number: when a criterion has an exemplar, open the exemplar.

| Reference | Size |
|---|---|
| `utevo-lux` — 7 skills | 64 to 185 lines, median **76** |
| `skills/core-loop/` — 13 skills | 28 to 257 lines, median **95** |

A skill past ~260 lines is past everything that has been shown to work here, and
the burden is on it. Past 750, splitting is not optional.

## 0. Mechanical sweep — before reading anything

```bash
python3 scripts/audit-sweep.py <category>    # or no argument for the whole fleet
python3 scripts/audit-sweep.py --sizes       # the distribution against the reference
```

It settles what needs no judgement: size, frontmatter, a `name` that disagrees
with its folder, a link to a file that does not exist, another tool's name, rules
shouted in caps. `BLOQUEIO` fails a skill on its own. Reading 86 skills by hand to
find the two that are broken is the expensive way round; the reading budget goes
to what the sweep cannot decide.

## 1. Confirm you are scoring what actually loads

The repo is canonical, but the runtime is a copy pinned to a version, so an edit
that was never published is not in play:

```bash
diff -rq --strip-trailing-cr skills/<cat>/<name> \
  ~/.claude/plugins/cache/jgbriel/jgbriel-skills/<version>/skills/<cat>/<name>
```

Always `--strip-trailing-cr`: CRLF against LF makes identical files look
rewritten. A difference means a version bump is missing — say so before scoring.

## 2. Rubric

0 (violates) / 1 (partial) / 2 (meets) per applicable criterion. Each row names
where to read an exemplar.

| # | Criterion | What passes | Exemplar |
|---|---|---|---|
| C1 | Discovery | kebab `name` matching the folder; description states **what it does and when to reach for it**, in words the user would actually type, and draws the line against its siblings | `core-loop/discuss` — separates itself from `grill-me`, `research` and `plan` in the description itself |
| C2 | Concision | Inside the reference range; every section pays for its own tokens; assumes the model is smart | `core-loop/implement`, 74 lines covering gate, slices, failure protocol and verification |
| C3 | Progressive disclosure | A navigable SKILL.md, `references/` one level down, mutually exclusive contexts in their own files | `core-loop/diagnose` — `stacks/` per runtime, `scripts/` apart |
| C4 | Degrees of freedom | Rigid where the operation is fragile, loose where the task is open — matched, not defaulted | `core-loop/research` §0: the tier is declared before anything is spent |
| C5 | Workflow | Numbered steps, a correction loop, an **explicit exit condition** | `core-loop/diagnose` — "completion criterion: a tight loop that goes red" |
| C6 | Rules with reasons | "Do X because Y" instead of a shouted MUST: the reason generalizes to the case nobody foresaw | `core-loop/implement` — "green by subtraction is not a fix", with the four ways of faking it |
| C7 | Examples and templates | An input/output pair wherever quality depends on the shape; strictness in proportion | `core-loop/discuss` — the preferred message block, literal |
| C8 | Terminology | One term per concept, start to finish | — |
| C9 | Code and scripts | Explicit dependencies, run-vs-read clarity, no magic constants, MCP tools fully qualified | `scripts/gen-inventory.py` |
| C10 | Timelessness | No date, metric or version that rots without earning it | — |
| C11 | Portability | No private path, no mandatory model, no hard dependency on a sibling being installed. Recommending one is fine; **breaking without it is not** | `core-loop/discuss` — "if another skill is not installed, the brief must still support continuation" |
| C12 | Evidence | An instruction is a claim about model behaviour. The load-bearing ones say what backs them — a benchmark, a measurement taken here, or an incident actually lived | `utevo-lux` README, Evidence section: one benchmark per instruction, opened at the source |

**Automatic blockers**, whatever the score: a vague description · a body past 750
lines with no split · a trigger colliding with an installed sibling · the
original author's context left in place (someone else's paths, another tool being
addressed, another project's data — an imported skill is never ready as it came).

**Verdict:** ≥85% keep · 60-84% adjust · <60% rewrite or archive.

**On "tested in real use":** not a scorable criterion, a state. A skill imported
today has no usage, and saying so is worth more than inventing a score.
`/token-audit` is what answers it, with session data.

## 3. A category is a set

Trigger collisions and contradictions between siblings only surface side by side.
Compare the whole category's descriptions at once: two skills both claiming "code
review", one forbidding what another mandates. A plugin skill does **not** collide
with a project skill — the plugin's comes namespaced. What competes for a name is
personal scope, and `scripts/check-project-skills.sh` finds it.

## 4. Fix and publish

Cheap and unambiguous: apply it. A structural decision (delete, merge, demote to
`disable-model-invocation`): present the option and ask. **Deleting always needs
explicit confirmation.**

Publishing is part of the fix, not an afterthought:

1. Edit in `skills/<cat>/<name>/` — never in the cache, which the next update overwrites
2. Bump `version` in `.claude-plugin/plugin.json`
3. Commit (Conventional Commits, English) and `claude plugin update jgbriel-skills`

A large file splits by line range (`sed -n 'A,Bp'`) into `references/` with a stub
pointing at it — the content moves verbatim, nothing gets rewritten on the way.

## 5. Report

```
## <category>/<skill> — <OK|Adjust|Rewrite> (<pts>/<max> · <pct>%)
<only the criteria below 2, each with evidence at file:line>
Fix: <one line per fix, or "none">
```

Close the category with cross-skill findings, the list of what was applied, and
what stayed open and why. A category with nothing to report is a result — do not
manufacture a low score to look rigorous.

The vault keeps the history in `wiki/Tools/Claude Code/docs/Skills Quality Criteria.md`,
reachable only from the Windows machine. Anywhere else, write the entry to a file
and say it is waiting to be pasted.
