---
inclusion: manual
description: Disciplined diagnosis loop for hard bugs — reproduce, hypothesise, instrument, fix, regression-test
---

# Diagnose

A discipline for hard bugs. Skip phases only when explicitly justified.

## Phase 1 — Build a feedback loop

**This is the skill.** If you have a fast, deterministic, agent-runnable pass/fail signal for the bug, you will find the cause. Spend disproportionate effort here.

Ways to construct one (try in order):
1. Failing test at whatever seam reaches the bug
2. Curl / HTTP script against a running dev server
3. CLI invocation with a fixture input, diffing stdout against a known-good snapshot
4. Headless browser script (Playwright/Puppeteer)
5. Replay a captured trace
6. Throwaway harness (minimal subset of the system)
7. Property / fuzz loop
8. Bisection harness (`git bisect run`)
9. Differential loop (old-version vs new-version)

Do not proceed to Phase 2 without a loop you believe in.

## Phase 2 — Reproduce

Run the loop. Confirm: failure matches what the user described, is reproducible, and symptom is captured exactly.

## Phase 3 — Hypothesise

Generate **3–5 ranked hypotheses** before testing any of them. Each must be falsifiable:

> "If X is the cause, then changing Y will make the bug disappear."

Show ranked list to user before testing.

## Phase 4 — Instrument

Each probe maps to a specific prediction. Change one variable at a time.

- Debugger/REPL inspection first
- Targeted logs at boundaries that distinguish hypotheses
- Never "log everything and grep"
- Tag every debug log: `[DEBUG-a4f2]` — cleanup = single grep

## Phase 5 — Fix + regression test

Write regression test **before the fix**, only if a correct seam exists (tests real bug pattern at call site). Then:
1. Turn minimised repro into failing test
2. Watch it fail → apply fix → watch it pass
3. Re-run Phase 1 loop against original scenario

## Phase 6 — Cleanup

- [ ] Original repro no longer reproduces
- [ ] Regression test passes (or seam absence documented)
- [ ] All `[DEBUG-...]` instrumentation removed
- [ ] Throwaway prototypes deleted
- [ ] Correct hypothesis stated in commit/PR message
