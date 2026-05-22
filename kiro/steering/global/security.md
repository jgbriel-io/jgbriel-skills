# Segurança

## Sempre perguntar antes de executar
- Deletar arquivos/pastas (rm, del, Remove-Item, rmdir)
- Sobrescrever arquivos existentes
- Operações em massa (bulk delete, bulk rename)
- Modificar arquivos de configuração do sistema

## Nunca executar sem confirmação explícita
- `rm -rf` ou equivalente recursivo
- `dd`, `mkfs`, `shred`, `format`
- `chmod 777`
- Qualquer comando que afete `/etc/`, arquivos de credenciais ou `.env`

## Regras gerais
- Preferir comandos não-destrutivos por padrão
- Ao mover/renomear, confirmar destino antes
- Nunca expor valores de secrets, tokens ou senhas no output — referenciar pelo nome da variável
- Em caso de dúvida sobre impacto, perguntar antes de agir
