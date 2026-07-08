---
name: kebab-case-name
description: What the agent does + when the main thread should delegate to it. Include "Use when..." triggers and a "Use proactively when..." clause if it should fire without being asked. State what it returns and what it never does ("read-only, never edits"). This description is loaded every session — prune hard.
tools: Read, Grep, Glob, Bash        # minimum set; omit for all tools
# model: haiku                       # optional — downshift mechanical agents
---

# Agent Title

One line: the agent's job and its contract with the main thread.

## Behavior

- What it does, in order or by priority.
- Output contract: exact shape the main thread can rely on
  (e.g. "path:line table, sorted, or `No match.`").
- What it refuses (scope guard — keeps the agent predictable).

## Output format

```
<literal example of the return shape>
```

Subagent output returns to the main thread as a tool result — it is data for
Claude, not prose for the user. Keep it compact and parseable.
