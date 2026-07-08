# config/ — Claude Code file-type kit

Every `.md` (and config) file type Claude Code consumes, with an annotated
template for each. Copy the template, delete the comments, fill it in.

| File type | Lives at | Loaded | Template |
|---|---|---|---|
| `CLAUDE.md` (global) | `~/.claude/CLAUDE.md` | Every session, all projects | [CLAUDE.template.md](CLAUDE.template.md) |
| `CLAUDE.md` (project) | `<repo>/.claude/CLAUDE.md` or repo root | Sessions inside that repo; overrides/extends global | same template, project flavor |
| `CLAUDE.local.md` | repo root, gitignored | Like project CLAUDE.md, personal only | same |
| `SKILL.md` | `~/.claude/skills/<name>/` | description always; body on trigger | `skills/skill-creator/templates/SKILL.template.md` |
| Agent | `~/.claude/agents/<name>.md` | description always; runs as isolated subagent | [AGENT.template.md](AGENT.template.md) |
| Slash command | `~/.claude/commands/<name>.md` | Only when user types `/<name>` | [COMMAND.template.md](COMMAND.template.md) |
| Memory | `~/.claude/projects/<proj>/memory/*.md` + `MEMORY.md` index | Index every session; files on recall | [MEMORY.template.md](MEMORY.template.md) |
| Domain context file | `<repo>/CONTEXT.md`, `docs/DESIGN.md`, `docs/adr/*.md` | On demand, when a skill/agent reads it | [CONTEXT-FILE.template.md](CONTEXT-FILE.template.md) + `../../templates/CONTEXT.template.md` |
| `settings.json` | `~/.claude/settings.json` (real) | Harness config: permissions, hooks, plugins, model | `../settings.template.json` |
| `.mcp.json` | project or `~/.claude` | MCP servers (use `${VAR}` for secrets) | — |
| Hooks | `~/.claude/hooks/*.mjs` + wiring in settings.json | On the wired event (PreToolUse, SessionStart…) | real examples in `../hooks/` |

## Rules of thumb

- **CLAUDE.md** = rules Claude must always follow. **Skill** = knowledge loaded
  when relevant. **Command** = explicit shortcut. **Agent** = isolated worker.
  Wrong layer = wasted context or missed instruction.
- Every token in global CLAUDE.md is paid every turn of every session — it
  earns the strictest pruning of all file types.
- Domain context files (DESIGN.md, CONTEXT.md, ADRs) live in the project repo,
  not here — this kit only holds the templates.
- Skill authoring quality bar: `wiki/Ferramentas/Claude/docs/SKILL-QUALITY.md`
  (C1–C11) in the vault; theory in the `writing-great-skills` skill.
