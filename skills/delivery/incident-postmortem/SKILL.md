---
name: incident-postmortem
description: Runs a blameless incident postmortem — timeline with timestamps, impact, root cause (5 whys), and corrective actions with an owner and deadline. Works for technical incidents (outage, production bug) or non-technical ones (process error, delivery delay, client miscommunication). Use when user asks about postmortem, post-incident review, RCA, root cause analysis, or wants help documenting a failure after it's been resolved.
---

# Incident Postmortem

Documento de pós-incidente: entender a cadeia de causas do sistema (técnico ou
de processo), não achar um culpado. Mesmo formato serve para queda de serviço,
bug crítico em produção, erro operacional ou atraso de entrega — o incidente
muda, a estrutura não.

Quando o vault estiver disponível, o documento final vai em
`wiki/Projetos/<projeto>/` (ou `wiki/Clientes/Diretos|Parceiros/<cliente>/` se
o incidente for de um projeto de cliente). Durante o incidente em si, a skill
é `rollback-runbook` — esta aqui entra depois de resolvido.

## Princípio blameless

O objetivo é que o sistema fique mais resistente à próxima falha, não que
alguém seja apontado. Duas consequências práticas:

- O documento descreve **ações e decisões no contexto em que foram tomadas**,
  não caráter ou competência de pessoa. Troca "esqueci de validar o input"
  por "o fluxo de deploy não tinha etapa de validação de input antes do
  merge".
- Postmortem que vira autopunição ensina a esconder o erro da próxima vez ou
  a suavizar o que realmente aconteceu — e o próximo incidente similar não é
  evitado porque o anterior não foi contado direito.
- Nomes só aparecem em "quem foi notificado" e "dono da ação corretiva" —
  nunca em "quem causou" (mesmo em projeto solo, vale documentar como
  decisão/processo, não como culpa pessoal).

## Quando abrir um postmortem formal

Nem todo incidente pequeno precisa de documento. Critério por severidade:

| Severidade | Critério | Postmortem formal? |
|---|---|---|
| Crítico | Cliente(s) impactado(s), perda de dado, SLA rompido, parada de operação | Sim, obrigatório |
| Alto | Degradação visível, contornado sem impacto externo confirmado | Sim, versão curta |
| Médio | Detectado e corrigido internamente antes de afetar alguém | Registro rápido, sem doc formal |
| Baixo | Erro pontual sem recorrência, causa óbvia e já corrigida | Não — anotar e seguir |

Regra prática: se a pergunta "isso pode acontecer de novo do mesmo jeito?" não
tem resposta óbvia, abre postmortem — mesmo que o impacto tenha sido pequeno
dessa vez.

## Estrutura do documento

### 1. Timeline

Cada evento relevante com timestamp (fuso fixo, ex. horário local do
cliente), em ordem cronológica: quando o problema começou (nem sempre é
quando foi detectado), quando foi detectado, quem foi acionado, cada ação de
mitigação tomada, quando foi resolvido.

### 2. Impacto

Quem foi afetado, por quanto tempo, e como se mede (usuários impactados,
transações perdidas, SLA de horas de atraso, valor financeiro se aplicável).
Sem número — mesmo estimado — o impacto vira opinião.

### 3. Causa raiz

Separar **causa imediata** de **causa raiz sistêmica**:

