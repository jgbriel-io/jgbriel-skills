---
name: client-state-management
description: Defines the boundary between server state, local UI state, and URL state as an architecture decision independent of state-management library. Use when user asks about global state, where state should live, useState vs store, Redux/Zustand/Context/Pinia/NgRx, or why filters/pagination/tabs reset on page refresh.
---

# Client State Management

A framework-agnostic decision: the right question is never "Redux or Zustand?",
"Context or Pinia?" — it is "what kind of state is this, and where should it
live?". Confusing the three kinds below is the common cause of stale data on
screen, filters that vanish on refresh, and a global store that became a dumping
ground for everything that "seemed like it needed sharing".

## The three kinds of state

| Kind | Example | Where it lives | Usual symptom when it is wrong |
|---|---|---|---|
| **Server state** | An order list, a user profile, a balance | A client cache, synchronised with the backend | `useState` plus `useEffect` reimplementing cache, loading and refetch by hand |
| **Local UI state** | An open modal, hover, a wizard step, an unsubmitted input | The component, or its immediate parent | Made global for no reason, or a store holding state one component uses |
| **URL state** | Filter, page, search, sort order, the screen's main tab | The query string or the route | Kept in a store or `useState`, and lost on refresh or when the link is shared |

> The React-specific application of this rule — `useState` vs server state, cache
> invalidation — lives in `frontend-conventions`, `react-best-practices`,
> `supabase-hooks` and `tanstack-query-patterns`. This skill is the
> library-agnostic decision layer, including URL state, which the others do not
> cover.

None of the three is generic "application state". Each has an owner and a right
tool. A global store (Redux, Zustand, Pinia, NgRx, Context) is for what remains
after the three are taken out: state genuinely shared across unrelated screens —
theme, session, cart, client-side feature flags.

## Server state: data that is not yours

The test: **"does this data exist in the backend independently of this screen? If
I open another tab, or another user changes it, does my copy go stale?"** If yes,
it is server state, and you hold a cache rather than the original.

```
// ❌ Reimplementing cache, loading, error and refetch by hand
const [orders, setOrders] = useState(null);
const [loading, setLoading] = useState(true);
useEffect(() => {
  fetch('/orders').then(r => r.json()).then(data => {
    setOrders(data);
    setLoading(false);
  });
}, []);
// and now: who invalidates this when an order is created on another screen?
// who retries when the network drops? who stops three simultaneous fetches of the same route?

// ✅ A server-state library already solves cache, loading, error, retry and invalidation
const { data: orders, isLoading } = useQuery('orders', fetchOrders);
```

- Loading, error and stale-while-revalidate are a solved problem — TanStack Query,
  SWR, RTK Query, vue-query, Angular Query. Rebuilding it on raw `useState`, `ref`
  or `signal` is reinventing a cache without invalidation.
- A mutation invalidates the matching cache key. The screen does not do
  `setOrders([...orders, created])` and hope it matches what the server persisted.
- Two screens asking for the same data share one cache by key, rather than keeping
  two diverging copies in two local stores.
- State derived from the fetch (`isLoading`, `isError`) is not yours to hold in a
  parallel `useState`; the query library already exposes it.

```
// ❌ Parking a fetch result in a global store "because several places use it"
store.orders = await fetchOrders(); // now nobody knows whether it is stale

// ✅ A keyed cache: any component asking for the same key reuses it
useQuery(['orders', filters], () => fetchOrders(filters));
```

## Local UI state: the component owns it

The test: **"does this state need to survive a remount? Does anything outside this
component's tree need to read or change it?"** If both answers are no, it is
local, and it lives in the component closest to whoever uses it.

```
// ❌ A child component's modal controlled from a global store
store.isDeleteModalOpen = true; // any part of the app can read or write this

// ✅ The modal's state lives in the component that renders it
const [isOpen, setIsOpen] = useState(false);
```

- An input's value before submit, hover, an expanded accordion, the current step of
  a **local** wizard (one nobody shares by link) — all UI state, solved with the
  framework's local primitive (`useState`, `ref`, `signal`, `$state`).
- If two distant components need the same UI state, first try lifting it to their
  common ancestor. Reach for Context or a store only when the tree is too deep for
  prop drilling to make sense.
- UI state needs no global state library. A `store` created for "modal open" or
  "field focused" is over-engineering.

## URL state: what the user expects to survive a refresh

The test: **"if the user refreshes, hits the browser's back button, or copies the
link and sends it to someone, would they expect to see the same thing?"** If yes,
it is URL state, and it must not live only in `useState` or a store.

