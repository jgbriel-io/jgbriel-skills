# project-standard

A shared check and an agent-config generator for repos that follow the project standard, plus the templates those repos start from. It uses only Node's standard library, and runs on Node 20+ and on Bun.

## Install

Pin a tag as a dev dependency:

```json
"devDependencies": {
  "project-standard": "github:jgbriel-io/jgbriel-skills#standard-v0.1.0"
}
```

Tags are `standard-vX.Y.Z` and are versioned apart from the plugin. The root `package.json` never gets a `prepare`, `prepack`, `install` or `build` script. With one of those scripts, npm would run an install inside the git clone.

## Commands

| Command | Does |
|---|---|
| `project-standard sync` | Regenerates the Cursor, Codex and Kiro copies from the Claude sources. Deletes generated files that no longer have a source. Prints every write and delete |
| `project-standard check --staged` | Pre-commit. Reads the staged content from the index, not the working tree |
| `project-standard check --base <ref>` | CI. Checks what changed between `<ref>` and `HEAD`. An all-zeros or unknown ref falls back to `HEAD^` |
| `project-standard check --all` | Migration. Checks every tracked file and scans the full history for secrets |

Findings print as `path:line: [check] message`. There are no warnings: any finding exits 1.

## Checks

| Check | Runs on a partial scope when | Fails when |
|---|---|---|
| `frontmatter` | a `docs/**/*.md` outside `docs/archive/` changed | `type` or `status` is missing or not an allowed value. A decision also fails on a `number` that does not match its file name, a date not in `YYYY-MM-DD`, or a mismatch between `superseded_by` and `superseded` |
| `links` | a `.md` in `docs/`, the root `README.md` or `AGENTS.md` changed | a relative link does not resolve to a **tracked** file with the exact case, leaves the repo, or is a `[[wikilink]]`. When a change deletes or renames a file, only links pointing at the removed path are reported |
| `decisions` | anything under `docs/decisions/` changed | numbers do not run contiguously from `0001`, or a file name is not `NNNN-slug.md`. It also fails unless `docs/decisions/README.md` has exactly one row per file, with the file's number, link and status |
| `agents` | always | `AGENTS.md`, plus its `@imports` that resolve to tracked files (up to 5 hops), plus `.claude/rules/` files without `paths:`, reaches 200 lines |
| `drift` | always | a generated copy differs from what `sync` would write (CRLF ignored), is missing, or has no source |
| `gitleaks` | always | Gitleaks 8.30.1 finds a secret in the staged content, the commit range or the full history |

Gitleaks is downloaded once per machine from its GitHub release and checked against the SHA-256 pinned in `lib/gitleaks.mjs`. It is cached in `%LOCALAPPDATA%\project-standard` or `~/.cache/project-standard`. If the binary cannot be obtained, that is a finding: an unavailable scanner is not a pass. False positives go in `.gitleaksignore` by fingerprint.

## Generated agent config

Edit the Claude sources only. The copies are committed, and `drift` fails when one differs.

| Source | Cursor | Codex | Kiro |
|---|---|---|---|
| `.mcp.json` | `.cursor/mcp.json` (`type: "stdio"` added, `${VAR}` rewritten to `${env:VAR}`) | `.codex/config.toml` (`${VAR}` env forwarded by name as `env_vars`, literal env as `env`, `Authorization: Bearer ${X}` as `bearer_token_env_var`, other `${X}` headers as `env_http_headers`) | `.kiro/settings/mcp.json` |
| `.claude/skills/<name>/` | `.agents/skills/<name>/` | `.agents/skills/<name>/` | `.kiro/skills/<name>/` |
| `.claude/rules/**/*.md` | `.cursor/rules/<flat>.mdc`: `paths` becomes `globs`, with braces expanded; `alwaysApply: true` when there is no `paths` | none | `.kiro/steering/<flat>.md`: `inclusion: fileMatch` with a `fileMatchPattern` list; `inclusion: always` when there is no `paths` |

`sync` refuses to write anything, and names the server, when a target cannot express the source:

- `${VAR:-default}`;
- SSE transport;
- a key other than `type`, `command`, `args`, `env`, `url` or `headers`;
- `${VAR}` in `command`, `args` or `url`, since Codex and Kiro expand variables only in env and headers;
- a Codex env var that is renamed rather than forwarded under its own name.

All generated paths belong to `sync`. Add them to the formatter's ignore list (`templates/.prettierignore`), or the formatter reflows them and `drift` fails on every commit.

Known limits:

- **Codex** loads a project's `.codex/config.toml` only after that project is trusted in the user's Codex config.
- **Cursor** also reads `.claude/skills/` itself, so it sees each skill twice.
- **Serena** runs with the same `--context` in every agent.

## Templates

Files in `templates/` are copied into a repo and their `{placeholders}` filled in.

| Placeholder | Value |
|---|---|
| `{pm}` | `npm`, `bun` or `pnpm` |
| `{exec}` | `npx --no`, `bunx --bun` or `pnpm exec` |

Two files are renamed on copy: `AGENTS.template.md` becomes `AGENTS.md`, and `CLAUDE.template.md` becomes `CLAUDE.md`. The `.template` suffix keeps them from loading as instructions while you work in this repo.

- `hooks/pre-commit` is the husky hook body.
- `ci/checks-step.yml` is the step for the CI `checks` job. That job needs `fetch-depth: 0`.
- `docs/README.md` lists a row per folder. Delete the rows for folders the repo does not have.

Configs for lint, formatting, TypeScript, tests, Sonar, the full CI workflow, Dependabot and the runbook are added after the first repo proves them.

## Format sources

- Cursor: [MCP](https://cursor.com/docs/context/mcp), [rules](https://cursor.com/docs/context/rules), [skills](https://cursor.com/docs/context/skills)
- Codex: [MCP](https://developers.openai.com/codex/mcp), [skills](https://developers.openai.com/codex/skills)
- Kiro: [MCP configuration](https://kiro.dev/docs/mcp/configuration/), [steering](https://kiro.dev/docs/steering/), [skills](https://kiro.dev/docs/skills/)
- [Gitleaks](https://github.com/gitleaks/gitleaks)
- MCP servers: [SonarQube](https://github.com/SonarSource/sonarqube-mcp-server), [Serena](https://oraios.github.io/serena/02-usage/030_clients.html), [Playwright](https://github.com/microsoft/playwright-mcp), [SocratiCode](https://github.com/giancarloerra/socraticode)

## Test

```
node project-standard/test.mjs
```

Each check gets throwaway git repos: one that should fail and a fixed twin that should pass. The first run downloads Gitleaks.
