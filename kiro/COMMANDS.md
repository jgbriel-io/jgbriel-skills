# Kiro IDE — Commands Reference

> Workflows práticos combinando steering + agents: ver **`WORKFLOWS.md`**

## Steering Files (`steering/`)

Carregados automaticamente por tipo de `inclusion`. Para steering manual: `@nome-do-arquivo` no chat.

### `global/` — Sempre ativos (`inclusion: always`)

| Arquivo | Função |
|---------|--------|
| `caveman.md` | Modo compressão caveman (quando ativo) |
| `code-editing.md` | Regras de edição de código |
| `docs-style.md` | Estilo de documentação técnica |
| `frontend.md` | Padrões de frontend |
| `git.md` | Convenções git e commits |
| `language.md` | Idioma (PT-BR conversa, EN código) |
| `response-style.md` | Estilo de resposta |
| `security.md` | Regras de segurança |
| `system.md` | Comportamento do sistema |
| `tasks.md` | Regras para uso de tasks/TODOs |

### `tech/` — Expertise técnica (`inclusion: manual` ou `fileMatch`)

| Arquivo | Função |
|---------|--------|
| `code-reviewer.md` | Checklist de code review completo |
| `frontend-design.md` | UI distinta, anti-generic aesthetic |
| `react-best-practices.md` | Bundle size, re-renders, composição |
| `senior-backend.md` | TanStack Query, Supabase hooks/mutations |
| `senior-frontend.md` | Componentes, estado, Tailwind, a11y |
| `seo-optimizer.md` | On-page, technical SEO, Core Web Vitals |
| `steering-guide.md` | Meta — como criar/organizar steering files |
| `supabase-postgres.md` | Indexes, RLS, schema design |

### `engineering/` — Workflows (`inclusion: manual`)

| Arquivo | Função |
|---------|--------|
| `diagnose.md` | Loop disciplinado para bugs difíceis |
| `grill-with-docs.md` | Sessão de grilling contra domain model |
| `improve-codebase-architecture.md` | Deepening opportunities |
| `prototype.md` | Throwaway prototype para validação |
| `tdd.md` | Red-green-refactor loop |
| `to-issues.md` | Quebra plano em GitHub issues |
| `to-prd.md` | Converte conversa em PRD |
| `triage.md` | State machine de triage |
| `zoom-out.md` | Contexto amplo antes de mergulhar |

### `productivity/` — Workflow (`inclusion: manual`)

| Arquivo | Função |
|---------|--------|
| `grill-me.md` | Grilling reverso — usuário defende |
| `handoff.md` | Handoff de contexto entre sessões |

### `personal/` — Uso pessoal (`inclusion: manual`)

| Arquivo | Função |
|---------|--------|
| `edit-article.md` | Edição e melhoria de artigos |
| `obsidian-vault.md` | Search, criação e organização no Obsidian |

### `tcc/` — TCC SyncClass (`inclusion: manual`)

| Arquivo | Função |
|---------|--------|
| `tcc-fragmentos.md` | Captura matéria-prima bruta por capítulo |
| `tcc-rascunho.md` | Escrita guiada parágrafo a parágrafo |
| `tcc-revisao-impessoal.md` | Varredura: 1ª pessoa, clichês, citações órfãs |
| `grill-me-tcc.md` | Stress-test pré-banca: hipóteses, metodologia, escopo, resultados |

### `misc/` — Utilitários (`inclusion: manual`)

| Arquivo | Função |
|---------|--------|
| `commit.md` | Gera Conventional Commit a partir do diff staged |
| `docs-writing.md` | Padrão de documentação técnica |
| `setup-pre-commit.md` | Husky + lint-staged + tsc + tests |
| `steering-creator.md` | Bootstrap e iteração de novos steering files |

---

## Agents (`agents/`)

Agents em JSON. Kiro carrega automaticamente todos os `.json` em `agents/`.

| Agent | Função |
|-------|--------|
| `researcher.json` | Localizador read-only (`path:line` table), nunca edita |
| `reviewer.json` | Code review severity-tagged, sem praise |
| `planner.json` | Plano ordenado com deps, riscos e exit criteria |
| `tcc-orientador.json` | Orientador severo de TCC (PT-BR) |

---

## Skills (`skills/`)

Skills Kiro são diferentes de Claude — invocadas com `@nome` no chat.

| Skill | Função |
|-------|--------|
| `caveman` | Modo compressão de tokens |
| `find-skills` | Lista skills disponíveis no projeto |

---

## Powers (`powers/installed/`)

| Power | Função |
|-------|--------|
| `supabase-hosted` | Integração Supabase — workflow de migrations, schema, types |

---

## Setup Kiro IDE

**Verificar steering carregado:**
- Status bar (canto inferior) mostra guides ativos
- Steering com `inclusion: always` carrega automaticamente
- Steering `manual`: usar `@nome-do-arquivo` no chat

**Listar steering files:**
```powershell
Get-ChildItem $env:USERPROFILE\.kiro\steering -Recurse -Filter "*.md" | Select-Object Name
```

**Reload após editar steering:**
`Ctrl+Shift+P` → `Reload Window`

**Verificar MCP conectado:**
`Ctrl+,` → buscar "MCP" → confirmar `cli.json` resolve para `~/.kiro/settings/cli.json`

**MCP servers** — `settings/cli.json` usa `${VAR}` placeholders:
```powershell
[System.Environment]::SetEnvironmentVariable('GITHUB_PERSONAL_ACCESS_TOKEN', 'ghp_xxx', 'User')
[System.Environment]::SetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'sbp_xxx', 'User')
```

**Paths:**
- Global steering: `%USERPROFILE%\.kiro\steering\` (subpastas recursivas)
- Global agents: `%USERPROFILE%\.kiro\agents\`
- Global skills: `%USERPROFILE%\.kiro\skills\`
- MCP config: `%USERPROFILE%\.kiro\settings\cli.json`
- Project-local: `<project>\.kiro\`