```
// ❌ Filter and page in useState — a refresh, or sharing the link, loses both
const [status, setStatus] = useState('pending');
const [page, setPage] = useState(1);

// ✅ Filter and page in the URL — refresh, back/forward and a shared link all keep it
// URL: /orders?status=pending&page=2
const [params, setParams] = useSearchParams();
const status = params.get('status') ?? 'pending';
```

- List filters, page, search term, sort order, a screen's main tab (not an internal
  wizard step), the selected item in a master-detail view — all of it belongs in
  the query string or the path.
- The browser's back button should act as "undo" for the last filter or page
  change, which only works when the state is in the URL.
- URL state survives switching browser tabs and an accidental refresh. That is what
  separates a UI detail from state the user considers part of what they were doing.

## Boundaries that cause arguments

| Situation | Which kind? | Why |
|---|---|---|
| The active step of a three-step creation wizard | Local UI state | Nobody expects to share a link "at step 2", and restarting the wizard on refresh is acceptable |
| The active tab of a screen with main sections (Details / History / Documents) | URL state | The user expects to link straight to "History", and a refresh should not drop back to "Details" |
| `isLoading`/`error` for a request | Server state, derived | Not yours to hold in a parallel `useState`; it comes from whatever fetches the data |
| An edit form pre-filled from the server | Starts as server state, becomes local UI state — an editable draft until submit | The input diverges from the server until it is confirmed; it does not sync on every keystroke |
| Cart, theme, user session | Global application state, outside the three | Genuinely shared across unrelated screens, which is where Context, a store or a global signal belongs |

## Checklist

- [ ] No backend data sits in raw `useState`/`ref` without a cache library (TanStack Query, SWR, RTK Query or equivalent)
- [ ] Fetch loading and error come from the server-state library, not duplicated in your own state
- [ ] Filter, pagination, search, sort order and the screen's main tab live in the URL, not in a store
- [ ] A refresh, and "copy the link and open it in another tab", preserve what the user would expect
- [ ] Modals, hover, accordions and local wizard steps use the component's own state, with no global store
- [ ] The global store or context holds only genuinely cross-cutting state (session, theme, cart, feature flags), and has not become a dumping ground
- [ ] Mutations invalidate the matching server-state cache rather than hand-editing the local copy
- [ ] No distant component reads or writes another's UI state through forced prop drilling where a store fits better — nor the reverse

## By stack

**React** — TanStack Query (server), `useState` (local UI), `useSearchParams`/`nuqs` (URL):
```tsx
const { data: orders } = useQuery(['orders', status, page], () => fetchOrders({ status, page }));
const [isModalOpen, setIsModalOpen] = useState(false); // local UI
const [params, setParams] = useSearchParams(); // URL
```

**Vue** — vue-query (server), `ref` (local UI), Vue Router `query` (URL):
```vue
<script setup>
const { data: orders } = useQuery(['orders', route.query.status], () => fetchOrders(route.query));
const isModalOpen = ref(false); // local UI
const router = useRouter();
function setStatus(status) { router.push({ query: { ...route.query, status } }); } // URL
</script>
```

**Angular** — Angular Query, or `HttpClient` plus RxJS with a cache (server), a component field or `signal` (local UI), `ActivatedRoute.queryParams` (URL):
```ts
orders$ = this.route.queryParams.pipe(switchMap(qp => this.ordersService.getOrders(qp)));
isModalOpen = signal(false); // local UI
setStatus(status: string) {
  this.router.navigate([], { queryParams: { status }, queryParamsHandling: 'merge' }); // URL
}
```

**Svelte/SvelteKit** — TanStack Query svelte (server), `$state` (local UI), `$page.url.searchParams` (URL):
```svelte
<script>
  const orders = createQuery({ queryKey: ['orders', $page.url.searchParams.get('status')], queryFn: fetchOrders });
  let isModalOpen = $state(false); // local UI
  function setStatus(status) { goto(`?status=${status}`); } // URL
</script>
```

## Anti-patterns

- ❌ Raw `useState`/`ref` holding a fetch response, with `isLoading`/`isError` rebuilt by hand
- ❌ A list's filter, page or search in local state rather than the query string
- ❌ A global store holding "modal open", "hover" or "field focused" — state one component uses
- ❌ A mutation editing the local cache copy instead of invalidating or refetching the right key
- ❌ Two screens requesting the same server data and keeping diverging copies in separate stores
- ❌ A refresh losing the filter, page or tab the user expected to find unchanged
- ❌ A Context or Provider created only to avoid two levels of prop drilling, where lifting would do
- ❌ Syncing an input to the server on every keystroke instead of treating it as a local draft until submit
- ❌ An application store that became a dumping ground for anything that "seemed global", without asking whether it is server, UI or URL state
