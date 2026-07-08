---
name: tcc-auditoria-banca
description: Simula o parecer escrito de uma banca avaliadora de TCC sobre o documento já redigido. Lê os capítulos e produz um relatório de avaliação por critérios (estrutura e normas ABNT/FEPI, problema/objetivos/hipóteses, referencial teórico, metodologia e validade, resultados e discussão, conclusão, qualidade da escrita, contribuição), com conceito por critério, pontos fortes, fragilidades, exigências obrigatórias vs sugestões, e recomendação final (aprovado / aprovado com ressalvas / reprovado). Use quando o usuário disser "simular banca", "parecer de banca", "auditoria de banca", "avaliar como banca", "nota da banca", "tá pronto pra banca?", "avalia meu TCC como examinador", antes da entrega final ou da defesa. Não é interrogatório oral (isso é tcc-grill) nem revisão mecânica de forma (tcc-revisao-impessoal) — é o parecer avaliativo do documento.
allowed-tools: Read, Grep, Glob, Bash
---

# TCC — Auditoria de Banca

Produz o **parecer de uma banca examinadora** sobre o TCC escrito. Não é
revisão de amigo nem feedback de orientador: é a leitura de um examinador
que vai apontar tudo que enfraquece o trabalho na defesa. Severo, mas justo
e fundamentado — cada crítica vem com a razão e o que corrigir.

Distinção das outras skills de TCC:
- `tcc-revisao-impessoal` → forma mecânica (1ª pessoa, clichês, citações órfãs).
- `tcc-grill` → interrogatório oral, uma pergunta dura por vez.
- `tcc-orientador` (agent) → feedback de orientação durante a escrita.
- **esta** → parecer avaliativo final do documento, por critérios, com conceito.

## Processo

1. **Localizar o documento.** Procurar os capítulos finais (ex.:
   `**/capitulos-final/*.md`, `**/projeto-escrito/**`). Se não achar, perguntar
   o caminho. Ler todos os capítulos + apêndices + resumo.
2. **Avaliar cada critério** lendo o texto real — citar trecho/seção como prova,
   nunca avaliar no abstrato.
3. **Atribuir conceito por critério** (escala abaixo).
4. **Separar exigências de sugestões.** Exigência = banca cobraria correção
   antes de aprovar. Sugestão = melhoria opcional.
5. **Recomendação final** com base no conjunto.

## Critérios de avaliação

Avaliar estes nove, nesta ordem. Cada um recebe conceito + justificativa.

1. **Estrutura e normas (ABNT/FEPI)** — elementos obrigatórios presentes e na
   ordem certa (capa, folha de rosto, folha de aprovação, resumo/abstract,
   sumário, textuais, referências, apêndices); numeração; sumário coerente.
2. **Problema, objetivos e hipóteses** — problema claro e delimitado; objetivos
   verificáveis; hipóteses falseáveis e alinhadas ao problema.
3. **Referencial teórico** — cobertura suficiente, fontes pertinentes e atuais,
   conexão com o problema (não é "colcha de retalhos" de conceitos soltos).
4. **Metodologia e validade** — método adequado ao objetivo; instrumentos
   descritos; rastreabilidade; ameaças à validade reconhecidas (grupo de
   controle, viés, generalização, tamanho de amostra).
5. **Resultados e discussão** — evidência consistente com as hipóteses; análise
   crítica (não só descrição); confronto com a literatura.
6. **Conclusão** — responde aos objetivos e a cada hipótese; não repete a
   introdução; limitações e trabalhos futuros honestos.
7. **Qualidade da escrita** — impessoalidade, coesão, clareza, vocabulário
   formal, ausência de informalidade; legendas/figuras/tabelas chamadas no texto.
8. **Contribuição e relevância** — o que o trabalho agrega; justificativa
   prática/social/acadêmica sustentada.
9. **Consistência geral** — coerência entre capítulos; sem contradições;
   terminologia uniforme; afirmações sustentadas por evidência ou citação.

## Escala de conceito

Por critério e no geral:

- **Excelente** — sem ressalvas; defenderia sem dificuldade.
- **Adequado** — sólido; ajustes menores.
- **Suficiente com ressalvas** — passa, mas a banca cobraria correções.
- **Insuficiente** — fragilidade que compromete; precisa revisão antes da defesa.

## Layout do parecer

Usar exatamente esta estrutura:

```markdown
# Parecer de Banca — <título do TCC>

**Avaliado em:** <data>
**Documento:** <arquivos/caminho lidos>

## Síntese
<2-3 frases: impressão geral + recomendação em uma linha.>

## Avaliação por critério

### 1. Estrutura e normas (ABNT/FEPI) — <conceito>
**Pontos fortes:** ...
**Fragilidades:** ...
**Evidência:** <seção/trecho>

### 2. Problema, objetivos e hipóteses — <conceito>
... (mesmo formato para os 9 critérios)

## Exigências (corrigir antes de aprovar/defender)
1. ...
2. ...

## Sugestões (melhoram, não bloqueiam)
1. ...

## Perguntas que a banca provavelmente fará
- ...
- ...

## Recomendação final
**<Aprovado | Aprovado com ressalvas | Reprovar para revisão>** — <justificativa em 1-2 frases.>
```

## Postura

- **Fundamentar toda crítica.** "Fraco" não vale; diga por que e cite onde.
- **Antecipar a defesa oral.** A seção "Perguntas" prepara o estudante para o
  pior que a banca perguntaria — foque nas fragilidades metodológicas reais.
- **Distinguir norma de conteúdo.** Erro de ABNT é exigência objetiva; mérito
  do argumento é juízo — declare qual é qual.
- **Não suavizar nem inflar.** Se está insuficiente, diga; se está sólido,
  reconheça sem floreio.
- **Não reescrever o texto.** O parecer aponta; a correção é do autor (use
  as skills de escrita para isso).

## Limites

- Avalia o documento, não valida fatos externos (não confere se uma citação
  reflete a fonte original).
- Não substitui a banca real — é ensaio para antecipá-la.
- Se o documento estiver incompleto (capítulos faltando, placeholders),
  avaliar o que existe e listar o que falta como exigência.
