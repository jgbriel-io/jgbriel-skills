---
description: Quick WIP commit to save progress. No message ritual, just an optional free-form description.
argument-hint: "[short optional description]"
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*)
model: haiku
---

Quick WIP commit to save progress.

## Steps

1. `git status --short` → show what will be committed.
2. If nothing is modified, stop: "Nothing to commit."
3. If an argument was given, use it as the description. Otherwise generate a short summary of the diff (1 sentence, max 40 chars).
4. Final message: `WIP: <description>`.
5. Stage everything: `git add -A`.
6. **Show the user before committing:**
   ```
   WIP commit:
   Message: WIP: <description>
   Files: <list>

   Confirm? (answer "yes" or edit the message)
   ```
7. Commit after confirmation.

## Warnings

- Do not use `--no-verify`, not even for a WIP. If a hook fails, tell the user; do **not** skip it.
- WIP commits are squashed before a PR. Remind the user at the end:
  ```
  Committed. Remember to squash before opening the PR (`git rebase -i`).
  ```

## When NOT to use

- The change is final and ready for review → use `/commit` (Conventional message).
- A single file with a small change → plain `git commit`.
