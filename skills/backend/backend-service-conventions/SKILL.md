---
name: backend-service-conventions
description: Framework-agnostic conventions for backend service structure — layering (controller/service/repository), dependency injection, error handling, module boundaries. Use when user asks about project structure, where to put business logic, how to organize a new module/feature, or how to avoid fat controllers/god services, regardless of language or framework.
---

# Convenções de Serviço Backend

Estrutura em camadas independe de framework. O que muda entre Nest/Django/Spring/Rails/.NET é só a sintaxe — o princípio é sempre o mesmo: cada camada tem uma responsabilidade e só conversa com a camada adjacente.

## Camadas

```
Request → Controller/Handler → Service → Repository/DAO → Banco
```

| Camada | Responsabilidade | Não deve conter |
|---|---|---|
| Controller/Handler | parse de request, validação de shape, status code, serialização de resposta | regra de negócio, SQL/query, chamada direta a outro serviço externo |
| Service | regra de negócio, orquestração, transação | parsing de HTTP, detalhes de storage |
| Repository/DAO | acesso a dados (query, ORM, ODM) | regra de negócio, validação de domínio |

```
// ❌ Controller com regra de negócio e acesso a dados
handler(req):
  if req.body.amount > user.balance: raise Error
  db.query("UPDATE accounts SET balance = balance - ? WHERE id = ?", ...)

// ✅ Controller delega, service decide, repository persiste
handler(req):
  result = accountService.withdraw(req.user.id, req.body.amount)
  return 200(result)

service.withdraw(userId, amount):
  account = accountRepository.findById(userId)
  if amount > account.balance: raise InsufficientFundsError
  return accountRepository.debit(userId, amount)
```

Teste rápido: se o controller tem `if` de regra de negócio, ou o service tem SQL cru, a camada errada.

## Injeção de dependência

Service recebe suas dependências (repository, client HTTP, logger) via construtor/parâmetro — nunca instancia nem importa singleton global dentro da lógica.

```
// ❌ Dependência hardcoded, impossível mockar em teste
class OrderService:
  process(order):
    repo = new PostgresOrderRepository()  // acoplado à implementação concreta
    emailClient = new SendgridClient()
    ...

// ✅ Dependência injetada por interface/abstração
class OrderService:
  constructor(orderRepository, emailClient):
    this.orderRepository = orderRepository
    this.emailClient = emailClient

  process(order):
    this.orderRepository.save(order)
    this.emailClient.send(order.customerEmail, ...)
```

- Service depende de interface/abstração (`OrderRepository`), não de implementação concreta (`PostgresOrderRepository`) — troca de banco ou mock em teste não exige mudar o service.
- Se o framework tem container de DI (Nest, Spring, .NET), registre a implementação lá; se não tem (Express puro, Flask), injeção manual por construtor já resolve.
- Um service não deve construir outro service internamente — recebe pronto.

## Tratamento de erro

Erros de domínio são tipados e tratados numa boundary única, nunca ad-hoc em cada handler.

```
// ❌ Erro genérico, sem contexto, tratado inconsistente
if not user: raise Exception("erro")

// ✅ Erro de domínio tipado, com status/code mapeável
class NotFoundError(DomainError):
  def __init__(self, resource): ...

if not user: raise NotFoundError("user")
```

- Camada de domínio lança erros de domínio (`NotFoundError`, `ValidationError`, `InsufficientFundsError`), nunca `Exception`/`Error` genérico.
- Um middleware/filter/handler global traduz erro de domínio → status HTTP + payload de resposta. Nenhum controller individual faz `try/catch` pra montar resposta de erro.
- Erro de infraestrutura (timeout de rede, conexão de banco caída) não vaza pro cliente com stacktrace — vira 500 genérico + log interno com detalhe.
- Nunca engolir erro silenciosamente (`catch { }` vazio) — logar ou repropagar.

## Estrutura de módulo

Agrupar por feature/domínio, não por tipo técnico.

```
// ❌ Agrupado por tipo — acha tudo de "order" espalhado em 4 pastas
/controllers
  order_controller
  user_controller
/services
  order_service
  user_service
/repositories
  order_repository

// ✅ Agrupado por feature — módulo autocontido
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

- Módulo expõe uma interface pública (controller + tipos exportados); o resto é implementação interna.
- Módulo A não importa `internal`/repository de módulo B diretamente — comunicação entre módulos passa pelo service público (ou evento/fila).
- Código compartilhado entre módulos vai para `shared`/`common`, não fica duplicado nem vira import cruzado.

## Checklist

- [ ] Controller sem regra de negócio nem query direta
- [ ] Service depende de abstração, recebe dependência via injeção
- [ ] Nenhum service instancia outro service internamente
- [ ] Erros de domínio tipados, tratados numa boundary central
- [ ] Nenhum `catch`/`except` vazio ou que só faz `log` e segue como se nada tivesse acontecido
- [ ] Módulo organizado por feature, não por tipo técnico
- [ ] Sem import direto de repository de outro módulo

## Exemplos por stack

**NestJS** — DI via decorators, injeção por construtor:
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

**Django/FastAPI (Python)** — service como função/classe pura, repository como camada de ORM:
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

**Spring Boot (Java)** — DI via `@Autowired`/construtor, interface + implementação separadas:
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

- ❌ Controller com SQL/query direto ou regra de negócio (`if` de domínio)
- ❌ Service instanciando dependência concreta (`new PostgresRepository()`) em vez de receber por injeção
- ❌ `catch`/`except` vazio ou que só loga e ignora
- ❌ Erro genérico (`Exception`, `Error`) em vez de erro de domínio tipado
- ❌ Módulo organizado por tipo técnico (`/controllers`, `/services`, `/repositories` na raiz) em vez de por feature
- ❌ Import direto de repository/model interno de outro módulo
- ❌ Service que constrói outro service internamente em vez de recebê-lo pronto
- ❌ Regra de negócio duplicada em mais de uma camada
