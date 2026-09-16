---
name: error-ux
description: Defines client-side error handling — render error boundaries that isolate failure without crashing the whole tree, the four required states of any data-fetching screen (empty/loading/error/success), manual vs. automatic retry, and actionable error messages instead of raw exception text. Use when user asks about error boundary, loading/empty/error states, retry logic, or handling API failures in the UI.
---

# Tratamento de Erro no Client

Conceito agnóstico de framework de UI: erro de render (boundary), erro de dado (estados de tela) e erro de rede (retry) são três problemas diferentes, com solução diferente. Estado de erro é um caso particular de estado de UI — convenções gerais de estado (loading global, cache, otimista) ficam em `client-state-management`; aqui o foco é como o erro é isolado, exibido e recuperado.

## 1. Error boundary — isola falha de render

Um componente que quebra durante o render não pode derrubar a árvore inteira. Todo framework de UI tem um mecanismo equivalente a "boundary": um limite que captura o erro de um subtree e renderiza um fallback local, sem propagar para os componentes irmãos/pais.

```
// ❌ Um card de produto com dado malformado quebra a página inteira
<Page>
  <Header />
  <ProductList products={data} />  // um item com preço null lança exceção no render
  <Footer />
</Page>
// resultado: tela branca, Header e Footer também somem

// ✅ Boundary por seção — falha isolada, resto da tela continua funcional
<Page>
  <Header />
  <ErrorBoundary fallback={<ProductListError />}>
    <ProductList products={data} />
  </ErrorBoundary>
  <Footer />
</Page>
```

Onde colocar boundary:

| Nível | Cobre | Quando usar |
|---|---|---|
| Boundary de topo (app/rota) | Qualquer erro não capturado por boundary interno | Sempre — é a rede de segurança final, mostra "algo deu errado" genérico |
| Boundary por seção/widget | Erro isolado em um card, tabela, gráfico | Sempre que a seção depende de dado que pode vir malformado/incompleto |
| Boundary por item de lista | Um item específico de uma lista renderiza mal | Lista com dados heterogêneos (ex: feed, catálogo com fontes diferentes) |

Boundary captura erro de **render**, não erro assíncrono (`fetch` rejeitado, `setTimeout`, event handler). Erro assíncrono precisa ser tratado explicitamente no código que faz a chamada (try/catch, `.catch`, callback de erro da lib de state) e transformado em estado, que aí sim o componente renderiza — ver seção 2.

```
// ❌ Boundary não captura isso — a exceção acontece fora do render
useEffect(() => {
  fetchData(); // se rejeitar, boundary não vê nada, erro morre no console
}, []);

// ✅ Erro assíncrono vira estado, que o componente renderiza condicionalmente
useEffect(() => {
  fetchData()
    .then(setData)
    .catch(err => setError(toUserMessage(err)));
}, []);
```

Boundary também precisa reportar o erro capturado ao error tracker (ver skill `error-tracking`) — um fallback silencioso sem instrumentação esconde o problema em vez de só suavizar a UX.

## 2. Os quatro estados de toda tela que busca dado

Toda tela/componente que depende de dado assíncrono tem quatro estados possíveis. Tratar só o caminho feliz (sucesso) deixa os outros três indefinidos — na prática viram tela branca, spinner infinito ou crash.

> `frontend-conventions` cita três estados (loading/error/empty) como convenção de escrita de componente; esta skill adiciona **success** como quarto estado explícito e é a fonte de verdade dos estados de tela.

| Estado | Condição | O que renderizar |
|---|---|---|
| Loading | Requisição em voo, sem dado anterior | Skeleton/spinner — nunca tela em branco sem indicação |
| Empty | Requisição concluiu, dado existe mas é vazio (`[]`, `null` esperado) | Mensagem específica de vazio + ação (ex: "Nenhum pedido ainda — criar o primeiro") |
| Error | Requisição falhou | Mensagem acionável + retry (ver seção 3) — nunca o mesmo layout de "empty" |
| Success | Dado chegou e tem conteúdo | Conteúdo normal |

