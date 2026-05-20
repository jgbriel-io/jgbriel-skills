---
description: Snapshot do progresso do TCC SyncClass — status de cada capítulo (1-10), pendências, próximos passos.
allowed-tools: Read, Glob, Grep, Bash(git log:*), Bash(git status:*)
---

Gere snapshot do progresso do TCC.

## Passos

1. **Localizar o projeto TCC.** Usar `cwd` se for repo do TCC (detectar via `.claude/skills/tcc-writing.md` ou `docs/tcc/`).
   Se não estiver em repo de TCC, perguntar path ao usuário.

2. **Ler o índice de status.** Em `.claude/skills/tcc-writing.md` há tabela com colunas:
   `| Cap. | Título | Conteúdo | Status |`
   Status possíveis: ✅ Concluído, 🟠 Rascunho, 🔴 Pendente.

3. **Conferir arquivos reais.** Para cada capítulo declarado:
   - Listar `docs/tcc/cap{N}-*.md` com Glob.
   - Conferir se o arquivo existe e tem conteúdo (não vazio, não só heading).
   - Comparar status declarado vs estado real do arquivo.

4. **Detectar fragmentos pendentes.** Listar `docs/tcc/_fragmentos/cap*-fragmentos.md` se existirem. Cada um indica capítulo em fase de captura.

5. **Detectar revisões pendentes.** Listar `docs/tcc/_revisoes/cap*-revisao-*.md` se existirem. Sinal de QA recente.

6. **Git context.** Última atividade nos arquivos `docs/tcc/`:
   ```
   git log --oneline -10 -- docs/tcc/
   ```

## Output

```
# TCC Status — SyncClass

## Capítulos
| Cap | Título            | Status declarado | Estado real         |
|-----|-------------------|------------------|---------------------|
| 1   | Introdução        | ✅ Concluído     | <linhas, última mod>|
| 2   | Referencial       | 🟠 Rascunho      | <linhas, última mod>|
| ... |                   |                  |                     |

## Em captura (fragmentos abertos)
- Cap N: <path/cap{N}-fragmentos.md> — <contagem de fragmentos>

## Revisões recentes
- Cap N: <path/revisão> — <data>

## Atividade recente (git)
<últimos 5 commits tocando docs/tcc/>

## Pendências críticas
<capítulos 🔴 Pendente, ordenados por dependência lógica:
 2 (Referencial) → 3 (Metodologia) → 4 (Requisitos) → ...>

## Próximo passo sugerido
<1-2 frases. Capítulo mais valioso de fechar a seguir, com justificativa.>
```

Sem comentários, sem dispersão. Tabela + listas. Pronto pra decisão.
