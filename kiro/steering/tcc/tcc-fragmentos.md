---
inclusion: manual
description: "Captura matéria-prima bruta de TCC acadêmico — anotações, observações sobre código, decisões técnicas, citações, ideias soltas — em arquivo de fragmentos antes de virar texto formal."
---

# TCC Fragmentos

Sessão de entrevista que minera o usuário em busca de fragmentos — pedaços heterogêneos de texto que **podem** entrar no capítulo final do TCC. Não aplica normas ABNT, não exige voz impessoal, não estrutura nada. O objetivo é **acumular material**.

## Localizar arquivo de fragmentos

Padrão SyncClass: `docs/tcc/_fragmentos/cap{N}-fragmentos.md`

Se não existe, criar com H1 contendo título do capítulo. Nada mais.

## Capturar fragmentos

A cada coisa que o usuário disser, identificar o que pode virar fragmento. Anexar ao arquivo silenciosamente. Mencionar de passagem ("adicionei isso").

**Antes de cada escrita:** re-ler o arquivo do disco — nunca sobrescrever.

## Formato do fragmento

Separador: `---` em linha própria, com linha em branco antes e depois.

Cada fragmento pode ser: frase nítida, parágrafo curto, citação direta, observação técnica, lista de pontos, analogia. **Não impor estrutura. Não numerar.**

## Tipos de fragmento

- **Trecho de leitura**: `> "citação" (AUTOR, ano, p. X)` + nota de uso
- **Observação sobre código**: localização + o que vale destacar
- **Decisão técnica**: contexto + alternativas + critério da escolha
- **Ideia solta**: texto cru, decodificável pelo autor 1 mês depois
- **Citação a formalizar**: referência incompleta, marcar para completar

## Postura conversacional

Entrevistar o usuário:
- "Que parte do código merece destaque no capítulo?"
- "Que decisão técnica ainda não tem justificativa registrada?"
- "Reunião com orientador — alguma observação que precisa virar texto?"

Perguntar **uma de cada vez**. Capturar fragmento antes de próxima pergunta.

## Encerramento

Sessão termina quando: usuário diz que chega, 15+ fragmentos capturados, ou usuário começa a repetir.

Mostrar contagem: "Capítulo X agora tem N fragmentos."

## Voz

Voz nesta fase é **livre** — primeira pessoa, gírias, abreviações. Conversão para impessoal acontece em `tcc-rascunho`, nunca aqui.
