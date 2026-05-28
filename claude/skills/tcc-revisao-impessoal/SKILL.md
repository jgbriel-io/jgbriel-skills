---
name: tcc-revisao-impessoal
description: Varredura final de capítulo de TCC procurando primeira pessoa, clichês acadêmicos, informalidade, vocabulário fraco, citações órfãs, figuras/tabelas sem chamada no texto, e termos técnicos não explicados na primeira ocorrência. Gera relatório com localizações (linha, trecho, problema, sugestão) e opcionalmente aplica correções. Use quando o usuário diz "revisar capítulo X", "revisão impessoal", "passar o pente fino no TCC", "preparar capítulo pra entrega", ou marca um capítulo como pronto e quer validar antes de enviar ao orientador.
allowed-tools: Read, Edit, Glob, Grep
---

# TCC Revisão Impessoal

Varredura mecânica de capítulo concluído. Encontra violações de normas acadêmicas que escaparam ao drafting. Não é skill criativa — é skill de QA do texto.

## Quando usar

- Capítulo está em rascunho completo e usuário quer validar antes de marcar como ✅.
- Antes de enviar capítulo ao orientador.
- Auditoria periódica de capítulos já finalizados (regressão).
- Usuário diz: "revisar", "pente fino", "checar voz impessoal", "tá pronto pra enviar?".

## Quando NÃO usar

- Capítulo ainda em construção → use `tcc-rascunho`.
- Mudar argumento ou estrutura do texto → não é escopo. Esta skill só cuida de **forma**, não de **conteúdo**.
- Validar citação contra fonte original → fora de escopo. Só verifica se citação aparece nas Referências.

## Processo

### 1. Localizar arquivo a revisar

Pergunta-padrão se usuário não disse: "Qual capítulo? (ex: `docs/tcc/cap3-metodologia.md`)"

Ou aceitar argumento direto (número do capítulo ou path completo).

### 2. Rodar verificações em ordem

Para cada verificação abaixo, usar `Grep` ou `Read` no arquivo e construir relatório com formato:

```
LINHA: N
TRECHO: "<excerto problemático>"
PROBLEMA: <descrição curta>
SUGESTÃO: <correção proposta>
```

### Verificação 1 — Primeira pessoa do singular/plural

Padrões a buscar (case-insensitive, palavra inteira):

- `\beu\b` (pronome)
- `\bnós\b`, `\bnos\b` (pronome objeto)
- `\bminha\b`, `\bmeu\b`, `\bminhas\b`, `\bmeus\b`
- `\bnossa\b`, `\bnosso\b`, `\bnossas\b`, `\bnossos\b`
- `\bme\b` (em contexto reflexivo: "me parece", "me convém")
- Verbos em 1ª pessoa: `\bfiz\b`, `\bfizemos\b`, `\bfaço\b`, `\bfazemos\b`, `\bimplementei\b`, `\bimplementamos\b`, `\bescolhi\b`, `\bescolhemos\b`, `\bdesenvolvi\b`, `\bdesenvolvemos\b`, `\bcriei\b`, `\bcriamos\b`, `\bdecidi\b`, `\bdecidimos\b`, `\boptei\b`, `\boptamos\b`, `\bachei\b`, `\bachamos\b`, `\bconsiderei\b`, `\bconsideramos\b`, `\butilizei\b`, `\butilizamos\b`, `\busei\b`, `\busamos\b`, `\bvou\b` (em "vou explicar"), `\bvamos\b` (em "vamos analisar"), `\bpretendo\b`, `\bpretendemos\b`

**Exceção legítima:** citação direta literal de autor em primeira pessoa — manter dentro das aspas.

**Sugestões automáticas:**
- "Eu desenvolvi X" → "Desenvolveu-se X" / "X foi desenvolvido"
- "Nós escolhemos Y" → "Optou-se por Y" / "Y foi adotado"
- "Achei melhor" → "Considerou-se mais adequado"
- "Vou explicar" → "Explica-se" / "Será apresentado"
- "A gente fez" → "Realizou-se" / "O projeto contemplou"
- "Minha pesquisa" → "A presente pesquisa" / "O presente trabalho"

### Verificação 2 — Clichês acadêmicos

Frases vazias que não adicionam informação:

- `é importante (notar|destacar|ressaltar|frisar|salientar)`
- `é (crucial|vital|fundamental|essencial)` (geralmente vazio)
- `atualmente`, `nos dias de hoje`, `no mundo atual`, `na sociedade contemporânea`
- `cada vez mais`
- `com o avanço (da tecnologia|tecnológico)`
- `desde os primórdios`
- `vale (lembrar|ressaltar|destacar|mencionar)`
- `não restam dúvidas (que|de que)`
- `é sabido que`, `como é sabido`

**Sugestão padrão:** cortar a frase introdutória, ir direto à afirmação.

> "É importante notar que o Supabase oferece RLS nativo." → "O Supabase oferece RLS nativo."

### Verificação 3 — Informalidade

- `\btipo\b` (como conector, ex: "tipo assim")
- `\ba gente\b`
- `\brolou\b`, `\brolar\b`
- `\bdeu certo\b`, `\bdeu errado\b`
- `\bpra\b`, `\bpro\b`, `\bpros\b`, `\bpras\b` (em prosa formal — em citação literal mantém)
- `\btá\b`, `\btô\b`
- `\bné\b`
- `\bcoisa\b` (vago — "uma coisa importante")
- `\bmuito\b` (intensificador — "muito rápido", "muito bom" → usar quantificação)
- `\bbem\b` (intensificador — "bem rápido" → idem)

