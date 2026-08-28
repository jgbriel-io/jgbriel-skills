---
name: diagnose
description: Diagnosis loop for hard bugs and performance regressions. Use when the user says "diagnose"/"debug this", or reports something broken/throwing/failing/slow.
---

# Diagnosing Bugs

A discipline for hard bugs. Skip phases only when explicitly justified.

When exploring the codebase, read `CONTEXT.md` (if it exists) to get a clear mental model of the relevant modules, and check ADRs in the area you're touching.

Golden rule: **evidence before theory, reproduction before fixing, root cause before patch.** A known symptom can have a new cause — never conclude by pattern-match.

## Tier by cost of proof — pick one before Phase 1

Uniform rigor is its own failure: a typo should not pay a full investigation's toll, and a race condition should not get a two-minute glance. Declare the tier first.

| Tier | Trigger | What runs |
| --- | --- | --- |
| **0 — fast path** | stack trace or log points at a specific project file **and** the estimated fix is ≤3 lines | Skip the formal loop and the diary. Prove by toggle (below), then report in 3 lines: cause / commit / fix |
| **1 — standard** | a failing test already exists, **or** the repro fits in <20 lines — but the fix isn't obvious | Phase 1 loop is mandatory as a gate, with its exit code recorded. Diary only if the first hypothesis dies |
| **2 — full trail** | no trace and no conclusive log (only a description), **or** intermittent, **or** it only reproduces against a real external service | Everything, including the diary with ≥2 competing hypotheses and the experiment that would refute each. Regressions go to bisect |

Tier 0 is not permission to guess — it still owes proof by toggle. If a tier-0 fix doesn't hold, you were in tier 1; restart there rather than patching again.

**Anti-patterns — name them out loud when you catch yourself:** `premature-editing` (concluding after one or two tool calls) · `symptom-fix` (a guard at the crash site instead of the first wrong writer) · `fix-without-named-cause` ("fix the 500" with no file:line and no observed wrong value) · `tautological-test` (a regression test that passes on the unpatched code) · `heisenbug-declared-victory` · `single-hypothesis` · `patch-overfitting` (refining against no oracle until it seems to pass) · `grep-silence-as-proof` (absence needs ≥2 searches with different parameters) · `uniform-rigor` (every bug paying tier 2).

## Redact

This skill has you show commands, outputs and captured artifacts. **Redact every secret first** — write `<REDACTED>` in its place. Build loops against env vars, so the credential stays in the environment rather than in what you show. Captured artifacts carry auth headers — quote only the lines that carry the signal.

If the redacted output is not enough to diagnose the bug, say so and ask the user.

## Phase 1 — Build a feedback loop

**This is the skill.** Everything else is mechanical. If you have a **tight** pass/fail signal for the bug — one that goes red on _this_ bug — you will find the cause; bisection, hypothesis-testing, and instrumentation all just consume it. If you don't have one, no amount of staring at code will save you.

Spend disproportionate effort here. **Be aggressive. Be creative. Refuse to give up.**

### Ways to construct one — try them in roughly this order

1. **Failing test** at whatever seam reaches the bug — unit, integration, e2e.
2. **Curl / HTTP script** against a running dev server.
3. **CLI invocation** with a fixture input, diffing stdout against a known-good snapshot.
4. **Headless browser script** (Playwright / Puppeteer) — drives the UI, asserts on DOM/console/network.
5. **Replay a captured trace.** Save a real network request / payload / event log to disk; replay it through the code path in isolation.
6. **Throwaway harness.** Spin up a minimal subset of the system (one service, mocked deps) that exercises the bug code path with a single function call.
7. **Property / fuzz loop.** If the bug is "sometimes wrong output", run 1000 random inputs and look for the failure mode.
8. **Bisection harness.** If the bug appeared between two known states (commit, dataset, version), automate "boot at state X, check, repeat" so you can `git bisect run` it.
9. **Differential loop.** Run the same input through old-version vs new-version (or two configs) and diff outputs.
10. **HITL bash script.** Last resort. If a human must click, drive _them_ with `scripts/hitl-loop.template.sh` so the loop is still structured. Captured output feeds back to you.

Build the right feedback loop, and the bug is 90% fixed.

### Tighten the loop

