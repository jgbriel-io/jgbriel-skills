---
inclusion: manual
description: Break a plan or PRD into independently-grabbable issues using tracer-bullet vertical slices
---

# To Issues

Break a plan into independently-grabbable issues using vertical slices (tracer bullets).

## Process

### 1. Gather context
Work from conversation context. If user passes an issue reference, fetch it from the tracker.

### 2. Explore codebase (if needed)
Use project's domain glossary for issue titles and descriptions. Respect ADRs.

### 3. Draft vertical slices

Each issue is a thin vertical slice that cuts through ALL integration layers end-to-end. NOT a horizontal slice of one layer.

Rules:
- Each slice delivers a narrow but complete path (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
- HITL = requires human interaction; AFK = can be implemented without human

### 4. Quiz the user

Present breakdown as numbered list. For each slice show: title, type (HITL/AFK), blocked by, user stories covered.

Ask: granularity ok? dependencies correct? any slices to merge or split?

### 5. Publish issues

For each approved slice, publish to issue tracker in dependency order (blockers first).

## Issue template

```markdown
## Parent
Reference to parent issue (omit if none).

## What to build
Concise description of this vertical slice — end-to-end behavior, not layer-by-layer.
Avoid file paths/code snippets (go stale). Exception: prototype snippets encoding a decision.

## Acceptance criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Blocked by
Reference to blocking ticket, or "None - can start immediately"
```
