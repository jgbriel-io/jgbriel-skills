---
name: backend-service-conventions
description: Framework-agnostic conventions for backend service structure — layering (controller/service/repository), dependency injection, error handling, module boundaries. Use when user asks about project structure, where to put business logic, how to organize a new module/feature, or how to avoid fat controllers/god services, regardless of language or framework.
---

# Backend Service Conventions

Layered structure is framework-independent. Nest, Django, Spring, Rails and .NET
differ only in syntax; the principle holds throughout: each layer has one
responsibility and talks only to the layer next to it.

## Layers

```
Request → Controller/Handler → Service → Repository/DAO → Database
```

| Layer | Responsibility | Must not contain |
|---|---|---|
| Controller/Handler | Parsing the request, validating its shape, status codes, serialising the response | Business rules, queries, direct calls to another external service |
| Service | Business rules, orchestration, transactions | HTTP parsing, storage details |
| Repository/DAO | Data access: queries, ORM, ODM | Business rules, domain validation |

```
// ❌ A controller holding both a business rule and data access
handler(req):
  if req.body.amount > user.balance: raise Error
  db.query("UPDATE accounts SET balance = balance - ? WHERE id = ?", ...)

// ✅ The controller delegates, the service decides, the repository persists
handler(req):
  result = accountService.withdraw(req.user.id, req.body.amount)
  return 200(result)

service.withdraw(userId, amount):
  account = accountRepository.findById(userId)
  if amount > account.balance: raise InsufficientFundsError
  return accountRepository.debit(userId, amount)
```

Quick test: if the controller holds a business `if`, or the service holds raw SQL,
the code is in the wrong layer.

## Dependency injection

A service receives its dependencies — repository, HTTP client, logger — through
its constructor or parameters. It never instantiates them, and never imports a
global singleton inside the logic.

```
// ❌ Hardcoded dependency, impossible to mock in a test
class OrderService:
  process(order):
    repo = new PostgresOrderRepository()  // coupled to a concrete implementation
    emailClient = new SendgridClient()
    ...

// ✅ Dependencies injected behind an abstraction
class OrderService:
  constructor(orderRepository, emailClient):
    this.orderRepository = orderRepository
    this.emailClient = emailClient

  process(order):
    this.orderRepository.save(order)
    this.emailClient.send(order.customerEmail, ...)
```

- A service depends on an interface (`OrderRepository`), not on a concrete
  implementation (`PostgresOrderRepository`), so swapping the database or mocking
  it in a test does not touch the service.
- Where the framework has a DI container (Nest, Spring, .NET), register the
  implementation there. Where it does not (plain Express, Flask), manual
  constructor injection is enough.
- A service never constructs another service internally; it receives one ready.

## Error handling

Domain errors are typed and handled at a single boundary, never ad hoc in each
handler.

```
// ❌ A generic error, no context, handled inconsistently
if not user: raise Exception("error")

// ✅ A typed domain error that maps to a status and a code
class NotFoundError(DomainError):
  def __init__(self, resource): ...

if not user: raise NotFoundError("user")
```

- The domain layer raises domain errors (`NotFoundError`, `ValidationError`,
  `InsufficientFundsError`), never a bare `Exception` or `Error`.
- One global middleware, filter or handler translates a domain error into an HTTP
  status and a response payload. No individual controller writes a `try/catch` to
  assemble an error response.
- An infrastructure error — a network timeout, a dropped database connection —
  never reaches the client with a stack trace. It becomes a generic 500 plus an
  internal log with the detail.
- Never swallow an error silently. An empty `catch { }` either logs or re-raises.

## Module structure

Group by feature or domain, not by technical type.

```
// ❌ Grouped by type — everything about "order" is spread across four folders
/controllers
  order_controller
  user_controller
/services
  order_service
  user_service
/repositories
  order_repository

// ✅ Grouped by feature — a self-contained module
/orders
  order_controller
  order_service
  order_repository
  order_types
/users
  user_controller
  user_service
  user_repository
```

- A module exposes a public interface — its controller and exported types — and
  everything else is internal implementation.
- Module A never imports module B's internals or repository directly. Communication
  between modules goes through the public service, or through an event or queue.
- Code shared between modules moves to `shared`/`common` rather than being
  duplicated or cross-imported.

## Checklist

- [ ] No business rule or direct query in a controller
- [ ] Services depend on abstractions and receive them by injection
- [ ] No service instantiates another service internally
- [ ] Domain errors are typed and handled at one central boundary
- [ ] No empty `catch`/`except`, and none that logs and then carries on as though nothing happened
- [ ] Modules organised by feature, not by technical type
- [ ] No direct import of another module's repository

## By stack

**NestJS** — DI through decorators, injected in the constructor:
```ts
@Injectable()
export class OrderService {
  constructor(
    @Inject('ORDER_REPOSITORY') private readonly repo: OrderRepository,
    private readonly emailService: EmailService,
  ) {}

  async process(order: CreateOrderDto) {
    if (order.amount <= 0) throw new BadRequestException('invalid amount');
    return this.repo.save(order);
  }
}
```

**Django/FastAPI (Python)** — the service as a plain class, the repository as the
ORM layer:
```python
class OrderService:
    def __init__(self, repo: OrderRepository, email_client: EmailClient):
        self.repo = repo
        self.email_client = email_client

    def process(self, order: OrderCreate) -> Order:
        if order.amount <= 0:
            raise InvalidAmountError()
        return self.repo.save(order)
```

**Spring Boot (Java)** — DI through the constructor, interface and implementation
kept apart:
```java
@Service
public class OrderService {
    private final OrderRepository repo;
    private final EmailClient emailClient;

    public OrderService(OrderRepository repo, EmailClient emailClient) {
        this.repo = repo;
        this.emailClient = emailClient;
    }

    public Order process(CreateOrderRequest req) {
        if (req.getAmount() <= 0) throw new InvalidAmountException();
        return repo.save(req);
    }
}
```

## Anti-patterns

- ❌ A controller holding a query or a domain `if`
- ❌ A service instantiating a concrete dependency (`new PostgresRepository()`) instead of receiving it
- ❌ An empty `catch`/`except`, or one that logs and ignores
- ❌ A generic `Exception`/`Error` where a typed domain error belongs
- ❌ Modules organised by technical type (`/controllers`, `/services`, `/repositories` at the root) rather than by feature
- ❌ Importing another module's internal repository or model directly
- ❌ A service constructing another service instead of receiving it
- ❌ The same business rule duplicated across layers