Treat the loop as a product. Once you have _a_ loop, **tighten** it:

- Can I make it faster? (Cache setup, skip unrelated init, narrow the test scope.)
- Can I make the signal sharper? (Assert on the specific symptom, not "didn't crash".)
- Can I make it more deterministic? (Pin time, seed RNG, isolate filesystem, freeze network.)

A 30-second flaky loop is barely better than no loop; a 2-second deterministic one is tight — a debugging superpower.

### Non-deterministic bugs

The goal is not a clean repro but a **higher reproduction rate**. Loop the trigger 100×, parallelise, add stress, narrow timing windows, inject sleeps. A 50%-flake bug is debuggable; 1% is not — keep raising the rate until it's debuggable.

### When you genuinely cannot build a loop

Stop and say so explicitly. List what you tried. Ask the user for: (a) access to whatever environment reproduces it, (b) a captured artifact (HAR file, log dump, core dump, screen recording with timestamps), or (c) permission to add temporary production instrumentation. Do **not** proceed to hypothesise without a loop.

### Completion criterion — a tight loop that goes red

Phase 1 is done when the loop is **tight** and **red-capable**: you can name **one command** — a script path, a test invocation, a curl — that you have **already run at least once** (paste the invocation and its output), and that is:

- [ ] **Red-capable** — it drives the actual bug code path and asserts the **user's exact symptom**, so it can go red on this bug and green once fixed. Not "runs without erroring" — it must be able to _catch this specific bug_.
- [ ] **Deterministic** — same verdict every run (flaky bugs: a pinned, high reproduction rate, per above).
- [ ] **Fast** — seconds, not minutes.
- [ ] **Agent-runnable** — you can run it unattended; a human in the loop only via `scripts/hitl-loop.template.sh`.

If you catch yourself reading code to build a theory before this command exists, **stop — jumping straight to a hypothesis is the exact failure this skill prevents.** No red-capable command, no Phase 2.

## Phase 2 — Reproduce + minimise

Run the loop. Watch it go red — the bug appears.

Confirm:

- [ ] The loop produces the failure mode the **user** described — not a different failure that happens to be nearby. Wrong bug = wrong fix.
- [ ] The failure is reproducible across multiple runs (or, for non-deterministic bugs, reproducible at a high enough rate to debug against).
- [ ] You have captured the exact symptom (error message, wrong output, slow timing) so later phases can verify the fix actually addresses it.

### Minimise

Once it's red, shrink the repro to the **smallest scenario that still goes red**. Cut inputs, callers, config, data, and steps **one at a time**, re-running the loop after each cut — keep only what's load-bearing for the failure.

**When one-at-a-time is too slow, halve instead (ddmin).** Cut **half** the remaining surface — payload fields, flow steps, fixture rows, config keys — and re-run the loop. Still red? Discard that half permanently and halve again. Went green? Put it back and halve the other side. This reaches the minimum in log₂(n) runs instead of n, which matters once the repro has more than a handful of moving parts. Stop when removing any single remaining piece turns it green: the residue is the cause's signature.

**A selective bug is usually a data bug.** If it fails for one record, user or tenant and not others, capture the actual offending datum and drive the repro with *it*, then diff it against a working one — the divergent field is the clue, and no amount of reading the code will surface it.

Why bother: a minimal repro shrinks the hypothesis space in Phase 3 (fewer moving parts left to suspect) and becomes the clean regression test in Phase 5.

Done when **every remaining element is load-bearing** — removing any one of them makes the loop go green.

Do not proceed until you have reproduced **and** minimised.

## Phase 3 — Hypothesise

Generate **3–5 ranked hypotheses** before testing any of them. Single-hypothesis generation anchors on the first plausible idea.

Each hypothesis must be **falsifiable**: state the prediction it makes.

> Format: "If <X> is the cause, then <changing Y> will make the bug disappear / <changing Z> will make it worse."

If you cannot state the prediction, the hypothesis is a vibe — discard or sharpen it.

**Show the ranked list to the user before testing.** They often have domain knowledge that re-ranks instantly ("we just deployed a change to #3"), or know hypotheses they've already ruled out. Cheap checkpoint, big time saver. Don't block on it — proceed with your ranking if the user is AFK.

