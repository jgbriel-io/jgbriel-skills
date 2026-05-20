---
description: Code review do diff atual via agent reviewer. Findings severity-tagged, sem fluff.
argument-hint: "[base-ref ou path opcional, default = uncommitted changes]"
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(gh pr:*), Read, Grep
---

Invoque o agent `reviewer` para revisar o código. Determine o que revisar conforme o argumento:

## Resolução do alvo

- **Sem argumento** → revisar diff uncommitted (`git diff` + `git diff --staged`).
- **`main`, `develop`, nome de branch** → `git diff <branch>...HEAD`.
- **SHA** → `git diff <sha>...HEAD`.
- **`PR <N>`** ou **`#<N>`** → `gh pr diff <N>`.
- **`HEAD~N`** → `git diff HEAD~N...HEAD`.
- **Path** (arquivo/diretório) → revisar conteúdo desse path.

## Briefing pro agent

Delegue ao agent `reviewer` via Task tool com prompt:

```
Revisar: <descrição do alvo>
Diff:
<conteúdo do diff>

Aplique sua heurística padrão (severity-tagged, uma linha por finding,
sem praise, sem nits de formatação). Reporte só problemas reais.
```

Se a área tocada tem testes (`Grep -r` por arquivos `*.test.*` ou `*.spec.*` adjacentes), incluir essa informação no briefing pro agent verificar cobertura.

## Output

Repasse o relatório do agent ao usuário **verbatim**. Não interprete, não suavize, não adicione comentários. Se o agent retornou "No issues found.", repassar exatamente isso.
