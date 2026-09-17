---
description: Summarized diff against a ref (branch, sha, HEAD~N). Shows the files touched plus what kind of change each one is.
argument-hint: "[ref, default = main]"
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Read
---

Show a summarized diff between HEAD and $ARGUMENTS (default `main` or `master`).

## Steps

1. **Resolve the base:** if empty, detect `main` or `master`. If the branch does not exist, ask.

2. **Change stat:**
   ```
   git diff <base>...HEAD --stat
   ```

3. **Semantic categorization:** classify each file from `--name-status`:
   - 🆕 new file (`A`)
   - ✏️ modified (`M`)
   - 🗑️ deleted (`D`)
   - 📛 renamed (`R`)

4. **Commits included:**
   ```
   git log <base>..HEAD --oneline
   ```

5. **Possible conflicts:** list both sides and intersect them in your head — no temp files:
   ```
   git diff <base>...HEAD --name-only
   git diff HEAD...<base> --name-only
   ```
   A file in both lists is where the merge may conflict.

## Output

```
# Diff: HEAD vs <base>

## Commits ahead (<N>)
- <sha> <subject>
- ...

## Files (<N touched, +X / -Y lines>)
🆕 path/new.ts (+45)
✏️ path/changed.ts (+12 / -8)
🗑️ path/removed.ts (-30)

## Dominant categories
- <feat/fix/refactor/…>: <N files>

## Possible merge conflicts
- <file>  ← modified on both sides

## Suggested next step
<1 sentence: rebase? merge? keep working?>
```

Under 400 words. Focus on **what changed**, not on the raw diff.
