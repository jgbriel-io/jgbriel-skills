# jgbriel-skills

My entire **Claude Code** setup as an installable plugin: skills by category,
slash commands, agents, hooks and the global behaviour rules. A new machine
matches the old one in two commands.

**Public repo.** Fork it, clone it, or take only what is useful.

---

## Structure

The repository **is** the plugin: the root holds the manifest, and each component
sits in the folder Claude Code expects.

```
jgbriel-skills/
├── .claude-plugin/
│   ├── plugin.json           # manifest: hooks + every skill path, declared one by one
│   └── marketplace.json      # 1 plugin, source "./"
│
├── skills/<category>/<name>/SKILL.md     # one folder per category
├── agents/*.md                           # subagents
├── commands/*.md                         # slash commands
├── hooks/*.mjs                           # wired by the manifest, not by settings.json
│
├── scripts/
│   ├── gen-inventory.py          # regenerates the inventories in this README and in STRUCTURE
│   ├── check-doc-refs.py         # fails when the docs name a command or skill that is gone
│   ├── audit-sweep.py            # mechanical pass over skills, agents and commands
│   ├── check-project-skills.sh   # finds a project skill shadowed by a personal one
│   └── audit-labels.sh
│
├── templates/                    # project templates, to copy into any repo
│   ├── CONTEXT.template.md
│   └── CONTEXT-MAP.template.md
│
└── claude/                       # reference documentation and config
    ├── CLAUDE.md                 # global rules (language, git, response style)
    ├── STRUCTURE.md              # where everything lives: settings, MCP, hooks
    ├── WORKFLOWS.md · GUIDE.md · README.md
    ├── settings.template.json    # sanitised settings.json
    ├── config/                   # format reference
    └── skills-archived/          # out of circulation, not shipped in the plugin
```

**Skill naming matters**: `plugin.json` lists every path explicitly. A new skill
only exists once it enters that list — a loose folder under `skills/` is never
discovered on its own.

---

## What is in here

### Claude Code (`claude/`)

<!-- inventory:commands:start -->
**14 slash commands:**

| Command | Description |
|---|---|
| `/branch` | Creates a new branch from an up-to-date main/master and switches to it. |
| `/commit` | Writes a Conventional Commits message from the staged diff. |
| `/diff` | Summarized diff against a ref (branch, sha, HEAD~N). |
| `/map` | Map of a directory — one line per file with its detected responsibility. |
| `/review` | Code review of the current diff via the reviewer agent. |
| `/scope` | Breaks a task into independent vertical slices — each slice demoable end-to-end. |
| `/status` | Quick snapshot of repo state — branch, ahead/behind, staged, unstaged, untracked, last commit. |
| `/sync` | Syncs the current branch with its remote — fetch, pull rebase, final status. |
| `/tcc-revisar` | Academic review of a TCC chapter through the tcc-orientador agent. |
| `/tcc-status` | Snapshot of SyncClass TCC progress — status of each chapter (1-10), what is pending, next steps. |
| `/undo` | Undoes the last commit with a soft reset — keeps the changes staged, removes only the commit. |
| `/where` | Locates where a symbol, function, class or string is defined and used. |
| `/why` | Historical context for a line or range — git blame + log + the last commit that touched it. |
| `/wip` | Quick WIP commit to save progress. |
<!-- inventory:commands:end -->

<!-- inventory:agents:start -->
**4 agents** — they run in an isolated subagent:

| Agent | What it is for |
|---|---|
| `planner` | Breaks a task or feature into an ordered implementation plan with explicit dependencies, risks, and exit criteria. |
| `researcher` | Read-only code locator and codebase mapper. |
| `reviewer` | Diff and code reviewer. |
| `tcc-orientador` | Academic reviewer playing a severe TCC advisor. |
<!-- inventory:agents:end -->

**Hooks** — wired by the plugin itself, with no wiring in `settings.json`:

- `guard-dangerous-bash.mjs` — blocks destructive commands (`rm -rf`, `git push --force`) on `PreToolUse`
- `context-mode-cache-heal.mjs` — self-heals the context-mode plugin cache on `SessionStart`

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

**Config:**

- `CLAUDE.md` — global rules (English by default, git rules, security, response style)
- `STRUCTURE.md` — where everything lives: plugin, hooks, MCP, `settings.json`, scripts, setup
- `WORKFLOWS.md` — recipes: which skill to chain with which
- `GUIDE.md` — cheat sheet for third-party plugins and where the config lives
- `.mcp.json` — template of **project-scope** MCP servers (GitHub, Supabase) with `${VAR}` placeholders. Copy it into the project root; `~/.claude/.mcp.json` is never read
- `settings.template.json` — sanitised settings (without my absolute paths)

### Project templates (`templates/`)

Templates to copy as a new file into any project (they are not Claude Code config):

