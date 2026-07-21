---
name: caching-strategy
description: Applies stack-agnostic caching strategy — layers (client, server, CDN), invalidation policy, cache-aside vs write-through vs write-behind. Use when user asks about caching, cache invalidation, stale data, TTL, cache-aside, write-through, ETags, or reducing load on a database/API.
---

# Caching Strategy

Vale para qualquer tecnologia de cache (Redis, Memcached, CDN, cache HTTP, cache in-memory). A dificuldade nunca é guardar o dado — é saber quando jogar fora.

## Camadas de cache

```
Cliente (browser/app) → CDN/edge → Servidor (app cache) → Banco de dados
```

| Camada | O que guarda | Invalida por |
|---|---|---|
| Cliente | resposta de API, asset estático | `Cache-Control`, `ETag`, versão de build |
| CDN/edge | resposta HTTP pública, asset | TTL, purge manual/API |
| Servidor (app) | resultado de query, sessão, resultado de cálculo caro | TTL, evento de escrita |
| Banco (query cache, buffer pool) | plano/página de dados | gerenciado pelo próprio motor |

Regra: cachear o mais perto possível do consumidor primeiro (cliente > CDN > servidor > banco) — cada camada evitada é uma rede a menos.

## Padrões de leitura/escrita

**Cache-aside (lazy loading)** — o mais comum, aplicação controla tudo:

```
// leitura
valor = cache.get(chave)
se não existir:
    valor = banco.buscar(chave)
    cache.set(chave, valor, ttl)
retorna valor

// escrita
banco.salvar(dado)
cache.delete(chave)  // invalida, não atualiza — próxima leitura repopula
```

- Simples, cache só guarda o que é lido de fato
- Risco: primeira leitura após invalidação sempre bate no banco (cache miss previsível)

**Write-through** — escreve no cache e no banco na mesma operação, de forma síncrona:

```
banco.salvar(dado)
cache.set(chave, dado, ttl)  // sempre atualizado, nunca "miss" logo após escrita
```

- Cache nunca fica stale em relação à última escrita
- Escrita fica mais lenta (duas operações síncronas)

**Write-behind (write-back)** — escreve no cache, banco é atualizado depois, de forma assíncrona:

```
cache.set(chave, dado)
fila.enfileirar(persistirNoBanco, dado)  // processado depois
```

- Escrita muito rápida, absorve picos
- Risco de perda de dado se o processo cair antes de persistir — usar só quando o dado tolera essa janela

| Padrão | Latência de escrita | Consistência | Quando usar |
|---|---|---|---|
| Cache-aside | baixa | eventual (até o próximo miss) | leitura dominante, dado tolera alguns ms/segundos de stale |
| Write-through | média/alta | forte | leitura logo após escrita precisa estar sempre correta |
| Write-behind | muito baixa | eventual, com risco de perda | escrita em volume alto, dado tolerante a perda pequena |

## Invalidação

> "There are only two hard things in Computer Science: cache invalidation and naming things." A frase é clichê porque é verdadeira — a maior parte dos bugs de cache não é sobre guardar, é sobre esquecer de invalidar.

| Estratégia | Como funciona | Risco |
|---|---|---|
| TTL (time-to-live) | expira sozinho depois de N segundos | janela de dado stale até expirar |
| Invalidação por evento | escrita dispara delete/update explícito da chave | fácil esquecer um caminho de escrita |
| Versionamento de chave | chave inclui versão (`user:42:v3`); nova escrita muda a versão, chave antiga só expira | não limpa a chave velha na hora (ocupa espaço até o TTL) |
| Purge/tag | invalida por tag/grupo (`tag:orders`) em vez de chave única | precisa de suporte da tecnologia de cache |

```
// ❌ TTL longo "pra garantir performance" em dado que muda com frequência
cache.set(`preco:${sku}`, preco, { ttl: 86400 })  // 1 dia — preço desatualizado o dia todo

// ✅ TTL compatível com a volatilidade real do dado
cache.set(`preco:${sku}`, preco, { ttl: 60 })

// ✅ ou invalidação por evento, sem depender só do TTL
async function atualizarPreco(sku, novoPreco) {
  await banco.atualizar(sku, novoPreco);
  await cache.delete(`preco:${sku}`);
}
```

Toda chave de cache precisa de dono: quem escreve o dado original é responsável por invalidar (ou publicar o evento que invalida). Cache sem dono vira dado stale silencioso.

## O que cachear (e o que não)

