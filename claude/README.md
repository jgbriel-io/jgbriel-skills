# Claude Code — Index

Four files, one job each. Suggested reading order:

| Order | File | Job |
|---|---|---|
| 1 | [CLAUDE.md](CLAUDE.md) | Global behaviour rules — language, git, security, cost. The file Claude Code reads on its own |
| 2 | [STRUCTURE.md](STRUCTURE.md) | Where everything lives and how it connects: plugin, hooks, MCP, `settings.json`, generated inventory |
| 3 | [WORKFLOWS.md](WORKFLOWS.md) | Recipes — which skill to chain with which, and why |
| 4 | [GUIDE.md](GUIDE.md) | Cheat sheet for third-party plugins and where the config lives |

`config/` holds the file templates (`CLAUDE.template.md`, `AGENT.template.md`
and the rest); `skills-archived/` holds what went out of circulation and does
not ship in the plugin.

**The rule against drift:** each fact lives in exactly one file, and the others
point at it. Every list of skills, commands or agents is **generated** by
`scripts/gen-inventory.py` from the tree — none is maintained by hand.
`scripts/check-doc-refs.py` fails when the prose around them names something
that no longer exists. Both run in CI.
