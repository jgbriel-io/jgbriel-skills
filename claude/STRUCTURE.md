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
| `.mcp.json` | symlink | `claude/.mcp.json` (servers MCP) |
| `settings.template.json` | symlink | `claude/settings.template.json` |
| `skills/` | symlink | `claude/skills/` |
| `agents/` | symlink | `claude/agents/` |
| `commands/` | symlink | `claude/commands/` |
| `hooks/` | symlink | `claude/hooks/` |

**Não versionados** (ficam só em `~/.claude/`, nunca neste repo — contêm estado de máquina/segredos):

| Item | O que é |
|---|---|
| `settings.json` | Config real ativa (permissions, hooks wiring, plugins habilitados, model, statusLine) |
| `settings.local.json` | Overrides pessoais de permissão |
| `.credentials.json` | Tokens — **nunca ler/exibir** |
| `history.jsonl`, `sessions/`, `projects/`, `shell-snapshots/`, `paste-cache/`, `plans/`, `tasks/`, `ide/`, `daemon/`, `session-env/` | Estado runtime/sessão |
| `plugins/` | Plugins instalados (cache + dados, gerenciados pelo CLI — ver seção 4) |
| `.agents/` | Estado interno de subagents (não confundir com `agents/` symlink, que são as definições .md) |

Editar algo em `~/.claude/skills/foo.md` é o mesmo arquivo que `claude/skills/foo.md` neste repo — symlink, não cópia. Commitar aqui é o fluxo correto; editar direto em `~/.claude/` também funciona pois é o mesmo inode.

---

## 2. Skills do projeto (`skills/`) — 33 pastas

Lista completa com descrição exata (extraída do frontmatter `description:` de cada `SKILL.md` — fonte de verdade, não resumo):

| Skill | Trigger / uso |
|---|---|
| `code-reviewer` | Code review full-stack — arquitetura, qualidade, segurança, performance, UI/UX, TS |
| `design-taste-frontend` | Landing pages/portfolios anti-slop — direção de design real, audit-first em redesign |
| `diagnose` | Loop disciplinado de diagnóstico (reproduzir→minimizar→hipótese→instrumentar→fix→regressão) |
| `docs-writing` | Style guide pra README/docs/ADR/JSDoc — não cobre escrita acadêmica TCC |
| `edit-article` | Reestruturar/clarear/apertar prosa de artigo |
| `grill-me` | Interroga plano/design até alinhamento, resolvendo cada ramo da árvore de decisão |
| `grill-me-tcc` | Stress-test pré-banca do TCC SyncClass |
| `grill-with-docs` | Grilling que atualiza CONTEXT.md/ADRs inline conforme decisões cristalizam |
| `handoff` | Compacta conversa atual em doc de handoff pra outro agente |
| `high-end-visual-design` | Fontes/spacing/shadows/cards de agência premium — bloqueia defaults genéricos |
| `image-to-code` | Image-to-code elite pra Codex — gera própria imagem de design antes de implementar |
| `improve-codebase-architecture` | Oportunidades de deepening informadas por CONTEXT.md/docs/adr |
| `minimalist-ui` | Editorial monochromo, tipografia, bento grid flat — sem gradiente/shadow pesado |
| `obsidian-vault` | Buscar/criar/organizar notas no vault Obsidian com wikilinks |
| `prototype` | Prototype descartável — terminal app (lógica) ou múltiplas variações de UI |
| `react-best-practices` | Bundle size, re-renders, waterfalls, subscriptions — React 18 + Vite |
| `redesign-existing-projects` | Upgrade de site/app existente pra qualidade premium sem quebrar funcionalidade |
| `senior-backend` | Padrões Supabase + TanStack Query — hooks, mutations, real-time |
| `senior-frontend` | Componentes React, estado, Tailwind, acessibilidade, organização de arquivos |
| `seo-optimizer` | Keyword research, on-page/technical SEO, Core Web Vitals, schema |
| `setup-pre-commit` | Husky + lint-staged (Prettier) + type-check + tests |
| `skill-creator` | Criar/melhorar skills — scaffolding de SKILL.md |
| `supabase-postgres` | Índices, RLS, schema design, queries, connection pooling |
| `tcc-auditoria-banca` | Parecer simulado de banca avaliadora sobre o TCC já redigido |
| `tcc-fragmentos` | Captura matéria-prima bruta do TCC antes de virar texto formal |
| `tcc-rascunho` | Transforma fragmentos em texto formal de capítulo, parágrafo a parágrafo |
| `tcc-revisao-impessoal` | Varredura final — 1ª pessoa, clichês, citações órfãs, termos não explicados |
| `tdd` | Red-green-refactor, testes de integração |
| `to-issues` | Plano/PRD → issues independentes via vertical slices |
| `to-prd` | Conversa atual → PRD publicado no tracker |
| `triage` | State machine de triagem de issues |
| `ui-ux-pro-max` | 50 estilos, 21 paletas, 50 pares de fonte, 9 stacks — design system completo |
| `zoom-out` | Contexto mais amplo/perspectiva de alto nível sobre trecho de código |

