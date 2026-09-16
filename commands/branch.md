---
description: Cria branch nova a partir de main/master (atualizado) e faz switch. Detecta a branch base automaticamente.
argument-hint: "<nome-da-branch>"
allowed-tools: Bash(git branch:*), Bash(git checkout:*), Bash(git switch:*), Bash(git fetch:*), Bash(git pull:*), Bash(git status:*)
model: haiku
---

Cria branch `$ARGUMENTS` a partir da branch base do repo (main ou master) atualizada.

## Passos

1. **Validar nome:**
   - Se `$ARGUMENTS` vazio, perguntar nome.
   - Se contém espaços, substituir por hífen e avisar: "Renomeei para `<nome-com-hifen>`."
   - Sem caracteres especiais perigosos (`..`, `~`, `^`, `:`, `\`, espaços já tratados).

2. **Conferir uncommitted changes:**
   ```
   git status --porcelain
   ```
   Se houver, parar: "Há mudanças locais. Comite, stash ou descarte antes de criar branch nova."

3. **Detectar branch base:**
   ```
   git remote show origin | grep "HEAD branch"
   ```
   Fallback: tentar `main`, depois `master`. Se nenhuma existir, perguntar usuário.

4. **Atualizar base:**
   ```
   git fetch origin <base>
   git switch <base>
   git pull --ff-only
   ```

5. **Criar branch nova e switch:**
   ```
   git switch -c $ARGUMENTS
   ```

6. **Confirmar:**
   ```
   Branch '$ARGUMENTS' criada a partir de '<base>' (sha <curto>).
   Working tree limpo.
   ```

Se algum passo falha, parar e reportar.
