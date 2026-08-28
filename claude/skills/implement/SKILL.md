---
name: implement
description: Implement planned work — a plan, PRD, issue or agreed task. Resolves the target first, refuses to edit without one, works in vertical slices, verifies by the surface actually touched, and closes the record. Use when the user asks to build, implement or code something that has already been decided.
argument-hint: <plan, PRD, issue or task> [scope notes]
---

Implement: `$ARGUMENTS`

## 0. Gate — resolve the target before touching anything

**No resolved target, no edits.** Name what you are implementing and where it is written down: a plan file, a PRD, an issue, or an explicit instruction in this conversation. If you cannot point at one:

- **Scope is large or the approach is undecided** → stop and produce a plan first (`plan`). This is the dominant case, not the exception. Planning is cheap; discovering at step 6 that step 1 was wrong is not.
- **Scope is genuinely trivial** — one sentence, ≤2 files, no technical decision — → say so in one line and go straight ahead. Don't manufacture ceremony for a rename.
- **The request is a question, not an instruction** ("how would we do X?", "can this work?") → answer it. Do not start editing.

That last one matters most: this skill fires on its own, so the gate is what separates being invoked from being authorised.

## 1. Pre-existence check — is it already built?

Before writing anything, find out whether the work exists. Search for the central symbols and their consumers.

- **Already done** (merged, issue closed, every step proven) → **do not reimplement.** Report: what exists and the proof; who would be affected if it changed; what would break; then ask what's actually wanted — extend it (new plan, declared dependency), or is this a regression (that's `diagnose`, not this).
- **Partly done** → implement **only the open parts**. Confirm what the code already does before adding to it; half-finished work plus a fresh implementation is worse than either.
- **Not started** → continue below.

## 2. Pre-flight

- **Read the whole plan or spec first**, not just the step you're starting. The project's own conventions and any recorded decisions rule — a settled decision is not re-opened here, it's implemented.
- **Follow the declared order.** A step blocked on an unmet dependency → stop and say so rather than improvising around it. If the plan explicitly authorises a stub to unblock it, build the stub first as its own step.
- **Build the re-test list now**: for every symbol you will *change* (not merely call), find its callers. That list is the verification scope in §4, and it is much cheaper to collect now than to reconstruct later.
- **A shared contract is additive-first.** A schema, type or signature consumed by more than one caller changes by adding an optional field, not by breaking a live consumer. If a breaking change is genuinely required, that's a decision to surface, not to make silently.
- `git log` the area you're about to touch. Recent work there tells you what not to collide with.

## 3. Implement — thin vertical slices

- **A slice that compiles and runs beats a finished layer.** Cross the layers early on the smallest possible path; integration risk should fail on a small diff, not a large one.
- **Type-check and run tests early and often**, not once at the end.
- **Re-inject the rules at the point of use.** A rule read forty turns ago is not in force. Before writing each step's code, restate — in full, not as a link — the specific conventions that step touches, and the constraints the plan attached to it. A rule cited by name only does not count as re-injected. Every few steps, re-read the plan itself.
- **New logic gets its test alongside it**, in the same step. Not "later".
- **A new dependency is a rare, expensive event.** Check licence and transitive tree *before* installing, not after. Pin the version. If the project pins versions centrally, take it from there and never improvise one.

### Failure protocol

The dominant failure mode is acting early and then insisting — not hallucinating.

- **Name the defect literally.** When asking for a fix (of yourself or a subagent), paste the actual error and name the specific failure — "`accountId` is possibly undefined at `service.ts:142`" — never "fix the problem". Naming it is the difference between a coin flip and a fix.
- **Two attempts on the same step, then stop.** If the second fix also fails, **halt and record state**: the step, both attempts with their real output, and your leading hypothesis. Refining against no oracle until it appears to pass produces something plausible and wrong.
- **A premise collapsed → stop and re-plan.** Don't force the original step through a world that changed.

## 4. Verify — by the surface you touched

Read [verification.md](verification.md) for the proof matrix, the scenario ladder and the reviewer protocol.

Non-negotiable:

- **A green type-check closes no surface by itself.** Touching a route and watching it compile is indirect evidence, not proof.
- **The plan's own verification section is the floor**, not the target — execute every entry and check every acceptance criterion.
- **Re-test the consumer list** from §2.
- **Report with pasted evidence** — command output, a log excerpt, a screenshot. Never an adjective. A failing test is reported as failing, with its output.

## 5. Close the record

1. Mark the executed steps done **as you close each one**, not in a batch at the end — that's what makes the work resumable by someone else.
2. Run the project's pre-merge checklist, whatever it is.
3. A decision made while implementing that outlives this task → write it down where the project keeps decisions, and say you did.
4. **Propose the commit; don't create it unasked.** An explicit "implement this" authorises the work, not the commit — and never a push.
5. Summarise per surface: what was built, what was deliberately left out and where that's recorded, the verification result, and anything the reviewer flagged.
