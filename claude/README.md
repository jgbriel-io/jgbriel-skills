# Claude Code — Índice

Quatro arquivos, um job cada. Ordem de leitura sugerida:

| Ordem | Arquivo | Job |
|---|---|---|
| 1 | [CLAUDE.md](CLAUDE.md) | Regras globais de comportamento — idioma, git, segurança, custo. É o arquivo que o Claude Code lê sozinho |
| 2 | [STRUCTURE.md](STRUCTURE.md) | Onde tudo mora e como se conecta: plugin, hooks, MCP, `settings.json`, inventário gerado |
| 3 | [WORKFLOWS.md](WORKFLOWS.md) | Receitas — qual skill encadear com qual, e por quê |
| 4 | [GUIDE.md](GUIDE.md) | Cheat sheet de plugin de terceiro e de onde a config mora |

`config/` guarda os templates de arquivo (`CLAUDE.template.md`,
`AGENT.template.md`, e os outros); `skills-archived/` guarda o que saiu de
circulação e não entra no plugin.

**Regra contra drift:** cada fato vive em um arquivo só, e os outros apontam.
Toda lista de skill, command ou agent é **gerada** por `scripts/gen-inventory.py`
a partir da árvore — nenhuma é mantida à mão. `scripts/check-doc-refs.py` falha
quando a prosa em volta cita algo que não existe mais; os dois rodam no CI.
