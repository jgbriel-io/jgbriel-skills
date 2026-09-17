# jgbriel-skills

O meu setup de **Claude Code** inteiro, como um plugin instalável: skills por
categoria, slash commands, agents, hooks e as regras globais de comportamento.
Uma máquina nova fica igual à antiga com dois comandos.

**Repo público.** Fork, clone, ou pegue só o que servir.

---

## Estrutura

O repositório **é** o plugin: a raiz tem o manifesto, e cada componente fica na
pasta que o Claude Code espera.

```
jgbriel-skills/
├── .claude-plugin/
│   ├── plugin.json           # manifesto: hooks + cada caminho de skill, declarado um a um
│   └── marketplace.json      # 1 plugin, source "./"
│
├── skills/<categoria>/<nome>/SKILL.md    # uma pasta por categoria
├── agents/*.md                           # subagents
├── commands/*.md                         # slash commands
├── hooks/*.mjs                           # conectados pelo manifesto, não por settings.json
│
├── scripts/
│   ├── gen-inventory.py          # regenera os inventários deste README e do STRUCTURE
│   ├── check-doc-refs.py         # falha se a doc citar comando ou skill que não existe
│   ├── check-project-skills.sh   # acha skill de projeto sombreada por skill pessoal
│   ├── migrate-windows.ps1       # tira a máquina do layout antigo de symlink
│   └── audit-labels.sh
│
├── templates/                    # templates de projeto, pra copiar em qualquer repo
│   ├── CONTEXT.template.md
│   └── CONTEXT-MAP.template.md
│
└── claude/                       # documentação e config de referência
    ├── CLAUDE.md                 # regras globais (idioma, git, response style)
    ├── STRUCTURE.md              # onde tudo mora, settings, MCP, hooks
    ├── COMMANDS.md · WORKFLOWS.md · GUIDE.md
    ├── settings.template.json    # settings.json sanitizado
    ├── config/                   # referência de formatos
    └── skills-archived/          # fora de circulação, não entram no plugin
```

**A nomenclatura de skill importa**: o `plugin.json` lista cada caminho
explicitamente. Uma skill nova só existe depois de entrar nessa lista — pasta
solta em `skills/` não é descoberta sozinha.

---

## O que tem aqui

### Claude Code (`claude/`)

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

<!-- inventory:agents:start -->
**3 agents** — rodam em subagent isolado:

| Agent | Uso |
|---|---|
| `planner` | Breaks a task or feature into an ordered implementation plan with explicit dependencies, risks, and exit criteria. |
| `researcher` | Read-only code locator and codebase mapper. |
| `tcc-orientador` | Revisor acadêmico no papel de orientador severo de TCC. |
<!-- inventory:agents:end -->

**Hooks** — conectados pelo próprio plugin, sem fiação em `settings.json`:

- `guard-dangerous-bash.mjs` — bloqueia comandos destrutivos (`rm -rf`, `git push --force`) no `PreToolUse`
- `context-mode-cache-heal.mjs` — auto-cura o cache do plugin context-mode no `SessionStart`

<!-- inventory:skills:start -->
**86 skills**, em 13 pastas de categoria:

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
| `cv-sync` | Pipeline do currículo: edita os .tex canônicos, recompila, distribui para o site e o vault, commita e confere a produçã… |
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
| `project-deploy` | Executa o deploy de um projeto do usuário seguindo o runbook documentado no vault — checklist passo a passo, confirmaçã… |
| `resolving-merge-conflicts` | Resolve os conflitos de um merge ou rebase já em andamento — lê a intenção original de cada lado antes de escolher, pre… |
| `rollback-runbook` | Defines a deploy-tool-agnostic rollback runbook — reverting a code deploy (blue-green/canary/previous artifact), why re… |
| `setup-pre-commit` | Set up Husky pre-commit hooks with lint-staged (Prettier), type checking, and tests in the current repo. |
| `stack-scaffold` | Scaffold a new project with the user's standard stack — React 18 + TypeScript + Tailwind + shadcn/ui, on Vite + Supabas… |
| `structured-logging` | Apply structured (JSON) logging practices — log levels, request/tenant correlation IDs, context propagation, and what m… |

</details>
<details><summary><code>frontend</code> — 7 skills</summary>

