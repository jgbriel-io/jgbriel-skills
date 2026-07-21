---
name: client-state-management
description: Defines the boundary between server state, local UI state, and URL state as an architecture decision independent of state-management library. Use when user asks about global state, where state should live, useState vs store, Redux/Zustand/Context/Pinia/NgRx, or why filters/pagination/tabs reset on page refresh.
---

# Gerenciamento de Estado no Client

Conceito agnóstico de framework/biblioteca: a pergunta certa nunca é "Redux ou Zustand?", "Context ou Pinia?" — é "que tipo de estado é esse, e onde ele deveria morar?". Confundir os três tipos abaixo é a causa mais comum de dado obsoleto na tela, filtro que some no refresh, e store global viradas em lixeira de tudo que "parecia precisar ser compartilhado".

## Os três tipos de estado

| Tipo | Exemplo | Onde mora | Sintoma de erro comum |
|---|---|---|---|
| **Server state** | lista de pedidos, perfil do usuário, saldo | cache do client, sincronizado com o backend | `useState` + `useEffect` reimplementando cache, loading e refetch manualmente |
| **UI state local** | modal aberto, hover, tab de um wizard, valor de input não submetido | componente (ou pai imediato) | vira global sem motivo, ou store guarda estado que só um componente usa |
| **Estado em URL** | filtro, página, busca, ordenação, aba principal da tela | query string / rota | fica em store/`useState` e some ao dar F5 ou compartilhar o link |

> A aplicação React-específica desta regra (useState vs server state, invalidação de cache) mora em `frontend-conventions`, `react-best-practices`, `supabase-hooks` e `tanstack-query-patterns`; esta skill é a camada de decisão agnóstica — incluindo estado em URL, que as outras não cobrem.

Nenhum dos três é "estado da aplicação" genérico — cada um tem dono e ferramenta certa. Store global (Redux/Zustand/Pinia/NgRx/Context) serve para o que sobra depois de tirar os três: estado que é de fato transversal a telas não relacionadas (tema, sessão, carrinho, feature flags client-side).

## Server state: dado que não é seu

Teste de decisão: **"esse dado existe no backend independente desta tela? Se eu abrir em outra aba ou outro usuário mudar, minha cópia fica desatualizada?"** Se sim, é server state — nunca é dono, é cache.

```
// ❌ Reimplementando cache, loading, erro e refetch na mão
const [orders, setOrders] = useState(null);
const [loading, setLoading] = useState(true);
useEffect(() => {
  fetch('/orders').then(r => r.json()).then(data => {
    setOrders(data);
    setLoading(false);
  });
}, []);
// e agora: quem invalida isso quando um pedido é criado em outra tela?
// quem faz retry se a rede cair? quem evita 3 fetches simultâneos da mesma rota?

// ✅ Lib de server state resolve cache, loading, erro, retry, invalidação
const { data: orders, isLoading } = useQuery('orders', fetchOrders);
```

- Loading, error e stale-while-revalidate são problema resolvido — TanStack Query, SWR, RTK Query (React), vue-query (Vue), Angular Query fazem isso. Reimplementar isso com `useState`/`ref`/`signal` cru é reinventar cache sem invalidação.
- Mutação (criar/editar/deletar) invalida a chave de cache correspondente — a tela não faz `setOrders([...orders, novo])` manualmente esperando que isso reflita o que o server realmente persistiu.
- Duas telas que pedem o mesmo dado (`orders`) devem compartilhar o mesmo cache por chave, não duas cópias divergentes em duas stores locais.
- Estado derivado do fetch (`isLoading`, `isError`) não é estado "seu" para guardar em `useState` paralelo — a lib de query já expõe isso.

```
// ❌ Guardar resultado de fetch numa store global "porque é usado em vários lugares"
store.orders = await fetchOrders(); // agora ninguém sabe se está stale

// ✅ Cache com chave, qualquer componente que pedir a mesma chave reusa o cache
useQuery(['orders', filters], () => fetchOrders(filters));
```

## UI state local: o componente é dono

Teste de decisão: **"esse estado sobrevive a um remount do componente? Alguém fora da árvore dele precisa ler ou mudar esse valor?"** Se a resposta pras duas é não, é local — fica no componente mais próximo de quem usa, ponto.

```
// ❌ Modal de um componente filho controlado por store global
store.isDeleteModalOpen = true; // qualquer parte do app pode ler/escrever isso

// ✅ Estado do modal vive no componente que o renderiza
const [isOpen, setIsOpen] = useState(false);
```

- Valor de input antes do submit, hover, accordion expandido, passo atual de um wizard **local** (não compartilhado por link) — tudo isso é UI state, resolvido com o primitivo local do framework (`useState`, `ref`, `signal`, `$state`).
- Se dois componentes distantes (não pai/filho direto) precisam do mesmo UI state, primeiro tente subir o estado (lifting) pro ancestral comum — só recorra a Context/store se a árvore for grande demais pra prop drilling fazer sentido.
- UI state não precisa de biblioteca de estado global. Se o time está criando uma `store` de state manager só para "modal aberto" ou "campo em foco", é sinal de sobre-engenharia.

## Estado em URL: o que o usuário espera que sobreviva a um refresh

Teste de decisão: **"se o usuário der F5, voltar pelo botão do browser, ou copiar o link e mandar pra outra pessoa, ele esperaria ver a mesma coisa?"** Se sim, é URL state — nunca deveria morar só em `useState`/store.

