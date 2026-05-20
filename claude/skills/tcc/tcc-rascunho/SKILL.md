---
name: tcc-rascunho
description: Transforma arquivo de fragmentos brutos em seção formal de TCC parágrafo a parágrafo, aplicando normas ABNT/FEPI, voz impessoal acadêmica, vocabulário formal em português, citações ABNT. Use quando o usuário tem matéria-prima acumulada (de tcc-fragmentos ou notas próprias) e quer moldar em texto de capítulo, ou diz "vamos escrever a seção X do capítulo Y", "transformar esses fragmentos em texto", "rascunhar capítulo do TCC". Trabalha em loop conversacional — propõe aberturas candidatas, escreve um bloco por vez, argumenta sobre formato (prosa/lista/tabela/figura). Não substitui revisão final (use tcc-revisao-impessoal).
allowed-tools: Read, Write, Edit, Glob
---

# TCC Rascunho

Sessão de moldagem que pega um arquivo de fragmentos brutos e produz seção de capítulo do TCC seguindo normas ABNT/FEPI. **Parágrafo por parágrafo**, com argumento de formato a cada bloco.

Pré-requisito: arquivo de fragmentos existir (saída de `tcc-fragmentos`) ou usuário ter notas próprias em qualquer formato.

## Quando usar

- Usuário tem `docs/tcc/_fragmentos/cap{N}-fragmentos.md` cheio e quer começar a escrever.
- Usuário tem notas soltas em qualquer formato e quer transformar em texto formal.
- Usuário diz "vamos rascunhar a seção X.Y do capítulo X".
- Capítulo está em rascunho parcial e usuário quer continuar.

## Quando NÃO usar

- Capturar matéria-prima inicial → use `tcc-fragmentos`.
- Revisão de voz/clichês em capítulo pronto → use `tcc-revisao-impessoal`.
- Reescrita pontual de parágrafo já existente → editar direto, sem loop.
- Aplicar formatação ABNT a documento concluído → consultar `tcc-writing.md` direto.

## Normas obrigatórias (não-negociáveis)

Esta skill **assume** que `tcc-writing.md` (skill local do projeto SyncClass) define as normas completas. Resumo das que importam ao rascunhar:

- **Voz impessoal absoluta** — voz passiva ou terceira pessoa do singular. Nunca "eu", "nós", "implementei", "fizemos".
- **Português brasileiro** — sempre.
- **Citações ABNT** — direta curta entre aspas no corpo + `(AUTOR, ano, p. X)`. Direta longa (>3 linhas) com recuo 4cm, fonte 10, sem aspas, `(AUTOR, ano, p. X)` no final. Indireta com paráfrase + `(AUTOR, ano)`.
- **Figuras/tabelas** — citadas no texto **antes** de aparecerem. Legenda acima ("Figura X – Título"), fonte abaixo ("Fonte: O autor (2026).").
- **Glossário técnico** — primeira ocorrência de termo técnico no capítulo é explicada brevemente.
- **Sem clichês** — "é importante", "é crucial", "atualmente", "nos dias de hoje".

Detalhes completos: ver `tcc-writing.md` do projeto.

## Processo

### 1. Ler a pilha de fragmentos

Ler o arquivo de fragmentos **do início ao fim** antes de qualquer escrita. Formar mapa mental:
- Que afirmações principais aparecem?
- Que citações já estão coletadas?
- Que decisões técnicas precisam de justificativa formal?
- Que lacunas existem (afirmação sem suporte, decisão sem alternativas comparadas)?

Se há lacunas óbvias, **nomeá-las** ao usuário antes de começar: "Faltam citações de apoio para a afirmação sobre Kanban — quer adicionar, ou cortamos essa parte?"

### 2. Localizar arquivo do capítulo

Padrão SyncClass: `docs/tcc/cap{N}-{slug}.md`.

Se a seção que será escrita ainda não existe no arquivo, criar o heading correto:
```markdown
## N.X Título da Seção
```

Sem pontuação ao fim de títulos (exceto interrogação).

### 3. Propor 2–3 aberturas candidatas

Para a seção, propor **2 ou 3 parágrafos de abertura** diferentes. Cada um implicando ângulo/tese distinta. Mostrar **todos** ao usuário antes de escrever no arquivo.

**Exemplo (Capítulo 3 — Metodologia, seção 3.1):**

> **Opção A** (contextualização ampla):
> "A escolha metodológica em projetos de desenvolvimento de software fundamenta-se em critérios que extrapolam preferências técnicas individuais, abrangendo a natureza do problema investigado, o grau de participação do pesquisador e a flexibilidade exigida ao longo da execução. No presente trabalho, adotou-se a Pesquisa-Ação..."
>
> **Opção B** (entrada direta na decisão):
> "Adotou-se, neste trabalho, a Pesquisa-Ação como abordagem metodológica principal. A justificativa repousa em três fatores que dialogam com a natureza do projeto SyncClass..."
>
> **Opção C** (citação como abertura):
> "Conforme define Thiollent (2011, p. 14), 'a pesquisa-ação é um tipo de pesquisa social com base empírica que é concebida e realizada em estreita associação com uma ação'. Esta caracterização sintetiza a postura metodológica adotada no desenvolvimento do projeto SyncClass..."

Aguardar usuário escolher (ou compor híbrida).

### 4. Escrever **apenas** a abertura escolhida

Anexar ao arquivo do capítulo. Não escrever o próximo parágrafo.

### 5. Argumentar o próximo bloco

