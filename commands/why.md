---
description: Historical context for a line or range — git blame + log + the last commit that touched it. Use to recover the original intent.
argument-hint: "<file>:<line>  or  <file> <start-line>-<end-line>"
allowed-tools: Bash(git blame:*), Bash(git log:*), Bash(git show:*), Read
---

Investigate the history of the range given in $ARGUMENTS.

## Parsing the argument

- Form 1: `path:line` (single line).
- Form 2: `path start-end` or `path start:end`.
- Form 3: `path` alone → the last commit that touched the whole file.

If it is ambiguous, ask for the right form.

## Investigation

1. **`git blame -L start,end <path>`** — who wrote each line, in which commit.
2. For the most recent commit found in the blame:
   - `git log --oneline -1 <sha>` — the message.
   - `git show <sha> --stat` — the scope of the change.
   - `git show <sha> -- <path>` — the diff for this file only.
3. **File history:** `git log --oneline -5 -- <path>` — the last 5 changes.
4. **External references:** if a commit in that history mentions an issue or PR (`#123`), note it.

## Output

```markdown
## Context: <path>:<line>

### Range
```
<contents of the target lines (read the file)>
```

### Last change to this range
- Commit: `<short sha>` by <author> on <date>
- Message: <commit subject>
- Context: <commit body, or "(no body)">

### Diff of that change
<git show output, focused on the range>

### Recent file history
- `<sha>` — <subject>
- `<sha>` — <subject>
- ...

### External references
- Issues/PRs mentioned: #N, #M (if any)
```

Under 500 words. Focus on **intent** (why it changed), not only on what changed.