```
// ❌ Filtro e página em useState — refresh ou compartilhar o link perde tudo
const [status, setStatus] = useState('pending');
const [page, setPage] = useState(1);

// ✅ Filtro e página na URL — refresh, back/forward e link compartilhado preservam o estado
// URL: /orders?status=pending&page=2
const [params, setParams] = useSearchParams();
const status = params.get('status') ?? 'pending';
```

- Filtro de listagem, página, termo de busca, ordenação, aba principal de uma tela (não passo interno de um wizard), item selecionado num mapa/lista mestre-detalhe — tudo isso vai pra query string ou pro path.
- Botão voltar do browser deve funcionar como "desfazer" da última mudança de filtro/página — só acontece se o estado estiver na URL, não em store.
- Estado em URL não some ao trocar de aba do browser e voltar, nem ao dar refresh acidental — isso é o que diferencia "detalhe de UI" de "estado que o usuário considera parte do que ele estava fazendo".

## Fronteiras que geram confusão

| Situação | É o quê? | Por quê |
|---|---|---|
| Aba ativa de um wizard de 3 passos dentro de um único fluxo de criação | UI state local | Ninguém espera compartilhar link "no passo 2 do wizard"; refresh reiniciar o wizard é aceitável |
| Aba ativa de uma tela com seções principais (Detalhes / Histórico / Documentos) | URL state | Usuário espera linkar direto pra aba "Histórico", e refresh não deveria voltar pra "Detalhes" |
| `isLoading`/`error` de uma requisição | Server state (derivado) | Não é estado próprio pra guardar em `useState` paralelo — vem de quem já busca o dado |
| Formulário de edição pré-populado com dado do server | Começa como server state (fetch), depois vira UI state local (rascunho editável até o submit) | O valor no input diverge do servidor até confirmar — não sincroniza a cada tecla |
| Carrinho de compras, tema, sessão do usuário | Estado global de aplicação (fora dos três) | Transversal a telas não relacionadas — aí sim cabe Context/store/signal global |

## Checklist

- [ ] Nenhum dado vindo do backend é guardado em `useState`/`ref` cru sem lib de cache (TanStack Query, SWR, RTK Query ou equivalente)
- [ ] Loading/error de fetch vem da lib de server state, não duplicado em estado próprio
- [ ] Filtro, paginação, busca, ordenação e aba principal de tela estão na URL, não em store/`useState`
- [ ] Refresh da página e "copiar link e abrir em outra aba" preservam o que o usuário esperaria preservar
- [ ] Modal, hover, accordion, passo de wizard local resolvidos com estado do próprio componente, sem store global
- [ ] Store/Context global só guarda estado realmente transversal (sessão, tema, carrinho, feature flag), não virou dumping ground
- [ ] Mutação (criar/editar/deletar) invalida o cache de server state correspondente, não edita a cópia local na mão
- [ ] Nenhum componente distante lê/escreve UI state de outro componente via prop drilling forçado onde uma store faria mais sentido — nem o contrário

## Exemplos por stack

**React** — TanStack Query (server) + `useState` (UI local) + `useSearchParams`/`nuqs` (URL):
```tsx
const { data: orders } = useQuery(['orders', status, page], () => fetchOrders({ status, page }));
const [isModalOpen, setIsModalOpen] = useState(false); // UI local
const [params, setParams] = useSearchParams(); // URL
```

**Vue** — vue-query (server) + `ref` (UI local) + Vue Router `query` (URL):
```vue
<script setup>
const { data: orders } = useQuery(['orders', route.query.status], () => fetchOrders(route.query));
const isModalOpen = ref(false); // UI local
const router = useRouter();
function setStatus(status) { router.push({ query: { ...route.query, status } }); } // URL
</script>
```

**Angular** — Angular Query ou `HttpClient`+RxJS com cache (server) + component field/`signal` (UI local) + `ActivatedRoute.queryParams` (URL):
```ts
orders$ = this.route.queryParams.pipe(switchMap(qp => this.ordersService.getOrders(qp)));
isModalOpen = signal(false); // UI local
setStatus(status: string) {
  this.router.navigate([], { queryParams: { status }, queryParamsHandling: 'merge' }); // URL
}
```

**Svelte/SvelteKit** — TanStack Query svelte (server) + `let`/`$state` (UI local) + `$page.url.searchParams` (URL):
```svelte
<script>
  const orders = createQuery({ queryKey: ['orders', $page.url.searchParams.get('status')], queryFn: fetchOrders });
  let isModalOpen = $state(false); // UI local
  function setStatus(status) { goto(`?status=${status}`); } // URL
</script>
```

## Anti-patterns

- ❌ `useState`/`ref` cru guardando resposta de fetch, com `isLoading`/`isError` reimplementados na mão
- ❌ Filtro, página ou busca de listagem em store/estado local em vez de query string
- ❌ Store global guardando "modal aberto", "hover", "campo em foco" — estado que só um componente usa
- ❌ Mutação editando a cópia local do cache diretamente em vez de invalidar/refetch a chave correta
- ❌ Duas telas pedindo o mesmo dado de servidor e mantendo duas cópias divergentes em stores separadas
- ❌ Refresh da página perder filtro/página/aba que o usuário esperava encontrar do mesmo jeito
- ❌ Context/Provider criado só para evitar prop drilling de dois níveis quando lifting resolveria
- ❌ Sincronizar valor de input com o servidor a cada tecla em vez de tratar como rascunho local até o submit
- ❌ Store de estado de aplicação virando dumping ground de tudo que "parecia global" sem revisar se é server/UI/URL
