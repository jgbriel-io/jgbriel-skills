---
name: resolving-merge-conflicts
description: Resolves the conflicts of a merge or rebase already in progress — reads the original intent of each side before choosing, preserves both where possible, runs the project checks and closes the merge. Use when the user says "resolve os conflitos", "deu conflito no merge", "conflito no rebase", or when a git command stops in a conflicted state. Never aborts the merge on its own.
---

1. **See the current state** of the merge/rebase. Check git history, and the conflicting files.

2. **Find the primary sources** for each conflict. Understand deeply why each change was made, and what the original intent was. Read the commit messages, check the PRs, check original issues/tickets.

3. **Resolve each hunk.** Preserve both intents where possible. Where incompatible, pick the one matching the merge's stated goal and note the trade-off. Do **not** invent new behaviour. Always resolve; never `--abort`.

4. Discover the project's **automated checks** and run them — typically typecheck, then tests, then format. Fix anything the merge broke.

5. **Finish the merge/rebase.** Stage everything and commit. If rebasing, continue the rebase process until all commits are rebased.
