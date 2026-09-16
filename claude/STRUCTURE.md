# Claude Code — Estrutura e Configuração

> Referência de comandos: `COMMANDS.md` · Receitas: `WORKFLOWS.md` · Regras: `CLAUDE.md`
> Este arquivo documenta **onde tudo mora** e **como se conecta** — não repete o que já está nos outros 3.

---

## 1. Layout físico — duas localizações, uma fonte de verdade

Tudo que é versionável vive neste repo (`D:\Projetos\projetos-pessoais\jgabriel-skills\claude\`).
`C:\Users\jgabriel\.claude\` é o diretório real lido pelo Claude Code — partes dele são **symlinks** apontando pra cá.

| Em `~/.claude/` | Tipo | Aponta pra |
|---|---|---|
| `CLAUDE.md` | symlink | `claude/CLAUDE.md` (regras globais) |
| `GUIDE.md` | symlink | `claude/GUIDE.md` (cheatsheet) |
| `settings.template.json` | symlink | `claude/settings.template.json` |
| `skills/` | — | **Não é mais symlink.** As skills vêm no plugin, em `skills/<categoria>/<nome>/`, instalado por marketplace |
| `agents/` | — | **Não é mais symlink.** Os 3 agents vêm no plugin, em `agents/` na raiz do repo |
| `commands/` | — | **Não é mais symlink.** Os 11 commands vêm no plugin, em `commands/` na raiz do repo |
| `hooks/` | — | **Não é mais symlink.** Os dois hooks viraram componentes do plugin, declarados no `plugin.json` e conectados na instalação |

**Não versionados** (ficam só em `~/.claude/`, nunca neste repo — contêm estado de máquina/segredos):

| Item | O que é |
|---|---|
| `settings.json` | Config real ativa (permissions, hooks wiring, plugins habilitados, model, statusLine) |
| `settings.local.json` | Overrides pessoais de permissão |
| `.credentials.json` | Tokens — **nunca ler/exibir** |
| `history.jsonl`, `sessions/`, `projects/`, `shell-snapshots/`, `paste-cache/`, `plans/`, `tasks/`, `ide/`, `daemon/`, `session-env/` | Estado runtime/sessão |
| `plugins/` | Plugins instalados (cache + dados, gerenciados pelo CLI — ver seção 4) |
| `.agents/` | Estado interno de subagents (não confundir com as definições `.md`, que hoje vivem nos plugins) |

Symlink vale hoje só para `CLAUDE.md`, `GUIDE.md` e `settings.template.json` — aí sim editar de um lado edita o outro. Skills, agents e commands saíram desse esquema: viraram plugins (seção 2) e chegam pelo marketplace, numa cópia versionada que **não** é o mesmo inode. Para esses, editar é sempre no repo.

---

## 2. Skills

Geradas a partir da árvore por `scripts/gen-inventory.py` — não editar à mão.

<!-- inventory:skills:start -->
**87 skills**, em 13 pastas de categoria:

<details><summary><code>backend</code> — 8 skills</summary>

| Skill | Uso |
|---|---|
| `api-design` | Applies stack-agnostic REST API design conventions — resource naming, HTTP verbs, status codes, error envelope, version… |
| `backend-service-conventions` | Framework-agnostic conventions for backend service structure — layering (controller/service/repository), dependency inj… |
| `background-jobs` | Designs asynchronous background work — job queues, retry/backoff policies, idempotency keys, dead-letter handling — ind… |
| `caching-strategy` | Applies stack-agnostic caching strategy — layers (client, server, CDN), invalidation policy, cache-aside vs write-throu… |
| `input-validation` | Validates untrusted input at every system boundary — API requests, queue messages, uploads, CLI args — via schema defin… |
| `rate-limiting` | Stack-agnostic rate limiting and throttling — token bucket vs sliding/fixed window algorithms, where to enforce limits … |
| `supabase-hooks` | Data-layer patterns for Supabase + TanStack Query — custom hooks, mutations, queries, real-time subscriptions, error ha… |
| `tanstack-query-patterns` | Frontend data layer patterns with TanStack Query 5 + Axios — service pattern, module-prefixed query keys, mutations, ca… |

</details>
<details><summary><code>career</code> — 3 skills</summary>

| Skill | Uso |
|---|---|
| `cv-sync` | Pipeline de atualização do currículo — edita os .tex canônicos, recompila com pdflatex, renomeia para os nomes de distr… |
| `job-description-analyzer` | Analyze job postings, calculate match scores, identify gaps, and create application strategy. |
| `resume-tailor` | Customize resume for specific job postings while maintaining truthfulness. |

</details>
<details><summary><code>cloudflare</code> — 4 skills</summary>

| Skill | Uso |
|---|---|
| `cloudflare` | Comprehensive Cloudflare platform skill covering Workers, Pages, storage (KV, D1, R2), AI (Workers AI, Vectorize, Agent… |
| `cloudflare-email-service` | Send and receive transactional emails with Cloudflare Email Service (Email Sending + Email Routing). |
| `workers-best-practices` | Reviews and authors Cloudflare Workers code against production best practices. |
| `wrangler` | Cloudflare Workers CLI for deploying, developing, and managing Workers, KV, R2, D1, Vectorize, Hyperdrive, Workers AI, … |

</details>
<details><summary><code>core-loop</code> — 13 skills</summary>

| Skill | Uso |
|---|---|
| `codebase-design` | Shared vocabulary for designing deep modules. |
| `codebase-memory` | Use the codebase knowledge graph for structural code queries. |
| `diagnose` | Diagnosis loop for hard bugs and performance regressions. |
| `discuss` | Develop an idea through structured discussion — one decision at a time, down a decision tree, until intent, audience, s… |
| `domain-modeling` | Build and sharpen a project's domain model and ubiquitous language. |
| `fable-method` | A step-by-step problem-solving loop (classify the ask, define done, gather evidence, decide, act surgically, verify by … |
| `grill-me` | Grill the user relentlessly about a plan, decision or idea that already exists, working the design tree in rounds until… |
| `handoff` | Compact the current conversation into a handoff document for another agent to pick up. |
| `implement` | Implement planned work — a plan, PRD, issue or agreed task. |
| `plan` | Produce an implementation plan — ordered steps, explicit dependencies, mechanical proofs, risks and exit criteria. |
| `pr-acceptance` | Judge whether a PR delivers what was asked — loads the originating issue/spec, the PR description and its discussions, … |
| `research` | Investigate a question or topic against primary sources and the repo's own history, then capture verified findings as a… |
| `resolve-review` | Address the change requests a human reviewer left on a PR — read the full description, issues, reviews and discussions,… |

</details>
<details><summary><code>data</code> — 6 skills</summary>

| Skill | Uso |
|---|---|
| `backup-restore` | Explains backup strategy and restore testing for relational databases — full vs. |
| `postgres-conventions` | Apply Postgres best practices — schema design, indexes, RLS policies, SQL queries, connection pooling. |
| `query-performance` | Diagnoses slow SQL queries by reading execution plans and picking the right index strategy — composite, partial, coveri… |
| `safe-migrations` | Explains zero-downtime schema migrations for relational databases — expand-contract pattern, batch data backfills, lock… |
| `seed-data` | Explains reproducible seed data per environment — determinism, idempotency, dependency ordering, and masking real data … |
| `supabase-postgres` | Apply Supabase/Postgres best practices — indexes, RLS, schema design, queries, connection pooling. |

</details>
<details><summary><code>delivery</code> — 8 skills</summary>

| Skill | Uso |
|---|---|
| `docs-writing` | Technical documentation style guide for README, docs/, ADRs, JSDoc/TSDoc, and inline code comments. |
| `estimation` | Applies effort-estimation technique to any deliverable, technical or not — task decomposition, three-point estimation (… |
| `incident-postmortem` | Runs a blameless incident postmortem — timeline with timestamps, impact, root cause (5 whys), and corrective actions wi… |
| `proposta-comercial` | Transforma um briefing de cliente em proposta comercial de freela — escopo fechado (incluído/excluído), entregáveis, cr… |
| `to-issues` | Break a plan, spec, or PRD into independently-grabbable issues on the project issue tracker using tracer-bullet vertica… |
| `to-prd` | Turn the current conversation into a PRD and publish it to the project issue tracker — no interview, just synthesis of … |
| `triage` | Move issues and external PRs through a state machine of triage roles — categorise, verify, grill if needed, and write a… |
| `wish` | Capture, enrich and organise future ideas in a project's wishlist file, before they become tracked work. |

</details>
<details><summary><code>devops</code> — 11 skills</summary>

| Skill | Uso |
|---|---|
| `ci-cd-pipeline` | Defines standard CI/CD pipeline stages (lint, type-check, test, build), dependency caching, running migrations in CI, a… |
| `container-conventions` | Defines multi-stage Docker builds, minimal base images, non-root users, .dockerignore, layer cache ordering, and docker… |
| `environment-config` | Environment-based configuration conventions — .env.example, startup-time env validation (fail fast, not mid-request), a… |
| `error-tracking` | Apply production error tracking patterns — unhandled exception capture, contextual metadata, release/version tagging, t… |
| `health-checks-metrics` | Apply health check (readiness vs. |
| `project-deploy` | Executa o deploy de um projeto do usuário seguindo o runbook documentado no vault — checklist passo a passo, confirmaçã… |
| `resolving-merge-conflicts` | Use when you need to resolve an in-progress git merge/rebase conflict. |
| `rollback-runbook` | Defines a deploy-tool-agnostic rollback runbook — reverting a code deploy (blue-green/canary/previous artifact), why re… |
| `setup-pre-commit` | Set up Husky pre-commit hooks with lint-staged (Prettier), type checking, and tests in the current repo. |
| `stack-scaffold` | Scaffold a new project with the user's standard stack — React 18 + TypeScript + Tailwind + shadcn/ui, on Vite + Supabas… |
| `structured-logging` | Apply structured (JSON) logging practices — log levels, request/tenant correlation IDs, context propagation, and what m… |

</details>
<details><summary><code>frontend</code> — 8 skills</summary>

| Skill | Uso |
|---|---|
| `accessibility-audit` | Guides accessibility (a11y) auditing — automated tooling (axe-core) wired into CI as a floor not a substitute for manua… |
| `client-state-management` | Defines the boundary between server state, local UI state, and URL state as an architecture decision independent of sta… |
| `error-ux` | Defines client-side error handling — render error boundaries that isolate failure without crashing the whole tree, the … |
| `forms-validation` | Defines form validation as a single schema shared between client and server, with Brazilian document masks (CPF, CNPJ, … |
| `frontend-conventions` | Conventions for WRITING new frontend code — component structure and extraction, page files that only compose components… |
| `image-to-code` | Elite website image-to-code skill for Codex. |
| `react-best-practices` | React 18 + Vite performance rules — bundle size, re-renders, waterfalls, subscriptions. |
| `web-perf` | Analyzes web performance using Chrome DevTools MCP. |

</details>
<details><summary><code>meta</code> — 6 skills</summary>

| Skill | Uso |
|---|---|
| `skill-audit` | Audit installed Claude Code skills against the C1–C11 quality rubric — per-skill scores, automatic blockers, trigger-co… |
| `skill-creator` | Create new Claude Code skills from scratch and iteratively improve existing ones. |
| `skill-sync` | Sync the skill fleet against its upstreams — mattpocock/skills and lucasmonstrox/utevo-lux — diffing repo vs upstream, … |
| `token-audit` | Audit Claude Code token consumption across all sessions and projects — weekly trend, heaviest sessions/projects, marath… |
| `wizard` | Generates an interactive bash wizard for setup steps only a human can do — dashboards, credentials, CI secrets, one-off… |
| `writing-great-skills` | Reference for writing and editing skills well — the vocabulary and principles that make a skill predictable. |

</details>
<details><summary><code>quality</code> — 4 skills</summary>

| Skill | Uso |
|---|---|
| `code-reviewer` | Stack-specific review checklist for React + TanStack Query + Supabase multi-tenant apps — hook architecture, RLS/tenant… |
| `e2e-testing` | Guides writing reliable end-to-end tests — programmatic auth fixtures instead of UI login, per-run data isolation, acce… |
| `integration-testing` | Guides writing integration tests against real dependencies — disposable containers for database/services instead of moc… |
| `tdd` | Test-driven development. |

</details>
<details><summary><code>security</code> — 6 skills</summary>

| Skill | Uso |
|---|---|
| `auth-patterns` | Authentication and authorization patterns — OTP/password/OAuth/OIDC flows, session vs JWT, RBAC/ABAC, MFA, token refres… |
| `dependency-audit` | Audits third-party dependencies for security and maintainability — lockfile discipline, upgrade cadence (automatic patc… |
| `lgpd-checklist` | LGPD compliance checklist for projects handling personal data — data inventory, legal basis, retention/anonymization, d… |
| `multi-tenant-isolation-audit` | Audits multi-tenant systems for cross-tenant data leakage — missing isolation filters, privileged-role bypass (service_… |
| `secrets-management` | Manage secrets and sensitive config across environments and CI — classify sensitive vs. |
| `security-review-checklist` | Broad OWASP-style security sweep of a PR or release — injection, XSS, SSRF, IDOR/broken access control, CSRF, insecure … |

</details>
<details><summary><code>tcc</code> — 6 skills</summary>

| Skill | Uso |
|---|---|
| `tcc-auditoria-banca` | Simula o parecer escrito de uma banca avaliadora de TCC sobre o documento já redigido. |
| `tcc-defesa` | Monta a apresentação de defesa do TCC SyncClass a partir dos capítulos escritos — arco narrativo, roteiro slide a slide… |
| `tcc-fragmentos` | Captura matéria-prima bruta de TCC acadêmico — anotações de leitura, observações sobre código do projeto, decisões técn… |
| `tcc-grill` | Arguição acadêmica do TCC SyncClass — questiona hipóteses, metodologia, recorte, lacunas bibliográficas e validade dos … |
| `tcc-rascunho` | Transforma arquivo de fragmentos brutos em seção formal de TCC parágrafo a parágrafo, aplicando normas ABNT/FEPI, voz i… |
| `tcc-revisao-impessoal` | Varredura final de capítulo de TCC procurando primeira pessoa, clichês acadêmicos, informalidade, vocabulário fraco, ci… |

</details>
<details><summary><code>vault</code> — 4 skills</summary>

| Skill | Uso |
|---|---|
| `obsidian-vault` | Create, search, and link notes in jgabriel's personal Obsidian vault (C:\Users\jgabriel\Documents\Obsidian Vault) follo… |
| `project-kickoff` | Orchestrates the full workflow for starting a project from scratch — idea to production-ready spec, design system, and … |
| `project-planner` | Scaffolds a project's wiki pages in wiki/Projetos/ — index.md with frontmatter, subpage stubs and ADRs — from a directi… |
| `project-sync` | Reads docs/ from a project on D:/Projetos and creates or updates wiki/Projetos/<name>/ pages in the Obsidian vault. |

</details>
<!-- inventory:skills:end -->

---

## 3. Agents e commands

<!-- inventory:agents:start -->
**3 agents** — rodam em subagent isolado:

| Agent | Uso |
|---|---|
| `planner` | Breaks a task or feature into an ordered implementation plan with explicit dependencies, risks, and exit criteria. |
| `researcher` | Read-only code locator and codebase mapper. |
| `tcc-orientador` | Revisor acadêmico no papel de orientador severo de TCC. |
<!-- inventory:agents:end -->

<!-- inventory:commands:start -->
**11 slash commands:**

| Comando | Descrição |
|---|---|
| `/branch` | Cria branch nova a partir de main/master (atualizado) e faz switch. |
| `/commit` | Gera commit message Conventional Commits a partir do diff staged. |
| `/diff` | Diff resumido contra ref (branch, sha, HEAD~N). |
| `/map` | Mapa de um diretório — listagem por arquivo com responsabilidade detectada. |
| `/sync` | Sincroniza branch atual com remote — fetch, pull rebase, status final. |
| `/tcc-revisar` | Revisão acadêmica de capítulo do TCC via agent tcc-orientador. |
| `/tcc-status` | Snapshot do progresso do TCC SyncClass — status de cada capítulo (1-10), pendências, próximos passos. |
| `/undo` | Desfaz último commit (soft reset) — mantém mudanças staged, só remove o commit. |
| `/where` | Localiza onde símbolo, função, classe ou string é definido/usado. |
| `/why` | Contexto histórico de uma linha ou trecho — git blame + log + último commit que tocou. |
| `/wip` | Commit rápido WIP pra salvar progresso. |
<!-- inventory:commands:end -->

---

## 4. Plugins instalados (fora deste repo — gerenciados pelo Claude Code CLI)

Vêm de marketplaces externas, **não** do `jgabriel-skills`. Ficam em `~/.claude/plugins/` (cache + data), habilitados em `settings.json` → `enabledPlugins`.

| Plugin | Marketplace (repo) | O que adiciona |
|---|---|---|
| `caveman` | `juliusbrussee/caveman` | Modo de resposta comprimido (lite/full/ultra) + skills `caveman:*` (caveman-commit, caveman-review, cavecrew-*) |
| `context-mode` | `mksglu/context-mode` | Tools `ctx_*` (batch_execute, execute, search, fetch_and_index) — processa output fora da conversa |
| `socraticode` | `giancarloerra/socraticode` | Indexação semântica de codebase, dependency graph, tools `codebase_*` + agent `codebase-explorer` |
| `claude-obsidian` | `AgriciDaniel/claude-obsidian` | Skills `claude-obsidian:*` (wiki-ingest, wiki-lint, save, canvas, autoresearch) — gestão do vault como wiki |

Namespace nos nomes (`caveman:cavecrew-builder`, `claude-obsidian:wiki-lint`) indica que vem de plugin, não deste repo.

---

## 5. Hooks — componentes do plugin

Não há mais fiação manual em `settings.json`: o `.claude-plugin/plugin.json` declara os dois, e instalar o plugin os conecta. O caminho usa `${CLAUDE_PLUGIN_ROOT}` normalizado (`/c/...` do Git Bash vira `c:/...`), então funciona nas duas plataformas — antes o template trazia o caminho do node cravado em `C:/Program Files/nodejs/node.exe`.

| Hook | Dispara em | Função |
|------|-----------|--------|
| `context-mode-cache-heal.mjs` | `SessionStart` | Self-heal do cache do plugin context-mode (corrige paths quebrados por auto-update — issues #46915, #727, #577) |
| `guard-dangerous-bash.mjs` | `PreToolUse` (matcher `Bash`) | Bloqueia comandos catastróficos que escapariam do allowlist de permissions (ex.: `bash -c 'rm -rf /'`) — exit 2 + stderr bloqueia a tool call |

O `settings.template.json` ainda declara um hook `Stop` apontando para `stop-beep.ps1`, **arquivo que nunca foi versionado** — é local da máquina Windows. Ou versiona no `core`, ou remove a entrada do template.

---

## 6. MCP servers

**`.mcp.json` só é lido da raiz de um projeto.** Não existe `~/.claude/.mcp.json` — o
arquivo era symlinkado para lá até 2026-08-17 e nunca carregou nada. Servidor de escopo de
usuário mora em `~/.claude.json`, registrado por `claude mcp add -s user <nome> -- <cmd>`.

`claude/.mcp.json` neste repo é template de escopo de projeto: copiar para a raiz do projeto
que precisar dos servidores.

| Server | Comando | Uso |
|---|---|---|
| `github` | `npx @modelcontextprotocol/server-github` | Requer `GITHUB_PERSONAL_ACCESS_TOKEN` no ambiente |
| `supabase` | `npx @supabase/mcp-server-supabase@latest --read-only` | Requer `SUPABASE_ACCESS_TOKEN`. **Read-only** por flag explícita |

Servidores de usuário ativos hoje (em `~/.claude.json`, fora deste repo):
`codebase-memory-mcp`, `playwright`, `nanobanana-mcp`.

---

## 7. `settings.json` — pontos que não estão em CLAUDE.md

- `permissions.deny`: bloqueio hard de `rm -rf`/variantes, `sudo`, `mkfs`/`dd`/`shred`/`format`/`diskpart`, pipe curl|sh, leitura de `.env`/`secrets/**`/`*.pem`/`*.key`/`id_rsa`/`/etc/shadow`/`/etc/passwd`
- `permissions.ask`: `rm`/`rmdir`/`del`/`Remove-Item`, `sed`/`awk`, `git reset`/`push --force`/`clean`, publish (`npm`/`pnpm`/`yarn`), `docker rm`/`rmi`/`system prune`
- `statusLine`: comando `ccstatusline`, refresh 10s
- `skillListingBudgetFraction: 0.03` — limita % do context budget gasto listando skills disponíveis
- `autoUpdatesChannel: "latest"`

---

## 8. Setup prático

**MCP servers** — `.mcp.json` usa `${VAR}` placeholders, setar via env var de usuário:
```powershell
[System.Environment]::SetEnvironmentVariable('GITHUB_PERSONAL_ACCESS_TOKEN', 'ghp_xxx', 'User')
[System.Environment]::SetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'sbp_xxx', 'User')
```

**Settings** — copiar `settings.template.json` → `settings.json` e ajustar paths.

**Paths:**
- Global settings: `%USERPROFILE%\.claude\settings.json`
- Global skills: `%USERPROFILE%\.claude\skills\`
- Project-local: `<project>\.claude\`

---

_Última atualização: 2026-06-22._