**Exceção:** citação literal.

### Verificação 4 — Citações órfãs

Buscar padrão `\([A-Z][A-ZÁÉÍÓÚÂÊÔÃÕÇ]+,?\s*\d{4}` (autor em maiúsculas + ano).

Para cada match, **conferir** se o autor aparece em `docs/tcc/tcc-8-periodo/projeto-escrito/Referências Bibliográficas.md` (ou path equivalente — perguntar usuário se não souber).

Reportar autores citados no corpo **ausentes** das Referências.

Também reportar autores **nas Referências** mas **nunca citados** no corpo do capítulo (possíveis referências órfãs).

### Verificação 5 — Figuras/tabelas sem chamada prévia

Buscar `^Figura \d+ – ` e `^Tabela \d+ – ` (início de linha).

Para cada figura/tabela `N`:
- Procurar nos parágrafos **anteriores** ao caption uma menção: `Figura N`, `Tabela N`, `(Figura N)`, `conforme Figura N`, `apresentada na Figura N`, etc.
- Se não houver menção anterior, reportar: "Figura N aparece sem ter sido citada antes no texto."

**Regra ABNT:** toda figura/tabela deve ser mencionada **antes** de aparecer.

### Verificação 6 — Glossário técnico (primeira ocorrência)

Lista de termos técnicos esperados (ajustar conforme o capítulo):
`SaaS`, `BaaS`, `RLS`, `MVP`, `IA`, `LGPD`, `ODS`, `ISO 25010`, `RNF`, `RF`, `UML`, `DER`, `CRUD`, `JWT`, `API`, `REST`, `JSON`, `SQL`, `CI/CD`, `MVC`, `DDD`, `ORM`, `PWA`, `SPA`, `SSR`, `CSR`.

Para cada termo encontrado no capítulo:
- Localizar a **primeira ocorrência**.
- Verificar se há expansão da sigla próxima: padrão `Termo (Expansão)` ou `Expansão (Termo)`.
- Se a primeira ocorrência é a sigla pura sem expansão, reportar: "Sigla X usada sem expansão na primeira ocorrência (linha N)."

**Sugestão:** "SaaS" → "Software como Serviço (SaaS)" ou "SaaS (Software como Serviço)".

### Verificação 7 — Pontuação em títulos

Headings markdown (`#`, `##`, `###`).

Regra ABNT: títulos **não levam ponto final**. Interrogação (`?`) é permitida em títulos-pergunta.

Reportar todo heading que termina em `.`, `;`, `:`.

### Verificação 8 — Alinhamento/formatação semântica

Esta verificação é leve em markdown (formatação real é Word). Mas conferir:
- Linha em branco antes/depois de heading.
- Linha em branco entre parágrafos (não duas).
- Trecho de código com bloco markdown (` ``` `) e linguagem identificada.
- Citações longas: bloco de quote (`>`) com `(AUTOR, ano, p. X)` após.

### 3. Gerar relatório

Formato:
```markdown
# Relatório de Revisão — Capítulo N (path)

Gerado em: <data>

## Resumo
- N ocorrências de primeira pessoa
- N clichês acadêmicos
- N informalidades
- N citações órfãs (no corpo, ausentes nas Referências)
- N possíveis referências órfãs (nas Referências, ausentes no corpo)
- N figuras/tabelas sem chamada prévia
- N siglas sem expansão na primeira ocorrência
- N títulos com pontuação inadequada

## Ocorrências detalhadas

### Primeira pessoa
LINHA 47
TRECHO: "Eu desenvolvi a arquitetura..."
SUGESTÃO: "Desenvolveu-se a arquitetura..." / "A arquitetura foi desenvolvida..."

LINHA 89
TRECHO: "Nós escolhemos o Supabase..."
SUGESTÃO: "Optou-se pelo Supabase..." / "O Supabase foi adotado..."

### Clichês
LINHA 12
TRECHO: "É importante notar que..."
SUGESTÃO: cortar introdução, ir direto à afirmação.

(... etc)
```

Salvar relatório em `docs/tcc/_revisoes/cap{N}-revisao-{data}.md` ou exibir inline conforme preferência do usuário.

### 4. Oferecer aplicação

Após o relatório, perguntar:
1. **Aplicar todas as sugestões automáticas** (pronomes, clichês, informalidades — correções mecânicas).
2. **Revisar uma a uma** (mostrar diff, confirmar cada).
3. **Só relatório, sem aplicar** (usuário corrige manualmente).

**Não aplicar** alterações em:
- Citações órfãs (não é correção mecânica — exige pesquisar a referência).
- Figuras sem chamada prévia (não é correção mecânica — exige rescrever o parágrafo).
- Glossário (exige decisão editorial sobre onde inserir a expansão).

Estes ficam só como recomendação.

## Limites desta skill

- **Não** valida o argumento do capítulo (escopo de orientador humano ou skill criativa).
- **Não** valida se citação reflete fielmente a fonte original (só presença).
- **Não** mexe em conteúdo — só em forma.
- **Não** garante aprovação acadêmica — é primeira camada de QA, não substitui revisão humana.

## Encerramento

Mostrar resumo final:
```
Capítulo N revisado.
Antes: X ocorrências em 8 categorias.
Aplicadas: Y correções automáticas.
Pendentes para revisão humana: Z itens (citações órfãs, figuras, glossário).

Recomendação: ler o capítulo em voz alta uma vez antes de enviar — captura ritmo
e fluência que verificação mecânica não pega.
```
