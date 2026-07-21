---
name: rate-limiting
description: Stack-agnostic rate limiting and throttling — token bucket vs sliding/fixed window algorithms, where to enforce limits (gateway, middleware, per-endpoint), keying strategy (IP/user/API key), 429 response shape, distributed limiting with shared store. Use when user asks about rate limiting, throttling, API abuse protection, 429 responses, or brute-force/DoS mitigation on endpoints.
---

# Rate Limiting

Protege capacidade (evita sobrecarga) e protege contra abuso (brute-force, scraping, custo de terceiros). Os dois motivos pedem limites diferentes — não usar o mesmo número pra tudo.

## Algoritmos

| Algoritmo | Como funciona | Burst | Custo memória | Quando usar |
|---|---|---|---|---|
| Fixed window | Contador zera a cada N segundos | Permite 2x no limite na borda da janela | Baixo | Casos simples, limite aproximado é aceitável |
| Sliding window (log ou counter) | Considera janela móvel, não reseta em bloco | Suave, sem pico na borda | Médio | Padrão recomendado para APIs públicas |
| Token bucket | Bucket enche a taxa fixa, cada request consome 1 token | Absorve rajada até o tamanho do bucket | Baixo | Tráfego com rajada legítima (ex.: usuário fazendo upload em lote) |
| Leaky bucket | Fila processada a taxa constante, excesso descartado/enfileirado | Suaviza saída, não absorve rajada de entrada | Baixo | Proteger downstream de taxa fixa (ex.: chamada a API de terceiro) |

```
// ❌ Fixed window: 100 req/min zera às HH:MM:00
// Cliente manda 100 no último segundo da janela + 100 no primeiro do próximo
// = 200 requests em ~1s, dentro do "limite"

// ✅ Sliding window ou token bucket: rajada na borda não escapa do limite real
```

Não existe algoritmo "melhor" — token bucket para tráfego com rajada esperada, sliding window para limite estrito por unidade de tempo, fixed window quando simplicidade importa mais que precisão.

## Onde aplicar

```
Client → CDN/WAF → API Gateway → Load Balancer → App (middleware) → Service/handler
           ↑              ↑                            ↑                  ↑
        limite bruto   limite por API key        limite por rota      limite por ação
        (DDoS, L3/L4)  (contrato de uso)         (custo do endpoint)  (regra de negócio)
```

- **Borda (gateway/CDN/WAF)**: primeira linha, barato, evita que tráfego malicioso chegue perto da aplicação
- **Middleware da aplicação**: limite por rota, sensível ao custo real do endpoint (login, busca, upload custam diferente de um `GET /health`)
- **Dentro do handler/use case**: regra de negócio específica (ex.: "3 tentativas de código OTP", "1 exportação por hora por conta") — não dá pra generalizar em middleware
- Camadas não são excludentes: rate limit grosso na borda + fino por endpoint é o padrão em produção

## Onde o limite dói mais

| Endpoint | Por quê | Limite típico |
|---|---|---|
| Login / autenticação | Alvo de brute-force e credential stuffing | Baixo, por IP + por conta |
| Reset de senha / OTP | Token de uso único, mas endpoint gera custo (SMS/e-mail) | Muito baixo, por conta e por telefone/e-mail |
| Busca / listagem com filtro livre | Query cara, fácil de gerar carga sem intenção maliciosa | Médio, por usuário |
| Endpoint que chama serviço de terceiro pago | Custo direto por chamada | Baixo, com fila/backoff em vez de rejeitar |
| Webhook de entrada | Terceiro pode reenviar em loop se responder erro | Médio, com deduplicação por idempotency key |
| Escrita em massa / import | Uma requisição gera N operações internas | Baixo, ou limite por "custo" e não por request |

## Chave de limitação

```
// ❌ Limitar só por IP
// NAT/proxy corporativo, VPN e mobile carrier NAT colocam milhares de usuários atrás de um IP
if (requestsByIp[ip] > limit) return 429;

// ✅ Combinar chaves conforme o contexto de autenticação
const key = user ? `user:${user.id}` : `ip:${ip}`;
// endpoint sensível: chave composta (ex.: login = ip + email tentado)
const loginKey = `login:${ip}:${email}`;
```

- Autenticado: por `user_id` ou API key — mais justo, não pune vizinhos de IP/NAT
- Anônimo: por IP, aceitando o trade-off de falso positivo em NAT compartilhado
- Endpoint sensível a abuso direcionado (login, OTP): chave composta (IP + identificador alvo), pra pegar tanto "um IP atacando várias contas" quanto "várias origens atacando uma conta"
- Multi-tenant: limite sempre escopado por tenant além de por usuário — um tenant não deve conseguir esgotar a cota de outro

## Resposta ao exceder o limite