```
// ❌ Só cobre o caminho feliz — loading/error/empty ficam indefinidos
function OrderList({ orders }) {
  return <ul>{orders.map(o => <li key={o.id}>{o.name}</li>)}</ul>;
  // orders undefined → crash; orders [] → lista vazia sem explicação; erro anterior → nunca chega aqui
}

// ✅ Os quatro estados explícitos
function OrderList({ state }) {
  if (state.status === 'loading') return <OrderListSkeleton />;
  if (state.status === 'error') return <ErrorState message={state.message} onRetry={state.retry} />;
  if (state.data.length === 0) return <EmptyState text="Nenhum pedido ainda" />;
  return <ul>{state.data.map(o => <li key={o.id}>{o.name}</li>)}</ul>;
}
```

Erro **não é** o mesmo estado visual que vazio — vazio é "funcionou e não tem nada", erro é "não funcionou". Misturar os dois esconde falha real atrás de uma mensagem de "nada encontrado".

```
// ❌ Trata falha de rede como se fosse lista vazia
if (!data || data.length === 0) return <EmptyState />; // esconde timeout, 500, etc.

// ✅ Erro e vazio são estados distintos, com causas e ações diferentes
if (error) return <ErrorState />;
if (data.length === 0) return <EmptyState />;
```

## 3. Retry manual vs. automático

Nem todo erro merece a mesma estratégia de retry — depende da causa.

| Tipo de erro | Causa típica | Retry automático | Retry manual |
|---|---|---|---|
| Rede/timeout | Conexão instável, timeout | Sim — backoff exponencial, 2-3 tentativas | Botão "Tentar novamente" se automático esgotar |
| 5xx (erro do servidor) | Falha transiente no backend | Sim — mesma lógica de backoff | Idem |
| 429 (rate limit) | Limite de requisições | Sim — respeitar `Retry-After` se vier no header | Evitar deixar só manual, usuário vai bater de novo imediatamente |
| 4xx (exceto 429) — validação, permissão, não encontrado | Requisição malformada ou não autorizada | **Não** — repetir a mesma requisição dá o mesmo erro | Não é "retry", é ação corretiva do usuário (corrigir campo, pedir acesso) |
| Erro de render (capturado por boundary) | Dado malformado, bug de componente | Não automático (risco de loop) | Botão que força remontagem do subtree, só se plausível que o dado mudou |

```
// ❌ Retry automático em erro 4xx — vai repetir o mesmo erro indefinidamente
async function fetchWithRetry(url) {
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    await delay(1000 * i); // reenvia a mesma request inválida 3x
  }
}

// ✅ Retry automático só para classe de erro recuperável (rede/5xx/429)
async function fetchWithRetry(url) {
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    if (!isRetryable(res.status)) throw new HttpError(res); // 4xx: falha já, sem retry
    await delay(backoff(i, res.headers.get('Retry-After')));
  }
  throw new HttpError(lastResponse);
}

function isRetryable(status) {
  return status >= 500 || status === 429 || status === 0; // 0 = falha de rede/timeout
}
```

Regra prática: retry automático resolve problema **transiente** (a mesma ação, tentada de novo, pode funcionar). Se o erro é sobre o conteúdo da requisição (validação, permissão, recurso inexistente), repetir não muda o resultado — a UI precisa pedir ação do usuário, não insistir sozinha.

## 4. Mensagem de erro acionável

`error.message` de uma exception técnica não é uma mensagem de UX — é um detalhe de implementação vazando para quem não pode fazer nada com ele.

```
// ❌ Exception técnica direto na tela
<ErrorState message={error.message} />
// "TypeError: Cannot read properties of undefined (reading 'map')"
// "Request failed with status code 403"

// ✅ Mapear erro técnico para mensagem acionável, log técnico vai pro tracker
function toUserMessage(error) {
  if (error.status === 403) return { text: 'Você não tem permissão para ver isso.', action: 'Solicitar acesso' };
  if (error.status === 404) return { text: 'Este item não existe mais.', action: 'Voltar' };
  if (error.status >= 500 || !error.status) return { text: 'Algo deu errado do nosso lado. Tente novamente.', action: 'Tentar novamente' };
  return { text: 'Não foi possível completar a ação.', action: 'Tentar novamente' };
}

reportToTracker(error); // stack trace técnico fica só na observabilidade
<ErrorState {...toUserMessage(error)} />
```

Toda mensagem de erro de UI tem três partes:

- **O que aconteceu** — em linguagem de usuário, não de exception (evitar "erro 500", "undefined", nome de função interna)
- **Por que, se for útil** — só quando ajuda a decidir a próxima ação ("sua sessão expirou" vs. genérico "erro")
- **O que fazer agora** — botão/link de ação (retry, voltar, contatar suporte), nunca deixar o usuário só olhando o texto

