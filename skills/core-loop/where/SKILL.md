---
name: where
description: Locates where a symbol, function, class or string is defined and used. Delegates to the researcher agent.
disable-model-invocation: true
argument-hint: "<symbol or string>"
allowed-tools: Task, Read, Grep, Glob
---

The arguments are whatever the user typed after the skill name; this text calls them `<arguments>`.

Call the `researcher` agent to locate: <arguments>

## Briefing for the agent

```
Locate: <arguments>

Report:
1. Where it is defined (main declaration): path:line + kind (function, class, const, type, interface).
2. Where it is used (call sites, imports, references): path:line list grouped by file.
3. Related tests, if a `*.test.*` or `*.spec.*` file covers it: path:line.

Output as a table or a compact bullet list.
Under 400 words.
If not found, list the patterns and paths that were searched.
```

## Output

Pass the agent's result back to the user verbatim.
