# Verification matrix (support for §4 of the `implement` skill)

Proof is typed by the surface the diff actually touched. Identify the surfaces from the changed paths, then execute each one's row. **A green type-check or lint closes no surface on its own** — it proves the code parses, not that it works.

| Surface | What counts as proof |
| --- | --- |
| **Data / schema** | The migration applies cleanly against a real instance. A new constraint is proven by violating it and seeing the failure. If the store enforces access rules, prove the rule is *on*: the unauthorised read returns nothing **and** the authorised one returns the expected rows — silence alone is ambiguous, since "correct refusal" and "misconfigured and broken" look identical |
| **Backend / API** | The endpoint exercised end to end with a real request; response body and status both checked. A new error path proven to produce the intended shape, from the central handler rather than assembled at the call site. A validation rule proven by sending something invalid. A queue or event consumer proven **idempotent**: same message twice, effect once |
| **Frontend** | Run the app, reach the screen, capture it. A form proven to reject invalid input *before* it reaches the network. Empty, loading and error states rendered — not just the happy path with data present |
| **Infrastructure / config** | Exercised locally against the real runtime where one exists, with the command and its output pasted. A new secret present only in the ignored env file or the secret store, never in the diff. A performance claim carries a before/after number — "faster" without one is not a result |
| **Pure logic** | A test next to the code, run, with output shown. New parsing, normalisation, computation or resolution logic that arrived without one means §3 was skipped — go back and write it |

A surface you touched but genuinely cannot test declares **why**, explicitly. Silence is not a pass.

## The scenario ladder

Two terms worth separating: a **happy path** is any error-free flow, and a feature has several. The **golden path** is *the* canonical flow the feature exists for — the one you would demo, the one that must never break. Every golden path is a happy path; the reverse is not true.

Climb in this order:

1. **The failures your change introduced** — invalid input, the unauthorised case, the boundary condition, the duplicate delivery. Prove the system *refuses* correctly, with the expected shape.
2. **Variants and edges** — empty list, absent optional field, the null-means-zero case, the second-most-common path.
3. **The golden path last**, as the closing proof.

Jumping straight to rung 3 means the happy path passed and nobody looked at the errors. Stopping at rungs 1–2 means you never proved the feature serves its purpose. Map each rung to the plan's acceptance criteria; without a plan, derive them from the PRD or issue.

## Always, on top of the matrix

- Type-check and lint, with the result pasted.
- Re-run the consumer list collected in pre-flight, plus the full test suite if shared code changed.
- A dependency was added → the licence and tree check, pasted.
- **Phrases that invalidate a report**: "should work", "probably", "seems fine", "tested mentally". Proof is output, a count, a log line, or an image.

## Last step, always: a fresh-context reviewer

Dispatch a subagent with deliberately clean context — whoever did the work is the worst judge of whether it's done.

- **Give it**: the full diff, the acceptance criteria, and the paths the plan said would be touched.
- **Ask it**: is each criterion actually implemented and actually proven? Is there a requirement with no corresponding change? Is there a new surface with no test? Did the diff touch paths outside the declared set?
- **Constrain it**: report correctness and requirement gaps only — not style, not preference. If there is no gap, it must say so explicitly rather than padding.
- A finding is either fixed now or recorded as an open item in the plan. Never silently dropped.
