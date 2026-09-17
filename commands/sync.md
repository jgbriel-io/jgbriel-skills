---
description: Syncs the current branch with its remote — fetch, pull rebase, final status. Touches no other branch.
allowed-tools: Bash(git fetch:*), Bash(git pull:*), Bash(git status:*), Bash(git branch:*), Bash(git rev-list:*), Bash(git rev-parse:*)
model: haiku
---

Sync the current branch with its remote:

1. `git branch --show-current` → keep the branch name.
2. `git fetch --all --prune`
3. Check for a configured upstream: `git rev-parse --abbrev-ref --symbolic-full-name @{u}` (silence the error).
4. If there is no upstream, stop: "No upstream configured. Set one with `git branch --set-upstream-to=origin/<branch>`."
5. Check for uncommitted changes: `git status --porcelain`. If there are any, stop: "Uncommitted local changes. Commit or stash them before pulling with rebase."
6. `git pull --rebase`
7. If the rebase stops on conflicts:
   - Stop immediately.
   - Show `git status` to the user.
   - Say: "The rebase stopped on conflicts. Resolve them, then `git rebase --continue` or `git rebase --abort`."
   - Do **not** resolve conflicts automatically.
8. If the rebase succeeded, show the final state:
   ```
   Branch: <name>
   Now at: <latest commit SHA + subject>
   Working tree: <clean | dirty>
   ```

No extra narration. If any step fails, stop and report it.
