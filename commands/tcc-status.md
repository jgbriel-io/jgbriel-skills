---
description: Snapshot of SyncClass TCC progress — status of each chapter (1-10), what is pending, next steps. Output is written in Portuguese.
allowed-tools: Read, Glob, Grep, Bash(git log:*), Bash(git status:*)
---

Produce a snapshot of TCC progress.

## Steps

1. **Locate the TCC project.** Use `cwd` if it is the TCC repo (detect it by `docs/tcc/` or a local `.claude/skills/tcc-writing.md`).
   If this is not a TCC repo, ask the user for the path.

2. **Read the status index, if it exists.** The project-local skill `.claude/skills/tcc-writing.md` holds a table with the columns
   `| Cap. | Título | Conteúdo | Status |`, where status is ✅ Concluído, 🟠 Rascunho or 🔴 Pendente.
   That skill belongs to the SyncClass project, not to this fleet — if the file is not there, say so once and take the real state
   of the files as the only source, leaving the "Status declarado" column as `—`.

3. **Check the real files.** For each chapter:
   - List `docs/tcc/cap{N}-*.md` with Glob.
   - Check that the file exists and has content (not empty, not only a heading).
   - Compare the declared status against the real state.

4. **Detect open fragments.** List `docs/tcc/_fragmentos/cap*-fragmentos.md` if any exist. Each one means a chapter still in capture.

5. **Detect recent reviews.** List `docs/tcc/_revisoes/cap*-revisao-*.md` if any exist. A sign of recent QA.

6. **Git context.** Last activity under `docs/tcc/`:
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

No commentary, no drift. Table plus lists. Ready for a decision.
