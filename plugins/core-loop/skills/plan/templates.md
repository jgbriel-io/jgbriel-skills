# Tier-3 template — one file, two altitudes

The **dossier** is everything the planning found: the consultation document. The **`## Plan`** at the end is the executable outline. Whoever implements reads the Plan and dips into the dossier when a step points there.

---

# <Title>

`Base: commit <short-hash> (YYYY-MM-DD)` — every `path:line` below is true as of this commit.

## Briefing

What was already decided, and by whom. One line each, **every line carrying its source**: a decision number, a `path`, a commit hash, or "the user, in conversation". Conflicts resolved here, or raised as `[PENDING-n]`.

## Problem

What we're solving and why now. Two or three sentences. If a spec already states this, link it rather than restating it.

## Terrain — what exists today

Per finding: `path/from/root.ts:line` and what's actually there. Separate **real** from **stubbed** from **documented-but-absent**. Note where existing code predates a decision that has since changed — that's a trap for whoever copies it as a precedent.

Gaps go here too. What you looked for and did not find is a finding.

## Dependency map

Two levels — work order, and code coupling.

| Target | Consumers | What must be re-tested |
| --- | --- | --- |
| `path#symbol` | `path`, `path` | ... |

## Blast radius

For each item: the symptom if it breaks, and how it would be detected. Anything read by more than one consumer belongs here — a shared schema, a cache key copied elsewhere, a policy repeated across tables.

## Options considered

Only where a real choice existed. The trade-off, the pick, and the reason. **A rejected option gets recorded here** — otherwise it gets re-proposed three sessions from now, and re-argued from scratch.

## Risks

`R1` … each with its mitigation, or an explicit "accepted, because".

## Open decisions

`[PENDING-1]` … one per question only the owner can settle. Each says what it blocks and what the plan assumed in the meantime.

## Detail sections

Referenced by steps: schema shapes, long test scenarios, parameter tables. Keeps the Plan short without losing the specifics.

---

## Plan

> ≤ ~150 lines · ≤ ~10 steps · ≤ 2 levels. Over budget → split into phases or a second plan with a declared dependency.

**P1 — <walking skeleton: the thinnest path crossing every layer>**

- **Change**: what happens, in which path.
- **Conventions**: the rules this step must follow, **pasted as text** — not linked.
- **Don't**: the concrete, plausible error of *this* step. The side effect that doesn't belong. The case deliberately unhandled.
- **Proof**: `<runnable command>` → `<expected result>`.

**P2 — <title>** *(depends: P1)*

- **Change**: …
- **Conventions**: …
- **Don't**: …
- **Proof**: …

> Declare `(depends: Pn)` **only where the dependency is real.** Most plans are graphs; a forced queue invents constraints and hides what could run in parallel.

### Final verification

The floor for calling it done — every entry executed nominally, not sampled:

- `A1` <acceptance criterion> → proven by `<command / observation>`
- `A2` …

Climb the ladder in order: the failures this work introduced, then the variants and edges, then the golden path last as the closing proof.

### Out of scope

What this plan deliberately does not do, each with **the condition that would bring it back**. A cut with no re-entry condition is forgetting, not deciding.
