---
name: api-design
description: Applies stack-agnostic REST API design conventions — resource naming, HTTP verbs, status codes, error envelope, versioning, pagination, idempotency, OpenAPI contracts. Use when user asks about API design, REST endpoints, status codes, error response shape, API versioning, pagination, or OpenAPI/Swagger specs.
---

# API Design

Applies to any runtime — Next.js route handlers, NestJS, FastAPI, Spring, Go,
Rails, .NET. The contract is the product; the implementation is a detail.

## Resources and verbs

Resources are plural nouns. The verb comes from the HTTP method, never from the
URL.

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

| Verb   | Route                | Action            | Success status |
|--------|----------------------|-------------------|----------------|
| GET    | `/resources`         | list              | 200            |
| GET    | `/resources/:id`     | detail            | 200            |
| POST   | `/resources`         | create            | 201            |
| PUT    | `/resources/:id`     | full replace      | 200            |
| PATCH  | `/resources/:id`     | partial update    | 200            |
| DELETE | `/resources/:id`     | remove            | 204            |

Sub-resources only where ownership is real: `/orders/:id/items`, not
`/order-items?order_id=`.

## Status codes

| Code | Use |
|---|---|
| 200 | Success with a body |
| 201 | Created — include a `Location` header with the resource URL |
| 204 | Success with no body (delete, update returning nothing) |
| 400 | Invalid payload (schema validation) |
| 401 | Unauthenticated, or an invalid token |
| 403 | Authenticated but not permitted |
| 404 | The resource does not exist — or exists but belongs to another tenant; never leak that distinction |
| 409 | Conflict: duplicate, or an incompatible state |
| 422 | Semantically invalid — passed schema validation, failed a business rule |
| 429 | Rate limited |
| 500 | Unhandled error. Never expected, always logged |

```
// ❌ 200 carrying { "success": false }
// ✅ the HTTP status reflects the outcome; the body carries the detail
```

## Error envelope

One shape for the whole API, never a bare string and never a shape that varies per
endpoint.

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Order not found",
    "details": [
      { "field": "quantity", "issue": "must be greater than 0" }
    ]
  }
}
```

- `code`: a stable string, consumed by clients and telemetry — it never changes
  between versions
- `message`: human-readable, and not part of the contract; its wording and language
  may change
- `details`: optional and granular, used by forms for per-field validation errors
- Never return a stack trace, SQL, or a file path in an error body

## Versioning

| Strategy | Example | When |
|---|---|---|
| URL path | `/v1/orders` | Public APIs, cacheable by URL, simplest to document |
| Header | `Accept-Version: 2` | Internal APIs evolving often, keeps the URL clean |
| Query parameter | `?version=2` | Avoid — caches inconsistently and is easy to forget |

The rule: a breaking change — removing a field, changing a type, changing what a
status means — requires a new version. Adding an optional field is not breaking
and does not bump anything.

## Pagination

```
// Offset — simple, poor on large tables, since OFFSET's cost grows
GET /orders?page=3&per_page=20

// Cursor — stable under concurrent inserts, constant cost
GET /orders?cursor=eyJpZCI6NDJ9&limit=20
```

The response always carries pagination metadata, never a bare array:

```json
{
  "data": [ ],
  "pagination": { "next_cursor": "eyJpZCI6NjJ9", "has_more": true }
}
```

## Idempotency

Operations with side effects that a client may retry — creating a payment, sending
an email — accept an idempotency key:

```
POST /payments
Idempotency-Key: 6c1f9b2e-...

// the server stores (key -> response) for a TTL;
// a repeat with the same key returns the original response without reprocessing
```

`GET`, `PUT` and `DELETE` are idempotent by definition of the method and need no
key.

## Filtering, sorting, sparse fields

```
GET /orders?status=pending&sort=-created_at&fields=id,total,status
```

- Filtering: `field=value` for simple equality; explicit operators
  (`created_at[gte]=`) when a range is needed
- Sorting: a `-` prefix for descending, several fields separated by commas
- Sparse fieldsets (`fields=`) avoid a huge payload when the client needs part of
  the resource

## The OpenAPI contract

Every new endpoint enters `openapi.yaml`/`openapi.json` before or alongside the
code. It is the contract between teams, not documentation generated afterwards.

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

Errors are versioned schemas too — a client generated from the contract types the
error, not only the success case.

## REST vs GraphQL vs gRPC

The same principles change form, not substance:

| Concept | REST | GraphQL | gRPC |
|---|---|---|---|
| Contract | OpenAPI | SDL (schema) | `.proto` |
| Resource and verb | URL plus HTTP method | Type plus query/mutation | Service plus RPC method |
| Status and errors | Status code plus envelope | Always 200, errors in `errors[]` | `grpc.Status` (code plus message) |
| Versioning | `/v1/` or a header | Additive schema evolution: deprecate a field, do not remove it | A versioned package in the `.proto` (`v1.OrderService`) |

## Checklist

- [ ] Resources are plural nouns, and the verb comes from the HTTP method
- [ ] The status code reflects the real outcome, rather than always 200
- [ ] Errors follow the API's single envelope, with a stable `code`
- [ ] No sensitive data — stack trace, SQL, PII — leaks in an error body
- [ ] The endpoint is in the contract (OpenAPI/SDL/proto) before the merge
- [ ] Lists are paginated; never an unbounded array
- [ ] Repeatable side-effecting operations accept an idempotency key
- [ ] Breaking changes ship as a new version rather than overwriting the current one

## By stack

**Next.js (route handler):**
```ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const order = await findOrder(params.id);
  if (!order) {
    return Response.json(
      { error: { code: 'RESOURCE_NOT_FOUND', message: 'Order not found' } },
      { status: 404 }
    );
  }
  return Response.json({ data: order }, { status: 200 });
}
```

**NestJS (controller plus exception filter):**
```ts
@Get(':id')
async getOrder(@Param('id') id: string) {
  const order = await this.ordersService.findOne(id);
  if (!order) {
    throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Order not found' });
  }
  return order; // the global filter wraps it in { data } / { error }
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
            detail={"code": "RESOURCE_NOT_FOUND", "message": "Order not found"},
        )
    return {"data": order}
```

## Anti-patterns

- ❌ A verb in the URL (`/getUser`, `/order/delete/42`)
- ❌ 200 for everything, with the error signalled only in the body
- ❌ A different error envelope per endpoint
- ❌ Treating the message as the contract, so clients write `if message === '...'`
- ❌ An unpaginated list
- ❌ A breaking change shipped without a new version
- ❌ A contract (OpenAPI/SDL/proto) that has drifted from the code
- ❌ A stack trace or SQL exposed in a response body
