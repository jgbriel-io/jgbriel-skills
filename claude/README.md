# Claude Code — Índice

5 arquivos `.md` em caixa alta, cada um com um job só. Ordem de leitura sugerida:

| Ordem | Arquivo | Job |
|---|---|---|
| 1 | `CLAUDE.md` | Regras globais de comportamento (idioma, git, segurança, code style) — lido automaticamente pelo Claude Code |
| 2 | `STRUCTURE.md` | Onde tudo mora: symlinks D: ↔ `~/.claude/`, skills/agents/plugins/hooks/MCP, `settings.json`, setup prático |
| 3 | `COMMANDS.md` | Tabela de slash commands (`commands/`) — referência rápida, sem duplicar skills/agents (isso é `STRUCTURE.md`) |
| 4 | `WORKFLOWS.md` | Receitas combinando commands + skills + agents pra casos de uso reais |
| 5 | `GUIDE.md` | Cheat sheet condensado — pra consulta no meio de uma sessão, não pra ler do zero |

Regra pra evitar drift: cada fato (skill existe, hook faz X, plugin Y) vive em **um único arquivo**. Os outros apontam pra ele em vez de copiar.
