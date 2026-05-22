---
inclusion: manual
description: Gera commit message Conventional Commits a partir do diff staged. Mostra proposta antes de commitar. Nunca comita sem confirmação explícita.
---

Gere mensagem de commit no padrão Conventional Commits para o diff staged.

## Passos

1. Rode `git diff --staged` para ver o que será comitado.
2. Se vazio, parar e avisar: "Nada staged. Use `git add` antes."
3. Analise as mudanças:
   - Tipo dominante: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `style`, `build`, `ci`
   - Scope: módulo/pasta dominante (`auth`, `db`, `ui`, etc)
   - Subject: imperativo, ≤50 chars, sem ponto final
   - Body: SÓ se o "porquê" não é óbvio pelo diff. Wrap em 72 chars.
4. Rode `git log -5 --oneline` para conferir estilo das últimas mensagens.
5. **Mostre a proposta** ao usuário:

```
Proposta:
<type>(<scope>): <subject>

<body opcional>

Para comitar, confirme.
```

6. **Aguarde confirmação explícita** antes de rodar `git commit`.

7. Quando confirmar, comite via HEREDOC:

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <subject>

<body>
EOF
)"
```

## Anti-patterns

- "Update files" / "Various changes" — sem informação
- Passado ("Added X") — usar imperativo ("add X")
- Subject com ponto final
- Body repetindo o diff em prosa
- Co-author tags automáticas

## Se hooks falharem

Investigar a causa. **Não** sugerir `--no-verify`. Corrigir e fazer **novo commit**, não amend.
