---
name: input-validation
description: Validates untrusted input at every system boundary — API requests, queue messages, uploads, CLI args — via schema definition, type coercion and structured error reporting, independent of language or framework. Use when user asks about input validation, request/DTO validation, payload schemas, sanitization, or mentions Zod, class-validator, Pydantic, Bean Validation, FluentValidation.
---

# Input Validation — Validação na Borda

## Princípio

Nunca confiar em payload externo. Todo dado que entra por uma borda (request HTTP, mensagem de fila, upload, arg de CLI, webhook) é hostil até provado o contrário — mesmo vindo de um client "seu".

```
// ❌ Confiar no tipo declarado no client
function createOrder(body) {
  db.insert({ amount: body.amount, userId: body.userId });
}

// ✅ Validar shape, tipo e invariantes antes de qualquer lógica
function createOrder(body) {
  const input = OrderSchema.parse(body); // lança se inválido
  db.insert({ amount: input.amount, userId: currentUser.id }); // userId nunca vem do payload
}
```

## Onde validar

Validação acontece na borda, não espalhada pela lógica de negócio:

| Camada | Responsabilidade |
|---|---|
| Borda (controller/handler) | Shape, tipo, formato, obrigatoriedade |
| Domínio/serviço | Invariantes de negócio (regra que depende de estado) |
| Banco | Constraint final (NOT NULL, CHECK, FK) — rede de segurança, não validação primária |

Múltiplas bordas exigem múltiplas validações: o mesmo tipo de dado que entra por API REST, worker assíncrono e importação de CSV precisa ser validado nos três pontos de entrada — validar só na API não protege o worker que consome a fila.

## O que validar

- Presença e tipo de cada campo — não confiar em coerção implícita da linguagem
- Formato (email, UUID, data, enum) usando allowlist de valores aceitos, nunca denylist
- Limites: tamanho de string, range numérico, tamanho de array/payload
- Origem de campos sensíveis (`id` de tenant/usuário, `role`, `status`) — nunca aceitar do client quando o valor correto já é conhecido pelo server (sessão, token)
- Tipo de arquivo/upload: extensão E magic bytes, nunca só o `Content-Type` declarado
- Tamanho e profundidade do payload — proteção contra DoS de JSON gigante ou profundamente aninhado

## Como reportar erro

```
// ❌ Erro genérico, sem dizer o que falhou
throw new Error('invalid input');

// ✅ Erro estruturado por campo, sem vazar detalhe interno
{
  "error": "validation_failed",
  "fields": [
    { "path": "email", "message": "formato inválido" },
    { "path": "amount", "message": "deve ser maior que 0" }
  ]
}
```

- Status 400/422 para erro de validação — nunca 500
- Resposta ao client é sobre o campo, nunca expõe stack trace, query SQL ou path de arquivo interno
- Log interno pode ter mais detalhe que a resposta ao client

## Sanitização vs validação

Operações diferentes, não confundir:

- **Validação** rejeita o dado se ele não passa na regra (schema, tipo, range)
- **Sanitização** transforma o dado (trim, escape de HTML, normalização de unicode) — sempre depois da validação, nunca no lugar dela

```
// ❌ Sanitizar como se fosse suficiente
const clean = input.replace(/<script>/gi, ''); // bypassa com <scr<script>ipt>

// ✅ Valida shape/tipo primeiro, sanitiza o que for exibido depois
const input = CommentSchema.parse(body); // valida
const safe = escapeHtml(input.text);     // sanitiza pra exibição
```

## Coerção de tipo

Bordas como query string e form-data chegam sempre como string. Coerção implícita (`"0" == false`, `Number("abc")` virando `NaN` silencioso) é fonte comum de bug e de bypass de validação. Preferir schema com coerção explícita que falha em valor fora do esperado, em vez de propagar `any`/`unknown` adiante.

## Checklist

- [ ] Todo endpoint/handler que recebe payload externo tem schema de validação antes da lógica de negócio
- [ ] Campos de identidade (`userId`, `tenantId`, `role`) nunca vêm do payload — vêm de sessão/token
- [ ] Erro de validação retorna 400/422 com detalhe por campo, sem stack trace
- [ ] Upload de arquivo valida tipo real (magic bytes), não só extensão/Content-Type
- [ ] Limite de tamanho de payload e profundidade de estrutura aninhada
- [ ] Toda borda de entrada (API, fila, CLI, import, webhook) tem validação própria — não depende da validação de outra camada
- [ ] Sanitização (escape/normalização) acontece além da validação, não no lugar dela

## Exemplos por stack

**Zod (Node/TS)**
```ts
const OrderSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['BRL', 'USD']),
});
const input = OrderSchema.parse(req.body); // ZodError -> handler mapeia pra 400
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
// @Valid no controller dispara MethodArgumentNotValidException -> 400
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

- ❌ Validar só no frontend e confiar que o request chega limpo no backend
- ❌ Aceitar `userId`/`tenantId`/`role` vindo do payload em vez da sessão autenticada
- ❌ Sanitizar (escape/regex) como substituto de validação de schema
- ❌ Erro de validação genérico sem indicar qual campo falhou
- ❌ Confiar em `Content-Type`/extensão declarada para validar tipo de arquivo
- ❌ Validar só na borda mais visível (API) e ignorar fila, import, webhook
- ❌ Payload sem limite de tamanho/profundidade