**Assets extras** (não são skills, são recursos usados pelas skills acima):
`diagnose/scripts/hitl-loop.template.sh` · `skill-creator/references/*.md` + `templates/SKILL.template.md` · `ui-ux-pro-max/data/*.csv` + `scripts/*.py`.

---

## 3. Agents do projeto (`agents/`) — 4 definições

Diferente de skill (que injeta instruções no thread principal), agent roda em subagent isolado.

| Agent | Uso |
|---|---|
| `planner` | Quebra feature em plano ordenado com deps/riscos/critérios de saída. Read-only, nunca executa |
| `researcher` | Localizador read-only — "onde X é definido", "o que chama Y", mapeia diretório. Nunca propõe fix |
| `reviewer` | Review de diff/PR — 1 finding por linha, severity-tagged, local+fix. Silêncio = OK |
| `tcc-orientador` | Orientador severo de TCC — argumento/evidência/coesão/estrutura/aderência ABNT. Não edita, só dá parecer |

`/plan`, `/map`, `/review`, `/tcc-revisar` (em `commands/`) são as portas de entrada pra esses agents — ver `COMMANDS.md`.

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

## 5. Hooks (`hooks/`) — 2 scripts Node ativos

Wiring real em `settings.json` (não versionado) → `hooks.{SessionStart,PreToolUse}`.

| Hook | Dispara em | Função |
|---|---|---|
| `context-mode-cache-heal.mjs` | `SessionStart` | Self-heal do cache do plugin context-mode (corrige paths quebrados por auto-update — issues #46915, #727, #577) |
| `guard-dangerous-bash.mjs` | `PreToolUse` (matcher `Bash`) | Bloqueia comandos catastróficos que escapariam do allowlist de permissions (ex.: `bash -c 'rm -rf /'`) — exit 2 + stderr bloqueia a tool call |

---

## 6. MCP servers (`.mcp.json`)

| Server | Comando | Uso |
|---|---|---|
| `github` | `npx @modelcontextprotocol/server-github` | Requer `GITHUB_PERSONAL_ACCESS_TOKEN` no ambiente |
| `supabase` | `npx @supabase/mcp-server-supabase@latest --read-only` | Requer `SUPABASE_ACCESS_TOKEN`. **Read-only** por flag explícita |

---

## 7. `settings.json` — pontos que não estão em CLAUDE.md

- `permissions.deny`: bloqueio hard de `rm -rf`/variantes, `sudo`, `mkfs`/`dd`/`shred`/`format`/`diskpart`, pipe curl|sh, leitura de `.env`/`secrets/**`/`*.pem`/`*.key`/`id_rsa`/`/etc/shadow`/`/etc/passwd`
- `permissions.ask`: `rm`/`rmdir`/`del`/`Remove-Item`, `sed`/`awk`, `git reset`/`push --force`/`clean`, publish (`npm`/`pnpm`/`yarn`), `docker rm`/`rmi`/`system prune`
- `statusLine`: comando `ccstatusline`, refresh 10s
- `skillListingBudgetFraction: 0.03` — limita % do context budget gasto listando skills disponíveis
- `autoUpdatesChannel: "latest"`

---

_Última atualização: 2026-06-21._