```
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1752600000
```

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Muitas requisições, tente novamente em instantes"
  }
}
```

- `Retry-After` sempre presente — cliente bem-comportado usa isso pra backoff, não fica em retry imediato
- Headers `X-RateLimit-*` (ou o padrão emergente `RateLimit-*` do IETF) em toda resposta, não só na que estourou — permite ao cliente se auto-regular antes de bater no limite
- Nunca `200` com corpo indicando erro, nunca `403` (isso é autorização, não throttling)

## Distribuído vs. em memória

```
// ❌ Contador em memória do processo
// Com N réplicas atrás de um load balancer, o limite real vira N × limite configurado
let counter = 0; // por instância

// ✅ Store compartilhado (Redis, Memcached) — contador único entre réplicas
await redis.incr(`rl:${key}`);
await redis.expire(`rl:${key}`, windowSeconds);
```

- Em memória só serve para instância única ou como camada extra local (fail-fast antes de bater no store compartilhado)
- Store compartilhado (Redis é o padrão de fato) adiciona latência de rede — usar pipeline/Lua script pra manter a checagem atômica (incrementar + checar limite em uma operação, evita race condition)
- Se o store compartilhado cair: decidir explicitamente entre "fail open" (deixa passar, prioriza disponibilidade) e "fail closed" (bloqueia, prioriza proteção) — depende do endpoint

## Lado do cliente: backoff

Rate limit não é só responsabilidade do servidor — cliente/SDK bem escrito respeita o sinal:

```
// ✅ Backoff exponencial com jitter, respeitando Retry-After quando presente
async function callWithBackoff(fn, attempt = 0) {
  try {
    return await fn();
  } catch (err) {
    if (err.status === 429 && attempt < maxRetries) {
      const wait = err.retryAfter ?? (baseDelay * 2 ** attempt + jitter());
      await sleep(wait);
      return callWithBackoff(fn, attempt + 1);
    }
    throw err;
  }
}
```

Sem jitter, múltiplos clientes que levaram 429 no mesmo instante retentam juntos e recriam o pico (thundering herd).

## Checklist

- [ ] Algoritmo escolhido de propósito (token bucket para rajada, sliding window para limite estrito) — não é o default da lib sem pensar
- [ ] Limite aplicado em pelo menos duas camadas: borda (grosso) + aplicação (por rota/ação)
- [ ] Endpoints sensíveis (login, OTP, reset de senha) com limite próprio, mais baixo
- [ ] Chave de limitação por usuário/API key quando autenticado, não só por IP
- [ ] Multi-tenant: limite escopado por tenant, não só por usuário global
- [ ] Resposta 429 inclui `Retry-After` e headers de limite/restante/reset
- [ ] Contador em store compartilhado (não em memória) quando há múltiplas réplicas
- [ ] Checagem de incremento + limite é atômica (evita race condition sob concorrência)
- [ ] Comportamento definido para quando o store de rate limit cai (fail open vs. fail closed)
- [ ] Cliente/SDK interno usa backoff exponencial com jitter, não retry imediato em loop

## Exemplos por stack

**NestJS (`@nestjs/throttler`, token bucket):**
```ts
@Throttle({ default: { limit: 5, ttl: 60_000 } })
@Post('login')
login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```

**Nginx (fixed/leaky bucket na borda, antes da aplicação):**
```nginx
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

location /api/login {
  limit_req zone=login burst=3 nodelay;
  proxy_pass http://backend;
}
```

**Go (`golang.org/x/time/rate`, token bucket em memória por chave):**
```go
limiter := rate.NewLimiter(rate.Every(time.Minute/5), 3) // 5 req/min, burst 3
if !limiter.Allow() {
    w.Header().Set("Retry-After", "12")
    http.Error(w, "rate limited", http.StatusTooManyRequests)
    return
}
```

**Redis (sliding window genérico, qualquer linguagem via script Lua/EVALSHA):**
```
// ZADD + ZREMRANGEBYSCORE + ZCARD em uma transação/script:
// remove timestamps fora da janela, conta os que restaram, decide permitir ou não
ZADD rl:user:42 <now> <now>-<random>
ZREMRANGEBYSCORE rl:user:42 -inf (<now> - window_ms)
ZCARD rl:user:42
```

## Anti-patterns

- ❌ Um único limite global pra todos os endpoints, ignorando custo real de cada um
- ❌ Limitar só por IP em API autenticada (pune usuários atrás do mesmo NAT/proxy)
- ❌ Fixed window sem considerar o efeito de rajada na borda da janela
- ❌ Contador em memória de processo com múltiplas réplicas atrás de load balancer
- ❌ 429 sem `Retry-After` — cliente não sabe quanto esperar e retenta às cegas
- ❌ Incremento e checagem do contador como operações separadas (race condition sob concorrência)
- ❌ Mesmo limite para login e para `GET /health`
- ❌ Cliente interno sem backoff, martelando retry imediato após 429
- ❌ Rate limit tratado como controle de acesso (isso é autorização — 403, não 429)
