---
name: map
description: Map of a directory — one line per file with its detected responsibility. Delegates to the researcher agent.
disable-model-invocation: true
argument-hint: "<directory, default = src/>"
allowed-tools: Task, Read, Grep, Glob
---

The arguments are whatever the user typed after the skill name; this text calls them `<arguments>`.

Call the `researcher` agent to map the directory: <arguments>

If empty, default to `src/`. If it does not exist, ask for the right path.

## Briefing for the agent

```
Map the directory: <arguments>

For each file (and subdirectory), produce one line with:
- Path relative to the target directory.
- Kind (source, test, config, doc).
- Main responsibility in ≤10 words.

Recurse 2 levels into deep subdirectories. Summarize the rest as "(...) + N files".

Output:
### <dir>/
- `file.ts` — short description
- `sub/`
  - `other.ts` — description
  - (...) + 3 files

Under 400 words. No extra prose.
```

## Output

Pass the map back to the user verbatim.