- `CONTEXT.template.md` — domain glossary for a single context. Format and rules of use: the `domain-modeling` skill (`skills/core-loop/domain-modeling/`).
- `CONTEXT-MAP.template.md` — for a repo with several contexts (monorepo/DDD); lists the contexts and how they relate.


---

## How to use it

This is a **Claude Code plugin**. The whole setup — this plugin, the three
third-party ones, and the tools around them — installs with one command, the same
on Windows, Linux and macOS:

```bash
node scripts/bootstrap.mjs
```

It installs what is missing and skips what is there, so re-running it after a
failure is the normal path; `--dry-run` prints the plan without touching anything.
See [Bootstrap](#bootstrap) for what it covers.

Only this plugin, nothing else:

```bash
claude plugin marketplace add jgbriel-io/jgbriel-skills
claude plugin install jgbriel-skills@jgbriel
```

Skills, commands, agents and hooks arrive together and the hooks wire themselves —
there is nothing to copy into `~/.claude/` and no `settings.json` to edit by hand.

To develop the skills, point the marketplace at the working copy itself:

```bash
claude plugin marketplace add /path/to/jgbriel-skills
```

A directory marketplace reads the tree directly, with no clone. The runtime is
still a versioned copy: after editing, bump `version` in
`.claude-plugin/plugin.json` and run `claude plugin update jgbriel-skills@jgbriel`.
**Without the bump, update has nothing to install and the change never arrives.**

### Bootstrap

`scripts/bootstrap.mjs` takes a machine from "Claude Code installed" to this whole
setup. It is Node rather than a shell script per platform because the repo's hooks
are already `.mjs`: a machine that cannot run it cannot run the plugin either, and
two scripts drift the moment one is edited.

| Step | What it does |
|---|---|
| Plugins | `jgbriel-skills`, `caveman`, `ponytail`, `context-mode`, `cloudflare` — marketplace + install |
| `uv` | Downloaded from the GitHub release for this OS/CPU into `~/.local/bin` |
| `serena` | `uv tool install -p 3.13 serena-agent`, then `serena setup claude-code` |
| `cocoindex` | `uv tool install cocoindex` |
| `codebase-memory-mcp` | Release binary + `claude mcp add -s user` |
| serena hooks | Merges the four documented entries into `~/.claude/settings.json` |

Every step is idempotent: it checks before it installs, and the hook merge adds
only entries whose command is not already in the file, so nothing is duplicated
and an unrelated hook is left alone.

### Third-party skills

Some categories this fleet used to vendor a copy of are better installed as
their own plugin instead — a copy here just goes stale between their releases
and this repo's. None are `skills/` entries; bootstrap installs the first,
the second is a manual per-project step:

| Name | Source | Install |
|---|---|---|
| `cloudflare` | [cloudflare/skills](https://github.com/cloudflare/skills), via the official marketplace | `claude plugin install cloudflare@claude-plugins-official` (in `PLUGINS`, bootstrap covers it) |
| `impeccable` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | `npx impeccable` inside the target project |

**`codebase-memory-mcp` has no Windows build** — the release ships linux and
darwin only. On Windows that step is skipped with the reason printed, not failed.

The installer never pipes a remote script into a shell: it fetches the release
asset and extracts it with `tar`, which reads `.zip` as well as `.tar.gz` on
Windows 10+. `scripts/test_bootstrap.mjs` covers the per-platform asset names and
the hook merge, including that a second merge adds nothing.

### Secrets setup

`.mcp.json` uses env vars and is only read from a **project root** — copy it there
instead of pointing at `~/.claude/`. A user-scope server is registered with
`claude mcp add -s user <name> -- <cmd>` and lives in `~/.claude.json`.

Set the vars before using MCP:

```powershell
[System.Environment]::SetEnvironmentVariable('GITHUB_PERSONAL_ACCESS_TOKEN', 'ghp_xxx', 'User')
[System.Environment]::SetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'sbp_xxx', 'User')
```

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx   # in ~/.bashrc
export SUPABASE_ACCESS_TOKEN=sbp_xxx
```

---

## What is NOT here

- Installed plugins (`caveman`, `context-mode`, and so on) — reinstall through the marketplace
- Chat history, sessions, local caches
- The real `settings.json` (with my absolute paths) — use `settings.template.json` as the base
- `.credentials.json` and secrets — set them through env vars
- Cross-machine sync scripts — fork and adapt to your own stack

---

## Recommended plugins

Install them through the Claude Code marketplace:

```
/plugin install caveman          # compressed answer mode
/plugin install ponytail         # YAGNI: the laziest solution that works
/plugin install context-mode     # processes large output outside the conversation
```

`claude plugin install a b c` installs only `a` and ignores the rest without
warning — one command per plugin.

---

## Contact

Adapt it freely. Improvements? Open an issue or a PR.

Email: virtualarrow.dev@gmail.com
