---
name: integration-testing
description: Guides writing integration tests against real dependencies — disposable containers for database/services instead of mocks, test data setup/teardown, and automated multi-tenant isolation checks. Framework-agnostic. Use when user asks about integration tests, testing against a real database, mocking vs. real dependencies, testcontainers, or test data isolation.
---

# Integration Testing — Teste de Integração

Teste de integração exercita a fronteira entre o código e uma dependência real — banco, fila, cache, API externa — sem mockar essa dependência. O objetivo é provar que o contrato (query, constraint, serialização, transação) funciona de verdade, não que a lógica interna está correta isoladamente (isso é teste unitário) nem que a jornada completa funciona pela UI (isso é E2E — ver skill `e2e-testing`).

## Por que não mockar a camada de dados

Mock de repositório/ORM testa a suposição de como o banco se comporta, não o banco em si. Bug de query mal escrita, constraint violada, tipo incompatível, encoding, transação que não commita — tudo isso passa limpo no mock e explode em produção.

```
// ❌ mock do repositório — só testa que o service chama o método certo
const repo = { findByEmail: jest.fn().mockResolvedValue(null) };
const service = new UserService(repo);
await service.criar({ email: "a@b.com" });
expect(repo.criar).toHaveBeenCalled();
// não prova nada sobre constraint de email único, tipo de coluna, ou índice

// ✅ banco real (container descartável) — prova o contrato de verdade
const service = new UserService(realRepo); // conectado a container Postgres efêmero
await service.criar({ email: "a@b.com" });
await expect(service.criar({ email: "a@b.com" }))
  .rejects.toThrow(/unique constraint/i);
// prova que a constraint de unicidade existe e está funcionando
```

Regra prática: se o teste some quando você comenta a implementação da query e ainda passa, ele não está testando integração — está testando o mock.

## Container descartável, não banco compartilhado

Cada execução da suíte sobe sua própria instância isolada da dependência (container Docker efêmero, banco in-memory equivalente, emulador local — ou `supabase start` local pra Supabase) e destrói ao final. Banco compartilhado entre execuções/máquinas/CI é fonte de flakiness e de "passa na minha máquina".

```
// ❌ aponta para banco de dev/staging compartilhado
DATABASE_URL=postgres://dev-shared-db/app_dev

// ✅ sobe container isolado por execução, migra, roda, destrói
beforeAll ->  subirContainer("postgres:16")
              rodarMigrations()
afterAll  ->  destruirContainer()
```

- Container por suíte (não por teste individual) é aceitável por custo — desde que os dados dentro dele sejam isolados por teste (próxima seção).
- CI e máquina local devem usar o mesmo mecanismo — nada de "no CI é mock, local é real" ou vice-versa, isso é exatamente o cenário que esconde bug.
- Serviço externo de terceiro sem versão local viável (gateway de pagamento, SMS) entra como fake server controlado por você (ex.: WireMock, servidor HTTP local que simula o contrato), não como mock in-process — o objetivo é exercitar serialização e I/O de rede reais, só substituindo o outro lado da rede.

## Setup e teardown de dado de teste

```
Padrão, qualquer stack:
1. cria os dados mínimos que o teste precisa, dentro do próprio teste/setup
2. roda o comportamento sob teste
3. assert no estado resultante (banco, resposta, efeito colateral)
4. limpa o dado criado — mesmo se o teste falhar
```

- Dado criado pelo teste, nunca fixture fixa carregada uma vez para toda a suíte e reaproveitada — reaproveitamento cria acoplamento entre testes e ordem de execução importa.
- Transação com rollback ao final de cada teste é a forma mais rápida de isolamento quando o driver/framework suporta — evita `DELETE`/`TRUNCATE` manual e é imune a teste que quebra no meio.
- Sem suporte a rollback automático: teardown explícito em `afterEach`/`finally`, nunca só no caminho feliz.
- Identificador único por execução (uuid) quando testes rodam em paralelo contra o mesmo container — evita colisão de chave única entre testes concorrentes.

## Onde fica a fronteira com unitário e E2E

| Camada | Depende de | Prova | Velocidade |
|---|---|---|---|
| Unitário | Nada externo (tudo em memória/mock) | Lógica pura, regra de negócio isolada | Milissegundos |
| Integração | Banco/serviço real, sem UI | Contrato entre código e dependência externa (query, constraint, transação, serialização) | Segundos |
| E2E | Sistema completo via UI/browser real | Jornada do usuário ponta a ponta | Minutos |

Teste de integração é mais lento que unitário (I/O real leva tempo) e mais rápido que E2E (não sobe browser nem renderiza UI). Se o comportamento pode ser provado sem I/O real, é unitário — não pague o custo de integração à toa. Se só pode ser provado subindo a UI inteira (fluxo multi-tela, JS client-side), é E2E — ver skill `e2e-testing` para esse critério. Regra de negócio + persistência é o território natural de integração.

