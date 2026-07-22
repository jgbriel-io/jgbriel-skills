# jgabriel-skills

Skills, regras e configurações reutilizáveis para **Claude Code**.
Replica meu setup completo em qualquer máquina — regras de código, steering global,
hooks, MCP config e skills customizadas (engineering, TCC, productivity, etc).

**Repo público.** Fork, clone, ou copie arquivos seletivamente para seu projeto.

---

## Estrutura

```
jgabriel-skills/
├── README.md
├── .gitignore
│
├── claude/                           # Claude Code global config (~/.claude)
│   ├── README.md                     # ordem de leitura dos docs abaixo
│   ├── CLAUDE.md                     # regras globais (idioma, git, response style)
│   ├── STRUCTURE.md                  # onde tudo mora, settings.json, MCP, hooks, plugins
│   ├── COMMANDS.md                   # tabela de slash commands
│   ├── WORKFLOWS.md                  # receitas combinando commands + skills + agents
│   ├── GUIDE.md                      # cheat sheet condensado
│   ├── .mcp.json                     # MCP servers (placeholders ${VAR})
│   ├── settings.template.json        # settings.json sanitizado
│   ├── agents/                       # 4 agents (planner, researcher, reviewer, tcc-orientador)
│   ├── commands/                     # 15 slash commands custom
│   ├── hooks/                        # SessionStart / PreToolUse hooks (2 scripts)
│   └── skills/                       # 33 skills, pasta flat (sem subpastas por categoria)
│
├── templates/                        # templates de projeto, pra copiar em qualquer repo
│   ├── CONTEXT.template.md           # glossário de domínio (1 contexto)
│   └── CONTEXT-MAP.template.md       # glossário pra repo com múltiplos contextos
│
    ├── COMMANDS.md                   # quick reference de steering/agents/skills/powers
    ├── GUIDE.md                      # guia rápido de setup
    ├── agents/                       # 4 agents JSON (planner, researcher, reviewer, tcc-orientador)
    ├── powers/installed/             # supabase-hosted power
    ├── settings/                     # cli.json, mcp.json
    ├── skills/                       # caveman, find-skills
    └── steering/
        ├── global/                   # sempre ativos (inclusion: always) — 10 guias
        ├── tech/                     # expertise técnica (inclusion: manual/fileMatch)
        ├── engineering/              # workflows de engenharia (inclusion: manual)
        ├── misc/                     # utilitários (inclusion: manual)
        ├── personal/                 # edit-article, obsidian-vault (inclusion: manual)
        ├── productivity/             # grill-me, handoff (inclusion: manual)
        └── tcc/                      # TCC SyncClass (inclusion: manual)
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

**Skills (`skills/`)** — 33 pastas, flat (sem subpastas por categoria):

`code-reviewer`, `design-direction`, `diagnose`, `docs-writing`, `edit-article`, `grill-me`, `grill-me-tcc`, `grill-with-docs`, `handoff`, `high-end-visual-design`, `image-to-code`, `improve-codebase-architecture`, `minimalist-ui`, `obsidian-vault`, `prototype`, `react-best-practices`, `redesign-existing-projects`, `senior-backend`, `senior-frontend`, `seo-optimizer`, `setup-pre-commit`, `skill-creator`, `supabase-postgres`, `tcc-auditoria-banca`, `tcc-fragmentos`, `tcc-rascunho`, `tcc-revisao-impessoal`, `tdd`, `to-issues`, `to-prd`, `triage`, `ui-ux-pro-max`, `zoom-out`

Lista com descrição completa: `claude/STRUCTURE.md`.

**Config:**

- `CLAUDE.md` — regras globais (PT-BR conversa, English code/commits, git rules, security, response style)
- `STRUCTURE.md` — onde tudo mora (symlinks, settings.json, MCP, hooks, plugins), setup prático
- `GUIDE.md` — onboarding rápido
- `.mcp.json` — MCP servers (GitHub, Supabase) usando placeholders `${VAR}`
- `settings.template.json` — settings sanitizado (sem caminhos absolutos meus)

### Templates de projeto (`templates/`)

Templates pra copiar como arquivo novo em qualquer projeto (não são config do Claude Code):

- `CONTEXT.template.md` — glossário de domínio de um contexto só. Formato e regras de uso: `claude/skills/grill-with-docs/CONTEXT-FORMAT.md`.
- `CONTEXT-MAP.template.md` — pra repo com múltiplos contextos (monorepo/DDD), lista os contextos e como se relacionam.


---

## Como usar

### Opção 1: Clone direto pra home

```powershell
git clone https://github.com/jgbriel-io/jgbriel-skills.git
# Linka conteúdo no home (cuidado, sobrescreve seu config)
robocopy jgbriel-skills\claude $env:USERPROFILE\.claude /E
```

### Opção 2: Copiar arquivos seletivos

```powershell
git clone https://github.com/jgbriel-io/jgbriel-skills.git
# Pega só o que interessa
Copy-Item jgbriel-skills\claude\CLAUDE.md $env:USERPROFILE\.claude\
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