**Rank by prior, cheapest first.** Absent evidence pointing elsewhere, suspicion runs: our code > our data (fixture, config, env) > our build/tooling config > a dependency > the platform or runtime. Reaching for "it's a bug in the framework" before exhausting the first three is almost always wrong, and it's expensive to disprove.

### Investigation diary (tier 2, and tier 1 once the first hypothesis dies)

Keep a live table: `hypothesis | experiment | result | verdict`.

- **A refuted hypothesis stays in the table with the evidence that killed it** — `file:line`, a commit hash, or a pasted log excerpt. Never just "tested, wasn't it."
- **Re-testing a refuted hypothesis without new evidence is forbidden.** Reread the table before each experiment. This is the single thing that stops a long hunt from circling.
- **Each experiment answers ONE binary question, written down before you run it** ("does the value already arrive wrong at the boundary? Y/N"). If you can't say beforehand what each outcome would prove, the experiment is badly designed. "Run it and see" with fifteen logs is not an experiment.

**Timebox: 15 minutes on one hypothesis with no new evidence.** Then stop and write the help request — literal symptom, the repro, what each test proved, the open question. That text is immediately useful twice: it's the search query (with the error in quotes), and it's the handoff if you have to escalate.

**Independent hypotheses fan out.** With ≥2 hypotheses that don't depend on each other, dispatch one subagent per hypothesis, each carrying the experiment that would **refute** it, each returning only a verdict plus `file:line` evidence. Heavy archaeology — reading N candidate diffs — goes to a subagent too, so the main thread receives the culprit hash rather than the diffs.

## Phase 4 — Instrument

Each probe must map to a specific prediction from Phase 3. **Change one variable at a time.**

Tool preference:

1. **Debugger / REPL inspection** if the env supports it. One breakpoint beats ten logs.
2. **Targeted logs** at the boundaries that distinguish hypotheses.
3. Never "log everything and grep".

**Tag every debug log** with a unique prefix, e.g. `[DEBUG-a4f2]`. Cleanup at the end becomes a single grep. Untagged logs survive; tagged logs die.

### Wolf Fence — binary search in space

A wrong value with no stack trace has no obvious probe site. Don't scatter logs. Draw the path the data travels — entry → auth → validation → service → persistence → response — and place **one** detector at the **midpoint**: a log of the value, or an assertion that fails. Run the repro once and ask a single question: **is the value already wrong here?** Wrong → the cause is upstream. Right → it's downstream. Halve again. log₂(n) runs localizes the stage. **One detector per round** — two detectors is two variables and tells you less than one.

### Where the error APPEARS is not where it is BORN

The line that throws is usually the first *victim* of bad data, not its author. A crash on a null field, a query returning nothing, a malformed record — each was written wrong by something earlier that did not complain at the time.

Walk backwards writer by writer to **the last point where the value was still correct**. The patch belongs at the **first wrong writer**. A guard at the crash site is defense-in-depth and sometimes worth adding, but it is never the fix — it converts a loud bug into a silent one.

In the report, the symptom line and the origin line are **two distinct `file:line` citations**. If they're the same line, say so explicitly, because it's unusual enough to be worth stating.

**Perf branch.** For performance regressions, logs are usually wrong. Instead: establish a baseline measurement (timing harness, `performance.now()`, profiler, query plan), then bisect. Measure first, fix second.

## Specialist paths — take these when the triage fits

### It worked before (regression)

The git history is the strongest evidence available, and it's usually faster than reading code.

- `git log --oneline -- <suspect paths>` — what landed in the area, and when.
- **Pickaxe:** `git log -S "<literal code excerpt>" -p --reverse` finds every commit that *added or removed* that excerpt. Use `-G "<regex>"` when the code only moved or was reindented.
- `git blame -w -C -C -C <file>` on the suspect lines — `-w` ignores whitespace, `-C -C -C` follows code moved between files. Landed on a refactor commit rather than the real author? Blame again from its parent: `git blame <commit>^ -- <file>`.
- Regression window: `git log --oneline --since="<last time it worked>" -- <suspect paths>`.
- **Window too big to read → `git bisect`.** This is where the Phase 1 loop pays off twice: `git bisect start && git bisect bad && git bisect good <known-good>`, then `git bisect run <your repro command>` (exit 0 = good, non-zero = bad, 125 = skip). Finish with `git bisect reset`.
- Culprit found → read its **whole** diff and understand *why* it broke, not just what changed. A commit that looks unrelated usually changed a shared assumption.

