---
name: e2e-testing
description: Guides writing reliable end-to-end tests — programmatic auth fixtures instead of UI login, per-run data isolation, accessible selectors (role/label), and when E2E is the right layer vs. integration/unit. Use when user asks about E2E tests, flaky tests, test selectors, login fixtures for tests, Playwright, Cypress, or Selenium.
---

# E2E Testing — Ponta a Ponta

## Quando usar E2E (vs. integração/unitário)

| Camada | O que valida | Custo | Quando usar |
|---|---|---|---|
| Unitário | Lógica pura, função isolada | Baixíssimo | Sempre — primeira linha de defesa |
| Integração | Contrato entre módulos, API real + banco | Baixo/médio | Regras de negócio, camada service/API/repositório |
| E2E | Jornada completa via UI real (browser) | Alto | Só fluxos críticos: login, checkout, cadastro, fluxo de pagamento |

Regra prática: se o comportamento pode ser provado sem subir um browser, não é E2E. E2E não substitui integração — é a camada mais lenta e mais frágil da pirâmide, use com parcimônia. Ver skill `tdd` para o ciclo red-green-refactor e `integration-testing` para testes de integração.

## Fixture de autenticação

Login pela UI em todo teste é lento e flaky — cada teste herda a fragilidade da tela de login, mesmo quando login não é o que está sendo testado. Autentique programaticamente (chamada direta à API de auth, ou reaproveitando uma sessão/token já obtida) e só então abra a página que interessa.

```
// ❌ login pela UI em todo teste
abrir("/login")
preencher("#email", "user@test.com")
preencher("#senha", "123456")
clicar("Entrar")
esperarUrl("/dashboard")
// ... o teste de verdade só começa aqui

// ✅ autenticação via API/fixture, sessão já pronta ao abrir a página
autenticarViaApi("user@test.com", "123456")  // injeta cookie/token/localStorage
abrir("/perfil")
// teste começa direto no comportamento sob teste
```

- O fluxo de login em si só é testado por UI *uma vez*, no teste dedicado a login.
- Reaproveitar sessão entre testes do mesmo usuário (setup em `beforeAll`/fixture global) é aceitável quando o teste não precisa de estado de auth limpo.

## Isolamento de dados por execução

Cada teste cria e limpa os próprios dados. Nunca depender de registro fixo em ambiente compartilhado nem da ordem de execução de outro teste — isso quebra em paralelização e em re-execução.

```
// ❌ depende de dado fixo criado manualmente meses atrás
abrir("/clientes/123/pedidos")

// ✅ cria e destrói o próprio dado, com identificador único por execução
cliente = api.criarCliente({ nome: `Cliente E2E ${uuid()}` })
api.criarPedido(cliente.id, { valor: 100 })
abrir(`/clientes/${cliente.id}/pedidos`)
// ...
api.deletarCliente(cliente.id)  // teardown, mesmo se o teste falhar
```

Checklist:
- [ ] Dado criado via API/seed do próprio teste, não via UI (setup por UI é lento e não é o que está sob teste)
- [ ] Identificador único por execução (uuid/timestamp) — evita colisão em execução paralela
- [ ] Teardown garantido mesmo em caso de falha (`afterEach`/`finally`, não só o caminho feliz)
- [ ] Teste passa rodando sozinho e passa rodando junto com toda a suíte, em qualquer ordem

## Seletores acessíveis

Seletor por classe CSS ou XPath posicional quebra a cada mudança de estilo ou de DOM, sem relação com o comportamento testado. Selecionar por role/label acessível é estável porque é o mesmo contrato que usuário e leitor de tela dependem — e força a UI a ser acessível de verdade (ver `accessibility-audit`).

```
// ❌ acoplado a implementação/estilo
selecionar(".btn-primary.submit-form")
selecionar("div > span:nth-child(2)")
selecionar("//div[3]/button")

// ✅ contrato de acessibilidade — sobrevive a refactor visual
selecionarPorRole("button", { nome: "Salvar" })
selecionarPorLabel("E-mail")
selecionarPorTexto("Pedido criado com sucesso")
```

`data-testid` é fallback aceitável só quando não existe role/label natural (ex.: elemento puramente visual usado para asserção de estado) — ainda assim prefira antes ajustar o componente para expor semântica acessível.

## Estabilidade (evitar flakiness)

```
// ❌ espera fixa — ou é curta demais (flaky) ou desperdiça tempo (lenta)
esperar(3000)
clicar("Salvar")

// ✅ espera pela condição real
esperarVisivel(selecionarPorTexto("Pedido criado com sucesso"))
clicar("Salvar")
```

- Nunca `sleep`/`waitForTimeout` fixo — esperar elemento visível, request finalizada, URL mudar.
- Teste que falha às vezes não é "flaky, roda de novo" — é bug no teste (condição de corrida, dado compartilhado, seletor ambíguo) ou no produto. Investigar a causa, não mascarar com retry.
- Retry automático do runner é rede de segurança para infra instável, não desculpa para teste malfeito.

## Estrutura recomendada

- Encapsular seletores e ações repetidas em page objects/helpers — evita duplicar `selecionarPorRole(...)` em dezenas de arquivos e centraliza o ponto de manutenção quando a UI muda.
- Um teste = uma jornada/comportamento. Não empilhar várias asserções de fluxos diferentes num teste só (dificulta saber o que quebrou).
- Suíte E2E deve poder rodar em paralelo (workers/sharding) — se não pode, geralmente é sintoma de dado não isolado.

## Exemplos por stack

**Playwright (TS)** — auth via `storageState` reaproveitado entre testes:
```ts
test.beforeAll(async ({ request }) => {
  await request.post('/api/auth/login', { data: { email, password } });
});
test.use({ storageState: 'auth.json' });

test('edita perfil', async ({ page }) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Salvar' }).click();
});
```

**Cypress** — auth programática via comando customizado:
```js
Cypress.Commands.add('login', (email, password) => {
  cy.request('POST', '/api/auth/login', { email, password })
    .then(({ body }) => window.localStorage.setItem('token', body.token));
});

it('edita perfil', () => {
  cy.login('user@test.com', '123456');
  cy.visit('/profile');
  cy.findByRole('button', { name: 'Salvar' }).click();
});
```

**Selenium (Python)** — auth via API, seletor por atributo de acessibilidade:
```python
def test_edita_perfil(driver, api_client):
    token = api_client.login("user@test.com", "123456")
    driver.add_cookie({"name": "session", "value": token})
    driver.get(f"{BASE_URL}/profile")
    driver.find_element(By.CSS_SELECTOR, "[role='button'][aria-label='Salvar']").click()
```

## Anti-patterns

- ❌ Login pela UI em todo teste que não é sobre login
- ❌ Depender de dado fixo/seed compartilhado entre testes ou ambientes
- ❌ Seletor por classe CSS, XPath posicional ou estrutura de DOM
- ❌ `sleep`/`waitForTimeout` fixo em vez de esperar condição
- ❌ Teste que só passa numa ordem específica de execução
- ❌ Cobrir com E2E o que já é validado por teste de integração/unitário
- ❌ Rodar a suíte E2E inteira, sem paralelização, a cada commit
- ❌ Mascarar teste flaky com retry em vez de investigar a causa raiz
- ❌ Teardown ausente ou só no caminho feliz (dado órfão acumula e contamina execuções futuras)
