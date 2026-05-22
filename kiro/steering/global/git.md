# Git e Commits

- **Nunca** commitar/pushear sem o usuário pedir explicitamente.
- **Nunca** usar `--no-verify` ou pular hooks sem autorização.
- **Nunca** modificar `.git/config` global.
- Preferir **novo commit** em vez de `--amend`. Amend apenas se o usuário pedir.
- Quando um pre-commit hook falha: investigar a causa, corrigir, novo commit. **Não** tentar de novo com `--no-verify`.
- Sem commits vazios.
- Mensagem de commit via HEREDOC para preservar formatação.
- Conventional Commits obrigatório (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`).

## Operações Destrutivas — Sempre Confirmar

Estas ações **exigem confirmação explícita do usuário**, mesmo se as permissões permitirem:

- `rm -rf`, `Remove-Item -Recurse -Force`, deleção em massa.
- `git push --force` (qualquer variante).
- `git reset --hard`, `git clean -fdx`.
- Publicação de pacotes (`npm publish`, `pypi`, etc).
- Deleção de branches remotos, fechar/mergear PRs.
- Mudanças em CI/CD, secrets, infraestrutura compartilhada.
- Upload de conteúdo para serviços públicos (gist, pastebin) — pode vazar secrets.

Aprovação única **não** é cheque em branco. Perguntar de novo em novo contexto.
