# Decision Format

Decisions live in `docs/decisions/` as `NNNN-slug.md`, four digits, numbered contiguously from `0001`, with one row each in `docs/decisions/README.md`.

Create `docs/decisions/` lazily — only when the first decision is needed.

## Template

```md
---
type: decision
status: accepted
number: 12
date: 2026-09-27
superseded_by:
---
# 0012 {Short title of the decision}

## Context
## Decision
## Consequences
## Rejected alternatives
```

Each section can be a single sentence. The value is in recording *that* a decision was made and *why* — not in filling out sections.

- `status`: `proposed`, `accepted`, `rejected` or `superseded`.
- Add the index row (`| 0012 | 2026-09-27 | [Title](0012-slug.md) | accepted |`) in the same commit.
- A decision is recorded only when every doc it contradicts is updated in that commit too.
- **Superseded, never rewritten.** The old file gets `status: superseded` and `superseded_by: <new number>`; its index row changes status.

## Numbering

Scan `docs/decisions/` for the highest existing number and increment by one. A gap or a missing index row fails the repo's docs check.

## When to record a decision

All three of these must be true:

1. **Hard to reverse** — the cost of changing your mind later is meaningful
2. **Surprising without context** — a future reader will look at the code and wonder "why on earth did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons

If a decision is easy to reverse, skip it — you'll just reverse it. If it's not surprising, nobody will wonder why. If there was no real alternative, there's nothing to record beyond "we did the obvious thing."

### What qualifies

- **Architectural shape.** "We're using a monorepo." "The write model is event-sourced, the read model is projected into Postgres."
- **Integration patterns between contexts.** "Ordering and Billing communicate via domain events, not synchronous HTTP."
- **Technology choices that carry lock-in.** Database, message bus, auth provider, deployment target. Not every library — just the ones that would take a quarter to swap out.
- **Boundary and scope decisions.** "Customer data is owned by the Customer context; other contexts reference it by ID only." The explicit no-s are as valuable as the yes-s.
- **Deliberate deviations from the obvious path.** "We're using manual SQL instead of an ORM because X." Anything where a reasonable reader would assume the opposite. These stop the next engineer from "fixing" something that was deliberate.
- **Constraints not visible in the code.** "We can't use AWS because of compliance requirements." "Response times must be under 200ms because of the partner API contract."
- **Rejected alternatives when the rejection is non-obvious.** If you considered GraphQL and picked REST for subtle reasons, record it — otherwise someone will suggest GraphQL again in six months.
