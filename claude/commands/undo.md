---
description: Desfaz último commit (soft reset) — mantém mudanças staged, só remove o commit. Mostra o que será desfeito antes.
allowed-tools: Bash(git log:*), Bash(git reset:*), Bash(git status:*)
model: haiku
---

Desfaz último commit via soft reset, mantendo as mudanças staged.

## Passos

1. **Mostrar o que será desfeito:**
   ```
   git log -1 --stat
   ```
   Exibir ao usuário. Se não há commits, parar e avisar.

2. **Conferir se o commit já foi pushed:**
   ```
   git status --short --branch
   ```
   Se houver `[ahead N]`, ok — só local, seguro desfazer.
   Se houver `[behind ...]` ou já está em sync, **avisar**:
   ```
   ⚠️ Este commit já foi pushed ao remote (ou está em sync).
   Desfazer localmente cria divergência. Você precisará force-push depois.
   Continuar?
   ```
   **Aguardar confirmação explícita** antes de prosseguir.

3. **Se confirmado** ou commit é só local:
   ```
   git reset --soft HEAD~1
   ```

4. **Mostrar resultado:**
   ```
   git status
   ```

5. **Lembrete final:**
   - Mudanças do commit desfeito agora estão **staged**.
   - Use `git restore --staged <file>` para tirar do staging.
   - Use `git commit` para refazer com nova mensagem.

## Limites

- **Não** mexer com `--hard` — perde mudanças. Se usuário quer hard reset, pedir confirmação explícita extra e dizer "isto descarta todas as mudanças do commit, sem volta".
- **Não** desfazer múltiplos commits sem pedido específico. Se quiser, pedir: "Quantos commits desfazer? (default 1)".