- Cachear: leitura cara e repetida, dado que muda pouco, resultado determinístico para os mesmos parâmetros
- Não cachear: dado por usuário sensível sem chave que isole o usuário, dado que muda a cada request, resultado que depende de estado externo não capturado na chave

```
// ❌ chave sem isolamento por tenant/usuário — vaza dado entre contextos
cache.set('pedidos-recentes', pedidos)

// ✅ chave inclui todo parâmetro que muda o resultado
cache.set(`pedidos-recentes:${tenantId}:${usuarioId}`, pedidos, { ttl: 30 })
```

## Cache HTTP (cliente e CDN)

Cabeçalhos padrão, funcionam em qualquer stack:

```
Cache-Control: public, max-age=3600, stale-while-revalidate=60
ETag: "a1b2c3"
```

- `max-age`: por quanto tempo o cliente pode servir sem revalidar
- `stale-while-revalidate`: serve o valor velho enquanto busca um novo em background — esconde a latência do miss do usuário
- `ETag`/`If-None-Match`: revalidação condicional — servidor responde `304 Not Modified` sem reenviar o corpo se nada mudou
- `private` vs `public`: `private` nunca deve passar por CDN/proxy compartilhado (dado por usuário)

```
// ❌ dado por usuário com Cache-Control: public — CDN serve o cache de um usuário pra outro
Cache-Control: public, max-age=3600

// ✅
Cache-Control: private, max-age=60
```

## Efeitos colaterais a considerar

- **Thundering herd / cache stampede**: TTL expira, N requisições simultâneas batem no banco ao mesmo tempo pra repopular a mesma chave — mitigar com lock/single-flight (só uma requisição recalcula, as outras esperam) ou TTL com jitter (não expira tudo no mesmo segundo)
- **Cache warming**: dado crítico não deve depender do primeiro usuário pagar o miss — pré-popular no deploy/startup quando o custo do miss é alto
- **Tamanho e eviction**: cache não é ilimitado; política de eviction (LRU, LFU) decide o que sai quando enche — cache mal dimensionado vira miss constante (churn)

## Checklist

- [ ] Padrão escolhido (cache-aside/write-through/write-behind) combina com a tolerância a stale do dado
- [ ] Toda chave de cache tem dono explícito responsável por invalidar
- [ ] TTL compatível com a volatilidade real do dado, não um valor genérico copiado de outro lugar
- [ ] Chave inclui todo parâmetro que muda o resultado (tenant, usuário, locale, versão)
- [ ] Dado sensível/por usuário nunca marcado como `public` em CDN/proxy compartilhado
- [ ] Estratégia contra cache stampede em chave de alto tráfego (lock, jitter, stale-while-revalidate)
- [ ] Invalidação testada — não só o caminho de leitura, o de escrita/deleção também

## Exemplos por stack

**Redis (cache-aside, Node/qualquer runtime):**
```ts
async function getUser(id: string) {
  const cached = await redis.get(`user:${id}`);
  if (cached) return JSON.parse(cached);

  const user = await db.users.findById(id);
  await redis.set(`user:${id}`, JSON.stringify(user), 'EX', 300);
  return user;
}

async function updateUser(id: string, data: Partial<User>) {
  await db.users.update(id, data);
  await redis.del(`user:${id}`); // invalidação por evento
}
```

**Django (cache framework, Python):**
```python
def get_product(sku):
    key = f"product:{sku}"
    product = cache.get(key)
    if product is None:
        product = Product.objects.get(sku=sku)
        cache.set(key, product, timeout=60)
    return product

def update_product(sku, **fields):
    Product.objects.filter(sku=sku).update(**fields)
    cache.delete(f"product:{sku}")
```

**HTTP/CDN (independente de linguagem):**
```
GET /api/catalog/sku-123
Cache-Control: public, max-age=300, stale-while-revalidate=60
ETag: "9f8b7a"

// requisição seguinte
If-None-Match: "9f8b7a"
→ 304 Not Modified (sem corpo, sem custo de banda)
```

## Anti-patterns

- ❌ TTL genérico ("1 hora pra tudo") sem considerar a volatilidade real do dado
- ❌ Cache sem dono — ninguém invalida quando o dado muda na origem
- ❌ Chave sem isolamento por tenant/usuário/locale
- ❌ `Cache-Control: public` em resposta com dado privado
- ❌ Escrita que atualiza o banco e esquece de invalidar o cache (fica stale até o TTL)
- ❌ Nenhuma proteção contra thundering herd em chave de alto tráfego
- ❌ Cachear resultado não-determinístico ou dependente de estado não capturado na chave
- ❌ Usar cache pra mascarar query lenta em vez de investigar a causa raiz
