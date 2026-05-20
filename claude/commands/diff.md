---
description: Diff resumido contra ref (branch, sha, HEAD~N). Mostra arquivos tocados + categorização das mudanças.
argument-hint: "[ref, default = main]"
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Read
---

Mostre diff resumido entre HEAD e $ARGUMENTS (default `main` ou `master`).

## Passos

1. **Resolver base:** se vazio, detectar `main` ou `master`. Se branch inexistente, perguntar.

2. **Stat das mudanças:**
   ```
   git diff <base>...HEAD --stat
   ```

3. **Categorização semântica:** para cada arquivo, classificar:
   - 🆕 Novo arquivo (`A` em `--name-status`).
   - ✏️ Modificado (`M`).
   - 🗑️ Deletado (`D`).
   - 📛 Renomeado (`R`).
4. **Commits incluídos:**
   ```
   git log <base>..HEAD --oneline
   ```

5. **Conflitos potenciais:** verificar se há arquivos modificados em ambos os lados:
   ```
   git diff <base>...HEAD --name-only > /tmp/our.txt
   git diff HEAD...<base> --name-only > /tmp/their.txt
   ```
   Interseção = arquivos onde merge pode dar conflito.

## Output

```
# Diff: HEAD vs <base>

## Commits ahead (<N>)
- <sha> <subject>
- ...

## Arquivos (<N tocados, +X / -Y linhas>)
🆕 path/novo.ts (+45)
✏️ path/modif.ts (+12 / -8)
🗑️ path/removido.ts (-30)

## Categorias dominantes
- <feat/fix/refactor/etc>: <N arquivos>

## Possíveis conflitos no merge
- <arquivo>  ← modificado nos dois lados

## Próximo passo sugerido
<1 frase: rebase? merge? continue trabalhando?>
```

Sob 400 palavras. Foco em **o que mudou**, não no diff cru.
