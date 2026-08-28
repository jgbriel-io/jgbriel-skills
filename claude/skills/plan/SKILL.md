---
name: plan
description: Produce an implementation plan — ordered steps, explicit dependencies, mechanical proofs, risks and exit criteria. Scales from a quick in-chat answer to a durable dossier that another session can execute cold. Use when the user asks how to approach something, asks for a plan or the order of work, or before starting anything with several moving parts.
argument-hint: <target — a task, PRD, issue or topic> [constraints]
---

Plan: `$ARGUMENTS`

**This skill implements nothing.** It decides what to do and in what order, so that doing it becomes mechanical.

## 0. Pick the tier first

Planning is overhead. Match it to the work, and say which tier you picked.

| Tier | When | Output |
| --- | --- | --- |
| **1 — quick** | "how should I approach this?" · exploratory · the answer is wanted now, in the conversation | Dispatch the `planner` subagent. Return its plan, ~300 words, **in chat. No file.** |
| **2 — mini** | one sentence of scope, ≤2 files, no real technical decision | Objective + 1–3 steps, each with a proof. In chat. No dossier. |
| **3 — full** | a module, a migration, anything another session will execute, anything with a real dependency graph | **Dossier + `## Plan`**, written to a file |

**Default to tier 1** when the request is a question rather than a commission. A file nobody asked for is litter, and this skill auto-fires.

Escalate only on evidence: tier 1 that surfaces a genuine dependency graph or an undecided trade-off becomes tier 3, and you say why.

**Tier 1's brief must carry tier 1's budget.** The subagent answers the brief it is given, not the tier you had in mind — ask it for exact paths, per-step exit criteria, risks and open decisions and it will correctly return a dossier, because that is what you requested. So state the ceiling *inside* the prompt: *"≤300 words, numbered steps, no tables, no risk register, no verified-state section — name the order and the one thing most likely to go wrong."* Give it the context it needs and cap the shape it returns. A tier-1 dispatch that comes back dossier-shaped is a briefing failure, not an escalation — either re-ask within budget, or say out loud that the work turned out to be tier 3.

**Push back rather than padding.** A genuine one-liner gets told it's a one-liner — don't manufacture six steps for a rename. Scope too big to plan meaningfully gets scoped down first: *"this needs breaking into smaller goals before I can order it — shall we start with X?"*

## 1. Gate

- **Read the target and everything it links.** Recorded decisions rule: a settled decision is detailed by the plan, not re-litigated.
- **Already built or already closed?** Don't plan over it — report the state and ask.
- **No investigation and an open question that changes the shape?** Research it first. Planning without it means roughly two-thirds of the effort becomes improvised investigation inside the plan. If told to proceed anyway, record the gap at the top and enumerate each unresolved decision as `[PENDING-n]` — never a silent choice.
- **A real prerequisite is missing** → the plan opens by declaring the blocker. If a stub can unblock it, the stub becomes an explicit first step plus a note releasing the downstream gate; otherwise the plan is blocked and says so.

## 2. Briefing — what has already been said and decided

Work rarely starts here. Collect the prior art **first**: a plan that contradicts a settled decision out of ignorance is this skill's worst failure. In order —

- **This conversation**: what the user asked for, constrained, or vetoed, including free text in the arguments.
- **Recorded decisions**: everything touching the topic, including superseded ones and what replaced them.
- **The target's own spec** — PRD, issue, acceptance criteria already written.
- **Neighbouring documents** in the area.
- **History**: `git log --grep`, merged PRs. Decisions live in commit messages that never reached a doc.

Everything entering the briefing **carries its source**. Conflicts resolve to the newest explicit human decision; if that's ambiguous, it becomes `[PENDING-n]`.

## 3. Map the terrain — delegate the reading

