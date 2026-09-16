---
name: rollback-runbook
description: Defines a deploy-tool-agnostic rollback runbook — reverting a code deploy (blue-green/canary/previous artifact), why reverting a database migration is usually the wrong move, feature flags as a faster alternative to full rollback, and rollback-vs-forward-fix decision criteria. Use when user asks about rollback, revert deploy, incident response, kill switch, hotfix, or rolling back a release.
---

# Rollback Runbook

Rollback é procedimento, não ferramenta. O que muda entre Vercel, Cloudflare Pages/Workers, Kubernetes, ECS, Heroku ou um bare-metal com systemd é só o comando — a decisão (o quê reverter, em que ordem, quando não reverter) é sempre a mesma. Este runbook assume qualquer stack (Vite/Next.js, NestJS, Supabase/Postgres, Python, Go).

## Decisão: rollback vs forward-fix

| Situação | Ação |
|---|---|
| Causa raiz óbvia, fix de 1 linha, já testado | Forward-fix — mais rápido que orquestrar rollback |
| Causa raiz incerta, ou fix não trivial | Rollback — parar o sangramento primeiro, investigar depois |
| Migration destrutiva já rodou e sujou dados | Rollback de código não resolve sozinho — ver seção Migration |
| Feature isolada atrás de flag | Desligar a flag — mais rápido que rollback completo |
| Incidente afetando cliente/SLA, tempo é crítico | Rollback, sem debate — investigar com o sistema já estável |

Regra prática: se a dúvida "reverto ou conserto?" ainda existe depois de 5 minutos olhando o incidente, a resposta é reverter. Forward-fix sob pressão tem taxa de erro alta.

## Reverter o deploy de código

| Estratégia | Como reverte | Velocidade | Observação |
|---|---|---|---|
| Blue-green | Troca de roteamento pro ambiente antigo (que continua de pé) | Segundos | Exige manter os dois ambientes ativos — custo dobrado durante a janela |
| Canary | Corta o tráfego pro canary, 100% volta pro estável | Segundos-minutos | Se o canary já se expandiu além de uma fração pequena, tratar como deploy completo |
| Artefato/deployment anterior | Reaplica a versão N-1 (mesmo build, mesma tag) | Minutos | Nunca faz rebuild — reusa o artefato já testado, é isso que faz o rollback ser rápido |
| Rolling update em execução | Pausa o rollout, reverte a versão-alvo, deixa o orquestrador convergir | Minutos | Rollback de um rolling update parado no meio some com estado misto até convergir |

Princípios que valem para qualquer ferramenta:

- Rollback de código reaplica um artefato já validado — nunca é "git revert + rebuild + redeploy" sob pressão. Se o rollback depende de build, o pipeline está errado.
- Reverter para a versão anterior conhecida-boa, não para "uma versão mais antiga qualquer" — confirmar qual foi o último deploy saudável antes de reverter.
- Rollback muda o código que roda, não o schema do banco — os dois são independentes por design (ver `safe-migrations`).
- Depois do rollback, travar novos deploys até a causa raiz ser entendida (freeze), senão o bug é reintroduzido sem perceber.

## Feature flag: o rollback mais rápido é não fazer rollback

Se a mudança problemática está atrás de flag, desligar a flag é mais rápido e mais seguro que reverter o deploy inteiro:

- Não depende de pipeline de deploy, orquestrador ou propagação de infra — é uma escrita no provider de flags (GrowthBook, LaunchDarkly, Unleash, Flagsmith, ou uma tabela própria em Postgres/Supabase).
- Efeito em segundos, sem redeploy, sem restart de instância.
- Reverte só o comportamento novo — não perde outras mudanças que foram no mesmo deploy (fix de outro bug, dependência atualizada etc.).
- Exige que a feature nova tenha sido lançada atrás de flag desde o início — não dá pra criar a flag depois que o incidente já começou.

Quando a flag não é opção (mudança não estava flagueada, ou o bug é em código de infraestrutura compartilhado), cai no rollback de deploy normal.

## Migration: por que raramente é a estratégia de rollback

Reverter uma migration de schema em produção, no meio de um incidente, quase sempre piora a situação:

