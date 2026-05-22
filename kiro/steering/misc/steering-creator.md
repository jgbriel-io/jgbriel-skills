---
inclusion: manual
description: "Create new Kiro steering files from scratch and iteratively improve existing ones. Use when the user wants to build a steering file, turn a recurring workflow into reusable steering, or fix a steering file that isn't loading correctly."
---

# Steering Creator

Builds and refines Kiro steering files. Goal: capture intent, write a draft, verify it loads, ship.

## Steering file anatomy

```
~/.kiro/steering/<subfolder>/<name>.md
```

Subfolders: `global/`, `tech/`, `engineering/`, `productivity/`, `personal/`, `tcc/`, `misc/`

### Frontmatter

```yaml
---
inclusion: always | fileMatch | manual
fileMatchPattern: "**/*.ts"   # only for fileMatch
description: "One line describing what this steering does."
---
```

**inclusion types:**
- `always` — injected in every conversation
- `fileMatch` — injected when a matching file is open/edited
- `manual` — only loaded on demand (@ mention or explicit trigger)

Use `manual` for workflows, `fileMatch` for tech-specific rules, `always` for core behavior.

## When to use each subfolder

| Subfolder | What goes here |
|---|---|
| `global/` | Core behavior rules (language, tone, git, security) |
| `tech/` | Tech-specific expertise (React, Supabase, SEO) — usually `fileMatch` |
| `engineering/` | Workflow guides (diagnose, TDD, planning) — usually `manual` |
| `productivity/` | Meta workflows (handoff, grill-me) — usually `manual` |
| `personal/` | Personal tools (Obsidian, article editing) — `manual` |
| `tcc/` | TCC-specific workflows — `manual` |
| `misc/` | Doesn't fit elsewhere |

## Process

### 1. Capture intent

Before writing, clarify:
- What should this steering tell Kiro to do?
- When should it be active? (always / fileMatch / manual)
- What's the output when it activates?

### 2. Draft the steering file

Keep body under ~300 lines. Use imperative voice. Explain *why* rules matter — Kiro reasons better with context than with ALL-CAPS MUSTs.

### 3. Verify it loads

Check `~/.kiro/steering/` matches the file path. Kiro loads subdirectories recursively.

For `fileMatch`: test by opening a file matching the pattern.

For `manual`: trigger via `@steering-name` in a Kiro conversation.

### 4. Iterate

If steering isn't firing: check frontmatter syntax, verify path is inside `~/.kiro/steering/`.

If steering fires too broadly: switch `always` → `fileMatch` or `fileMatch` → `manual`.

## Description field

Concise. Describes what the steering provides when active. Used for `@` autocomplete in Kiro.

Bad: `Helps with code.`  
Good: `React best practices — component structure, hooks, Tailwind, a11y. Active for .tsx files.`

## Anti-patterns

- Duplicating content already in `global/` steering files
- `always` inclusion for something that only matters for one file type
- Body longer than ~300 lines — split into separate files
- No description field (breaks `@` autocomplete)
