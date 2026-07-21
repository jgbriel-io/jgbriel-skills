---
name: health-checks-metrics
description: Apply health check (readiness vs. liveness) and basic metrics practices — what each probe verifies, failure blast radius, dependency-check depth, and RED/USE metrics without label cardinality explosion. Use when user asks about health check, readiness probe, liveness probe, /healthz endpoint, orchestrator restart loop, or basic service metrics.
---

# Health Checks e Métricas Básicas

Duas perguntas diferentes que todo orquestrador (Kubernetes, ECS, Nomad, systemd, PM2, App Service) faz ao processo, com consequência diferente cada uma:

| Pergunta | Probe | Falha causa |
|---|---|---|
| "O processo está travado/morto e precisa reiniciar?" | Liveness | Orquestrador **mata e reinicia** o processo |
| "O processo está pronto pra receber tráfego agora?" | Readiness | Orquestrador **tira da lista de load balancing**, sem reiniciar |

Confundir as duas é a causa mais comum de outage auto-infligido: usar a mesma checagem para ambas, ou colocar dependência externa na liveness, derruba o serviço inteiro por um problema que era só "espera um pouco".

## Liveness

Responde: "este processo está num estado do qual não vai se recuperar sozinho?" (deadlock, loop infinito, memória corrompida, thread principal travada).

- Deve ser **barata e local**: sem I/O de rede, sem query a banco, sem chamada a serviço externo
- Falso positivo é caro — reinicia um processo saudável, derruba conexões em andamento, pode entrar em crash-loop
- Se o processo responde (mesmo que devagar ou com erro de negócio), ele está vivo — liveness não é sobre "está tudo bem", é sobre "não está travado"

```
// ❌ liveness chamando banco de dados
GET /livez -> ping(database) -> 200/500

// ✅ liveness só confirma que o event loop/runtime responde
GET /livez -> 200 sempre que o processo consegue processar a requisição
```

## Readiness

Responde: "este processo está pronto pra receber tráfego útil agora?" (conexões de banco estabelecidas, cache aquecido, migração aplicada, dependência crítica de boot disponível).

- Pode checar dependências **diretas e essenciais pro processo funcionar** (conexão de banco, fila de mensagens que ele consome)
- Falhar readiness é barato — só tira da rotação, o processo continua vivo e pode voltar a ficar pronto sozinho
- Usado também no rollout: pod novo só recebe tráfego depois que readiness passa (evita 502 durante deploy)

```
// ✅ readiness confirma dependências diretas de servir requisição
GET /readyz -> {
  db: pingDatabase(),        // conexão que o processo usa em toda request
  queue: checkConnection(),  // se o processo consome fila, precisa da conexão
} -> 200 se todas ok, 503 se alguma falhar
```

## Profundidade da checagem: onde parar

O erro mais caro em health check é **checar demais**: propagar a checagem por toda a cadeia de dependências transitivas até um serviço externo lento derruba o cluster inteiro, não só uma chamada.

| Checar | Não checar |
|---|---|
| Conexão própria de banco/fila que o processo usa diretamente | Serviço de terceiro fora do seu controle (gateway de pagamento, API de CEP) |
| Migração de schema aplicada no boot | Saúde de serviço "irmão" que não é dependência direta desta instância |
| Cache local inicializado, se o processo depende dele pra responder | Toda a cadeia transitiva (A verifica B que verifica C que verifica D) |
| Espaço em disco/memória se isso impede o processo de funcionar | Latência artificial só pra "ter certeza" — health check não é smoke test completo |

```
// ❌ readiness em cascata: se o serviço de pagamento externo cair,
// TODAS as instâncias ficam not-ready e o cluster inteiro para
GET /readyz -> checkExternalPaymentGateway() -> 503 se lento

// ✅ dependência externa não crítica pro boot: circuit breaker/fallback
// no código de negócio, não no health check
GET /readyz -> checkOwnDatabaseConnection() -> 200
// chamada ao gateway de pagamento tem timeout/retry/fallback próprios,
// e não derruba a instância inteira se estiver degradada
```

Regra prática: readiness cobre "o que este processo precisa pra fazer seu trabalho", não "o mundo inteiro está bem". Se a dependência tem seu próprio circuito de resiliência (retry, timeout, fallback), ela não pertence ao health check.

## Startup probe (quando existir)

Processos com boot lento (JVM aquecendo, migração pesada, cache frio grande) se beneficiam de uma terceira checagem, separada de liveness/readiness: confirma que o processo **terminou de inicializar**, com timeout mais generoso, antes que liveness comece a contar falhas. Sem isso, boot lento é confundido com processo travado e o orquestrador reinicia em loop.

## Métricas básicas: RED ou USE

Duas convenções equivalentes, escolher uma por tipo de componente:

**RED** — pra serviços que atendem requisição (API, worker de fila, endpoint):
- **Rate** — requisições/eventos por segundo
- **Errors** — taxa de erro (não contagem absoluta — contagem sem base de comparação não diz nada)
- **Duration** — latência (sempre em percentis: p50, p95, p99 — média esconde outlier)

