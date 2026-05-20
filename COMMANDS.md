# Quick Reference — Claude Code + Kiro IDE

Referência prática para uso e troubleshooting. Veja [README.md](./README.md)
para overview completo do repo.

---

## Slash commands do repo

15 comandos custom em `claude/commands/`. Lista resumida:

| Comando | Pra que serve |
|---------|---------------|
| `/branch` | Cria branch nova a partir de main atualizado |
| `/commit` | Gera Conventional Commit a partir do diff staged |
| `/diff` | Diff resumido vs ref + categorização |
| `/map` | Mapa de diretório (delega ao agent `researcher`) |
| `/plan` | Plano implementável ordenado (delega ao agent `planner`) |
| `/review` | Code review do diff atual (delega ao agent `reviewer`) |
| `/scope` | Quebra task em vertical slices independentes |
| `/status` | Snapshot do estado do repo |
| `/sync` | fetch + pull rebase + status |
| `/tcc-revisar` | Revisão acadêmica de capítulo (delega ao `tcc-orientador`) |
| `/tcc-status` | Snapshot do progresso TCC |
| `/undo` | Soft reset do último commit |
| `/where` | Localiza símbolo/função/string no codebase |
| `/why` | git blame + log de uma linha/trecho |
| `/wip` | Commit WIP rápido |

---

## Skills custom do repo

Skills disponíveis em `claude/skills/`. Invocação direta via `/<nome-da-skill>`
ou trigger natural pela descrição.

**Top-level:**
- `/docs-writing` — padrão de documentação técnica (Tier 1/2/3)

**Engineering (`engineering/`):**
- `/diagnose` — loop disciplinado pra bugs difíceis
- `/grill-with-docs` — sessão de grilling contra domain model
- `/improve-codebase-architecture` — busca deepening opportunities
- `/prototype` — throwaway prototype pra design
- `/tdd` — red-green-refactor loop
- `/to-issues` — quebra plano em GitHub issues (vertical slices)
- `/to-prd` — converte conversa em PRD
- `/triage` — state machine de triage roles
- `/zoom-out` — pede contexto/perspectiva ampla

**TCC (projeto SyncClass — `tcc/`):**
- `/tcc` — entry point TCC
- `/tcc-fragmentos` — fragmentos por capítulo
- `/tcc-rascunho` — escrita guiada
- `/tcc-revisao-impessoal` — revisão de voz impessoal

**Personal (`personal/`):**
- `/edit-article` — edição de artigos
- `/obsidian-vault` — workflows Obsidian

**Productivity (`productivity/`):**
- `/grill-me` — grilling reverso (user defende)
- `/handoff` — handoff de contexto

**Misc:**
- `/setup-pre-commit` — Husky + lint-staged + tsc + tests
- `/skill-creator` — bootstrap de nova skill

---

## Agents

4 subagents em `claude/agents/`. Não são invocados via `/comando` — usados pela
main thread via Task tool ou por slash commands que delegam.

| Agent | Função |
|-------|--------|
| `planner` | Quebra task em plano ordenado, deps, riscos |
| `researcher` | Localizador read-only (`path:line` table) |
| `reviewer` | Code review severity-tagged, sem praise |
| `tcc-orientador` | Orientador severo de TCC (PT-BR) |

---

## Hooks ativos

Em `claude/hooks/`. Carregados via `settings.json`.

- `guard-dangerous-bash.mjs` — PreToolUse hook. Bloqueia `rm -rf`, `git push --force`,
  `git reset --hard`, formatação de disco, escrita em devices, etc.
- `context-mode-cache-heal.mjs` — repara cache do plugin context-mode.
- `stop-beep.ps1` — beep no fim de cada turno (Windows).

---

## Setup Claude Code

**Instalar plugins recomendados:**

```
/plugin install caveman
/plugin install context-mode
```

**Diagnóstico:**

```
/caveman:caveman-help
/context-mode:ctx-doctor
```

**Listar plugins:**

```
/plugin list
```

**Trocar nível do caveman mode:**

```
/caveman lite|full|ultra
```