## Isolamento multi-tenant como teste automatizado

Quando o sistema é multi-tenant (comum em SaaS com múltiplos clientes/contas), isolamento entre tenants é justamente o tipo de contrato que mock nunca vai pegar — RLS, filtro de `tenant_id`/`owner_id`, schema-per-tenant só se provam rodando contra o banco/serviço real. Trate cada policy de isolamento como um teste de integração comum, não como checklist manual.

```
Padrão do teste de isolamento (integração, banco real):
1. cria tenant A e tenant B no banco real
2. cria recurso R como tenant A
3. autentica/roda a query como tenant B
4. assert: acesso negado/vazio — nunca retorna dado de A
```

Ver skill `multi-tenant-isolation-audit` para o inventário completo de onde isolamento vaza (joins, cache, jobs, storage, exports) e o checklist de auditoria — aqui o ponto é só: cada item daquele checklist vira teste de integração versionado, não vira verificação manual repetida a cada review.

## Checklist

- [ ] Teste roda contra instância real e descartável da dependência (container, emulador) — nunca mock da camada de dados
- [ ] Container/instância é efêmero, criado e destruído pela própria suíte — CI e local usam o mesmo mecanismo
- [ ] Dado de teste é criado pelo próprio teste/setup, não carregado de fixture fixa compartilhada
- [ ] Teardown garantido mesmo em falha (rollback de transação, `afterEach`/`finally`) — sem dado órfão acumulando entre execuções
- [ ] Teste passa isolado e passa rodando junto com toda a suíte, em qualquer ordem
- [ ] Constraint, índice, transação e query são exercitados de verdade — não só a chamada ao método
- [ ] Serviço externo de terceiro sem versão local usa fake server controlado, não mock in-process
- [ ] Toda policy de isolamento multi-tenant tem teste de integração dedicado (tenant A não acessa recurso de tenant B)
- [ ] Suíte de integração roda em pipeline de CI, não só localmente antes do merge
- [ ] Nenhum teste de integração está fazendo o papel de E2E (não abre browser/UI) nem de unitário (não mocka a dependência que deveria exercitar)

## Anti-patterns

- ❌ Mockar o repositório/ORM/client de banco e chamar isso de "teste de integração"
- ❌ Apontar teste de integração para banco de dev/staging compartilhado entre execuções
- ❌ Fixture de dados carregada uma vez e reaproveitada por toda a suíte, criando acoplamento de ordem entre testes
- ❌ Teardown ausente ou só no caminho feliz — dado órfão contamina a próxima execução
- ❌ CI usando mock enquanto local usa banco real (ou vice-versa) — divergência que esconde bug até produção
- ❌ Confiar em checklist manual de isolamento multi-tenant em vez de automatizar como teste de integração
- ❌ Escrever E2E completo (via UI) para provar algo que uma chamada direta à API contra o banco real já prova mais rápido
- ❌ Suíte de integração tão lenta que ninguém roda localmente e vira responsabilidade só do CI

## Exemplos por stack

**Node/TypeScript (Testcontainers + Postgres):**
```ts
let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16").start();
  await runMigrations(container.getConnectionUri());
});
afterAll(() => container.stop());

test("cria usuário rejeita email duplicado", async () => {
  const repo = new UserRepository(container.getConnectionUri());
  await repo.criar({ email: "a@b.com" });
  await expect(repo.criar({ email: "a@b.com" })).rejects.toThrow();
});
```

**Supabase local (`supabase start`):**
```ts
beforeAll(async () => {
  // supabase start já sobe Postgres + Auth + Storage local via Docker
  supabase = createClient(LOCAL_URL, LOCAL_ANON_KEY);
});

test("RLS bloqueia cross-tenant", async () => {
  await supabase.auth.signInWithPassword({ email: userA, password });
  const { data } = await supabase.from('pedidos').select().eq('id', pedidoDeB.id);
  expect(data).toHaveLength(0); // policy bloqueou, não retornou dado de outro owner
});
```

**Python (pytest + testcontainers):**
```python
@pytest.fixture(scope="module")
def pg_container():
    with PostgresContainer("postgres:16") as pg:
        run_migrations(pg.get_connection_url())
        yield pg

def test_email_unico(pg_container):
    repo = UserRepository(pg_container.get_connection_url())
    repo.criar(email="a@b.com")
    with pytest.raises(IntegrityError):
        repo.criar(email="a@b.com")
```

**Go (dockertest ou testcontainers-go):**
```go
func TestCriarUsuario_EmailDuplicado(t *testing.T) {
    db := setupPostgresContainer(t) // sobe container, roda migrations, retorna *sql.DB
    repo := NewUserRepository(db)

    require.NoError(t, repo.Criar(ctx, User{Email: "a@b.com"}))
    err := repo.Criar(ctx, User{Email: "a@b.com"})
    require.ErrorContains(t, err, "duplicate key")
}
```