### It started after a dependency changed

1. Lockfile archaeology — find who bumped what, and when, then cross it against the symptom's onset.
2. Inspect the resolved tree: which package pulled it in, and is there more than one version present?
3. Confirm guilt by pinning the previous version and re-running the repro. If it goes green, you have your culprit; if not, the bump was a coincidence.
4. Read the changelog between the two versions before theorising — announced breaking changes are the cheapest possible answer.
5. Search the project's issue tracker for **the exact error string in quotes**, open *and* closed issues. Keep the link of anything that actually helped; it goes in the report.
6. Reproduce **outside** your app, in an isolated script with only that package on the same runtime. This is what separates "our usage is wrong" from "their bug", and you cannot conclude the latter without it.
7. Outcomes ranked: fix our usage > pin the version (with an issue link recorded) > local workaround. A genuinely novel bug of theirs deserves an upstream report.

## Phase 5 — Fix + regression test

Write the regression test **before the fix** — but only if there is a **correct seam** for it.

A correct seam is one where the test exercises the **real bug pattern** as it occurs at the call site. If the only available seam is too shallow (single-caller test when the bug needs multiple callers, unit test that can't replicate the chain that triggered the bug), a regression test there gives false confidence.

**If no correct seam exists, that itself is the finding.** Note it. The codebase architecture is preventing the bug from being locked down. Flag this for the next phase.

If a correct seam exists:

1. Turn the minimised repro into a failing test at that seam.
2. Watch it fail.
3. Apply the fix.
4. Watch it pass.
5. Re-run the Phase 1 feedback loop against the original (un-minimised) scenario.

### Proof by toggle — the gate on claiming root cause

Watching the test pass with the fix in place proves nothing on its own; a tautological test passes either way. Prove the fix is load-bearing:

1. Run the repro **with** the patch → green.
2. Remove the patch (`git stash`) and run again → **it must go red.**
3. Restore it (`git stash pop`).

**If it doesn't go red without your patch, you have not found the cause** — you changed something adjacent and the bug moved. Go back to Phase 3.

This is also the tier-0 fast path's only obligation: even a three-line fix owes the toggle.

**A bug that "went away on its own" is never closed as fixed.** Classify it as a heisenbug or a data bug and record what's still missing to reproduce it. It will come back.

## Phase 6 — Cleanup + post-mortem

Required before declaring done:

- [ ] Original repro no longer reproduces (re-run the Phase 1 loop)
- [ ] Regression test passes (or absence of seam is documented)
- [ ] All `[DEBUG-...]` instrumentation removed (`grep` the prefix)
- [ ] Throwaway prototypes deleted (or moved to a clearly-marked debug location)
- [ ] The hypothesis that turned out correct is stated in the commit / PR message — so the next debugger learns

**Then ask: what would have prevented this bug?** If the answer involves architectural change (no good test seam, tangled callers, hidden coupling) hand off to the `codebase-design` skill with the specifics. Make the recommendation **after** the fix is in, not before — you have more information now than when you started.

## Report format

Open with three lines, so the reader can decide in ten seconds whether to approve the fix:

- **CAUSE** — `file:line` (the origin, not the crash site)
- **COMMIT** — the culprit hash plus one sentence on why it broke things, when it's a regression
- **FIX** — one sentence

Then, only what carried the diagnosis:

1. **Root cause** with evidence — symptom `file:line` *and* origin `file:line` when they differ.
2. **Why it was possible** — one "why?" above the patch. A missing test, an implicit contract, an unvalidated boundary. This is the part that prevents the next one.
3. **Reproduction** — how to trigger it, and the toggle result proving the fix is load-bearing.
4. **Impact radius** — what else touches the changed symbols, and what you re-tested.
5. **Classification** — regression · latent · data · timing/race · dependency · platform · not-a-bug-but-spec.
6. **Evidence** — internal (`file:line`, hashes, log excerpts) and external (issues, changelogs, docs), one line each.

A claim about the code with no `file:line`, hash, or pasted output behind it is a theory, not a finding — label it as one or cut it.
