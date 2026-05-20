---
description: Sincroniza branch atual com remote — fetch, pull rebase, status final. Não toca outras branches.
allowed-tools: Bash(git fetch:*), Bash(git pull:*), Bash(git status:*), Bash(git branch:*), Bash(git rev-list:*)
---

Sincronize a branch atual com o remote:

1. `git branch --show-current` → guardar nome da branch.
2. `git fetch --all --prune`
3. Conferir se há upstream configurado: `git rev-parse --abbrev-ref --symbolic-full-name @{u}` (silencia erro).
4. Se sem upstream, parar e avisar: "Sem upstream configurado. Configure com `git branch --set-upstream-to=origin/<branch>`."
5. Conferir uncommitted changes: `git status --porcelain`. Se houver, parar e avisar: "Há mudanças locais não comitadas. Comite ou stash antes de fazer pull rebase."
6. `git pull --rebase`
7. Se rebase falhar com conflitos:
   - Parar imediatamente.
   - Mostrar `git status` para o usuário.
   - Dizer: "Rebase parou em conflitos. Resolva manualmente, depois `git rebase --continue` ou `git rebase --abort`."
   - **Não** tentar resolver conflitos automaticamente.
8. Se rebase ok, mostrar resultado final:
   ```
   Branch: <nome>
   Atualizado para: <último commit SHA + mensagem>
   Working tree: <clean | dirty>
   ```

Sem narração extra. Se algo falha em qualquer passo, parar e reportar.
