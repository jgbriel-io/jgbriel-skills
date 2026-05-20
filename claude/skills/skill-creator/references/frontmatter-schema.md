# SKILL.md frontmatter — full schema

YAML frontmatter at top of `SKILL.md`. Fields:

## Required

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | kebab-case. Must match folder name. |
| `description` | string | One sentence + trigger phrases. Primary triggering signal. Be pushy to avoid undertrigger. |

## Optional

| Field | Type | Notes |
|-------|------|-------|
| `allowed-tools` | string \| list | Restrict tools the skill can call. Comma list or YAML list. Example: `Read, Write, Edit, Bash(git:*)` |
| `disable-model-invocation` | bool | If `true`, only fires when user types `/skill-name`. Default `false` (Claude can auto-invoke). |
| `compatibility` | string | Free-form note about required deps/environment. |

## Fields seen in the wild but NOT in the official schema

These appear in some community templates but are ignored by Claude Code:

- `user-invocable` — already implicit; all skills are invocable via `/name`.
- `agent` — skills don't bind to agents at the frontmatter level.
- `context: fork` / `context: default` — not a valid key.
- `version` — not consumed; use git/changelog instead.

Don't include these. They won't break anything but they're cargo-cult.

## Example — minimal

```yaml
---
name: cleanup-downloads
description: Organize the user's Downloads folder by file type (PDFs to Documents, images to Pictures, videos to Videos, archives to Archives). Use when the user says "clean up downloads", "organize my downloads", "sort my downloads folder", or mentions a messy downloads folder.
---
```

## Example — with tool restrictions

```yaml
---
name: code-review
description: Review the current git diff or a specified PR for bugs, security issues, performance, and style. Use whenever the user asks for a review, says "look over this", asks "is this right?", or pastes a diff.
allowed-tools: Read, Grep, Bash(git diff:*), Bash(git log:*), Bash(gh pr view:*)
---
```

## Description anti-examples → fixed

| Bad | Why it's bad | Fixed |
|-----|--------------|-------|
| `Helps organize files.` | Vague. No triggers. | `Sort files in a directory into subfolders by extension. Use when the user asks to organize, clean up, or categorize a folder of mixed files.` |
| `MUST USE THIS SKILL FOR ALL FILE OPERATIONS.` | Spammy + overbroad. | `Bulk rename or move files matching a glob pattern. Use for batch renames, mass moves, or applying a naming scheme to many files at once.` |
| `Skill for skills.` | Tautology. | `Create new Claude Code skills from scratch. Use when the user wants to build, scaffold, or improve a skill.` |
