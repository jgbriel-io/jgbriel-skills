# Claude Code — Commands Reference

> Workflows práticos combinando commands + skills + agents: ver **`WORKFLOWS.md`**

## Slash Commands (`commands/`)

| Comando | Descrição |
|---------|-----------|
| `/branch` | Cria branch nova a partir de main atualizado |
| `/commit` | Gera Conventional Commit a partir do diff staged |
| `/diff` | Diff resumido vs ref + categorização das mudanças |
| `/map` | Mapa de diretório (delega ao agent `researcher`) |
| `/plan` | Plano implementável ordenado (delega ao agent `planner`) |
| `/review` | Code review do diff atual (delega ao agent `reviewer`) |
| `/scope` | Quebra task em vertical slices independentes |
| `/status` | Snapshot do estado do repo (branch, staged, ahead/behind) |
| `/sync` | fetch + pull rebase + status final |
| `/tcc-revisar` | Revisão acadêmica de capítulo TCC (delega ao agent `tcc-orientador`) |
| `/tcc-status` | Snapshot do progresso TCC SyncClass |
| `/undo` | Soft reset do último commit (mantém mudanças staged) |
| `/where` | Localiza símbolo/função/string no codebase |
| `/why` | git blame + log de uma linha/trecho |
| `/wip` | Commit WIP rápido sem ritual de mensagem |

---

## Skills (`skills/`)

Invocação: `/<nome-da-skill>` ou trigger natural via descrição.

### `tech/` — Expertise técnica

| Skill | Descrição |
|-------|-----------|
| `/code-reviewer` | Checklist completo: arquitetura, qualidade, segurança, performance, UI/UX, TypeScript |
| `/frontend-design` | UI distinta e production-grade, anti-generic aesthetic |
| `/react-best-practices` | Bundle size, re-renders, waterfalls, composição de componentes |
| `/senior-backend` | TanStack Query, Supabase hooks/mutations, padrões de serviço |
| `/senior-frontend` | Componentes, estado, Tailwind, acessibilidade |
| `/seo-optimizer` | On-page, technical SEO, Core Web Vitals, schema markup |
| `/supabase-postgres` | Indexes, RLS, schema design, queries performáticas |

### `engineering/` — Workflows de engenharia

| Skill | Descrição |
|-------|-----------|
| `/diagnose` | Loop disciplinado para bugs difíceis |
| `/grill-with-docs` | Sessão de grilling contra domain model/docs |
| `/improve-codebase-architecture` | Deepening opportunities, módulos, interfaces |
| `/prototype` | Throwaway prototype para validação de design |
| `/tdd` | Red-green-refactor loop |
| `/to-issues` | Quebra plano em GitHub issues (vertical slices) |
| `/to-prd` | Converte conversa em PRD estruturado |
| `/triage` | State machine de triage roles |
| `/zoom-out` | Contexto amplo antes de mergulhar |

### `misc/` — Utilitários

| Skill | Descrição |
|-------|-----------|
| `/docs-writing` | Padrão de documentação técnica (README, docs/, ADRs, JSDoc) |
| `/setup-pre-commit` | Husky + lint-staged + tsc + tests |
| `/skill-creator` | Bootstrap e iteração de novas skills |

### `personal/` — Uso pessoal

| Skill | Descrição |
|-------|-----------|
| `/edit-article` | Edição e melhoria de artigos (estrutura, clareza, fluxo) |
| `/obsidian-vault` | Search, criação e organização de notas no Obsidian |

### `productivity/` — Workflow

| Skill | Descrição |
|-------|-----------|
| `/grill-me` | Grilling reverso — usuário defende, Claude questiona |
| `/handoff` | Handoff de contexto entre sessões |

### `tcc/` — TCC SyncClass

| Skill | Descrição |
|-------|-----------|
| `/tcc-fragmentos` | Captura matéria-prima bruta por capítulo |
| `/tcc-rascunho` | Escrita guiada parágrafo a parágrafo (ABNT/FEPI) |
| `/tcc-revisao-impessoal` | Varredura: 1ª pessoa, clichês, informalidade, citações órfãs |
| `/grill-me-tcc` | Stress-test pré-banca: hipóteses, metodologia, escopo, resultados |

---

## Agents (`agents/`)

Não invocados via `/` — usados pela main thread ou por slash commands que delegam.

| Agent | Função |
|-------|--------|
| `planner` | Plano ordenado com deps, riscos e exit criteria |
| `researcher` | Localizador read-only (`path:line` table), nunca edita |
| `reviewer` | Code review severity-tagged, sem praise |
| `tcc-orientador` | Orientador severo de TCC (PT-BR), argumento e evidência |

---

## Hooks (`hooks/`)

| Hook | Tipo | Função |
|------|------|--------|
| `guard-dangerous-bash.mjs` | PreToolUse | Bloqueia `rm -rf`, `git push --force`, `git reset --hard`, etc |
| `context-mode-cache-heal.mjs` | SessionStart | Auto-cura cache do plugin context-mode |
| `stop-beep.ps1` | Stop | Beep no fim de cada turno (Windows) |

---

## Plugins

### caveman
```
/caveman lite|full|ultra    # mudar nível
stop caveman                 # desativar
/caveman:caveman-help        # help completo
/caveman:caveman-stats       # token savings
```

Níveis: `lite` (frases completas, sem filler) · `full` (default, drop articles) · `ultra` (máxima compressão)

### context-mode
```
/context-mode:ctx-stats      # savings desta sessão
/context-mode:ctx-doctor     # diagnóstico
/context-mode:ctx-upgrade    # atualizar
/context-mode:ctx-purge      # limpar knowledge base (destrutivo)
```

### Instalar plugins
```
/plugin install caveman
/plugin install context-mode
/plugin list
/plugin clear-cache
```

---

## Configuração

**MCP servers** — `.mcp.json` usa `${VAR}` placeholders:
```powershell
[System.Environment]::SetEnvironmentVariable('GITHUB_PERSONAL_ACCESS_TOKEN', 'ghp_xxx', 'User')
[System.Environment]::SetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'sbp_xxx', 'User')
```

**Settings** — copiar `settings.template.json` → `settings.json` e ajustar paths.

**Paths:**
- Global settings: `%USERPROFILE%\.claude\settings.json`
- Global skills: `%USERPROFILE%\.claude\skills\`
- Project-local: `<project>\.claude\`
