---
description: Snapshot rápido do estado do repo — branch, ahead/behind, staged, unstaged, untracked, último commit.
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git log:*), Bash(git diff:*), Bash(git rev-list:*)
model: haiku
---

Mostre um snapshot do estado atual do repo, neste formato:

```
Branch: <nome> (ahead N, behind M)
Último commit: <sha curto> <mensagem>

Staged:
  <arquivo> (<+linhas/-linhas>)

Unstaged:
  <arquivo> (<+linhas/-linhas>)

Untracked:
  <arquivo>
```

Comandos a usar:
- `git branch --show-current`
- `git rev-list --left-right --count HEAD...@{u}` para ahead/behind (silencia erro se não há upstream)
- `git log -1 --oneline`
- `git diff --stat --cached` para staged
- `git diff --stat` para unstaged
- `git ls-files --others --exclude-standard` para untracked

Se não estiver em repo git, dizer "Não é um repositório git." e parar.

Se nada mudou, dizer "Working tree clean." sob a linha de branch.

Output curto. Sem comentários, sem sugestões, só o snapshot.
