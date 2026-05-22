# Sistema

## Sempre perguntar antes de
- Instalar pacotes globalmente (npm -g, pip, scoop, winget, choco)
- Modificar variáveis de ambiente do sistema (PATH, PATHEXT, etc.)
- Alterar configurações do Windows (registro, Group Policy, serviços)
- Fazer download ou upload de arquivos da internet
- Abrir portas ou modificar firewall

## Nunca executar sem confirmação explícita
- Modificar `HKEY_LOCAL_MACHINE` no registro
- Desabilitar/habilitar serviços do Windows
- Comandos com `--global` ou `--system` que afetem fora do projeto atual

## Regras gerais
- Preferir instalações locais (no projeto) a globais
- Ao sugerir comandos de rede, mostrar o que será baixado/enviado antes
- Não modificar arquivos fora do diretório de trabalho atual sem avisar
