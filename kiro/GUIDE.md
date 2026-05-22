# Kiro IDE — Quick Guide

## Setup

### 1. Copy to home

```powershell
robocopy jgbriel-skills\kiro $env:USERPROFILE\.kiro /E
```

### 2. Set MCP secrets

`.mcp.json` uses env var placeholders. Set before using MCP:

```powershell
[System.Environment]::SetEnvironmentVariable('GITHUB_PERSONAL_ACCESS_TOKEN', 'ghp_xxx', 'User')
[System.Environment]::SetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'sbp_xxx', 'User')
```

Restart terminal/IDE after setting.

### 3. Verify steering loaded

1. Open project in Kiro
2. Status bar (bottom) shows loaded guides
3. If missing, check `~/.kiro/steering/*.md` exists

---

## Steering files

18 steering files in `steering/`. Most load automatically; `g-*` with `manual` or `fileMatch`
inclusion load on demand or when matching files are open.

| File | What it does |
|------|-------------|
| `language.md` | PT-BR conversation, English code |
| `git.md` | Commit rules, destructive op confirmations |
| `security.md` | Safe defaults, no exposed secrets |
| `code-editing.md` | Edit rules, no dead code |
| `response-style.md` | Concise responses |
| `system.md` | Windows/PowerShell, no global installs |
| `caveman.md` | Caveman mode (terse responses) |
| `docs-style.md` | Doc structure, ADRs, JSDoc |
| `frontend.md` | UI/browser testing rules |
| `g-react-best-practices.md` | React performance (loads with `.tsx` files) |
| `g-senior-backend.md` | TanStack Query, Supabase (loads with hooks/migrations) |
| `g-senior-frontend.md` | React components, Tailwind, a11y (loads with `.tsx`) |
| `g-supabase-postgres-best-practices.md` | Postgres/Supabase patterns (loads with SQL/migrations) |
| `g-code-reviewer.md` | Code review checklist (manual) |
| `g-frontend-design.md` | Frontend design patterns (manual) |
| `g-seo-optimizer.md` | SEO guide (manual) |
| `g-steering-guide.md` | How to create steering files (manual) |

---

## Skills

2 skills in `skills/`:

| Skill | What it does |
|-------|-------------|
| `caveman` | Response compression mode |
| `find-skills` | Lists available skills |

---

## Powers

`powers/installed/supabase-hosted` — MCP + steering for Supabase projects.
Activates Supabase tools and injects database workflow guidance.

---

## Adding project-specific steering

Create `<project>/.kiro/steering/p-name.md`:

```yaml
---
inclusion: always
description: Project-specific rules for <project>
---

# Rules
...
```

Use `p-` prefix for project scope. `g-` prefix is reserved for global/generic rules.

---

## Troubleshooting

**Steering files not loading:**
```
Check: ~/.kiro/steering/*.md exists
Ctrl+Shift+P → Reload Window
```

**MCP server not connecting:**
```
1. Confirm env var: $env:GITHUB_PERSONAL_ACCESS_TOKEN
2. Check settings/mcp.json server config
3. Restart Kiro
```

**After editing a steering file:**
```
Ctrl+Shift+P → Reload Window
```

---

_Updated: 2026-05-21_