## Checklist

- [ ] Toda seção que renderiza dado externo/de terceiro tem boundary próprio (não só o boundary de topo da app)
- [ ] Boundary reporta o erro capturado ao error tracker antes de mostrar o fallback
- [ ] Toda tela com fetch trata explicitamente loading, empty, error e success — nenhum implícito
- [ ] Estado de erro e estado vazio têm componente/mensagem visualmente distintos
- [ ] Retry automático só cobre erro de rede/5xx/429 com backoff, nunca 4xx de validação/permissão
- [ ] Erro 4xx mostra ação corretiva ("corrigir campo", "solicitar acesso"), não um botão de retry que repete o mesmo erro
- [ ] Nenhuma tela expõe `error.message`/stack trace cru — sempre passa por um mapeador de mensagem
- [ ] Toda mensagem de erro tem uma ação associada (retry, voltar, suporte) — nunca texto sem saída
- [ ] Erro assíncrono (fetch, timer, callback) é convertido em estado antes de chegar ao render — boundary não substitui isso

## Exemplos por stack

**React**
```tsx
class SectionErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { reportToTracker(error, info); }
  render() {
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}

function OrderList() {
  const { data, status, error, retry } = useOrders();
  if (status === 'loading') return <Skeleton />;
  if (status === 'error') return <ErrorState {...toUserMessage(error)} onRetry={retry} />;
  if (data.length === 0) return <EmptyState text="Nenhum pedido ainda" />;
  return <ul>{data.map(o => <li key={o.id}>{o.name}</li>)}</ul>;
}
```

**Vue**
```vue
<script setup>
import { onErrorCaptured, ref } from 'vue';
const error = ref(null);
onErrorCaptured((err) => { reportToTracker(err); error.value = err; return false; });
</script>

<template>
  <ErrorState v-if="error" v-bind="toUserMessage(error)" />
  <Skeleton v-else-if="status === 'loading'" />
  <EmptyState v-else-if="data.length === 0" text="Nenhum pedido ainda" />
  <ul v-else><li v-for="o in data" :key="o.id">{{ o.name }}</li></ul>
</template>
```

**Angular**
```ts
@Component({ selector: 'order-list', template: `
  <error-state *ngIf="vm.status === 'error'" [message]="vm.message" (retry)="retry()"></error-state>
  <skeleton *ngIf="vm.status === 'loading'"></skeleton>
  <empty-state *ngIf="vm.status === 'success' && vm.data.length === 0" text="Nenhum pedido ainda"></empty-state>
  <ul *ngIf="vm.status === 'success' && vm.data.length > 0">
    <li *ngFor="let o of vm.data">{{ o.name }}</li>
  </ul>
`})
export class OrderListComponent {
  vm$ = this.ordersService.state$; // ErrorHandler global já reporta erro de render ao tracker
}
```

**Svelte**
```svelte
<script>
  export let promise; // { status, data, error, retry }
</script>

{#if $promise.status === 'error'}
  <ErrorState {...toUserMessage($promise.error)} on:retry={$promise.retry} />
{:else if $promise.status === 'loading'}
  <Skeleton />
{:else if $promise.data.length === 0}
  <EmptyState text="Nenhum pedido ainda" />
{:else}
  <ul>{#each $promise.data as o (o.id)}<li>{o.name}</li>{/each}</ul>
{/if}
```

## Anti-patterns

- ❌ Um erro de render em um card derruba a página inteira por falta de boundary
- ❌ Boundary sem reportar ao error tracker — fallback silencioso esconde o bug
- ❌ Tela só cobre o caminho de sucesso, loading/empty/error ficam indefinidos ou geram crash
- ❌ Estado vazio e estado de erro usando o mesmo componente/mensagem genérica
- ❌ Retry automático em erro 4xx de validação/permissão, repetindo a mesma falha
- ❌ Retry manual sem backoff em erro 429, gerando nova rajada imediata contra o rate limit
- ❌ Exibir `error.message`/stack trace técnico direto na tela do usuário
- ❌ Mensagem de erro sem nenhuma ação associada — usuário travado sem próximo passo
- ❌ Tratar erro assíncrono (fetch/timer) como se boundary de render fosse capturá-lo