**Send the gathering to subagents.** Briefing sweeps, history archaeology, "where does X connect to Y", reading N candidate files — one subagent per front, read-only, each returning conclusions and citations rather than file contents. The synthesis is yours; the reading is not, and keeping it out of the main thread is what lets a tier-3 plan stay affordable.

- **Reuse before rediscovering.** If an investigation already exists, extract its findings; searching is then only for (a) confirming cited paths still exist and (b) covering what it missed.
- **For every symbol that will change** — not merely be called — find its callers. That list becomes the verification scope.
- **Greenfield → find the precedent.** Name the closest existing implementation, and say explicitly what to copy from it *and what not to*. A precedent written before a since-changed decision is a trap, not a template.
- **Every path and symbol quoted in the request is a hypothesis** until you've confirmed it exists.

## 4. Write it

For tier 3, use [templates.md](templates.md) — dossier first, `## Plan` last, in one file.

**The quality bar: a fresh session with zero context from this conversation executes it without re-deciding anything.** That is the whole point of the artifact.

- **Reference code by path and symbol; never re-describe its logic in prose.** Duplicated prose rots, and whoever implements it reimplements what already exists.
- **Pin the plan in time**: record the commit it was written against. Every `path:line` in it is true as of that commit.
- **Cite like evidence** — code as `path:line` on first mention, decisions by number, history by short hash. A behavioural claim with no anchor doesn't belong in the terrain or blast-radius sections.
- **Detail lives in the dossier; the `## Plan` stays short** and points at it. Heavy material — a schema shape, a long test scenario, a parameter table — goes in a dossier section the step references.

### Rules for steps

- **One step = one cohesive change + one proof.** A step containing "and also" is two steps.
- **The first step is a walking skeleton**: the thinnest path that crosses every layer and is verifiable with one command. Integration risk should fail on step 1 with a small diff, not on step 6 with a large one.
- **No orphan code.** Every step ends with its output *wired to something that runs* — the route mounted, the hook used, the migration applied.
- **Inject the conventions into the step that touches them**, as text. A rule referenced by link is a rule that won't be followed. Paste only the subset that step needs.
- **Every step declares its "Don't"** — the forbidden side effect, the responsibility belonging to another symbol, the case deliberately unhandled. "Don't break anything" doesn't count; name a concrete, plausible error *of that step*.
- **Every proof is mechanical**: a runnable command and its expected result. A step that ends "should work" has no proof.
- **Tests are layered by surface touched**, and a surface with no possible test says why. Silence is not coverage.
- **Steps express intent** — what changes, where, why — not finished code. Include a snippet only where the exact shape *is* the contract.
- **Declare dependencies only where they're real.** Most plans are graphs; forcing a queue invents constraints and hides parallelism.

### Budget

`## Plan` ≤ ~150 lines, ≤ ~10 steps, ≤ 2 levels of nesting. Over that, split into phases, or carve the large piece into its own plan with a declared dependency — and **name the axis you cut on**: first a missing hard dependency, then a value phase, then a layer. Break any step that touches more than three files or whose proof won't fit in one command.

**Anti-patterns**: `rule-far-from-action` · `prose-proof` · `and-also-step` · `queue-plan-when-it-is-a-graph` · `unrecorded-alternative` (a rejected option with no record gets re-proposed three sessions later) · `sizing-without-consequence` · `how-for-completeness` (a wrong procedure is worse than none).

## 5. Close

1. Tier 3 → save the file and link it from the target's spec, one line. Tier 1 and 2 stay in the conversation.
2. **Spot-check your own citations**: reopen two or three `path:line` and confirm the line still says what the plan claims. Manual, and not optional.
3. Something deliberately cut → record it as out of scope **with the condition that would bring it back**. A cut with no re-entry condition is forgetting, not deciding.
4. Answer with: the steps one line each, blast radius in a few lines, the main risks, test coverage per layer (what exists, what the implementation must create), and **the `[PENDING-n]` items before suggesting implementation** — a question whose wrong answer throws work away gets resolved now, not mid-build.
