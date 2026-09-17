---
name: input-validation
description: Validates untrusted input at every system boundary — API requests, queue messages, uploads, CLI args — via schema definition, type coercion and structured error reporting, independent of language or framework. Use when user asks about input validation, request/DTO validation, payload schemas, sanitization, or mentions Zod, class-validator, Pydantic, Bean Validation, FluentValidation.
---

# Input Validation

This skill covers the server boundary: requests, queue messages, uploads,
webhooks, CLI arguments. Client-side form validation, with CPF/CNPJ/CEP masks and
per-field error UX, is `forms-validation` — and the two deliberately share one
schema, because two definitions of "valid" diverge on the first change.

## Principle

Never trust an external payload. Anything arriving at a boundary — an HTTP
request, a queue message, an upload, a CLI argument, a webhook — is hostile until
proven otherwise, including when it comes from a client you wrote.

```
// ❌ Trusting the type the client declared
function createOrder(body) {
  db.insert({ amount: body.amount, userId: body.userId });
}

// ✅ Validate shape, type and invariants before any logic
function createOrder(body) {
  const input = OrderSchema.parse(body); // throws when invalid
  db.insert({ amount: input.amount, userId: currentUser.id }); // userId never comes from the payload
}
```

## Where validation happens

At the boundary, not scattered through the business logic:

| Layer | Responsibility |
|---|---|
| Boundary (controller/handler) | Shape, type, format, required fields |
| Domain/service | Business invariants — rules that depend on state |
| Database | Final constraints (NOT NULL, CHECK, FK): a safety net, not the primary validation |

Several boundaries mean several validations. The same data arriving through a REST
API, an async worker and a CSV import must be validated at all three: validating
only the API does not protect the worker draining the queue.

## What to validate

- The presence and type of each field. Do not rely on the language's implicit
  coercion
- Format (email, UUID, date, enum) through an allowlist of accepted values, never a
  denylist
- Limits: string length, numeric range, array and payload size
- The origin of sensitive fields (`tenantId`, `userId`, `role`, `status`) — never
  accept them from the client when the server already knows the right value from
  the session or token
- File uploads: extension AND magic bytes, never the declared `Content-Type` alone
- Payload size and nesting depth, as protection against a huge or deeply nested
  JSON DoS

## Reporting errors

```
// ❌ A generic error that does not say what failed
throw new Error('invalid input');

// ✅ Structured per field, leaking no internals
{
  "error": "validation_failed",
  "fields": [
    { "path": "email", "message": "invalid format" },
    { "path": "amount", "message": "must be greater than 0" }
  ]
}
```

- Status 400 or 422 for validation errors, never 500
- The client response is about the field, and never carries a stack trace, SQL or
  an internal file path
- Internal logs may hold more detail than the response

## Sanitisation vs validation

Two different operations, and conflating them is a security bug:

- **Validation** rejects data that does not satisfy a rule — schema, type, range.
- **Sanitisation** transforms data (trim, HTML escaping, unicode normalisation).
  It happens after validation, never instead of it.

```
// ❌ Sanitising as though it were enough
const clean = input.replace(/<script>/gi, ''); // bypassed by <scr<script>ipt>

// ✅ Validate shape and type first, sanitise what will be displayed
const input = CommentSchema.parse(body); // validate
const safe = escapeHtml(input.text);     // sanitise for display
```

## Type coercion

Boundaries like query strings and form data always arrive as strings. Implicit
coercion — `"0" == false`, `Number("abc")` silently becoming `NaN` — is a common
source of bugs and of validation bypass. Prefer a schema with explicit coercion
that fails on unexpected values, rather than propagating `any`/`unknown` inward.

## Checklist

- [ ] Every endpoint or handler receiving an external payload validates against a schema before any business logic
- [ ] Identity fields (`userId`, `tenantId`, `role`) never come from the payload; they come from the session or token
- [ ] Validation errors return 400/422 with per-field detail and no stack trace
- [ ] File uploads validate the real type (magic bytes), not just the extension or `Content-Type`
- [ ] Payload size and nesting depth are bounded
- [ ] Every input boundary — API, queue, CLI, import, webhook — validates on its own, rather than relying on another layer
- [ ] Sanitisation (escaping, normalisation) happens in addition to validation, not in its place

## By stack

**Zod (Node/TS)**
```ts
const OrderSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['BRL', 'USD']),
});
const input = OrderSchema.parse(req.body); // ZodError -> the handler maps it to 400
```

**Pydantic (Python)**
```python
class Order(BaseModel):
    amount: PositiveFloat
    currency: Literal["BRL", "USD"]

order = Order(**payload)  # ValidationError -> 422
```

**Bean Validation (Java)**
```java
public class OrderDto {
    @Positive private BigDecimal amount;
    @Pattern(regexp = "BRL|USD") private String currency;
}
// @Valid on the controller raises MethodArgumentNotValidException -> 400
```

**FluentValidation (.NET)**
```csharp
public class OrderValidator : AbstractValidator<OrderDto> {
    public OrderValidator() {
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Currency).Must(c => new[] { "BRL", "USD" }.Contains(c));
    }
}
```

## Anti-patterns

- ❌ Validating only in the frontend and trusting that the request arrives clean
- ❌ Accepting `userId`, `tenantId` or `role` from the payload instead of the authenticated session
- ❌ Sanitising (escaping, regex) as a substitute for schema validation
- ❌ A generic validation error that does not name the failing field
- ❌ Trusting a declared `Content-Type` or file extension to determine a file's type
- ❌ Validating only the most visible boundary (the API) and ignoring queues, imports and webhooks
- ❌ A payload with no size or depth limit
