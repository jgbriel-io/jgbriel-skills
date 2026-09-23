---
description: Breaks a task into independent vertical slices — each slice demoable end-to-end. Focused on incremental delivery, not layers.
argument-hint: "<task description>"
allowed-tools: Read, Grep, Glob, Task
---

Break the task into vertical slices (tracer-bullet style). Each slice must:

- **Cut across every layer** (schema, API, UI, tests) end-to-end.
- **Be demoable on its own** — the user can see something working.
- **Not depend on future slices** to deliver value.
- **Fit in ≤1 day of work**, ideally.

## Briefing for the planner agent (delegate via Task)

```
Break into vertical slices: $ARGUMENTS

Different from a sequential plan:
- NOT "schema → api → ui → tests" (horizontal).
- IS "smallest possible end-to-end scenario → next scenario".

Expected output:
### Slice 1: <short name, describes the user-facing scenario>
- What it delivers: <visible feature>
- Layers touched: <files>
- How to verify: <end-to-end demonstration>
- Size: <S | M | L>

### Slice 2: ...

(...)

### Out of scope for this breakdown
- ...
```

## Output

Relay the planner's breakdown to the user. Add at the end:

> Want me to run `/plan <slice X>` to detail the implementation of a specific slice?

Don't execute anything.