- Causa imediata: o que quebrou, tecnicamente ou operacionalmente ("o deploy
  subiu sem a migration", "a proposta foi enviada com o valor errado").
- Causa raiz: por que o sistema permitiu que isso quebrasse sem ser
  interceptado antes. Quase sempre é "não tinha teste/alerta/revisão/checklist
  pra isso" — não "errei".

Técnica dos 5 porquês para chegar lá:

```
Por quê 1: Por que o cliente recebeu a proposta com valor errado?
→ Porque a planilha de cálculo tinha uma fórmula desatualizada.

Por quê 2: Por que a fórmula desatualizada não foi pega antes do envio?
→ Porque não existe revisão por um segundo par de olhos antes do envio.

Por quê 3: Por que não existe essa revisão?
→ Porque o processo assume que quem monta a proposta também confere.

Por quê 4: Por que esse processo nunca foi questionado?
→ Porque nunca tinha dado errado antes visivelmente.

Por quê 5 (causa raiz): Por que o processo não tem um segundo checkpoint
estrutural, dado que erro de cálculo tem custo alto e é fácil de não notar
sozinho?
→ Falta uma etapa formal de revisão cruzada antes de qualquer envio externo
  com valor monetário.
```

Parar quando o "porquê" seguinte responder algo fora do controle (ex:
decisão de negócio externa) — nesse ponto vira causa raiz, não sintoma.

### 4. O que funcionou bem

Toda resposta a incidente tem algo que funcionou — detecção rápida, runbook
seguido, comunicação clara com o cliente. Registrar isso reforça o
comportamento certo e evita que o postmortem pareça só uma lista de falhas.

### 5. Ações corretivas

Cada ação precisa de **dono** (uma pessoa, não uma equipe) e **prazo**
(data, não "em breve"). Ação sem dono não acontece; ação sem prazo vira
backlog eterno.

| Ação | Dono | Prazo | Status |
|---|---|---|---|
| | | | |

## Template

```markdown
# Postmortem — <título curto do incidente>

**Severidade:** <crítico/alto/médio> · **Status:** <em andamento/resolvido>
**Data do incidente:** <data> · **Duração:** <hh:mm início → hh:mm fim>

## Resumo
<2-3 frases: o que aconteceu, impacto, se já está resolvido.>

## Impacto
- Quem foi afetado: <cliente(s)/usuários/eu mesmo>
- Duração do impacto: <tempo>
- Medida de impacto: <número — usuários, transações, valor, SLA>

## Timeline
| Horário | Evento |
|---|---|
| hh:mm | Início real do problema (se souber) |
| hh:mm | Detecção |
| hh:mm | Ação de mitigação tomada |
| hh:mm | Incidente considerado resolvido |

## Causa raiz

**Causa imediata:** <o que quebrou>

**5 porquês:**
1. ...
2. ...
3. ...
4. ...
5. (causa raiz) ...

## O que funcionou bem
- <item>

## Ações corretivas
| Ação | Dono | Prazo | Status |
|---|---|---|---|
| | | | |

## Lições
<1-2 frases: o que muda no processo/sistema a partir de agora.>
```

## Checklist

- [ ] Severidade avaliada antes de decidir se abre postmortem formal
- [ ] Timeline com timestamps reais, não aproximados de memória
- [ ] Impacto quantificado (número, não "afetou alguns clientes")
- [ ] Causa imediata e causa raiz sistêmica registradas separadamente
- [ ] 5 porquês aplicado até chegar em algo estrutural, não em "eu errei"
- [ ] Ao menos um item de "o que funcionou bem" registrado
- [ ] Toda ação corretiva tem dono único e prazo com data
- [ ] Documento revisado com uma segunda leitura fria, pra checar se ficou
      factual e sem tom de culpa
- [ ] Documento compartilhado com quem foi afetado, quando aplicável (cliente
      externo tem direito a saber o que houve e o que muda)

## Anti-patterns

- ❌ Causa raiz que termina em "erro humano" sem perguntar por que o sistema
  permitiu esse erro sem detecção
- ❌ Ação corretiva sem dono ("revisar o processo depois")
- ❌ Ação corretiva sem prazo ("em breve", "assim que possível")
- ❌ Postmortem formal aberto pra todo incidente médio/baixo, virando
  burocracia que ninguém lê
- ❌ Timeline reconstruída de memória dias depois, sem checar logs/mensagens
- ❌ Documento escrito só pra arquivar — sem as ações corretivas serem
  cobradas depois
- ❌ Aplicar o formato só a incidente técnico e improvisar quando o erro é
  operacional (proposta errada, atraso de entrega, comunicação falha com
  cliente) — a estrutura é a mesma nos dois casos
