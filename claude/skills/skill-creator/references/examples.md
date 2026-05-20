# Skill examples — annotated

Three real-shape examples covering different patterns: pure prose, bundled
script, and domain split.

---

## Example 1 — Pure prose (no bundles)

`commit-message-writer/SKILL.md`

```yaml
---
name: commit-message-writer
description: Generate Conventional Commits messages from staged or unstaged diffs. Use when the user asks "write a commit", "commit message", "what's a good commit msg for this", or runs git status/diff and then asks for help committing. Don't trigger on PR descriptions or release notes — those are different.
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*)
---

# Commit Message Writer

Generate a Conventional Commits message from the current diff.

## Steps

1. Run `git diff --staged`. If empty, fall back to `git diff` and warn the
   user nothing is staged.
2. Identify the dominant change type: feat / fix / refactor / docs / chore /
   test / perf / style / build / ci.
3. Identify a scope if one obvious package/module dominates the diff.
4. Write subject ≤50 chars. Imperative, no trailing period.
5. Add body only when the *why* isn't obvious from the diff. Wrap at 72.

## Format

```
<type>(<scope>): <subject>

<body, optional>
```

## Examples

Diff: added a JWT verification function in `auth/middleware.ts`
→ `feat(auth): add JWT verification middleware`

Diff: bumped React 18.2 → 18.3, no other changes
→ `chore(deps): bump react to 18.3`

Diff: rewrote pagination cursor logic to fix off-by-one
→ `fix(pagination): correct cursor off-by-one at page boundary`

## Anti-patterns

- "Update files" / "Various changes" — meaningless.
- Past tense ("Added X") — use imperative ("add X").
- Subject + period.
- Body restating the diff in prose.
```

**Why this works:**
- Description names triggers explicitly + adds a negative ("don't trigger on PR descriptions").
- Body explains *steps* + *format* + *examples* + *anti-patterns* — covers what to do, what shape, and what to avoid.
- `allowed-tools` is restrictive: only read-only git commands.

---

## Example 2 — Bundled script

`cleanup-downloads/`

```
cleanup-downloads/
├── SKILL.md
└── scripts/
    └── organize.ps1
```

`SKILL.md`:

```yaml
---
name: cleanup-downloads
description: Sort the user's Downloads folder by file extension into category subfolders (PDFs to Documents/PDFs, images to Pictures, videos to Videos, archives to Archives). Use when the user says "organize downloads", "clean up downloads", "my downloads folder is a mess", or asks where a recently-downloaded file went.
allowed-tools: Bash(powershell:*), Read, Write
---

# Cleanup Downloads

Move files from `~/Downloads` into category folders, by extension.

Run `scripts/organize.ps1`. It handles the moves and prints a summary.

## What the script does

- Maps extensions → target folder:
  - `.pdf .doc .docx .xlsx` → `~/Documents`
  - `.jpg .jpeg .png .gif .webp` → `~/Pictures`
  - `.mp4 .mkv .mov .avi` → `~/Videos`
  - `.zip .7z .rar .tar .gz` → `~/Archives`
  - everything else → stays in Downloads
- Skips files modified in the last 24h (probably still in use).
- Refuses to overwrite — if target exists, appends `(2)`, `(3)`, etc.

## When NOT to use

- User wants to *delete* files, not organize them.
- User wants to organize a different folder (parameterize the script first).
```

**Why this works:**
- The skill body is *short* because the logic lives in the script.
- Description tells Claude exactly when to fire including lazy phrasings.
- "When NOT to use" prevents adjacent misfires.

---

## Example 3 — Domain split

`cloud-deploy/`

```
cloud-deploy/
├── SKILL.md
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```

`SKILL.md`:

```yaml
---
name: cloud-deploy
description: Deploy an app to AWS, GCP, or Azure following the team's standard runbook. Use when the user says "deploy", "ship it", "push to prod", "stage this", or asks how to deploy a specific service. Pick the right cloud based on context — the user's project, recent commands, or explicit mention.
allowed-tools: Bash, Read
---

# Cloud Deploy

Pick the right cloud, then follow its runbook.

1. Determine cloud:
   - User mentions AWS, GCP, Azure explicitly → use that.
   - Project has `terraform/aws/`, `cdk.json`, etc. → infer.
   - If still ambiguous, ask: "AWS, GCP, or Azure?"
2. Read the matching reference file:
   - AWS → `references/aws.md`
   - GCP → `references/gcp.md`
   - Azure → `references/azure.md`
3. Follow the runbook in that file.

Do NOT read all three. They're long; only the relevant one belongs in
context.
```

**Why this works:**
- SKILL.md is the router. Each reference file is the full runbook for one cloud.
- Progressive disclosure: 3KB stays in context up front, the 15KB runbook only loads when needed.
- Explicit "do NOT read all three" because Claude tends to be greedy with Read.

---

## Patterns to steal

1. **Trigger negatives.** Mention 1–2 cases where the skill should *not* fire.
   Helps Claude calibrate.
2. **Lazy phrasings in description.** Real users don't say "extract structured
   data" — they say "pull the numbers out". Include both.
3. **Anti-patterns section.** What the output should NOT look like. Often
   more useful than positive examples.
4. **Refer to scripts/templates by relative path.** Always works regardless
   of where the skill is installed.