Perguntar: "Dado este parágrafo, o que o leitor precisa ler em seguida?"

Puxar fragmento relevante da pilha. Argumentar o **formato**:

#### Decisões de formato a tomar a cada bloco

**Prosa vs. lista**
- Prosa carrega argumento. Lista carrega itens paralelos.
- Se itens são *verdadeiramente* paralelos (mesma estrutura sintática, mesma natureza), lista. Senão, prosa com conectivos.
- Listas em TCC formal preferencialmente com hífen ou bullet padrão, ou enumeração `(i)`, `(ii)`, `(iii)` no corpo do parágrafo.

**Tabela vs. estrutura repetida em prosa**
- Mesma forma se repete 3+ vezes com mesmos campos? Tabela.
- Senão, prosa com leads em negrito.
- Toda tabela: legenda acima, fonte abaixo, citação no texto **antes** de aparecer.

**Figura vs. descrição textual**
- Figura quando a estrutura visual É o ponto (DER, diagrama UML, fluxo, arquitetura).
- Prosa quando o ponto é argumento sobre algo.
- Toda figura: legenda acima, fonte abaixo, citação no texto **antes** de aparecer.

**Citação direta vs. paráfrase**
- Direta: quando as palavras exatas do autor importam. Curta entre aspas no corpo. Longa (>3 linhas) recuada.
- Paráfrase: quando só a ideia importa. Geralmente mais fluida, recomendada como padrão.

**Código no corpo vs. apêndice**
- Trecho ≤5 linhas, ilustrativo: pode ir inline em bloco de código.
- Mais que isso → Apêndice. Referenciar com "(Apêndice A)".
- Nunca colar arquivo inteiro no corpo do TCC.

**Justificativa técnica — tripé**
Para toda decisão técnica não-trivial:
1. **Contexto** — qual problema/necessidade existia?
2. **Alternativas** — que opções foram consideradas?
3. **Critérios** — por que a escolhida atende melhor?

### 6. Escrever o bloco e parar

Anexar ao arquivo. Re-ler o arquivo do disco antes de cada escrita — usuário pode ter editado entre turnos. Nunca sobrescrever blocos anteriores.

### 7. Loop 5–6 até a seção fechar

Usuário decide quando a seção está completa. Não tentar terminar autonomamente.

## Postura conversacional

Push back ativo. Não deixar transições fracas passarem:

- "Esse parágrafo faz o quê pelo leitor que o anterior não fez?"
- "Se eu cortar isso, o que quebra na cadeia argumentativa?"
- "Esse trecho está fazendo dois trabalhos — separar ou escolher um?"
- "A abertura prometeu falar sobre X. Estamos derivando para Y. Re-amarrar ou mudar a abertura?"
- "Tem afirmação aqui sem citação de apoio. Tem fragmento que cobre? Senão, ressalvar ou cortar."
- "Esse vocabulário ('fiz', 'achei melhor') é da fase de fragmentos. Vamos converter para voz impessoal antes de salvar."

## Pilha como pedreira, não roteiro

Fragmentos são **matéria-prima**. Pode-se:
- Paragrafar um fragmento, dividi-lo em dois parágrafos, mesclar dois fragmentos em um, parafrasear, citar literal.
- Reordenar conforme a lógica do capítulo, não a ordem de captura.
- Deixar fragmentos sobrarem — está tudo bem, é o ponto de ter mais matéria-prima que o necessário.

Se a pilha não tem o que a seção precisa, **nomear a lacuna explicitamente**: "Precisamos de um exemplo aqui e a pilha não tem — me dá um agora, ou cortamos esta subseção."

## Vocabulário acadêmico de transição

Reforço dos conectivos formais para fluidez:

- **Causalidade:** "em virtude de", "decorrente de", "uma vez que", "tendo em vista que"
- **Adversidade:** "no entanto", "todavia", "em contrapartida", "por outro lado"
- **Conclusão:** "portanto", "desta forma", "conclui-se que", "depreende-se que"
- **Adição:** "ademais", "além disso", "outrossim", "soma-se a isso"
- **Exemplificação:** "a título de exemplo", "como ilustração", "verifica-se em"
- **Comparação:** "analogamente", "de maneira semelhante", "em contraste"

## Conversão livre → impessoal em tempo real

Quando o fragmento está em primeira pessoa ou informal, **converter na hora** ao escrever no capítulo:

| Fragmento bruto | Texto formal |
|---|---|
| "Eu escolhi Supabase porque..." | "Optou-se pelo Supabase em razão de..." |
| "A gente fez 24 sprints" | "O projeto contemplou 24 sprints" |
| "Achei melhor usar RLS" | "Considerou-se mais adequado o uso de Row Level Security (RLS)" |
| "Deu certo a abordagem" | "A abordagem apresentou resultado satisfatório" |
| "Tem 25 migrations" | "O projeto contempla 25 migrações SQL versionadas" |
| "É importante notar que" | (cortar — clichê. Reformular afirmação direta) |

## Encerramento da sessão

Quando o usuário diz que a seção está completa:
1. Re-ler o arquivo inteiro do capítulo.
2. Conferir rapidamente:
   - Toda figura/tabela citada antes de aparecer?
   - Toda citação no corpo tem entrada nas referências do projeto?
   - Glossário: termos técnicos explicados na primeira ocorrência?
   - Nenhuma primeira pessoa escapou?
3. Sugerir próximo passo: outra seção, ou rodar `tcc-revisao-impessoal` no capítulo todo.

Não declarar a seção "pronta" — só o usuário pode.
