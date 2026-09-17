---
description: Writes a Conventional Commits message from the staged diff. Shows it before committing. Never commits without confirmation.
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git commit:*)
---

Write a Conventional Commits message for the staged diff.

## Steps

1. Run `git diff --staged` to see what will be committed.
2. If it is empty, stop: "Nothing staged. Run `git add` first."
3. Analyze the changes:
   - Dominant type: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `style`, `build`, `ci`.
   - Scope: the dominant module or folder (`auth`, `db`, `ui`, …).
   - Subject: imperative, ≤50 chars, no final period.
   - Body: ONLY when the "why" is not obvious from the diff. Wrap at 72.
4. Run `git log -5 --oneline` to match the style of the recent messages (case, scope conventions).
5. **Show the proposed message** to the user:

```
Proposed:
<type>(<scope>): <subject>

<optional body>

Confirm to commit.
```

6. **Wait for explicit confirmation** before running `git commit`. Never commit proactively.

7. Once confirmed, commit through a HEREDOC so the formatting survives:

```bash
git commit -m "$(cat <<'MSG'
<type>(<scope>): <subject>

<body>
MSG
)"
```

## Anti-patterns

- "Update files" / "Various changes" — no information.
- Past tense ("Added X") — use the imperative ("add X").
- A subject ending in a period.
- A body restating the diff in prose.
- Automatic co-author tags, unless the user asks for them.

## If hooks fail

Investigate the cause. Do **not** suggest `--no-verify`. Fix the problem and make a **new commit**, not an amend.
