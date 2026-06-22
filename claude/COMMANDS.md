# Claude Code — Commands Reference

> Skills, agents, plugins, hooks, MCP, setup: ver **`STRUCTURE.md`**
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

> Skills, agents, plugins, hooks, MCP, setup prático: ver **`STRUCTURE.md`** — não duplicado aqui para evitar drift entre os dois arquivos.