**USE** — pra recurso (CPU, memória, disco, conexão de pool):
- **Utilization** — % do tempo/capacidade em uso
- **Saturation** — fila de trabalho esperando o recurso (ex: connections aguardando no pool)
- **Errors** — falhas do próprio recurso (ex: conexão recusada)

```
// ✅ RED por endpoint
http_requests_total{route="/orders", method="POST", status_class="2xx"}
http_request_duration_seconds{route="/orders", method="POST"}  // histograma, não gauge

// ✅ USE por recurso
db_pool_connections_in_use / db_pool_connections_max
db_pool_wait_queue_length
```

Latência **sempre** como histograma/summary com percentis — média mente sobre o pior caso, que é o que o usuário sente.

## Cardinalidade: o label não pode explodir

Cada combinação única de valores de label vira uma série temporal nova. Label com alta cardinalidade (id de usuário, id de request, timestamp, UUID) multiplica séries até o agregador de métricas ficar inviável ou caro demais — isso é "cardinality explosion"/"label explosion".

| Label seguro | Label perigoso |
|---|---|
| `route` (rota normalizada: `/orders/:id`) | `route` com id cru (`/orders/8f3e1c2a-...`) — uma série por pedido |
| `status_class` (`2xx`, `4xx`, `5xx`) | `status_code` exato de erro de negócio granular sem necessidade |
| `tenant_tier` (`free`, `pro`, `enterprise`) | `tenant_id` (uma série por cliente, sem limite) |
| `method` (`GET`, `POST`) | `user_id`, `request_id`, `session_id` — nunca em métrica, isso é log/trace |

```
// ❌ cardinalidade explode: uma série nova por pedido
http_requests_total{path="/orders/8f3e1c2a-9182-4b3e"}

// ✅ rota normalizada, cardinalidade fixa e conhecida
http_requests_total{route="/orders/:id"}
```

Regra prática: se o valor do label é ilimitado ou cresce com o número de entidades de negócio (usuário, pedido, sessão), ele não é label de métrica — é campo de log ou atributo de trace.

## Checklist

- [ ] Liveness não faz I/O de rede/banco — só confirma que o processo responde
- [ ] Readiness checa apenas dependências diretas e essenciais pro processo funcionar
- [ ] Nenhuma dependência externa/transitiva propagada em cascata no readiness
- [ ] Processo com boot lento tem startup probe separado, com timeout próprio
- [ ] Métricas de latência são histograma com percentis (p50/p95/p99), não média
- [ ] Taxa de erro medida como proporção (errors/total), não contagem absoluta isolada
- [ ] Nenhum label de métrica com cardinalidade ilimitada (`user_id`, `request_id`, UUID, timestamp)
- [ ] Rotas com parâmetro normalizadas antes de virar label (`/orders/:id`, não o valor cru)
- [ ] Endpoint de métricas (`/metrics`) e de health check não exigem autenticação (ou usam rede interna) e não vazam dado de negócio

## Exemplos por stack

**Kubernetes (probes no deployment)**
```yaml
livenessProbe:
  httpGet: { path: /livez, port: 8080 }
  periodSeconds: 10
  failureThreshold: 3
readinessProbe:
  httpGet: { path: /readyz, port: 8080 }
  periodSeconds: 5
  failureThreshold: 3
startupProbe:
  httpGet: { path: /readyz, port: 8080 }
  failureThreshold: 30
  periodSeconds: 5
```

**NestJS (@nestjs/terminus)**
```ts
@Get('livez')
livez() { return { status: 'ok' }; }

@Get('readyz')
@HealthCheck()
readyz() {
  return this.health.check([
    () => this.db.pingCheck('database'),   // dependência direta, não terceiro
  ]);
}
```

**Python (FastAPI + prometheus_client)**
```python
@app.get("/livez")
def livez():
    return {"status": "ok"}

@app.get("/readyz")
def readyz():
    return {"status": "ok"} if db_pool.is_connected() else Response(status_code=503)

REQUEST_LATENCY = Histogram("http_request_duration_seconds", "latency", ["route", "method"])
```

O padrão (liveness barata e local, readiness com dependência direta, métricas RED/USE com label de cardinalidade fixa) é idêntico entre stacks — muda apenas a lib (Terminus, Actuator no Java/Spring, health check middleware no Go/Ruby, `/health` custom em qualquer runtime).

## Anti-patterns

- ❌ Liveness fazendo query a banco ou chamada a serviço externo
- ❌ Readiness e liveness apontando pro mesmo endpoint/checagem
- ❌ Readiness propagando checagem em cascata até dependência transitiva de terceiro
- ❌ Reiniciar o processo (via liveness) quando o problema real é "não está pronto ainda" (readiness resolveria sem restart)
- ❌ Latência medida só como média, sem percentis
- ❌ Taxa de erro como contagem absoluta sem denominador (total de requisições)
- ❌ Label de métrica com `user_id`, `request_id`, UUID ou timestamp cru
- ❌ Rota como label sem normalizar parâmetro (`/orders/123` em vez de `/orders/:id`)
- ❌ Processo com boot lento sem startup probe, entrando em crash-loop por falso positivo de liveness
- ❌ Endpoint de métricas expondo dado de negócio ou exigindo auth pesada que impede scrape