- Se a migration seguiu expand-contract (ver `safe-migrations`), o schema nunca precisou ser revertido — o código velho e o novo convivem no mesmo schema durante toda a operação. Rollback de código sozinho já resolve.
- `DROP COLUMN`/`DROP TABLE` não tem volta — dado apagado não retorna sem restore de backup (ver `backup-restore`). "Reverter a migration" nesse caso significa restore, não `migrate down`.
- Rodar `down` de uma migration que já rodou `up` em produção, com dado real gravado depois, corrompe ou perde dado que não existia quando o `up` rodou.
- Migration com lock ainda em andamento: cancelar/matar a query é mais seguro que tentar reverter no meio.

Prática:

- Primeiro, reverter o código para a versão que não depende da mudança de schema.
- Só reverter a migration em si (schema) se ela realmente quebrou algo sozinha (ex: índice mal criado degradando performance) — e mesmo assim, com backup confirmado antes.
- Se a migration destrutiva já rodou e não seguiu expand-contract, isso é a causa raiz a resolver depois do incidente (ver `incident-postmortem`): nenhuma migration destrutiva deveria ir para produção fora do padrão de fases.

## Comunicação durante o incidente

- Declarar o incidente (mesmo que só pra si mesmo/registro, em projeto solo; ou no canal do cliente, em projeto freela) antes de começar a mexer, não depois.
- Anunciar a ação tomada ("revertendo deploy X para versão Y") antes de executar — evita ações conflitantes se houver mais de uma pessoa envolvida.
- Confirmar quando o rollback terminou e o sistema voltou a operar normal.
- Pós-incidente: postmortem sem culpa, causa raiz documentada (ver `incident-postmortem`), e se o rollback foi lento, isso vira item de ação (automatizar o passo manual, adicionar flag, etc.).

## Checklist

- [ ] Identificado o último deploy saudável antes de reverter (não "uma versão anterior qualquer")
- [ ] Confirmado que a mudança problemática está atrás de flag antes de decidir por rollback completo
- [ ] Rollback de código feito reaplicando artefato já testado, sem rebuild
- [ ] Verificado se a migration em produção seguiu expand-contract — se sim, rollback de código já resolve, sem tocar no schema
- [ ] Se migration destrutiva já rodou, confirmado backup antes de qualquer ação sobre o schema
- [ ] Incidente declarado e ação comunicada antes de executar
- [ ] Novos deploys travados (freeze) até causa raiz confirmada
- [ ] Confirmação de que o sistema voltou ao normal
- [ ] Postmortem agendado com causa raiz e ação de melhoria no processo de rollback

## Anti-patterns

- ❌ Rollback que depende de build/compile sob pressão — se não é reaplicar artefato pronto, não é rollback rápido
- ❌ Rodar `migrate down` em produção sem checar se dado novo foi gravado depois do `up`
- ❌ Reverter deploy inteiro quando desligar uma feature flag resolveria em segundos
- ❌ Migration destrutiva em produção sem seguir expand-contract, forçando rollback de schema no meio de um incidente
- ❌ Executar rollback sem avisar ninguém envolvido, gerando ações conflitantes
- ❌ Encerrar o incidente sem postmortem, repetindo a mesma causa raiz depois
- ❌ Continuar fazendo deploys normais logo após o rollback, sem freeze, reintroduzindo o bug

## Exemplos por stack

**Vercel (Next.js)** — promover deployment anterior direto no dashboard/CLI, sem rebuild:
```bash
vercel rollback <deployment-url-or-id>
```

**Cloudflare Pages/Workers** — reverter pra um deployment anterior via dashboard, ou re-publicar a versão anterior via wrangler (ver skill `wrangler`):
```bash
wrangler rollback [deployment-id]
```

**Kubernetes** — reverte o rollout para a revision anterior (reusa a imagem já testada):
```bash
kubectl rollout undo deployment/api
kubectl rollout undo deployment/api --to-revision=42   # revision específica
```

**Heroku / PaaS com releases** — reaplica um release anterior:
```bash
heroku releases:rollback v122 -a api-prod
```

**Feature flag (independente de plataforma)** — kill switch sem redeploy:
```bash
curl -X PATCH https://app.growthbook.io/api/v1/features/checkout-v2 \
  -H "Authorization: Bearer $GROWTHBOOK_API_KEY" \
  -d '{"environments":{"production":{"enabled":false}}}'
```

**Supabase/Postgres — não reverter, checar expand-contract primeiro**: se a migration seguiu o padrão, o rollback é só reverter o deploy da aplicação; a coluna/tabela antiga continua no schema até o passo de `contract`, então não há schema para desfazer no meio do incidente.
