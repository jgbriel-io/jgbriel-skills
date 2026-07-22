---
name: estimation
description: Applies effort-estimation technique to any deliverable, technical or not — task decomposition, three-point estimation (optimistic/likely/pessimistic via PERT), and project-level risk buffering. Use when user asks to estimate effort, size a task, "quanto tempo leva", three-point estimate, PERT, risk buffer, or when committing to a deadline for a client.
---

# Estimativa de Esforço

Estimar é probabilidade, não adivinhação. Vale para código, mas também para
design, migração de dados, redação de conteúdo, configuração de infra —
qualquer entrega com incerteza. O erro mais comum não é a conta errada, é
estimar a tarefa grande inteira de uma vez.

Output: a estimativa alimenta `proposta-comercial` (quando o destino é um
cliente) ou `project-planner` (quando é projeto pessoal documentado no wiki).

## 1. Decompor antes de estimar

Estimar direto uma tarefa grande ("integrar com o ERP do cliente", "migrar o
banco") é sempre errado — não porque a pessoa é ruim em estimar, mas porque
incerteza cresce com o tamanho do que ainda não foi pensado em detalhe.
Quebrar até cada parte ser pequena o bastante pra estimar com confiança
(regra prática: nada que não caiba estimar em poucas horas até 1-2 dias).

```
❌ "Integração com o ERP" → 3 semanas (chute)

✅ Integração com o ERP:
   - Mapear endpoints e autenticação do ERP        → confiança alta
   - Implementar client + retry/erro                → confiança alta
   - Transformar payload pro formato interno         → confiança média
   - Testar com dados reais do cliente                → confiança baixa (depende do cliente)
   - Homologação e ajustes pós-feedback                → confiança baixa
```

Se uma parte ainda parece "grande e vaga" depois de quebrada, quebra de novo.
Parte que ninguém consegue estimar com confiança é sinal de que falta
investigação (spike), não de que falta coragem pra chutar um número.

## 2. Três pontos por parte

Pra cada parte decomposta, levantar três números — não um:

- **Otimista (O)**: tudo dá certo, sem interrupção, sem imprevisto.
- **Mais provável (M)**: o cenário normal, com os atritos de sempre.
- **Pessimista (P)**: o que der errado plausivelmente der errado (dependência
  atrasa, requisito muda, ambiente do cliente tem uma particularidade).

Combinar os três com a fórmula PERT, que pondera o cenário mais provável e
embute margem sem virar chute:

```
Estimativa = (O + 4M + P) / 6
```

**Exemplo — "transformar payload pro formato interno":**

```
O = 4h   (formato já é bem parecido)
M = 8h   (cenário normal, com um ou outro campo divergente)
P = 20h  (schema do ERP é inconsistente por cliente, precisa normalizar caso a caso)

Estimativa = (4 + 4×8 + 20) / 6 = (4 + 32 + 20) / 6 = 56 / 6 ≈ 9,3h
```

Note que a estimativa final (9,3h) fica mais perto de M (8h) do que da média
simples de O/M/P (10,7h) — é isso que a ponderação por 4 faz: acomoda o
risco de cauda longa do pessimista sem deixar ele dominar o número.

Somar as estimativas PERT de todas as partes dá o esforço total da entrega —
mas essa soma ainda não é o prazo que vai pro cliente (ver seção 4).

## 3. Buffer de risco: no nível do projeto, não da tarefa

Buffer colocado dentro de cada tarefa individual desaparece — por dois
efeitos bem documentados:

- **Lei de Parkinson**: trabalho se expande até preencher o tempo disponível.
  Se a tarefa tem folga embutida, a folga é gasta, não economizada.
- **Síndrome do estudante**: com prazo confortável, o início é adiado até a
  folga já ter sumido — daí qualquer imprevisto real estoura o prazo mesmo
  assim.

A alternativa é não dar buffer tarefa por tarefa: somar as estimativas "sem
gordura" (a PERT de cada parte já carrega alguma margem, mas não é o buffer
de projeto) e aplicar um único buffer agregado no fim, dimensionado pelo
número de partes e pela incerteza geral:

```
Esforço total (soma das PERT)         = 42h
Buffer de projeto (20-35% típico,
  maior quanto mais partes de baixa
  confiança/dependência externa)      = 12h  (≈ 28%)
Estimativa final pro cliente           = 54h
```

O buffer de projeto absorve o imprevisto que não estava em nenhuma tarefa
específica — porque normalmente não está: é o e-mail que demora a ser
respondido, o ambiente de homologação que cai, o requisito que muda depois
de aprovado.

## 4. Viés comum

- **Otimismo sistemático**: quem estima tende a lembrar do caminho feliz e
  esquecer o atrito de projetos passados. Contra-medida: antes de fechar o
  número, perguntar "da última vez que fiz algo parecido, quanto tempo
  realmente levou?".
- **Ignorar o que não é a parte "principal"**: revisão de código, ajuste
  pós-review, deploy, escrever changelog/documentação, reunião de
  alinhamento com o cliente, tempo de handoff pro QA — tudo isso é trabalho
  real e raramente entra na conta de quem só pensa em "implementar a
  feature".
- **Ancoragem no número que o cliente quer ouvir**: se o cliente já mencionou
  um prazo, a estimativa tende a ser puxada pra caber nele. Estimar primeiro,
  comparar com a expectativa depois — nunca o contrário.

## 5. Estimativa não é compromisso

São duas coisas diferentes e a confusão entre elas é a origem de boa parte
do atrito com cliente:

| | Estimativa | Compromisso/prazo |
|---|---|---|
| Natureza | probabilística — uma faixa com confiança | decisão de negócio — uma data única |
| Quem decide | quem vai executar | quem responde pelo projeto (pode considerar margem comercial, prioridade do cliente, dependências externas) |
| Muda com | nova informação sobre o trabalho | raramente, depois de comunicado |

O compromisso é construído *em cima* da estimativa (estimativa + buffer de
projeto + margem de negócio), mas não é a mesma coisa. Prometer a estimativa
otimista como prazo é assumir o risco pessoalmente; prometer a pessimista
como prazo é perder o cliente pra concorrência. O prazo comunicado vem da
estimativa combinada com buffer — nunca do número otimista isolado.

## Checklist

- [ ] Entrega grande foi quebrada em partes estimáveis com confiança
- [ ] Cada parte tem O/M/P levantados, não só um número
- [ ] Estimativa da parte usa PERT — (O + 4M + P) / 6 — não média simples
- [ ] Trabalho "invisível" (review, deploy, comunicação, documentação) entrou na conta
- [ ] Buffer aplicado uma vez, agregado, no nível da entrega — não espalhado tarefa por tarefa
- [ ] Prazo comunicado ao cliente = estimativa + buffer, decisão explícita — não o número otimista
- [ ] Parte que ninguém consegue estimar virou investigação (spike), não virou chute

## Anti-patterns

- ❌ Estimar a entrega inteira num número só, sem decompor
- ❌ Estimar só o "mais provável", ignorando otimista e pessimista
- ❌ Dar buffer dentro de cada tarefa em vez de um buffer agregado no fim
- ❌ Prometer ao cliente a estimativa otimista como se fosse o prazo
- ❌ Esquecer revisão, deploy, homologação e comunicação na conta do esforço
- ❌ Ancorar a estimativa no prazo que o cliente queria ouvir
- ❌ Tratar estimativa e compromisso como a mesma decisão
