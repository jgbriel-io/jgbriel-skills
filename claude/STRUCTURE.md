# Claude Code — Estrutura e Configuração

> Regras de comportamento: [CLAUDE.md](CLAUDE.md) · Receitas: [WORKFLOWS.md](WORKFLOWS.md) · Cheat sheet: [GUIDE.md](GUIDE.md)
> Este arquivo documenta **onde tudo mora** e **como se conecta**.

---

## 1. Duas máquinas, um plugin

O repo **é** o plugin. Nada dele é copiado à mão para `~/.claude/`: instalar pelo
marketplace resolve skills, commands, agents e hooks de uma vez, e a instalação é
uma cópia versionada em `~/.claude/plugins/cache/jgbriel/jgbriel-skills/<versão>/`.

Isso vale igual nas duas máquinas — Windows (principal) e Ubuntu (trabalho). O que
muda entre elas são só os caminhos absolutos.

**O que fica em `~/.claude/` e nunca neste repo** — estado de máquina e segredo:

| Item | O que é |
|---|---|
| `settings.json` | Config ativa: permissions, model, statusLine, plugins habilitados |
| `settings.local.json` | Overrides pessoais de permissão |
| `.credentials.json` | Tokens — **nunca ler nem exibir** |
| `history.jsonl`, `sessions/`, `projects/`, `shell-snapshots/`, `plans/`, `tasks/` | Estado de runtime e de sessão |
| `plugins/` | Cache dos plugins instalados, gerenciado pelo CLI |

**Layout antigo.** Antes do plugin, `~/.claude/{skills,agents,commands,hooks}`
eram symlinks para dentro de um clone deste repo. Esses caminhos não existem mais:
um `git pull` deixa os links pendurados e a sessão abre sem nada, inclusive sem o
`guard-dangerous-bash`. No Windows, `scripts/migrate-windows.ps1` desfaz isso.

---

## 2. Skills

Gerada a partir da árvore por `scripts/gen-inventory.py` — não editar à mão.

<!-- inventory:skills:start -->
**85 skills**, em 13 pastas de categoria:

<details><summary><code>backend</code> — 6 skills</summary>

| Skill | Uso |
|---|---|
| `api-design` | Applies stack-agnostic REST API design conventions — resource naming, HTTP verbs, status codes, error envelope, version… |
| `backend-service-conventions` | Framework-agnostic conventions for backend service structure — layering (controller/service/repository), dependency inj… |
| `background-jobs` | Designs asynchronous background work — job queues, retry/backoff policies, idempotency keys, dead-letter handling — ind… |
| `caching-strategy` | Applies stack-agnostic caching strategy — layers (client, server, CDN), invalidation policy, cache-aside vs write-throu… |
| `input-validation` | Validates untrusted input at every system boundary — API requests, queue messages, uploads, CLI args — via schema defin… |
| `rate-limiting` | Stack-agnostic rate limiting and throttling — token bucket vs sliding/fixed window algorithms, where to enforce limits … |

</details>
<details><summary><code>career</code> — 3 skills</summary>

| Skill | Uso |
|---|---|
| `cv-sync` | Pipeline do currículo: edita os .tex canônicos, recompila, distribui para o site e o vault, commita e confere a produçã… |
| `job-description-analyzer` | Analisa uma vaga contra o perfil do usuário — requisito obrigatório separado do desejável, nota de aderência, lacunas, … |
| `resume-tailor` | Adapta o currículo para uma vaga específica sem inventar nada — reordena habilidades, reescreve bullets para a linguage… |

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
| `fable-method` | An evidence-first problem-solving loop for work outside code — money and pricing decisions, marketing and content, rese… |
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
| `project-deploy` | Executa o deploy de um projeto seguindo o runbook documentado no vault — checklist passo a passo, confirmação antes de … |
| `resolving-merge-conflicts` | Resolve os conflitos de um merge ou rebase já em andamento — lê a intenção original de cada lado antes de escolher, pre… |
| `rollback-runbook` | Defines a deploy-tool-agnostic rollback runbook — reverting a code deploy (blue-green/canary/previous artifact), why re… |
| `setup-pre-commit` | Set up Husky pre-commit hooks with lint-staged (Prettier), type checking, and tests in the current repo. |
| `stack-scaffold` | Scaffold a new project with the user's standard stack — React 18 + TypeScript + Tailwind + shadcn/ui, on Vite + Supabas… |
| `structured-logging` | Apply structured (JSON) logging practices — log levels, request/tenant correlation IDs, context propagation, and what m… |

</details>
<details><summary><code>frontend</code> — 9 skills</summary>

