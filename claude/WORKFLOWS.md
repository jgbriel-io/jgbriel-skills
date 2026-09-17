# Claude Code — Workflows

Receitas práticas combinando slash commands, skills e agents.

---

## Feature / Task Nova

```
/plan          → plano ordenado com deps e riscos
/scope         → divide em vertical slices se scope grande
  ↓ implementar (usar /where, /why para navegar)
/review        → code review do diff (agent reviewer)
/commit        → mensagem Conventional Commits
/sync          → fetch + pull rebase antes de push
```

## Bug Difícil

```
/diagnose      → loop: hipótese → evidência → fix
/where <X>     → localiza definição/uso no código
/why           → git blame + log da linha
  ↓ fix
/commit
```

## Code Review

```
/review        → delega ao agent reviewer
               → severity-tagged, sem fluff
```

## Decisão de Arquitetura

```
/codebase-memory     → mapa estrutural: quem chama o quê, dependências, impacto
/domain-modeling     → valida contra o modelo de domínio e registra o ADR
/codebase-design     → onde cortar o seam, interface do módulo, deepening
  ↓ ADR registrado pelo próprio domain-modeling
```

## Refactoring

```
/codebase-memory  → escopo real: callers, fan-in/fan-out, dead code
/codebase-design  → decidir a fronteira antes de mexer
/plan             → quebrar em slices verificáveis, cada uma com prova
/tdd              → red-green-refactor onde há lógica
  ↓ /implement slice por slice
/review → /commit  (por slice)
```

## Prototipagem

```
/prototype     → throwaway prototype para validar design
  ↓ validar
/scope         → quebrar solução real em slices
  ↓ implementar
```

## Documentação de Sprint

```
/docs-writing  → ativa template e padrões
  ↓ escrever docs/sprints/sprint-NN-tipo-desc.md
  ↓ atualizar docs/sprints/README.md (status table)
/commit
```

## TCC — Escrever Capítulo

```
/tcc-fragmentos          → capturar matéria-prima via entrevista
/tcc-rascunho            → moldar fragmentos em seção ABNT (parágrafo a parágrafo)
/tcc-revisao-impessoal   → varredura: 1ª pessoa, clichês, informalidade, citações órfãs
/tcc-revisar             → feedback como orientador severo (agent tcc-orientador)
/tcc-status              → snapshot do progresso geral (caps 1-10)
```

## TCC — Simulação de Banca

```
/grill-me-tcc   → stress-test: hipóteses, metodologia, escopo, literatura, resultados
                → uma pergunta por vez, indica fraqueza testada + resposta esperada
                → ao final lista as 3 fragilidades mais críticas
```

> Diferente do `tcc-orientador` (revisa texto escrito), o `grill-me-tcc` testa se você consegue **defender** o que escreveu.

## Novo Projeto

```
1. Criar .claude/CLAUDE.md com contexto do projeto (stack, roles, convenções críticas)
2. /docs-writing → criar docs/README.md + subpastas de domínio
3. Copiar settings.template.json → .claude/settings.json e ajustar paths
```

## Criação de Nova Skill

```
/skill-creator   → bootstrap interativo de nova skill
                 → cria name/SKILL.md com frontmatter correto
```

---

## Navegação Rápida

| Necessidade | Comando |
|-------------|---------|
| Onde está definido X? | `/where X` |
| Quem modificou esta linha? | `/why` |
| Mapa do diretório | `/map` |
| Estado do repo | `/status` |
| Diff staged | `/diff` |
| Desfazer último commit | `/undo` |

---

## Agents (usados por slash commands ou chamada direta)

| Agent | Quando chamar diretamente |
|-------|--------------------------|
| `researcher` | "onde está X definido?", "quais arquivos usam Y?" |
| `reviewer` | revisão de arquivo específico fora do `/review` |
| `planner` | plano detalhado antes de implementar feature complexa |
| `tcc-orientador` | feedback acadêmico severo de capítulo ou seção |