| Skill | Uso |
|---|---|
| `accessibility-audit` | Guides accessibility (a11y) auditing — automated tooling (axe-core) wired into CI as a floor not a substitute for manua… |
| `client-state-management` | Defines the boundary between server state, local UI state, and URL state as an architecture decision independent of sta… |
| `error-ux` | Defines client-side error handling — render error boundaries that isolate failure without crashing the whole tree, the … |
| `forms-validation` | Defines form validation as a single schema shared between client and server, with Brazilian document masks (CPF, CNPJ, … |
| `frontend-conventions` | Conventions for WRITING new frontend code — component structure and extraction, page files that only compose components… |
| `react-best-practices` | React 18 + Vite performance rules — bundle size, re-renders, waterfalls, subscriptions. |
| `web-perf` | Analyzes web performance using Chrome DevTools MCP. |

</details>
<details><summary><code>meta</code> — 6 skills</summary>

| Skill | Uso |
|---|---|
| `skill-audit` | Audit installed Claude Code skills against the C1–C11 quality rubric — per-skill scores, automatic blockers, trigger-co… |
| `skill-creator` | Create new Claude Code skills from scratch and iteratively improve existing ones. |
| `skill-sync` | Sync the skill fleet against its upstreams — mattpocock/skills and lucasmonstrox/utevo-lux — diffing repo vs upstream, … |
| `token-audit` | Audita consumo de token do Claude Code entre sessões e projetos — tendência semanal, sessões e projetos mais pesados, s… |
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
| `project-sync` | Reads docs/ from a project on D:/Projetos and creates or updates wiki/Projetos/<name>/ pages in the Obsidian vault. |

</details>
<!-- inventory:skills:end -->

**Config:**

- `CLAUDE.md` — regras globais (PT-BR conversa, English code/commits, git rules, security, response style)
- `STRUCTURE.md` — onde tudo mora: plugin, hooks, MCP, `settings.json`, scripts, setup
- `WORKFLOWS.md` — receitas: qual skill encadear com qual
- `GUIDE.md` — cheat sheet de plugin de terceiro e de onde a config mora
- `.mcp.json` — template de MCP servers de **escopo de projeto** (GitHub, Supabase) com placeholders `${VAR}`. Copiar para a raiz do projeto; `~/.claude/.mcp.json` não é lido
- `settings.template.json` — settings sanitizado (sem caminhos absolutos meus)

### Templates de projeto (`templates/`)

Templates pra copiar como arquivo novo em qualquer projeto (não são config do Claude Code):

- `CONTEXT.template.md` — glossário de domínio de um contexto só. Formato e regras de uso: a skill `domain-modeling` (`skills/core-loop/domain-modeling/`).
- `CONTEXT-MAP.template.md` — pra repo com múltiplos contextos (monorepo/DDD), lista os contextos e como se relacionam.


---

## Como usar

Isto é um **plugin do Claude Code**. Instalar é registrar o marketplace e instalar:

```bash
claude plugin marketplace add jgbriel-io/jgbriel-skills
claude plugin install jgbriel-skills@jgbriel
```

Skills, commands, agents e hooks chegam juntos, e os hooks se conectam sozinhos —
não há nada para copiar para `~/.claude/` nem `settings.json` para editar à mão.

### Vindo do layout antigo de symlinks

Antes do plugin, `~/.claude/{skills,agents,commands,hooks}` eram symlinks para
dentro de um clone deste repo. Esses caminhos não existem mais na `main`: depois
de um `git pull` os links ficam pendurados e o Claude Code abre sem skill, sem
agent e sem o `guard-dangerous-bash`. No Windows,
`scripts/migrate-windows.ps1` desfaz os links e instala o plugin — e para quando
encontra um diretório de verdade em vez de um link, porque ali existe algo que
nunca esteve no repo.

Para desenvolver as skills, aponte o marketplace para o próprio working copy:

```bash
claude plugin marketplace add /caminho/para/jgbriel-skills
```

Uma marketplace de diretório lê a árvore direto, sem clonar. O runtime continua
sendo uma cópia versionada: depois de editar, suba o `version` em
`.claude-plugin/plugin.json` e rode `claude plugin update jgbriel-skills@jgbriel`.
**Sem o bump, o update não tem o que instalar e a alteração não chega.**

### Setup de secrets

`.mcp.json` usa env vars, e só é lido da **raiz de um projeto** — copie para lá em vez de
apontar para `~/.claude/`. Servidor de escopo de usuário se registra com
`claude mcp add -s user <nome> -- <cmd>` e mora em `~/.claude.json`.

Defina as vars antes de usar MCP:

```powershell
[System.Environment]::SetEnvironmentVariable('GITHUB_PERSONAL_ACCESS_TOKEN', 'ghp_xxx', 'User')
[System.Environment]::SetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'sbp_xxx', 'User')
```

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx   # no ~/.bashrc
export SUPABASE_ACCESS_TOKEN=sbp_xxx
```

---

## O que NÃO tá aqui

- Plugins instalados (`caveman`, `context-mode`, etc) — reinstalar via marketplace
- Chat history, sessions, caches locais
- `settings.json` real (com paths absolutos meus) — use `settings.template.json` como base
- `.credentials.json` e secrets — defina via env vars
- Scripts de sync entre máquinas — fork e adapte conforme sua stack

---

## Plugins recomendados

Instale via marketplace do Claude Code:

```
/plugin install caveman          # modo de resposta comprimido
/plugin install ponytail         # YAGNI: a solução mais preguiçosa que funciona
/plugin install context-mode     # processa output grande fora da conversa
```

`claude plugin install a b c` instala só o `a` e ignora o resto sem avisar — um
comando por plugin.

---

## Contato

Adapte livremente. Melhorias? Abra issue ou PR.

Email: virtualarrow.dev@gmail.com
