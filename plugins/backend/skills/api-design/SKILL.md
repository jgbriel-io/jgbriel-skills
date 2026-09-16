---
name: api-design
description: Applies stack-agnostic REST API design conventions — resource naming, HTTP verbs, status codes, error envelope, versioning, pagination, idempotency, OpenAPI contracts. Use when user asks about API design, REST endpoints, status codes, error response shape, API versioning, pagination, or OpenAPI/Swagger specs.
---

# API Design

Vale para qualquer runtime (Next.js API routes, NestJS, FastAPI, Spring, Go, Rails, .NET). O contrato é o produto — implementação é detalhe.

## Recursos e verbos

Recursos são substantivos no plural; verbos vêm do método HTTP, nunca da URL.

```
// ❌
POST /getUser
POST /createOrder
GET  /order/delete/42

// ✅
GET    /users/42
POST   /orders
DELETE /orders/42
```

| Verbo  | Rota                | Ação                | Status sucesso |
|--------|----------------------|---------------------|----------------|
| GET    | `/resources`         | listar              | 200            |
| GET    | `/resources/:id`      | detalhe             | 200            |
| POST   | `/resources`          | criar               | 201            |
| PUT    | `/resources/:id`      | substituir completo | 200            |
| PATCH  | `/resources/:id`      | atualizar parcial   | 200            |
| DELETE | `/resources/:id`      | remover             | 204            |

Sub-recursos só quando há relação de posse real: `/orders/:id/items`, não `/order-items?order_id=`.

## Status codes

| Faixa | Uso |
|---|---|
| 200 | sucesso com corpo |
| 201 | criado — inclui `Location` header com URL do recurso |
| 204 | sucesso sem corpo (delete, update sem retorno) |
| 400 | payload inválido (validação de schema) |
| 401 | sem autenticação ou token inválido |
| 403 | autenticado mas sem permissão |
| 404 | recurso não existe (ou existe mas não é do tenant — nunca vaze essa distinção) |
| 409 | conflito (duplicidade, estado incompatível) |
| 422 | semanticamente inválido (passou na validação de schema, falhou na regra de negócio) |
| 429 | rate limit |
| 500 | erro não tratado — nunca esperado, sempre logado |

```
// ❌ 200 com { "success": false } no corpo
// ✅ status HTTP reflete o resultado; corpo carrega detalhe
```

## Envelope de erro

Um formato único para toda a API, nunca `string` cru nem shape variando por endpoint.

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Pedido não encontrado",
    "details": [
      { "field": "quantity", "issue": "must be greater than 0" }
    ]
  }
}
```

- `code`: string estável, usada por client/telemetria — nunca muda entre versões
- `message`: texto legível, não é contrato (pode mudar de idioma/redação)
- `details`: opcional, granular, usado por formulários (erro de validação por campo)
- Nunca devolver stack trace, SQL, ou path de arquivo no corpo de erro

## Versionamento

| Estratégia | Exemplo | Quando usar |
|---|---|---|
| URL path | `/v1/orders` | API pública, cache por URL, mais simples de documentar |
| Header | `Accept-Version: 2` | API interna, evolução mais frequente, não polui a URL |
| Query param | `?version=2` | evitar — cacheável de forma inconsistente, fácil esquecer |

Regra: breaking change (remover campo, mudar tipo, mudar semântica de status) exige nova versão. Adicionar campo opcional não é breaking — não bump.

## Paginação

```
// Offset — simples, ruim em tabelas grandes (custo de OFFSET cresce)
GET /orders?page=3&per_page=20

// Cursor — estável sob inserção concorrente, custo constante
GET /orders?cursor=eyJpZCI6NDJ9&limit=20
```

Resposta sempre inclui metadado de paginação, nunca só o array:

```json
{
  "data": [ ],
  "pagination": { "next_cursor": "eyJpZCI6NjJ9", "has_more": true }
}
```

## Idempotência

Operações que causam efeito colateral (criar pagamento, disparar e-mail) e podem ser retentadas pelo client devem aceitar uma chave de idempotência:

```
POST /payments
Idempotency-Key: 6c1f9b2e-...

