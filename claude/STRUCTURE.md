# Claude Code — Structure and Configuration

> Behaviour rules: [CLAUDE.md](CLAUDE.md) · Recipes: [WORKFLOWS.md](WORKFLOWS.md) · Cheat sheet: [GUIDE.md](GUIDE.md)
> This file documents **where everything lives** and **how it connects**.

---

## 1. Two machines, one plugin

The repo **is** the plugin. Nothing is hand-copied into `~/.claude/`: installing
from the marketplace resolves skills, commands, agents and hooks in one go, and
the installation is a versioned copy under
`~/.claude/plugins/cache/jgbriel/jgbriel-skills/<version>/`.

This holds on both machines — Windows (main) and Ubuntu (work). The only thing
that differs between them is the absolute paths.

**What stays in `~/.claude/` and never in this repo** — machine state and secrets:

| Item | What it is |
|---|---|
| `settings.json` | Active config: permissions, model, statusLine, enabled plugins |
| `settings.local.json` | Personal permission overrides |
| `.credentials.json` | Tokens — **never read, never display** |
| `history.jsonl`, `sessions/`, `projects/`, `shell-snapshots/`, `plans/`, `tasks/` | Runtime and session state |
| `plugins/` | Cache of installed plugins, managed by the CLI |

**The old layout.** Before the plugin, `~/.claude/{skills,agents,commands,hooks}`
were symlinks into a clone of this repo. Both machines are long past it and the
migration script is gone; a machine that still has those dangling links is fixed
by deleting them and running `node scripts/bootstrap.mjs`.

---

## 2. Skills

Generated from the tree by `scripts/gen-inventory.py` — do not edit by hand.

<!-- inventory:skills:start -->
**78 skills**, across 12 category folders:

<details><summary><code>backend</code> — 6 skills</summary>

| Skill | What it is for |
|---|---|
| `api-design` | Applies stack-agnostic REST API design conventions — resource naming, HTTP verbs, status codes, error envelope, version… |
| `backend-service-conventions` | Framework-agnostic conventions for backend service structure — layering (controller/service/repository), dependency inj… |
| `background-jobs` | Designs asynchronous background work — job queues, retry/backoff policies, idempotency keys, dead-letter handling — ind… |
| `caching-strategy` | Applies stack-agnostic caching strategy — layers (client, server, CDN), invalidation policy, cache-aside vs write-throu… |
| `input-validation` | Validates untrusted input at every system boundary — API requests, queue messages, uploads, CLI args — via schema defin… |
| `rate-limiting` | Stack-agnostic rate limiting and throttling — token bucket vs sliding/fixed window algorithms, where to enforce limits … |

</details>
<details><summary><code>career</code> — 3 skills</summary>

| Skill | What it is for |
|---|---|
| `cv-sync` | The resume pipeline — edit the canonical .tex files, recompile, distribute to the site and the vault, commit, and verif… |
| `job-description-analyzer` | Analyzes a job posting against the user's profile — mandatory requirements separated from nice-to-have, a fit score, ga… |
| `resume-tailor` | Adapts the resume to a specific posting without inventing anything — reorders skills, rewrites bullets into the languag… |

</details>
<details><summary><code>core-loop</code> — 11 skills</summary>

