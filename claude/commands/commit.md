---
description: Gera commit message Conventional Commits a partir do diff staged. Mostra antes de commitar. Não comita sem confirmação.
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git commit:*)
---

Gere mensagem de commit no padrão Conventional Commits para o diff staged.

## Passos

1. Rode `git diff --staged` para ver o que será comitado.
2. Se vazio, parar e avisar: "Nada staged. Use `git add` antes."
3. Analise as mudanças:
   - Tipo dominante: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `style`, `build`, `ci`.
   - Scope: módulo/pasta dominante (`auth`, `db`, `ui`, etc).
   - Subject: imperativo, ≤50 chars, sem ponto final.
   - Body: SÓ se o "porquê" não é óbvio pelo diff. Wrap em 72.
4. Rode `git log -5 --oneline` para conferir estilo das últimas mensagens (case, scope conventions).
5. **Mostre a mensagem proposta** ao usuário no formato:

```
Proposta:
<type>(<scope>): <subject>

<body opcional>

Para comitar, confirme.
```

6. **Espere confirmação explícita** antes de rodar `git commit`. Não comite proativamente.

7. Quando confirmar, comite via HEREDOC para preservar formatação:

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <subject>

<body>
EOF
)"
```

## Anti-patterns a evitar

- "Update files" / "Various changes" — sem informação.
- Passado ("Added X") — usar imperativo ("add X").
- Subject com ponto final.
- Body repetindo o diff em prosa.
- Co-author tags automáticas (a menos que o usuário peça).

## Se hooks falharem

Investigar a causa. **Não** sugerir `--no-verify`. Corrigir o problema e fazer **novo commit**, não amend.