// servidor guarda (key -> resposta) por um TTL;
// requisição repetida com a mesma key retorna a resposta original, sem reprocessar
```

`GET`, `PUT`, `DELETE` já são idempotentes por definição do método — não precisam da chave.

## Filtragem, ordenação, campos parciais

```
GET /orders?status=pending&sort=-created_at&fields=id,total,status
```

- Filtro: `campo=valor` para igualdade simples; operadores explícitos (`created_at[gte]=`) quando precisar de range
- Ordenação: `-` prefixo para descendente, múltiplos campos separados por vírgula
- Sparse fieldset (`fields=`) evita payload gigante quando o client só precisa de parte do recurso

## Contrato OpenAPI

Todo endpoint novo entra no `openapi.yaml`/`openapi.json` antes ou junto do código — é o contrato entre times, não documentação gerada depois.

```yaml
paths:
  /orders/{id}:
    get:
      operationId: getOrder
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200':
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Order' }
        '404':
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Error' }
```

Erros também são schemas versionados — cliente gerado a partir do contrato tipa o erro, não só o sucesso.

## REST vs GraphQL vs gRPC

Os mesmos princípios mudam de forma, não de substância:

| Conceito | REST | GraphQL | gRPC |
|---|---|---|---|
| Contrato | OpenAPI | SDL (schema) | `.proto` |
| Recurso/verbo | URL + método HTTP | tipo + query/mutation | serviço + RPC method |
| Status/erro | status code + envelope | sempre 200, erros em `errors[]` | `grpc.Status` (código + mensagem) |
| Versionamento | `/v1/` ou header | evolução aditiva do schema (deprecar campo, não remover) | pacote versionado no `.proto` (`v1.OrderService`) |

## Checklist

- [ ] Recurso é substantivo plural, verbo vem do método HTTP
- [ ] Status code reflete o resultado real, não sempre 200
- [ ] Erro segue envelope único da API, com `code` estável
- [ ] Nenhum dado sensível (stack trace, SQL, PII) vaza no corpo de erro
- [ ] Endpoint documentado no contrato (OpenAPI/SDL/proto) antes do merge
- [ ] Lista tem paginação — nunca array sem limite
- [ ] Operação com efeito colateral repetível aceita idempotency key
- [ ] Breaking change vem com nova versão, não sobrescreve a atual

## Exemplos por stack

**Next.js (route handler):**
```ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const order = await findOrder(params.id);
  if (!order) {
    return Response.json(
      { error: { code: 'RESOURCE_NOT_FOUND', message: 'Pedido não encontrado' } },
      { status: 404 }
    );
  }
  return Response.json({ data: order }, { status: 200 });
}
```

**NestJS (controller + exception filter):**
```ts
@Get(':id')
async getOrder(@Param('id') id: string) {
  const order = await this.ordersService.findOne(id);
  if (!order) {
    throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Pedido não encontrado' });
  }
  return order; // filtro global envolve no envelope { data } / { error }
}
```

**FastAPI (Python):**
```python
@app.get("/orders/{order_id}")
async def get_order(order_id: str):
    order = await find_order(order_id)
    if not order:
        raise HTTPException(
            status_code=404,
            detail={"code": "RESOURCE_NOT_FOUND", "message": "Pedido não encontrado"},
        )
    return {"data": order}
```

## Anti-patterns

- ❌ Verbo na URL (`/getUser`, `/order/delete/42`)
- ❌ 200 para tudo, erro sinalizado só no corpo
- ❌ Envelope de erro diferente por endpoint
- ❌ Mensagem de erro como contrato (client faz `if message === '...'`)
- ❌ Lista sem paginação
- ❌ Breaking change lançado sem nova versão
- ❌ Contrato (OpenAPI/SDL/proto) desatualizado em relação ao código
- ❌ Stack trace ou SQL exposto no corpo de resposta
