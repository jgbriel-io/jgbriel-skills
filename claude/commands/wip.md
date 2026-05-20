---
description: Commit rápido WIP pra salvar progresso. Sem ritual de mensagem, só descrição livre opcional.
argument-hint: "[descrição curta opcional]"
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*)
---

Commit WIP rápido para salvar progresso.

## Passos

1. `git status --short` → mostrar o que será comitado.
2. Se nada modificado, parar: "Nada para comitar."
3. Se houver argumento, usar como descrição. Senão, gerar resumo curto do diff (1 frase, max 40 chars).
4. Mensagem final: `WIP: <descrição>`.
5. Stage tudo: `git add -A`.
6. **Mostrar ao usuário antes de comitar:**
   ```
   WIP commit:
   Mensagem: WIP: <descrição>
   Arquivos: <lista>

   Confirma? (responda "sim" ou edite a mensagem)
   ```
7. Após confirmação, comitar.

## Avisos

- Não usar `--no-verify` mesmo em WIP. Se hook falha, dizer ao usuário, **não** pular.
- WIP commits devem ser squashed antes de PR. Lembrar o usuário no fim:
  ```
  Commit feito. Lembre de fazer squash antes de abrir PR (use `git rebase -i`).
  ```

## Quando NÃO usar

- Mudança final pronta pra review → use `/commit` (mensagem Conventional).
- Apenas um arquivo modificado e mudança pequena → use `git commit` direto.
