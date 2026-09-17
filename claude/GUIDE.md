# Claude Code — Cheat Sheet

Consulta no meio de uma sessão. Só o que **não** está gerado em outro lugar: os
comandos dos plugins de terceiros e o mapa dos arquivos de configuração.

As skills, os commands e os agents deste repo estão na tabela gerada em
[STRUCTURE.md](STRUCTURE.md) — não são repetidos aqui, porque lista copiada à mão
é lista que mente depois.

---

## Plugins de terceiros

### caveman — modo de resposta comprimido

| Comando | Efeito |
|---|---|
| `/caveman lite` | Fragmentos leves, sem artigo |
| `/caveman full` | Compressão padrão |
| `/caveman ultra` | Compressão máxima |
| `stop caveman` | Volta ao normal |

Código, commit, PR e aviso de segurança saem em prosa normal mesmo com o modo
ativo.

### ponytail — a solução mais preguiçosa que funciona

| Comando | Efeito |
|---|---|
| `/ponytail lite\|full\|ultra` | Intensidade do YAGNI |
| `/ponytail-review` | Revisão caçando só over-engineering |
| `/ponytail-audit` | Mesma varredura no repo inteiro |
| `/ponytail-debt` | Coleta os comentários `ponytail:` num balanço |

### context-mode — processa output fora da conversa

| Comando | Efeito |
|---|---|
| `/ctx-stats` | Tokens economizados na sessão |
| `/ctx-doctor` | Diagnóstico do plugin |
| `/ctx-search` | Busca na base indexada |
| `/ctx-purge` | Limpa a base — irreversível |

Quando os tools `ctx_*` não conectam, os hooks continuam injetando orientação
apontando pra eles. Nesse caso, ignore a orientação e use `Bash`/`Read` direto;
reiniciar resolve.

---

## Comandos nativos que valem lembrar

| Comando | Efeito |
|---|---|
| `/code-review` | Revisão do diff atual — o eixo de defeito |
| `/simplify` | Aplica limpeza de reuso e simplificação no que mudou |
| `/security-review` | Auditoria de segurança do branch |
| `/init` | Gera `CLAUDE.md` para um projeto |
| `/update-config` | Edita `settings.json` e hooks |
| `/skills` | Liga e desliga skill por nome |

---

## Onde a configuração mora

| Arquivo | O que faz |
|---|---|
| `~/.claude/CLAUDE.md` | Regras globais de comportamento |
| `~/.claude/settings.json` | Modelo, permissões, hooks, plugins habilitados |
| `~/.claude/settings.local.json` | Overrides pessoais de permissão |
| `~/.claude/projects/<projeto>/memory/` | Memória persistente entre sessões |
| `<projeto>/.claude/` | Escopo de projeto: skills, commands e settings próprios |

Skill de projeto **não** colide com skill de plugin: a do plugin aparece sob o
namespace dele (`jgbriel-skills:tdd`) e a do projeto sem prefixo (`tdd`). Quem
disputa nome é o escopo pessoal, e `scripts/check-project-skills.sh` detecta.
