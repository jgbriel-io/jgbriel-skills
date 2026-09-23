---
description: Quick snapshot of repo state — branch, ahead/behind, staged, unstaged, untracked, last commit.
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git log:*), Bash(git diff:*), Bash(git rev-list:*)
---

Show a snapshot of the current repo state, in this format:

```
Branch: <name> (ahead N, behind M)
Last commit: <short sha> <message>

Staged:
  <file> (<+lines/-lines>)

Unstaged:
  <file> (<+lines/-lines>)

Untracked:
  <file>
```

Commands to use:
- `git branch --show-current`
- `git rev-list --left-right --count HEAD...@{u}` for ahead/behind (silence the error if there's no upstream)
- `git log -1 --oneline`
- `git diff --stat --cached` for staged
- `git diff --stat` for unstaged
- `git ls-files --others --exclude-standard` for untracked

If not in a git repo, say "Not a git repository." and stop.

If nothing changed, say "Working tree clean." under the branch line.

Keep output short. No commentary, no suggestions, just the snapshot.