| Skill | Uso |
|---|---|
| `accessibility-audit` | Guides accessibility (a11y) auditing — automated tooling (axe-core) wired into CI as a floor not a substitute for manua… |
| `client-state-management` | Defines the boundary between server state, local UI state, and URL state as an architecture decision independent of sta… |
| `error-ux` | Defines client-side error handling — render error boundaries that isolate failure without crashing the whole tree, the … |
| `forms-validation` | Defines form validation as a single schema shared between client and server, with Brazilian document masks (CPF, CNPJ, … |
| `frontend-conventions` | Conventions for WRITING new frontend code — component structure and extraction, page files that only compose components… |
| `react-best-practices` | React 18 + Vite performance rules — bundle size, re-renders, waterfalls, subscriptions. |
| `supabase-hooks` | Client data layer for Supabase + TanStack Query — custom hooks, mutations, queries, real-time subscriptions, error hand… |
| `tanstack-query-patterns` | Client data layer with TanStack Query 5 + Axios — service pattern, module-prefixed query keys, mutations, cache invalid… |
| `web-perf` | Analyzes web performance using Chrome DevTools MCP. |

</details>
<details><summary><code>meta</code> — 5 skills</summary>

| Skill | Uso |
|---|---|
| `skill-audit` | Audit Claude Code skills against the fleet's reference implementation — a mechanical sweep first, then criterion-by-cri… |
| `skill-sync` | Sync the skill fleet against its upstreams — mattpocock/skills and lucasmonstrox/utevo-lux — diffing repo vs upstream, … |
| `token-audit` | Audit Claude Code token consumption across sessions and projects — weekly trend, heaviest sessions and projects, marath… |
| `wizard` | Generates an interactive bash wizard for setup steps only a human can do — dashboards, credentials, CI secrets, one-off… |
| `writing-great-skills` | Reference for writing and editing skills well — the vocabulary and principles that make a skill predictable. |

</details>
<details><summary><code>quality</code> — 4 skills</summary>

| Skill | Uso |
|---|---|
| `code-reviewer` | Stack-specific review checklist for React + TanStack Query + Supabase multi-tenant apps — hook architecture, RLS/tenant… |
| `e2e-testing` | Guides writing reliable end-to-end tests — programmatic auth fixtures instead of UI login, per-run data isolation, acce… |
| `integration-testing` | Guides writing integration tests against real dependencies — disposable containers for database/services instead of moc… |
| `tdd` | O loop red-green-refactor e o que faz um teste sobreviver a refactor — comportamento por interface pública, seam acorda… |

</details>
<details><summary><code>security</code> — 6 skills</summary>

| Skill | Uso |
|---|---|
| `auth-patterns` | Authentication and authorization patterns — OTP/password/OAuth/OIDC flows, session vs JWT, RBAC/ABAC, MFA, token refres… |
| `dependency-audit` | Audits third-party dependencies for security and maintainability — lockfile discipline, upgrade cadence (automatic patc… |
| `lgpd-checklist` | LGPD compliance checklist for projects handling personal data — data inventory, legal basis, retention/anonymization, d… |
| `multi-tenant-isolation-audit` | Audits multi-tenant systems for cross-tenant data leakage — missing isolation filters, privileged-role bypass (service_… |
| `secrets-management` | Manage secrets and sensitive config across environments and CI — classify sensitive vs. |
| `security-review-checklist` | Varredura OWASP de um PR ou release — injection, XSS, SSRF, IDOR, CSRF, desserialização insegura — como checklist explí… |

</details>
<details><summary><code>tcc</code> — 6 skills</summary>

| Skill | Uso |
|---|---|
| `tcc-auditoria-banca` | Simula o parecer escrito de uma banca avaliadora sobre o TCC já redigido: conceito por critério (normas, problema, refe… |
| `tcc-defesa` | Monta a apresentação de defesa do TCC SyncClass a partir dos capítulos escritos — arco narrativo, roteiro slide a slide… |
| `tcc-fragmentos` | Captura matéria-prima bruta de TCC — anotações de leitura, decisões técnicas, citações, ideias soltas — em arquivo de f… |
| `tcc-grill` | Arguição acadêmica do TCC SyncClass — questiona hipóteses, metodologia, recorte, lacunas bibliográficas e validade dos … |
| `tcc-rascunho` | Transforma fragmentos brutos em seção formal de TCC, parágrafo a parágrafo, aplicando normas ABNT/FEPI, voz impessoal e… |
| `tcc-revisao-impessoal` | Varredura final de capítulo de TCC procurando primeira pessoa, clichês acadêmicos, informalidade, vocabulário fraco, ci… |

</details>
<details><summary><code>vault</code> — 4 skills</summary>

| Skill | Uso |
|---|---|
| `obsidian-vault` | Cria, busca e conecta notas no vault pessoal do Obsidian seguindo as convenções da wiki — estrutura de pastas, wikilink… |
| `project-kickoff` | Orquestra o começo de um projeto do zero, da ideia ao spec, design system e plano de implementação, invocando as skills… |
| `project-planner` | Scaffolds a project's wiki pages in wiki/Projetos/ — index.md with frontmatter, subpage stubs and ADRs — from a directi… |
| `project-sync` | Lê a pasta `docs/` de um projeto e cria ou atualiza as páginas dele em `wiki/Projetos/` no vault do Obsidian, espelhand… |

</details>
<!-- inventory:skills:end -->

Uma skill nova só existe depois que o caminho dela entra na lista `skills` do
`.claude-plugin/plugin.json`. Pasta solta em `skills/` não é descoberta sozinha, e
`claude plugin validate` passa mesmo assim — quem mostra a verdade é
`claude plugin details`.

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

## 4. Hooks — componentes do plugin

Sem fiação manual em `settings.json`: o `plugin.json` declara os três e instalar
o plugin conecta. O caminho usa `${CLAUDE_PLUGIN_ROOT}` normalizado (o `/c/...` do
Git Bash vira `c:/...`), então roda nas duas plataformas.

| Hook | Dispara em | Função |
|---|---|---|
| `guard-dangerous-bash.mjs` | `PreToolUse` (matcher `Bash`) | Bloqueia comando catastrófico que escaparia do allowlist — `exit 2` + stderr barra a tool call |
| `context-mode-cache-heal.mjs` | `SessionStart` | Cura o cache do plugin context-mode, que quebra caminho em auto-update |
| `printf '\a'` | `Stop` | Beep ao terminar. Era um `.ps1` cravado numa máquina só; virou uma linha |

---

## 5. Plugins de terceiros

Vêm de marketplaces externas, não deste repo. Ficam em `~/.claude/plugins/`.

| Plugin | Marketplace | O que adiciona |
|---|---|---|
| `caveman` | `juliusbrussee/caveman` | Modo de resposta comprimido + skills `caveman:*` |
| `ponytail` | `ponytail` | Modo YAGNI: a solução mais preguiçosa que funciona |
| `context-mode` | `mksglu/context-mode` | Tools `ctx_*` — processa output grande fora da conversa |

O namespace no nome (`caveman:cavecrew-builder`) indica que veio de plugin. Os
comandos de cada um estão em [GUIDE.md](GUIDE.md).

---

## 6. MCP servers

**`.mcp.json` só é lido da raiz de um projeto.** Não existe `~/.claude/.mcp.json`;
servidor de escopo de usuário mora em `~/.claude.json`, registrado por
`claude mcp add -s user <nome> -- <cmd>`.

`claude/.mcp.json` aqui é template de escopo de projeto, com placeholders `${VAR}`
— copiar para a raiz do projeto que precisar.

| Server | Comando | Uso |
|---|---|---|
| `github` | `npx @modelcontextprotocol/server-github` | Requer `GITHUB_PERSONAL_ACCESS_TOKEN` no ambiente |
| `supabase` | `npx @supabase/mcp-server-supabase@latest --read-only` | Requer `SUPABASE_ACCESS_TOKEN`; read-only por flag explícita |

---

## 7. `settings.json` — o que não está em CLAUDE.md

- `permissions.deny`: `rm -rf` e variantes, `sudo`, `mkfs`/`dd`/`shred`, `curl | sh`, leitura de `.env`/`secrets/**`/`*.pem`/`*.key`/`id_rsa`
- `permissions.ask`: `rm`/`Remove-Item`, `sed`/`awk`, `git reset`/`push --force`/`clean`, publish de pacote, `docker rm`/`system prune`
- `skillListingBudgetFraction: 0.06` — fração da janela reservada para listar skills. O default é `0.01`, que dá 8.000 chars: a frota sozinha passa de 30.000, e acima do teto o Claude Code **corta as descrições**, deixando só o nome. Skill sem descrição visível não é escolhida sozinha
- `statusLine`: `ccstatusline`, refresh 10s
- `autoUpdatesChannel: "latest"`

---

## 8. Scripts

| Script | O que faz |
|---|---|
| `gen-inventory.py` | Regenera as tabelas deste arquivo e do README. `--check` falha se estiverem defasadas |
| `check-doc-refs.py` | Falha quando a prosa cita comando ou skill que não existe mais |
| `audit-sweep.py` | Passada mecânica do `/skill-audit`: tamanho contra a referência, frontmatter, link quebrado, resíduo de outra ferramenta |
| `check-project-skills.sh` | Acha skill de projeto sombreada por skill pessoal de mesmo nome |
| `migrate-windows.ps1` | Tira a máquina do layout antigo de symlink e instala o plugin |
| `audit-labels.sh` | Confere os labels dos issues |

Os dois primeiros rodam no CI, em push na `main` e em todo PR.

---

## 9. Setup

```bash
claude plugin marketplace add jgbriel-io/jgbriel-skills
claude plugin install jgbriel-skills@jgbriel
```

Para desenvolver, aponte o marketplace para o working copy. O runtime continua
sendo cópia versionada: **sem subir o `version` no `plugin.json`, o `update` não
tem o que instalar e a alteração não chega, sem erro nenhum.**

Secrets dos MCP servers, via env var de usuário:

```powershell
[System.Environment]::SetEnvironmentVariable('GITHUB_PERSONAL_ACCESS_TOKEN', 'ghp_xxx', 'User')
```

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx   # no ~/.bashrc
```
