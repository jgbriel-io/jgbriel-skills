---
description: Creates a new branch from an up-to-date main/master and switches to it. Detects the base branch automatically.
argument-hint: "<branch-name>"
allowed-tools: Bash(git branch:*), Bash(git checkout:*), Bash(git switch:*), Bash(git fetch:*), Bash(git pull:*), Bash(git status:*), Bash(git remote:*)
model: haiku
---

Create branch `$ARGUMENTS` from the repo's base branch (main or master), updated first.

## Steps

1. **Validate the name:**
   - If `$ARGUMENTS` is empty, ask for the name.
   - If it contains spaces, replace them with hyphens and say so: "Renamed to `<name-with-hyphens>`."
   - No dangerous characters (`..`, `~`, `^`, `:`, `\`; spaces already handled).

2. **Check for uncommitted changes:**
   ```
   git status --porcelain
   ```
   If there are any, stop: "Local changes present. Commit, stash or discard them before creating a branch."

3. **Detect the base branch:**
   ```
   git remote show origin | grep "HEAD branch"
   ```
   Fallback: try `main`, then `master`. If neither exists, ask the user.

4. **Update the base:**
   ```
   git fetch origin <base>
   git switch <base>
   git pull --ff-only
   ```

5. **Create the branch and switch:**
   ```
   git switch -c $ARGUMENTS
   ```

6. **Confirm:**
   ```
   Branch '$ARGUMENTS' created from '<base>' (sha <short>).
   Working tree clean.
   ```

If any step fails, stop and report it.
