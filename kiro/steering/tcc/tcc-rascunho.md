---
inclusion: manual
description: "Transforma arquivo de fragmentos brutos em seção formal de TCC parágrafo a parágrafo, aplicando normas ABNT/FEPI, voz impessoal acadêmica, citações ABNT."
---

# TCC Rascunho

Sessão de moldagem que pega fragmentos brutos e produz seção de capítulo do TCC. **Parágrafo por parágrafo**, com argumento de formato a cada bloco.

## Normas obrigatórias

- **Voz impessoal absoluta** — voz passiva ou terceira pessoa. Nunca "eu", "nós", "implementei".
- **Português brasileiro** sempre.
- **Citações ABNT** — direta curta entre aspas + `(AUTOR, ano, p. X)`. Longa (>3 linhas) recuada 4cm, fonte 10. Indireta com paráfrase + `(AUTOR, ano)`.
- **Figuras/tabelas** citadas no texto **antes** de aparecerem. Legenda acima, fonte abaixo.
- **Sem clichês** — "é importante", "é crucial", "atualmente", "nos dias de hoje".

## Processo

### 1. Ler a pilha de fragmentos

Ler `docs/tcc/_fragmentos/cap{N}-fragmentos.md` do início ao fim. Nomear lacunas antes de começar.

### 2. Localizar arquivo do capítulo

Padrão SyncClass: `docs/tcc/cap{N}-{slug}.md`. Criar heading se seção não existe.

### 3. Propor 2–3 aberturas candidatas

Para a seção, propor **2–3 parágrafos de abertura** com ângulos distintos. Mostrar **todos** antes de escrever no arquivo. Aguardar usuário escolher.

### 4. Escrever só a abertura escolhida

Anexar ao arquivo. Não escrever próximo parágrafo ainda.

### 5. Argumentar o próximo bloco

Puxar fragmento relevante. Argumentar o formato antes de escrever:

- **Prosa vs. lista** — prosa carrega argumento, lista carrega itens paralelos
- **Tabela** — quando mesma forma se repete 3+ vezes com mesmos campos
- **Figura** — quando estrutura visual É o ponto (DER, diagrama, fluxo)
- **Citação direta vs. paráfrase** — direta quando as palavras exatas importam
- **Decisão técnica** — tripé: contexto + alternativas + critérios

### 6. Escrever o bloco e parar

Re-ler arquivo do disco antes de cada escrita. Nunca sobrescrever blocos anteriores.

### 7. Loop 5–6 até seção fechar

Usuário decide quando a seção está completa.

## Conversão livre → impessoal em tempo real

| Fragmento bruto | Texto formal |
|---|---|
| "Eu escolhi Supabase porque..." | "Optou-se pelo Supabase em razão de..." |
| "A gente fez 24 sprints" | "O projeto contemplou 24 sprints" |
| "Achei melhor usar RLS" | "Considerou-se mais adequado o uso de RLS" |
| "É importante notar que" | (cortar — clichê. Reformular direto) |

## Conectivos formais

- Causalidade: "em virtude de", "uma vez que", "tendo em vista que"
- Adversidade: "no entanto", "todavia", "em contrapartida"
- Conclusão: "portanto", "desta forma", "depreende-se que"
- Adição: "ademais", "além disso", "outrossim"

## Encerramento

Ao fechar seção: conferir figuras/tabelas citadas antes, citações nas referências, glossário, nenhuma primeira pessoa escapou.