| Skill | What it is for |
|---|---|
| `codebase-design` | Shared vocabulary for designing deep modules. |
| `codebase-memory` | Use the codebase knowledge graph for structural code queries. |
| `diagnose` | Diagnosis loop for hard bugs and performance regressions. |
| `discuss` | Develop an idea through structured discussion — one decision at a time, down a decision tree, until intent, audience, s… |
| `domain-modeling` | Build and sharpen a project's domain model and ubiquitous language. |
| `grill-me` | Grill the user relentlessly about a plan, decision or idea that already exists, working the design tree in rounds until… |
| `handoff` | Compact the current conversation into a handoff document for another agent to pick up. |
| `implement` | Implement planned work — a plan, PRD, issue or agreed task. |
| `plan` | Produce an implementation plan — ordered steps, explicit dependencies, mechanical proofs, risks and exit criteria. |
| `pr-acceptance` | Work a PR from either end — `accept` judges whether it delivers what was asked (issue/spec, description and discussions… |
| `research` | Investigate a question or topic against primary sources and the repo's own history, then capture verified findings as a… |

</details>
<details><summary><code>data</code> — 6 skills</summary>

| Skill | What it is for |
|---|---|
| `backup-restore` | Explains backup strategy and restore testing for relational databases — full vs. |
| `postgres-conventions` | Apply Postgres best practices — schema design, indexes, RLS policies, SQL queries, connection pooling. |
| `query-performance` | Diagnoses slow SQL queries by reading execution plans and picking the right index strategy — composite, partial, coveri… |
| `safe-migrations` | Explains zero-downtime schema migrations for relational databases — expand-contract pattern, batch data backfills, lock… |
| `seed-data` | Explains reproducible seed data per environment — determinism, idempotency, dependency ordering, and masking real data … |
| `supabase-postgres` | Apply Postgres conventions through the Supabase client — column selection, single vs maybeSingle, range pagination, RPC… |

</details>
<details><summary><code>delivery</code> — 8 skills</summary>

| Skill | What it is for |
|---|---|
| `docs-writing` | Technical documentation style guide for README, docs/, ADRs, JSDoc/TSDoc, and inline code comments. |
| `estimation` | Applies effort-estimation technique to any deliverable, technical or not — task decomposition, three-point estimation (… |
| `incident-postmortem` | Runs a blameless incident postmortem — timeline with timestamps, impact, root cause (5 whys), and corrective actions wi… |
| `proposta-comercial` | Turns a client briefing into a freelance commercial proposal — closed scope (included and excluded), deliverables, sche… |
| `to-issues` | Break a plan, spec, or PRD into independently-grabbable issues on the project issue tracker using tracer-bullet vertica… |
| `to-prd` | Turn the current conversation into a PRD and publish it to the project issue tracker — no interview, just synthesis of … |
| `triage` | Move issues and external PRs through a state machine of triage roles — categorise, verify, grill if needed, and write a… |
| `wish` | Capture, enrich and organise future ideas in a project's wishlist file, before they become tracked work. |

</details>
<details><summary><code>devops</code> — 11 skills</summary>

| Skill | What it is for |
|---|---|
| `ci-cd-pipeline` | Defines standard CI/CD pipeline stages (lint, type-check, test, build), dependency caching, running migrations in CI, a… |
| `container-conventions` | Defines multi-stage Docker builds, minimal base images, non-root users, .dockerignore, layer cache ordering, and docker… |
| `environment-config` | Environment-based configuration conventions — .env.example, startup-time env validation (fail fast, not mid-request), a… |
| `error-tracking` | Apply production error tracking patterns — unhandled exception capture, contextual metadata, release/version tagging, t… |
| `health-checks-metrics` | Apply health check (readiness vs. |
| `project-deploy` | Deploys a project by following the runbook documented in the vault — a step-by-step checklist, confirmation before anyt… |
| `resolving-merge-conflicts` | Resolves the conflicts of a merge or rebase already in progress — reads the original intent of each side before choosin… |
| `rollback-runbook` | Defines a deploy-tool-agnostic rollback runbook — reverting a code deploy (blue-green/canary/previous artifact), why re… |
| `setup-pre-commit` | Set up Husky pre-commit hooks with lint-staged (Prettier), type checking, and tests in the current repo. |
| `stack-scaffold` | Scaffold a new project with the user's standard stack — React 18 + TypeScript + Tailwind + shadcn/ui, on Vite + Supabas… |
| `structured-logging` | Apply structured (JSON) logging practices — log levels, request/tenant correlation IDs, context propagation, and what m… |

</details>
<details><summary><code>frontend</code> — 9 skills</summary>

| Skill | What it is for |
|---|---|
| `accessibility-audit` | Guides accessibility (a11y) auditing — automated tooling (axe-core) wired into CI as a floor not a substitute for manua… |
| `client-state-management` | Defines the boundary between server state, local UI state, and URL state as an architecture decision independent of sta… |
| `error-ux` | Defines client-side error handling — render error boundaries that isolate failure without crashing the whole tree, the … |
| `forms-validation` | Defines form validation as a single schema shared between client and server, with Brazilian document masks (CPF, CNPJ, … |
| `frontend-conventions` | Conventions for WRITING new frontend code — component structure and extraction, page files that only compose components… |
| `react-best-practices` | React 18 + Vite performance rules — bundle size, re-renders, waterfalls, subscriptions. |
| `supabase-hooks` | Client data layer for Supabase + TanStack Query — custom hooks, mutations, queries, real-time subscriptions, error hand… |
| `tanstack-query-patterns` | Client data layer with TanStack Query 5 + Axios — service pattern, module-prefixed query keys, mutations, cache invalid… |
| `web-perf` | Measures web performance on a running page through the Chrome DevTools MCP — Core Web Vitals (LCP, INP, CLS), FCP, TBT … |

</details>
<details><summary><code>meta</code> — 4 skills</summary>

| Skill | What it is for |
|---|---|
| `skill-audit` | Audit Claude Code skills against the fleet's reference implementation — a mechanical sweep first, then criterion-by-cri… |
| `skill-sync` | Sync the skill fleet against its upstreams — mattpocock/skills and lucasmonstrox/utevo-lux — diffing repo vs upstream, … |
| `wizard` | Generates an interactive bash wizard for setup steps only a human can do — dashboards, credentials, CI secrets, one-off… |
| `writing-great-skills` | Reference for writing and editing skills well — the vocabulary and principles that make a skill predictable. |

</details>
<details><summary><code>quality</code> — 4 skills</summary>

| Skill | What it is for |
|---|---|
| `code-reviewer` | Stack-specific review checklist for React + TanStack Query + Supabase multi-tenant apps — hook architecture, RLS/tenant… |
| `e2e-testing` | Guides writing reliable end-to-end tests — programmatic auth fixtures instead of UI login, per-run data isolation, acce… |
| `integration-testing` | Guides writing integration tests against real dependencies — disposable containers for database/services instead of moc… |
| `tdd` | The red-green-refactor loop and what makes a test survive a refactor — behavior through the public interface, the seam … |

</details>
<details><summary><code>security</code> — 6 skills</summary>

| Skill | What it is for |
|---|---|
| `auth-patterns` | Authentication and authorization patterns — OTP/password/OAuth/OIDC flows, session vs JWT, RBAC/ABAC, MFA, token refres… |
| `dependency-audit` | Audits third-party dependencies for security and maintainability — lockfile discipline, upgrade cadence (automatic patc… |
| `lgpd-checklist` | LGPD compliance checklist for projects handling personal data — data inventory, legal basis, retention/anonymization, d… |
| `multi-tenant-isolation-audit` | Audits multi-tenant systems for cross-tenant data leakage — missing isolation filters, privileged-role bypass (service_… |
| `secrets-management` | Manage secrets and sensitive config across environments and CI — classify sensitive vs. |
| `security-review-checklist` | An OWASP-style sweep of a PR or release — injection, XSS, SSRF, IDOR, CSRF, insecure deserialization — as an explicit c… |

</details>
<details><summary><code>tcc</code> — 6 skills</summary>

| Skill | What it is for |
|---|---|
| `tcc-auditoria-banca` | Simulates the written report an examining board issues on a finished TCC (Brazilian undergraduate thesis) — grade per c… |
| `tcc-defesa` | Builds the defense presentation for the SyncClass TCC out of the written chapters — narrative arc, slide-by-slide scrip… |
| `tcc-fragmentos` | Captures raw TCC material — reading notes, technical decisions, quotations, loose ideas — into a fragments file, before… |
| `tcc-grill` | Academic interrogation of the SyncClass TCC — challenges hypotheses, methodology, scope, bibliographic gaps and the val… |
| `tcc-rascunho` | Turns raw fragments into a formal TCC section, paragraph by paragraph, applying ABNT/FEPI norms, impersonal voice and c… |
| `tcc-revisao-impessoal` | Final sweep of a TCC chapter looking for first person, academic clichés, informality, weak vocabulary, orphan citations… |

</details>
<details><summary><code>vault</code> — 4 skills</summary>

| Skill | What it is for |
|---|---|
| `obsidian-vault` | Creates, searches and links notes in the personal Obsidian vault following the wiki conventions — folder structure, wik… |
| `project-kickoff` | Orchestrates a project from scratch — idea to spec, design system and implementation plan — invoking each phase's skill… |
| `project-planner` | Scaffolds a project's wiki pages in wiki/Projetos/ — index.md with frontmatter, subpage stubs and ADRs — from a directi… |
| `project-sync` | Reads a project's `docs/` folder and creates or updates its pages under `wiki/Projetos/` in the Obsidian vault, mirrori… |

</details>
<!-- inventory:skills:end -->

A new skill only exists once its path enters the `skills` list in
`.claude-plugin/plugin.json`. A loose folder under `skills/` is never discovered
on its own, and `claude plugin validate` passes anyway — the one that shows the
truth is `claude plugin details`.

---

## 3. Agents and commands

<!-- inventory:agents:start -->
**3 agents** — they run in an isolated subagent:

| Agent | What it is for |
|---|---|
| `planner` | Breaks a task or feature into an ordered implementation plan with explicit dependencies, risks, and exit criteria. |
| `researcher` | Read-only code locator and codebase mapper. |
| `tcc-orientador` | Academic reviewer playing a severe TCC advisor. |
<!-- inventory:agents:end -->

<!-- inventory:commands:start -->
**11 slash commands:**

| Command | Description |
|---|---|
| `/branch` | Creates a new branch from an up-to-date main/master and switches to it. |
| `/commit` | Writes a Conventional Commits message from the staged diff. |
| `/diff` | Summarized diff against a ref (branch, sha, HEAD~N). |
| `/map` | Map of a directory — one line per file with its detected responsibility. |
| `/sync` | Syncs the current branch with its remote — fetch, pull rebase, final status. |
| `/tcc-revisar` | Academic review of a TCC chapter through the tcc-orientador agent. |
| `/tcc-status` | Snapshot of SyncClass TCC progress — status of each chapter (1-10), what is pending, next steps. |
| `/undo` | Undoes the last commit with a soft reset — keeps the changes staged, removes only the commit. |
| `/where` | Locates where a symbol, function, class or string is defined and used. |
| `/why` | Historical context for a line or range — git blame + log + the last commit that touched it. |
| `/wip` | Quick WIP commit to save progress. |
<!-- inventory:commands:end -->

---

## 4. Hooks — plugin components

No manual wiring in `settings.json`: `plugin.json` declares all three and
installing the plugin connects them. The path uses a normalised
`${CLAUDE_PLUGIN_ROOT}` (Git Bash's `/c/...` becomes `c:/...`), so it runs on both
platforms.

| Hook | Fires on | Job |
|---|---|---|
| `guard-dangerous-bash.mjs` | `PreToolUse` (matcher `Bash`) | Blocks a catastrophic command that would slip past the allowlist — `exit 2` + stderr stops the tool call |
| `context-mode-cache-heal.mjs` | `SessionStart` | Heals the context-mode plugin cache, which breaks its own path on auto-update |
| `printf '\a'` | `Stop` | Beep when finished. It used to be a `.ps1` pinned to one machine; now it is one line |

### What the guard blocks, and what it deliberately does not

It matches the command's **text**, which made it refuse two things that are not
dangerous at all:

- **`rm -rf` against any absolute path.** Deleting one versioned plugin cache
  directory is not deleting a system path. It now blocks only a target one or two
  segments deep — `/`, `/etc`, `/home/user` — plus `~`, `$HOME` and `*`. Anything
  deeper is ordinary work.
- **A dangerous command written as data.** Documenting `permissions.deny` through
  `cat > file <<'EOF'` was refused as though the text ran. Heredoc bodies are now
  stripped before matching — **except** when the heredoc feeds `bash`, `sh`, `zsh`
  or `ksh`, where the body really is executed and stays under inspection.

`scripts/test_guard_bash.mjs` holds both halves: what must still be blocked, and
the real commands that used to be refused. The second half matters more — a guard
that cries wolf teaches people to route around it.

---

## 5. Third-party plugins

They come from external marketplaces, not from this repo, and live in
`~/.claude/plugins/`.

| Plugin | Marketplace | What it adds |
|---|---|---|
| `caveman` | `JuliusBrussee/caveman` | Compressed answer mode + the `caveman:*` skills and the `cavecrew-*` agents |
| `ponytail` | `DietrichGebert/ponytail` | YAGNI mode: the laziest solution that works, with `/ponytail-review`, `-audit`, `-debt` |
| `context-mode` | `mksglu/context-mode` | The `ctx_*` tools — processes large output outside the conversation, into a persistent FTS5 base |
| `jgbriel-skills` | `jgbriel` (this repo) | The whole fleet |

Registered marketplaces: the three above, `jgbriel` and
`anthropics/claude-plugins-official`. `claude plugin marketplace list` shows the
machine's real state.

The namespace in a name (`caveman:cavecrew-builder`) marks it as coming from a
plugin. Each one's commands are in [GUIDE.md](GUIDE.md).

The first two are **behaviour modes**, not tools: they activate through a
`SessionStart` hook and hold for the whole session until `stop caveman` /
`stop ponytail`. Caveman governs how the text comes out, ponytail governs what
gets built — which is why the two run together without conflict.

---

## 6. MCP servers

**`.mcp.json` is only read from a project's root.** There is no
`~/.claude/.mcp.json`; a user-scope server lives in `~/.claude.json`, registered
by `claude mcp add -s user <name> -- <cmd>`.

`claude/.mcp.json` here is a project-scope template with `${VAR}` placeholders —
copy it into the root of whichever project needs it.

| Server | Command | What it is for |
|---|---|---|
| `codebase-memory-mcp` | `~/.local/bin/codebase-memory-mcp` | Knowledge graph over the code: `search_graph`, `trace_path`, `query_graph`. User scope. **Linux and macOS only** — the release has no Windows build |
| `serena` | `serena start-mcp-server --context=claude-code --project-from-cwd` | Retrieval and editing **at the symbol level** through a language server — what grep cannot give. [oraios/serena](https://github.com/oraios/serena) |
| `github` | `npx @modelcontextprotocol/server-github` | Needs `GITHUB_PERSONAL_ACCESS_TOKEN` in the environment |
| `supabase` | `npx @supabase/mcp-server-supabase@latest --read-only` | Needs `SUPABASE_ACCESS_TOKEN`; read-only by explicit flag |

`codebase-memory-mcp` and `serena` overlap on purpose: the graph answers "who
calls what" over an index that was already built, serena answers about the file as
it is right now through the LSP. When they disagree, the LSP is right.

Installing serena, without piping an installer into the shell (denied by
`permissions.deny`):

```bash
uv tool install -p 3.13 serena-agent   # installs serena, serena-agent, serena-hooks
serena setup claude-code               # registers the MCP at user scope
```

`serena setup` issues the `claude mcp add --scope user` itself — do not assemble
that command by hand. `--project-from-cwd` makes the server take the project from
the directory the session opened in. `uv` itself came from the GitHub release
tarball, extracted into `~/.local/bin`.

Serena's optional hooks are configured in `~/.claude/settings.json`, all four with
absolute paths so they do not depend on PATH. `scripts/bootstrap.mjs` merges them
for you; the table is what it writes:

| Event | Command | Job |
|---|---|---|
| `SessionStart` | `serena-hooks activate` | prompts the agent to activate the project |
| `PreToolUse` (matcher `""`) | `serena-hooks remind` | nudges toward the symbolic tools after too many consecutive `grep`/`read_file` calls |
| `PreToolUse` (matcher `mcp__serena__*`) | `serena-hooks auto-approve` | auto-approves Serena's own tool calls |
| `SessionEnd` | `serena-hooks cleanup` | clears the session's hook data |

They live in `settings.json`, not in this repo, because that file is machine state
— see §1. That is also why the bootstrap merges instead of overwriting: it adds
only entries whose command is absent, and leaves every other hook alone.

### Outside Claude Code — CocoIndex

[CocoIndex](https://github.com/cocoindex-io/cocoindex) is not an MCP server: it is
a Python incremental-indexing library — source, transform, target (file, pgvector,
graph), reprocessing only the delta. It belongs to a project that needs semantic
search of its own, not to the agent's configuration. It ships its own agent skill
in `skills/cocoindex/` of their repo.

```bash
uv tool install cocoindex        # CLI: init, ls, show, update, drop
echo "COCOINDEX_DB=./cocoindex.db" > .env
cocoindex update main.py
```

**It does not need Postgres.** The 1.0 line uses a local per-app database file
(`COCOINDEX_DB`); pgvector is a *target* you choose, not a prerequisite.

An app is `coco.App(name, main_fn, **args)`; the function marked
`@coco.fn(memo=True)` is the unit the engine memoises; `localfs.walk_dir(...)`
with `coco.mount_each(...)` is the pair that walks the source. Inside the
function, `file.file_path` is a `FilePath`, not a `pathlib.Path`: calling
`.read_text()` directly raises `AttributeError`, so `.resolve()` first.

**Memoisation is by content, not by mtime.** Measured over this fleet's 84
`SKILL.md` files: first run `84 added`; next run with no change `84 unchanged`; a
`touch` on one file is still `84 unchanged`; a real one-line edit gives
`1 reprocessed, 83 unchanged`.

---

## 7. `settings.json` — what is not in CLAUDE.md

- `permissions.deny`: `rm -rf` and variants, `sudo`, `mkfs`/`dd`/`shred`, `curl | sh`, reading `.env`/`secrets/**`/`*.pem`/`*.key`/`id_rsa`
- `permissions.ask`: `rm`/`Remove-Item`, `sed`/`awk`, `git reset`/`push --force`/`clean`, package publish, `docker rm`/`system prune`
- `skillListingBudgetFraction: 0.06` — the fraction of the window reserved for listing skills. The default is `0.01`, which gives 8,000 chars: the fleet alone passes 30,000, and above the ceiling Claude Code **truncates the descriptions**, leaving only the name. A skill with no visible description is never chosen on its own
- `statusLine`: `ccstatusline`, 10s refresh
- `autoUpdatesChannel: "latest"`

---

## 8. Scripts

| Script | What it does |
|---|---|
| `bootstrap.mjs` | Installs the whole setup on a fresh machine — plugins, uv, serena, cocoindex, the codebase-memory MCP and serena's hooks. Idempotent; `--dry-run` prints the plan |
| `test_bootstrap.mjs` | Covers the bootstrap's per-platform asset names and the hook merge |
| `test_guard_bash.mjs` | Covers what `guard-dangerous-bash.mjs` blocks and what it must stop blocking |
| `gen-inventory.py` | Regenerates the tables in this file and in the README. `--check` fails when they are stale |
| `check-doc-refs.py` | Fails when the prose names a command or skill that no longer exists |
| `audit-sweep.py` | The mechanical pass of `/skill-audit`: size against the reference, frontmatter, broken link, residue from another tool |
| `check-project-skills.sh` | Finds a project skill shadowed by a personal skill of the same name |
| `audit-labels.sh` | Checks the issue labels |

Handoffs are not versioned here. This repository is the fleet, not a project, so a
handoff about it has no reader other than the next session: it goes to
`~/.claude/handoffs/`, named `YYYY-MM-DD-slug.md`. Only a project repository keeps
handoffs in `docs/handoffs/`, where they are repository artifacts and get committed.
Do not create that folder here — the `handoff` skill writes into it whenever it
exists.

All of these run in CI (`.github/workflows/checks.yml`), on pushes to `main` and
on every PR: the two doc checks, the sweep, and the three test files. Until
2026-09-17 the workflow ran only the first two, so every sweep rule was enforced
by somebody remembering to run it — the same shape of failure the sweep exists to
catch.

---

## 8a. Releasing: the version is the release

There are **no git tags**. `version` in `.claude-plugin/plugin.json` is the whole
release mechanism: the runtime installs a versioned copy, and `claude plugin
update` has nothing to install unless that number moved. **Every PR that changes
anything shipped bumps it.**

That has two consequences nobody remembers until it bites:

- **Stacked PRs conflict on exactly one line.** Each branch bumps `version`
  assuming the one before it already merged, so they must merge in order.
  Out of order you get a conflict on that line — or worse, a version that walks
  backwards. Resolution is always: keep the higher number, re-run the checks,
  push, wait for CI, merge.
- **A child PR dies when its parent's branch is deleted.** Merging with
  `--delete-branch` closes any PR still targeting that branch, and GitHub refuses
  to reopen it (`GraphQL: Could not open the pull request`). **Retarget the child
  to `main` before merging the parent**; once it is closed the only way back is a
  new PR from the same branch.

After the merge, `claude plugin update jgbriel-skills` pulls the new version and
asks for a restart. The old version directories stay in
`~/.claude/plugins/cache/jgbriel/jgbriel-skills/`; deleting the one the running
session loaded its hooks from breaks that session, so clean them up after the
restart, not before.

---

## 9. Setup

One command on any of the three platforms:

```bash
node scripts/bootstrap.mjs      # --dry-run to see the plan first
```

It installs the four plugins, `uv`, serena (with `serena setup claude-code` and
the four hooks from §6), cocoindex and the codebase-memory MCP, skipping whatever
is already present. `codebase-memory-mcp` ships no Windows build, so on Windows
that one step reports itself skipped.

Just this plugin, by hand:

```bash
claude plugin marketplace add jgbriel-io/jgbriel-skills
claude plugin install jgbriel-skills@jgbriel
```

For development, point the marketplace at the working copy. The runtime is still
a versioned copy: **without bumping `version` in `plugin.json`, `update` has
nothing to install and the change never arrives — with no error at all.**

MCP server secrets, through a user env var:

```powershell
[System.Environment]::SetEnvironmentVariable('GITHUB_PERSONAL_ACCESS_TOKEN', 'ghp_xxx', 'User')
```

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx   # in ~/.bashrc
```
