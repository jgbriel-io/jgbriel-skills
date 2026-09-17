---
name: incident-postmortem
description: Runs a blameless incident postmortem — timeline with timestamps, impact, root cause (5 whys), and corrective actions with an owner and deadline. Works for technical incidents (outage, production bug) or non-technical ones (process error, delivery delay, client miscommunication). Use when user asks about postmortem, post-incident review, RCA, root cause analysis, or wants help documenting a failure after it's been resolved.
---

# Incident Postmortem

A post-incident document exists to explain the system's chain of causes —
technical or procedural — not to find someone to blame. The same structure serves
an outage, a critical production bug, an operational mistake or a late delivery:
the incident changes, the structure does not.

Where the vault is available, the finished document goes under
`wiki/Projetos/<project>/`, or `wiki/Clientes/Diretos|Parceiros/<client>/` when
the incident belongs to a client project. During the incident itself the skill is
`rollback-runbook`; this one starts once it is resolved.

## Blameless, and why

The goal is a system more resistant to the next failure, not a person identified.
Two practical consequences:

- The document describes **actions and decisions in the context where they were
  made**, never a person's character or competence. "I forgot to validate the
  input" becomes "the deploy flow had no input-validation step before merge".
- A postmortem that turns into self-punishment teaches you to hide the next
  mistake, or to soften what actually happened — and then the next similar
  incident is not prevented, because the previous one was never told straight.
- Names appear only under "who was notified" and "owner of the corrective action",
  never under "who caused it". This holds even on a solo project: document it as a
  process, not as personal fault.

## When a formal postmortem is warranted

Not every small incident needs a document. By severity:

| Severity | Criterion | Formal postmortem? |
|---|---|---|
| Critical | Clients affected, data lost, SLA breached, operations halted | Yes, mandatory |
| High | Visible degradation, worked around with no confirmed external impact | Yes, short version |
| Medium | Caught and fixed internally before anyone was affected | A quick note, no formal document |
| Low | One-off, obvious cause, already fixed | No — note it and move on |

Rule of thumb: if "could this happen the same way again?" has no obvious answer,
write the postmortem, even when this time the impact was small.

## Document structure

### 1. Timeline

Each relevant event with a timestamp in a fixed timezone — the client's local
time, say — in chronological order: when the problem actually began (not always
when it was noticed), when it was detected, who was paged, each mitigation taken,
when it was resolved.

### 2. Impact

Who was affected, for how long, and measured how: users affected, transactions
lost, hours of SLA breached, financial value where it applies. Without a number —
even an estimated one — impact is opinion.

### 3. Root cause

Separate the **immediate cause** from the **systemic root cause**:

- Immediate cause: what broke, technically or operationally. "The deploy shipped
  without the migration", "the proposal went out with the wrong figure".
- Root cause: why the system let that break without being caught first. Almost
  always "there was no test, alert, review or checklist for this" — not "I made a
  mistake".

Five whys to get there:

```
Why 1: Why did the client receive a proposal with the wrong figure?
→ Because the pricing spreadsheet had an out-of-date formula.

Why 2: Why was the out-of-date formula not caught before sending?
→ Because nothing requires a second pair of eyes before an external send.

Why 3: Why is there no such review?
→ Because the process assumes whoever builds the proposal also checks it.

Why 4: Why was that assumption never questioned?
→ Because it had never visibly gone wrong before.

Why 5 (root cause): Why is there no structural second checkpoint, given that a
pricing error is expensive and hard to notice alone?
→ There is no formal cross-review step before any external send involving money.
```

Stop when the next "why" lands outside your control — an external business
decision, say. That is the root cause rather than another symptom.

### 4. What went well

Every incident response has something that worked: fast detection, a runbook that
was followed, clear communication with the client. Recording it reinforces the
right behaviour and stops the postmortem reading as a list of failures.

### 5. Corrective actions

Each action needs an **owner** — a person, not a team — and a **deadline**, a date
rather than "soon". An action with no owner does not happen; an action with no date
becomes permanent backlog.

| Action | Owner | Due | Status |
|---|---|---|---|
| | | | |

## Template

```markdown
# Postmortem — <short incident title>

**Severity:** <critical/high/medium> · **Status:** <ongoing/resolved>
**Date:** <date> · **Duration:** <hh:mm start → hh:mm end>

## Summary
<2-3 sentences: what happened, the impact, whether it is resolved.>

## Impact
- Who was affected: <clients/users/just me>
- How long: <duration>
- Measured by: <number — users, transactions, value, SLA>

## Timeline
| Time | Event |
|---|---|
| hh:mm | Real start of the problem, if known |
| hh:mm | Detection |
| hh:mm | Mitigation taken |
| hh:mm | Considered resolved |

## Root cause

**Immediate cause:** <what broke>

**Five whys:**
1. ...
2. ...
3. ...
4. ...
5. (root cause) ...

## What went well
- <item>

## Corrective actions
| Action | Owner | Due | Status |
|---|---|---|---|
| | | | |

## Lessons
<1-2 sentences: what changes in the process or the system from now on.>
```

## Checklist

- [ ] Severity assessed before deciding whether to write a formal postmortem
- [ ] Timeline built from real timestamps, not reconstructed from memory
- [ ] Impact quantified — a number, not "some clients were affected"
- [ ] Immediate cause and systemic root cause recorded separately
- [ ] Five whys followed until it reaches something structural, not "I made a mistake"
- [ ] At least one entry under "what went well"
- [ ] Every corrective action has a single owner and a dated deadline
- [ ] The document re-read cold, to check it stayed factual and free of blame
- [ ] Shared with whoever was affected where applicable — an external client is entitled to know what happened and what changes

## Anti-patterns

- ❌ A root cause that ends at "human error" without asking why the system allowed it undetected
- ❌ A corrective action with no owner ("review the process later")
- ❌ A corrective action with no date ("soon", "as soon as possible")
- ❌ Formal postmortems for every medium and low incident, until it is bureaucracy nobody reads
- ❌ A timeline reconstructed days later without checking logs or messages
- ❌ A document written only to be filed, with nobody chasing the corrective actions
- ❌ Applying the format only to technical incidents and improvising when the failure is operational — a wrong proposal, a late delivery, a miscommunication with a client. The structure is the same
