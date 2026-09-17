---
name: estimation
description: Applies effort-estimation technique to any deliverable, technical or not — task decomposition, three-point estimation (optimistic/likely/pessimistic via PERT), and project-level risk buffering. Use when user asks to estimate effort, size a task, "quanto tempo leva", three-point estimate, PERT, risk buffer, or when committing to a deadline for a client.
---

# Effort Estimation

Estimating is probability, not guessing. It applies to code, but equally to
design, a data migration, writing content, configuring infrastructure — anything
delivered under uncertainty. The common mistake is not bad arithmetic; it is
estimating the whole large task in one go.

The output feeds `proposta-comercial` when a client is on the other end, or
`project-planner` when it is a personal project recorded in the vault.

## 1. Decompose before estimating

Estimating a large task directly — "integrate with the client's ERP", "migrate the
database" — is always wrong. Not because the estimator is bad at it, but because
uncertainty grows with the size of what has not been thought through in detail.
Break it down until each part is small enough to estimate with confidence: as a
rule, nothing bigger than a few hours to a day or two.

```
❌ "ERP integration" → 3 weeks (a guess)

✅ ERP integration:
   - Map the ERP's endpoints and authentication   → high confidence
   - Implement the client, with retry and errors  → high confidence
   - Transform the payload to the internal format → medium confidence
   - Test against the client's real data          → low confidence (depends on the client)
   - Acceptance and post-feedback adjustments     → low confidence
```

If a part still looks large and vague after being broken down, break it again. A
part nobody can estimate with confidence is a sign that investigation is missing —
a spike — not that courage to name a number is missing.

## 2. Three points per part

For each part, produce three numbers rather than one:

- **Optimistic (O)**: everything goes right, no interruptions, no surprises.
- **Most likely (M)**: the normal case, with the usual friction.
- **Pessimistic (P)**: what plausibly goes wrong does — a dependency slips, a
  requirement changes, the client's environment has a quirk.

Combine them with the PERT formula, which weights the likely case and carries
margin without becoming a guess:

```
Estimate = (O + 4M + P) / 6
```

**Example — "transform the payload to the internal format":**

```
O = 4h   (the formats are already close)
M = 8h   (normal case, a divergent field here and there)
P = 20h  (the ERP's schema differs per client and has to be normalised case by case)

Estimate = (4 + 4×8 + 20) / 6 = (4 + 32 + 20) / 6 = 56 / 6 ≈ 9.3h
```

Note that 9.3h sits closer to M (8h) than the plain average of O/M/P (10.7h) would.
That is what the weight of 4 does: it accommodates the pessimist's long tail
without letting it dominate the number.

Summing the PERT estimates of every part gives the delivery's total effort — but
that sum is not yet the deadline the client hears (see section 4).

## 3. Risk buffer: at project level, not per task

A buffer placed inside each individual task disappears, through two
well-documented effects:

- **Parkinson's law**: work expands to fill the time available. Slack inside a task
  is spent, not saved.
- **Student syndrome**: with a comfortable deadline, the start is postponed until
  the slack is already gone — so any real surprise blows the deadline anyway.

The alternative is not to buffer task by task: sum the lean estimates (each PERT
already carries some margin, but that is not the project buffer) and apply a single
aggregate buffer at the end, sized by the number of parts and the overall
uncertainty:

```
Total effort (sum of the PERTs)        = 42h
Project buffer (typically 20-35%,
  larger the more low-confidence or
  externally dependent parts there are) = 12h  (≈ 28%)
Final estimate for the client           = 54h
```

The project buffer absorbs the surprise that belonged to no specific task — which
is where surprises usually come from: the email that takes days to be answered,
the staging environment that goes down, the requirement that changes after it was
approved.

## 4. Common biases

- **Systematic optimism**: estimators remember the happy path and forget the
  friction of past projects. Counter it by asking, before fixing the number, "last
  time I did something like this, how long did it actually take?".
- **Ignoring everything that is not the "main" part**: code review, post-review
  fixes, deployment, writing the changelog or documentation, alignment calls with
  the client, handoff time to QA. All of it is real work, and it rarely appears in
  an estimate made by someone thinking only about "building the feature".
- **Anchoring on the number the client wants to hear**: if a deadline has already
  been mentioned, the estimate drifts to fit it. Estimate first, compare against
  the expectation afterwards — never the other way round.

## 5. An estimate is not a commitment

They are different things, and confusing them causes much of the friction with
clients:

| | Estimate | Commitment / deadline |
|---|---|---|
| Nature | Probabilistic — a range with a confidence | A business decision — a single date |
| Who decides | Whoever will do the work | Whoever answers for the project, weighing commercial margin, client priority, external dependencies |
| Changes with | New information about the work | Rarely, once communicated |

The commitment is built *on top of* the estimate — estimate plus project buffer
plus business margin — but it is not the same thing. Promising the optimistic
estimate as a deadline is taking the risk personally; promising the pessimistic one
is losing the client to a competitor. The communicated deadline comes from the
estimate plus the buffer, never from the optimistic number alone.

## Checklist

- [ ] The large delivery was broken into parts that can be estimated with confidence
- [ ] Each part has O/M/P, not a single number
- [ ] Each part uses PERT — (O + 4M + P) / 6 — not a plain average
- [ ] Invisible work (review, deploy, communication, documentation) is in the total
- [ ] The buffer is applied once, aggregated, at delivery level — not spread across tasks
- [ ] The deadline given to the client is estimate plus buffer, as an explicit decision — not the optimistic number
- [ ] Any part nobody could estimate became a spike rather than a guess

## Anti-patterns

- ❌ Estimating the whole delivery as one number, with no decomposition
- ❌ Estimating only the likely case, ignoring optimistic and pessimistic
- ❌ Buffering inside each task instead of once at the end
- ❌ Promising the client the optimistic estimate as if it were the deadline
- ❌ Forgetting review, deploy, acceptance and communication in the effort
- ❌ Anchoring the estimate on the deadline the client wanted to hear
- ❌ Treating the estimate and the commitment as the same decision
