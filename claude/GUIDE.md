# Claude Code — Guia Rápido
## Modos de resposta (Caveman)

| Comando | Efeito |
|---|---|
| `/caveman lite` | Fragmentos leves, sem artigos |
| `/caveman full` | Modo padrão ativo — máxima compressão |
| `/caveman ultra` | Ultra comprimido |
| `stop caveman` | Volta ao modo normal |

---

## Context-mode

| Comando | Efeito |
|---|---|
| `/ctx-stats` | Tokens economizados na sessão |
| `/ctx-doctor` | Diagnóstico do plugin |
| `/ctx-upgrade` | Atualizar para versão mais nova |
| `/ctx-purge` | Limpar knowledge base (irreversível) |
| `/ctx-insight` | Dashboard de analytics no browser |

> **Bloqueado pelo context-mode:** WebFetch, Bash >20 linhas, Read para análise.
> Usar `ctx_batch_execute` no lugar.

---

## Skills — Git / Código

| Comando | Efeito |
|---|---|
| `/status` | Branch, staged, unstaged, último commit |
| `/branch` | Nova branch a partir de main |
| `/commit` | Gera mensagem Conventional Commits |
| `/diff` | Diff resumido contra ref |
| `/sync` | Fetch + pull rebase |
| `/undo` | Desfaz último commit (soft reset) |
| `/wip` | Commit rápido de progresso |
| `/review` | Code review do diff atual |
| `/plan` | Quebra tarefa em plano implementável |
| `/scope` | Quebra em vertical slices independentes |
| `/where <símbolo>` | Localiza definição/uso no código |
| `/why` | Contexto histórico de linha (git blame) |
| `/map` | Mapa do diretório com responsabilidades |

---

## Skills — TCC (SyncClass)

| Comando | Efeito |
|---|---|
| `/tcc-status` | Progresso dos capítulos (1-10) |
| `/tcc-revisar` | Revisão acadêmica como orientador severo |
| `/tcc-fragmentos` | Captura fragmentos brutos via entrevista |
| `/tcc-rascunho` | Escreve rascunho de seção |
| `/tcc-revisao-impessoal` | Revisa impessoalidade/linguagem ABNT |

---

## Skills — Outros

| Comando | Efeito |
|---|---|
| `/skill-creator` | Cria ou melhora uma skill |
| `/update-config` | Edita settings.json / hooks |
| `/fewer-permission-prompts` | Reduz prompts de permissão |
| `/simplify` | Revisa código alterado por qualidade |
| `/security-review` | Auditoria de segurança do branch |
| `/init` | Gera CLAUDE.md para projeto novo |

---

## Configuração global

| Arquivo | O que faz |
|---|---|
| `~/.claude/CLAUDE.md` | Regras globais (idioma, git, segurança) |
| `~/.claude/settings.json` | Modelo, plugins, permissões, hooks |
| `~/.claude/settings.local.json` | Permissões pessoais (ctx tools) |
| `~/.claude/hooks/stop-beep.ps1` | Beep quando Claude termina resposta |
| `~/.claude/projects/C--Users-B2ML/memory/` | Memória persistente entre sessões |

---

## Pendente

- [ ] Instalar Node.js v22+ (`fnm install 22 && fnm default 22`) → retry `/ctx-upgrade`
