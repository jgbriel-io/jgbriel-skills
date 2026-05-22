# Edição de Código

- Preferir editar arquivos existentes a criar novos.
- **Sem comentários redundantes** que apenas repetem o código. Comentar apenas o **porquê** quando não óbvio (invariante oculta, workaround de bug, restrição externa).
- **Sem abstrações inventadas** que a tarefa não exige. Três linhas similares são melhores que abstração prematura.
- **Sem tratamento de erro** para cenários impossíveis. Validar apenas em fronteiras (input de usuário, APIs externas).
- **Sem código morto** — se removido, sumiu. Sem `// removed`, sem variáveis renomeadas para `_unused`.
- **Sem flags de retrocompatibilidade** quando se pode simplesmente mudar o código.
- Adaptar-se ao estilo existente, mesmo se faria diferente.
- Não refatorar partes não relacionadas ao pedido.
