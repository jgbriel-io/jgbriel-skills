# Claude Code — Cheat Sheet

For looking things up mid-session. Only what is **not** generated elsewhere: the
third-party plugin commands and the map of configuration files.

This repo's skills, commands and agents are in the generated table in
[STRUCTURE.md](STRUCTURE.md) — not repeated here, because a hand-copied list is a
list that lies later.

---

## Third-party plugins

### caveman — compressed answer mode

| Command | Effect |
|---|---|
| `/caveman lite` | Light fragments, no articles |
| `/caveman full` | Standard compression |
| `/caveman ultra` | Maximum compression |
| `stop caveman` | Back to normal |

Code, commits, PRs and security warnings come out in normal prose even with the
mode active.

### ponytail — the laziest solution that works

| Command | Effect |
|---|---|
| `/ponytail lite\|full\|ultra` | YAGNI intensity |
| `/ponytail-review` | Review hunting over-engineering only |
| `/ponytail-audit` | The same sweep across the whole repo |
| `/ponytail-debt` | Collects the `ponytail:` comments into a ledger |

### context-mode — processes output outside the conversation

| Command | Effect |
|---|---|
| `/ctx-stats` | Tokens saved in the session |
| `/ctx-doctor` | Plugin diagnostics |
| `/ctx-search` | Search the indexed base |
| `/ctx-purge` | Wipes the base — irreversible |

When the `ctx_*` tools fail to connect, the hooks keep injecting guidance that
points at them. In that case ignore the guidance and use `Bash`/`Read` directly;
a restart fixes it.

---

## Built-in commands worth remembering

| Command | Effect |
|---|---|
| `/code-review` | Review of the current diff — the defect axis |
| `/simplify` | Applies reuse and simplification cleanups to what changed |
| `/security-review` | Security audit of the branch |
| `/init` | Generates a `CLAUDE.md` for a project |
| `/update-config` | Edits `settings.json` and hooks |
| `/skills` | Turns a skill on or off by name |

---

## Where the configuration lives

| File | What it does |
|---|---|
| `~/.claude/CLAUDE.md` | Global behaviour rules |
| `~/.claude/settings.json` | Model, permissions, hooks, enabled plugins |
| `~/.claude/settings.local.json` | Personal permission overrides |
| `~/.claude/projects/<project>/memory/` | Memory that persists across sessions |
| `<project>/.claude/` | Project scope: its own skills, commands and settings |

A project skill does **not** collide with a plugin skill: the plugin's appears
under its namespace (`jgbriel-skills:tdd`) and the project's without a prefix
(`tdd`). What competes for a name is the personal scope, and
`scripts/check-project-skills.sh` detects it.
