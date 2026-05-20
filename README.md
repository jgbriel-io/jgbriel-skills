# jgbriel-skills

Skills, regras e configurações reutilizáveis para **Claude Code** e **Kiro IDE**.
Replica meu setup completo em qualquer máquina — regras de código, steering global,
hooks, MCP config e skills customizadas (engineering, TCC, productivity, etc).

**Repo público.** Fork, clone, ou copie arquivos seletivamente para seu projeto.

---

## Estrutura

```
jgbriel-skills/
├── README.md
├── COMMANDS.md                       # quick reference de comandos
├── .gitignore
│
├── claude/                           # Claude Code global config (~/.claude)
│   ├── CLAUDE.md                     # regras globais (idioma, git, response style)
│   ├── GUIDE.md                      # guia rápido
│   ├── .mcp.json                     # MCP servers (placeholders ${VAR})
│   ├── settings.template.json        # settings.json sanitizado
│   ├── agents/                       # 4 agents (planner, researcher, reviewer, tcc-orientador)
│   ├── commands/                     # 15 slash commands custom
│   ├── hooks/                        # SessionStart / PreToolUse hooks
│   └── skills/                       # skills custom (docs-writing, tcc-*, engineering/*, etc)
│
└── kiro/                             # Kiro IDE global config (~/.kiro)
    ├── agents/                       # agent_config.json.example
    ├── powers/installed/             # supabase-hosted power
    ├── settings/                     # cli.json, mcp.json
    ├── skills/                       # caveman, find-skills
    └── steering/                     # 18 steering guides (language, git, security, etc)
```

---

## O que tem aqui

### Claude Code (`claude/`)

**Slash commands (`commands/`)** — 15 atalhos:

| Comando | Descrição |
|---------|-----------|
| `/branch` | Cria branch nova a partir de main atualizado |
| `/commit` | Gera commit Conventional Commits a partir do diff staged |
| `/diff` | Diff resumido contra ref + categorização |
| `/map` | Mapa de diretório via agent researcher |
| `/plan` | Quebra tarefa em plano ordenado via agent planner |
| `/review` | Code review do diff atual via agent reviewer |
| `/scope` | Quebra tarefa em vertical slices independentes |
| `/status` | Snapshot do estado do repo |
| `/sync` | fetch + pull rebase + status final |
| `/tcc-revisar` | Revisão acadêmica de capítulo TCC |
| `/tcc-status` | Snapshot do progresso do TCC |
| `/undo` | Soft reset do último commit |
| `/where` | Localiza símbolo/função/string |
| `/why` | git blame + log da linha |
| `/wip` | Commit WIP rápido |

**Agents (`agents/`)** — 4 subagents customizados:

- `planner` — quebra tarefas em plano ordenado com deps e riscos
- `researcher` — localizador read-only de código
- `reviewer` — code review severity-tagged, sem fluff
- `tcc-orientador` — orientador severo de TCC, feedback acadêmico

**Hooks (`hooks/`):**

- `guard-dangerous-bash.mjs` — bloqueia comandos destrutivos (`rm -rf`, `git push --force`, etc)
- `context-mode-cache-heal.mjs` — auto-cura cache do plugin context-mode
- `stop-beep.ps1` — beep no fim de cada turno

**Skills (`skills/`):**

- `docs-writing.md` — padrão de documentação técnica (Tier 1/2/3)
- `skill-creator/` — bootstrap de novas skills
- `engineering/` — `diagnose`, `grill-with-docs`, `improve-codebase-architecture`, `prototype`, `tdd`, `to-issues`, `to-prd`, `triage`, `zoom-out`
- `personal/` — `edit-article`, `obsidian-vault`
- `productivity/` — `grill-me`, `handoff`
- `tcc/` — `tcc`, `tcc-fragmentos`, `tcc-rascunho`, `tcc-revisao-impessoal` (skills do projeto SyncClass TCC)
- `misc/` — `setup-pre-commit`

**Config:**

- `CLAUDE.md` — regras globais (PT-BR conversa, English code/commits, git rules, security, response style)
- `GUIDE.md` — onboarding rápido
- `.mcp.json` — MCP servers (GitHub, Supabase) usando placeholders `${VAR}`
- `settings.template.json` — settings sanitizado (sem caminhos absolutos meus)

### Kiro IDE (`kiro/`)

- `steering/` — 18 guias globais: `language`, `code-editing`, `git`, `security`, `frontend`, `docs-style`, `tasks`, `response-style`, `system`, e variantes `g-*` (React, backend, frontend design, code-reviewer, SEO, Supabase, steering-guide)
- `skills/` — `caveman` (modo compressão), `find-skills`
- `powers/installed/` — `supabase-hosted` (power para projetos Supabase)
- `settings/` — `cli.json`, `mcp.json`
- `agents/` — `agent_config.json.example` (template)

---

## Como usar

### Opção 1: Clone direto pra home

```powershell
git clone https://github.com/jgbriel-io/jgbriel-skills.git
# Linka conteúdo no home (cuidado, sobrescreve seu config)
robocopy jgbriel-skills\claude $env:USERPROFILE\.claude /E
robocopy jgbriel-skills\kiro $env:USERPROFILE\.kiro /E
```

### Opção 2: Copiar arquivos seletivos

```powershell
git clone https://github.com/jgbriel-io/jgbriel-skills.git
# Pega só o que interessa
Copy-Item jgbriel-skills\claude\CLAUDE.md $env:USERPROFILE\.claude\
Copy-Item jgbriel-skills\kiro\steering\* $env:USERPROFILE\.kiro\steering\
```

### Opção 3: Submódulo

```bash
git submodule add https://github.com/jgbriel-io/jgbriel-skills.git .jgbriel-skills
# Symlink ou copia seletiva conforme sua stack
```

### Setup de secrets

`.mcp.json` usa env vars. Defina antes de usar MCP:

```powershell
[System.Environment]::SetEnvironmentVariable('GITHUB_PERSONAL_ACCESS_TOKEN', 'ghp_xxx', 'User')
[System.Environment]::SetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'sbp_xxx', 'User')
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
/plugin install caveman          # modo compressão (~75% menos tokens)
/plugin install context-mode     # reduz consumo de context window
```

---

## Contato

Adapte livremente. Melhorias? Abra issue ou PR.

Email: virtualarrow.dev@gmail.com
