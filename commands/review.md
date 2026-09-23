---
description: Code review of the current diff via the reviewer agent. Severity-tagged findings, no fluff.
argument-hint: "[base-ref or path, optional, default = uncommitted changes]"
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(gh pr:*), Read, Grep, Task
---

Invoke the `reviewer` agent to review the code. Resolve the target from the argument:

## Target resolution

- **No argument** → review uncommitted diff (`git diff` + `git diff --staged`).
- **`main`, `develop`, branch name** → `git diff <branch>...HEAD`.
- **SHA** → `git diff <sha>...HEAD`.
- **`PR <N>`** or **`#<N>`** → `gh pr diff <N>`.
- **`HEAD~N`** → `git diff HEAD~N...HEAD`.
- **Path** (file/directory) → review that path's contents.

## Briefing for the agent

Delegate to the `reviewer` agent via the Task tool with this prompt:

```
Review: <target description>
Diff:
<diff content>

Apply your standard heuristic (severity-tagged, one finding per line,
no praise, no formatting nits). Report only real problems.
```

If the touched area has tests (`Grep -r` for adjacent `*.test.*` or `*.spec.*` files), include that in the agent's briefing so it can check coverage.

## Output

Relay the agent's report to the user **verbatim**. Don't interpret, soften, or add commentary. If the agent returned "No issues found.", relay exactly that.
