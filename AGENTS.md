# jgabriel-skills

One fleet for three agents: Claude Code, Codex, Cursor. `skills/` is the source of truth; everything else is linked or generated from it. What each agent reads, per component, is in [.agents/compat.md](.agents/compat.md).

## Layout

- `skills/<category>/<name>/SKILL.md`: Agent Skills format, read by all three. A skill the human types by name sets `disable-model-invocation: true`. There is no `commands/` folder.
- `skills/**/agents/openai.yaml`: Codex picker metadata and invocation policy. Generated, never edited.
- `agents/*.md`: Claude subagents. The Codex TOML and the Cursor markdown are generated from them.
- `hooks/`: `guard-dangerous-bash.mjs` is wired by the plugin for Claude Code. It and `inject-mode.mjs` (keeps caveman and ponytail on) are merged into Codex and Cursor by `scripts/link-agents.mjs`.
- `claude/`: global rules and reference docs for Claude Code.

## Rules

- A new skill needs its path in `.claude-plugin/plugin.json` `skills`. Then regenerate: `python3 scripts/gen-inventory.py` and `node scripts/gen-openai-yaml.mjs`.
- Skill bodies stay harness-neutral: write `<arguments>`, never `$ARGUMENTS`, and name no Claude-only tool. `allowed-tools`, `argument-hint` and `model` in frontmatter are Claude-only and harmless elsewhere.
- Plugin hooks and `${CLAUDE_PLUGIN_ROOT}` paths are Claude-only: a hook other agents should run goes through `scripts/link-agents.mjs`.
- Bump `version` in `.claude-plugin/plugin.json` with any change users should receive.
- The repo is public: no client or project repo names, no machine paths.

## Checks

```bash
python3 scripts/gen-inventory.py --check
python3 scripts/check-doc-refs.py
python3 scripts/audit-sweep.py
python3 scripts/test_audit_sweep.py
node scripts/gen-openai-yaml.mjs --check
node scripts/test_link_agents.mjs
node scripts/test_guard_bash.mjs
node scripts/test_bootstrap.mjs
node project-standard/test.mjs
```

## Wire this machine

```bash
node scripts/link-agents.mjs --dry-run
node scripts/link-agents.mjs
```

Re-run after adding, renaming or removing a skill or an agent.
