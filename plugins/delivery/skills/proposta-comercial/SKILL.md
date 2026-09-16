---
name: proposta-comercial
description: Transforma um briefing de cliente em proposta comercial de freela — escopo fechado (incluído/excluído), entregáveis, cronograma, investimento e condições. Entrevista o que faltar, uma pergunta por vez, e salva a proposta no vault do cliente. Use quando o usuário disser "faz a proposta pro cliente X", "monta o orçamento", "escopo pro freela", "proposta comercial", ou colar um briefing pedindo precificação. Não gera contrato jurídico — só a proposta.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Freela — Proposta

Briefing → proposta fechada. O objetivo é escopo sem ambiguidade: proposta
vaga vira retrabalho não pago.

## Processo

### 1. Extrair do briefing

Do que o usuário colou/contou, extrair: cliente, objetivo do projeto,
entregáveis implícitos, prazo mencionado, orçamento sinalizado. O que não
estiver claro entra na entrevista.

### 2. Entrevistar o que falta (uma pergunta por vez)

Na ordem do que mais trava a proposta:

1. **Entregáveis** — o que exatamente o cliente recebe? (site de N páginas,
   painel, integração X). Sugerir lista e confirmar.
2. **Fora do escopo** — o que o cliente pode achar que está incluído mas não
   está (conteúdo/copy, fotos, SEO contínuo, hospedagem, manutenção). A seção
   mais importante da proposta.
3. **Prazo** — em semanas, contado a partir do quê (aprovação? recebimento do
   material do cliente?).
4. **Investimento** — o preço vem sempre do usuário: perguntar o valor
   fechado ou a taxa/hora. Se pedirem sugestão, estimar horas por entregável
   e multiplicar pela taxa que o usuário informar — a estimativa é de horas,
   a precificação é dele.
5. **Condições** — forma de pagamento (sinal + entrega é o padrão), quantas
   rodadas de revisão inclusas, o que é cobrado à parte, validade da proposta.

### 3. Montar a proposta

```markdown
# Proposta — <Projeto> · <Cliente>

**Data:** <YYYY-MM-DD> · **Validade:** <X dias>

## Contexto
<2-3 frases: o problema do cliente e o que será feito.>

## Escopo

### Incluído
- <entregável 1>
- ...

### Não incluído
- <item> — <pode ser contratado à parte / responsabilidade do cliente>

## Cronograma
| Etapa | Entrega | Prazo |
|---|---|---|

## Investimento
**R$ <valor>** — <forma de pagamento (ex.: 50% na aprovação, 50% na entrega)>

## Condições
- <N> rodadas de revisão inclusas; adicionais a R$ <valor>/rodada
- Prazo conta a partir de <marco>
- Conteúdo (textos, imagens) fornecido pelo cliente até <marco>
```

### 4. Salvar e revisar

- Salvar em `wiki/Clientes/<cliente>/Proposta - <Projeto>.md` (perguntar o
  destino se o cliente não tiver pasta; nunca na raiz do vault).
- Ler de volta com olho de cliente: alguma linha que ele possa interpretar
  como "isso está incluído" quando não está? Fechar a brecha.
- Oferecer versão enxuta pra WhatsApp/e-mail (5-8 linhas) se o usuário quiser.

## Limites

- Não é contrato — cláusulas jurídicas, multa, rescisão ficam fora.
- Preço é decisão do usuário; a skill estrutura, não precifica sozinha.
