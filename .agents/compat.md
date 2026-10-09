# One fleet, three agents

What each agent reads, per component. Checked 2026-10-09 against Codex CLI 0.162.0, Cursor Agent CLI 2026.09.15 and the vendors' docs (sources at the end).

## Map

| Component | Source here | Claude Code | Codex | Cursor |
|---|---|---|---|---|
| Skills | `skills/<category>/<name>/` | the plugin | the plugin, or `~/.agents/skills` links | `~/.agents/skills` links |
| User-invoked skills (the old slash commands) | same, with `disable-model-invocation: true` | `/jgbriel-skills:<name>` | `allow_implicit_invocation: false` in `agents/openai.yaml` | `disable-model-invocation` is honoured |
| Subagents | `agents/*.md` | the plugin | generated `~/.codex/agents/<name>.toml` | generated `~/.cursor/agents/<name>.md` |
| Global rules | `claude/CLAUDE.md` | `~/.claude/CLAUDE.md` | generated `~/.codex/AGENTS.md` | none on disk: Settings, User Rules, by hand |
| MCP servers | the table in `scripts/link-agents.mjs` | `claude mcp add` | managed block in `~/.codex/config.toml` | `~/.cursor/mcp.json` |
| Dangerous-command guard | `hooks/guard-dangerous-bash.mjs` | `plugin.json` hook | `~/.codex/hooks.json`, trusted once with `/hooks` | `~/.cursor/hooks.json`, `preToolUse` on `Shell` |
| Always-on modes (caveman, ponytail) | the installed skills, read at run time by `hooks/inject-mode.mjs` | each plugin's own hooks | `SessionStart` hook running `inject-mode.mjs` | `sessionStart` hook returning `additional_context` |
| Settings and permissions | `claude/settings.template.json` | `settings.json` | not mirrored: `approval_policy` and sandbox are a per-user choice | not mirrored: `cli-config.json` permissions |

`scripts/link-agents.mjs` does every row marked generated, linked or merged. Claude Code needs nothing from it.

## Install

| Agent | Route | Updates itself |
|---|---|---|
| Claude Code | `claude plugin marketplace add jgbriel-io/jgbriel-skills`, then `claude plugin install jgbriel-skills@jgbriel` | on a `version` bump |
| Codex | `codex plugin marketplace add jgbriel-io/jgbriel-skills`, then `codex plugin add jgbriel-skills@jgbriel` | on a `version` bump |
| Codex or Cursor, from a clone | `node scripts/link-agents.mjs` | never needs to: the links point into the clone |

Pick one route per agent. The plugin and the links together list every skill twice. The plugin route carries skills only; subagents, global rules, MCP servers and hooks come from the script.

## Not portable

- `context-mode-cache-heal.mjs` and the `Stop` bell: they repair and signal the Claude plugin cache.
- claude.ai connectors (Figma, Gmail, Drive, Calendar): they belong to the Claude account.
- `allowed-tools` pre-approvals: Codex and Cursor ask for approval by their own rules.
- `model: haiku` on an agent or skill: dropped, so the agent inherits the session model. Codex can set `agents.default_subagent_model`.
- Claude-only plugins (`claude-obsidian`, `i-have-adhd`) and the vendor packs: each ships its own installer for the other agents, so none is vendored here.
- Mode skills are installed per agent by their own installer (`npx skills add ... -a <agent>`, or `codex plugin add` for ponytail). `inject-mode.mjs` only keeps an installed mode on; it installs nothing and copies no rules. The level (`ultra`) is set in `link-agents.mjs`.
- Ponytail's own Codex plugin hooks did not run in a trust-bypassed session while `inject-mode.mjs` did, so Codex gets both modes from the script. Leave the plugin's two hooks untrusted in `/hooks`, or the ruleset is injected twice.
- Cursor merges hook replies, and it is not documented what happens when two `sessionStart` hooks both return `additional_context`. Another tool's hook on the same event may win.

## What the checks showed

- Codex installs this repo from `.claude-plugin/marketplace.json`. Its automatic conversion of `commands/` into skills skipped 8 of the 14 commands, each of them using `$ARGUMENTS` or `model:`. That is why the commands are skills now.
- Codex namespaces linked skills with the plugin that contains them, so `commit` appears as `jgbriel-skills:commit`, the same name as in Claude Code.
- On Windows, Node cannot create directory symlinks without privilege, but junctions work, and Codex followed them.
- Cursor reads `~/.agents/skills`, `~/.claude/skills` and `~/.codex/skills`, and runs the hooks in `~/.claude/settings.json` when third-party imports are on. A skill folder copied into `~/.cursor/skills` goes stale (the copies found here had drifted from the repo) and can list the skill twice next to the link: remove it once the link exists.
- Cursor names the shell tool `Shell` and blocks only on a JSON `permission` reply or exit code 2; the guard speaks both.
- Codex runs a hook only after it is trusted by hash, so a changed hook command needs `/hooks` again.
- Codex reads at most `project_doc_max_bytes` (32 KiB) of instructions, global file included; the script raises it to 64 KiB.
- The guard did not block in Codex 0.162 (2026-10-09). The model ran its shell call inside the code-mode `exec` tool, the trusted `Bash` hook never fired, and `--disable code_mode_host` leaves `gpt-6.1-sol` with no way to run commands at all. The limit on a Codex agent is its sandbox, not the guard.
- When Claude Code spawns Codex, its own guard sees only the `codex exec` line, never what Codex runs. Spawn with `-s read-only` (research, review) or `-s workspace-write` (implementation), never `--dangerously-bypass-approvals-and-sandbox`; run it in the background, since an open-ended `codex exec` outlives a 150 s foreground timeout; collect the answer with `-o <file>`.

## Sources

- Codex: [skills](https://developers.openai.com/codex/skills), [subagents](https://developers.openai.com/codex/subagents), [hooks](https://developers.openai.com/codex/hooks), [AGENTS.md](https://developers.openai.com/codex/guides/agents-md), [plugins](https://developers.openai.com/codex/plugins/build), [MCP](https://developers.openai.com/codex/mcp)
- Cursor: [skills](https://cursor.com/docs/context/skills), [subagents](https://cursor.com/docs/subagents), [hooks](https://cursor.com/docs/hooks), [third-party hooks](https://cursor.com/docs/reference/third-party-hooks), [rules](https://cursor.com/docs/context/rules), [plugins](https://cursor.com/docs/plugins)
- The pattern: [mattpocock/skills](https://github.com/mattpocock/skills), `AGENTS.md` and `.agents/install-block.md`
