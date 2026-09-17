---
description: Undoes the last commit with a soft reset — keeps the changes staged, removes only the commit. Shows what is about to be undone first.
allowed-tools: Bash(git log:*), Bash(git reset:*), Bash(git status:*)
model: haiku
---

Undo the last commit with a soft reset, keeping the changes staged.

## Steps

1. **Show what will be undone:**
   ```
   git log -1 --stat
   ```
   Show it to the user. If there are no commits, stop and say so.

2. **Check whether the commit was already pushed:**
   ```
   git status --short --branch
   ```
   - `[ahead N]` → local only, safe to undo.
   - No upstream at all (no `[ahead]`/`[behind]` marker and no tracking branch) → local only, safe to undo.
   - Tracking branch in sync, or `[behind ...]` → **warn**:
   ```
   ⚠️ This commit is already on the remote (or the branch is in sync).
   Undoing it locally creates a divergence. You will need a force-push afterwards.
   Continue?
   ```
   **Wait for explicit confirmation** before going on.

3. **Once confirmed**, or when the commit is local only:
   ```
   git reset --soft HEAD~1
   ```

4. **Show the result:**
   ```
   git status
   ```

5. **Closing reminder:**
   - The undone commit's changes are now **staged**.
   - `git restore --staged <file>` takes a file out of staging.
   - `git commit` redoes it with a new message.

## Limits

- Do **not** reach for `--hard` — it loses changes. If the user wants a hard reset, ask for one extra explicit confirmation and say "this discards every change in the commit, with no way back".
- Do **not** undo several commits without a specific request. If asked for more, ask: "How many commits to undo? (default 1)".