- `lite` — sem filler/hedging, frases completas
- `full` — drop articles, fragmentos OK (default)
- `ultra` — máxima compressão, abreviações

**Stats do context-mode:**

```
/context-mode:ctx-stats
```

**Upgrade do context-mode:**

```
/context-mode:ctx-upgrade
```

---

## Setup Kiro IDE

**Verificar steering carregado:**

1. Abrir projeto no Kiro
2. Status bar (canto inferior) mostra guides carregados
3. Se faltar, conferir `~/.kiro/steering/*.md`

**Listar steering files:**

```powershell
Get-ChildItem $env:USERPROFILE\.kiro\steering -Filter "*.md" | Select-Object Name
```

**Reload após editar steering:**

`Ctrl+Shift+P` → `Reload Window`

**Verificar MCP conectado:**

`Ctrl+,` → buscar "MCP" — confirmar `cli.json` resolve pra `~/.kiro/settings/cli.json`.

---

## Setup env vars (secrets)

`.mcp.json` neste repo usa placeholders `${VAR}`. Defina os tokens antes:

```powershell
[System.Environment]::SetEnvironmentVariable('GITHUB_PERSONAL_ACCESS_TOKEN', 'ghp_xxx', 'User')
[System.Environment]::SetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'sbp_xxx', 'User')
```

Restart o terminal/IDE depois pra picar as vars.

---

## Troubleshooting

### Plugin não instala

```
/plugin clear-cache
/plugin install <plugin-name>
```

### Steering files não carregam no Kiro

Verifica que arquivos existem em `~/.kiro/steering/` e tem extensão `.md`.
Reload window. Se ainda não carrega, abrir issue do Kiro IDE.

### MCP server não conecta

1. Confirma env var setada: `$env:GITHUB_PERSONAL_ACCESS_TOKEN`
2. Confirma `.mcp.json` aponta pro server certo
3. Restart Claude Code / Kiro
4. `/mcp list` pra ver status

---

## Paths importantes

| Propósito | Path Windows | Path Unix |
|-----------|--------------|-----------|
| Claude global settings | `%USERPROFILE%\.claude\settings.json` | `~/.claude/settings.json` |
| Claude global skills | `%USERPROFILE%\.claude\skills\` | `~/.claude/skills/` |
| Claude project-local | `<project>\.claude\` | `<project>/.claude/` |
| Kiro global steering | `%USERPROFILE%\.kiro\steering\` | `~/.kiro/steering/` |
| Kiro MCP config | `%USERPROFILE%\.kiro\settings\cli.json` | `~/.kiro/settings/cli.json` |

---

## Caveman mode (plugin `caveman`)

**Quando ativo:** drop articles (a/the), fragmentos OK, sem filler.

**Pattern:** `[thing] [action] [reason]. [next step].`

**Toggle:**

```
/caveman lite|full|ultra
stop caveman          # desativar
normal mode           # desativar
/caveman full         # reativar (default)
```

Code, commits, PRs e security warnings sempre em prosa normal — caveman só na
conversa.

---

## Context-mode (plugin `context-mode`)

Reduz consumo de context window indexando outputs grandes.

**Stats da sessão:**

```
/context-mode:ctx-stats
```

**Diagnóstico:**

```
/context-mode:ctx-doctor
```

**Upgrade:**

```
/context-mode:ctx-upgrade
```

**Purge knowledge base (destrutivo):**

```
/context-mode:ctx-purge
```

---

## Convenções

- **Idioma:** conversa/comentários em PT-BR. Código/identifiers em English.
  Commits e PRs em English (Conventional Commits).
- **Docs:** estrutura `docs/` tier-based (Tier 1: README; Tier 2: architecture,
  database, deployment; Tier 3: ADRs, runbooks, security). Veja `/docs-writing`.
- **Git:** commits novos > amend. Sem `--no-verify` sem autorização. Confirmar
  antes de ações destrutivas (`push --force`, `reset --hard`, etc).
- **Secrets:** nunca em commit/logs/PR. `.mcp.json` usa `${VAR}` placeholders.

Detalhes em `claude/CLAUDE.md` e `kiro/steering/*.md`.

---

_Updated: 2026-05-20_
