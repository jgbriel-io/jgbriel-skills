---
name: error-ux
description: Defines client-side error handling — render error boundaries that isolate failure without crashing the whole tree, the four required states of any data-fetching screen (empty/loading/error/success), manual vs. automatic retry, and actionable error messages instead of raw exception text. Use when user asks about error boundary, loading/empty/error states, retry logic, or handling API failures in the UI.
---

# Client-Side Error Handling

A UI-framework-agnostic concept: a render error (boundaries), a data error (screen
states) and a network error (retry) are three different problems with three
different solutions. Error state is a special case of UI state — general state
conventions live in `client-state-management`; the focus here is how an error is
isolated, shown and recovered from.

## 1. Error boundaries isolate a render failure

A component that throws during render must not take the whole tree with it. Every
UI framework has an equivalent of a boundary: a limit that catches a subtree's
error and renders a local fallback, without propagating to siblings or parents.

```
// ❌ One product card with malformed data breaks the entire page
<Page>
  <Header />
  <ProductList products={data} />  // one item with a null price throws during render
  <Footer />
</Page>
// result: a blank screen, Header and Footer gone too

// ✅ A boundary per section — the failure is isolated, the rest still works
<Page>
  <Header />
  <ErrorBoundary fallback={<ProductListError />}>
    <ProductList products={data} />
  </ErrorBoundary>
  <Footer />
</Page>
```

Where boundaries go:

| Level | Covers | When |
|---|---|---|
| Top-level (app or route) | Anything no inner boundary caught | Always — the final safety net, showing a generic "something went wrong" |
| Per section or widget | An error confined to a card, table or chart | Whenever the section depends on data that may arrive malformed or incomplete |
| Per list item | One item in a list rendering badly | Lists with heterogeneous data — a feed, a catalogue drawing on several sources |

A boundary catches **render** errors, not asynchronous ones: a rejected `fetch`, a
`setTimeout`, an event handler. Asynchronous errors have to be handled explicitly
where the call is made (try/catch, `.catch`, the state library's error callback)
and turned into state, which the component then renders — see section 2.

```
// ❌ The boundary never sees this: the exception happens outside render
useEffect(() => {
  fetchData(); // on rejection the boundary sees nothing, and the error dies in the console
}, []);

// ✅ The async error becomes state, which the component renders conditionally
useEffect(() => {
  fetchData()
    .then(setData)
    .catch(err => setError(toUserMessage(err)));
}, []);
```

A boundary also reports what it caught to the error tracker (see `error-tracking`).
A silent fallback with no instrumentation hides the problem rather than softening
the experience.

## 2. The four states of any data-fetching screen

Every screen or component depending on asynchronous data has four possible states.
Handling only the happy path leaves the other three undefined — in practice, a
blank screen, an endless spinner, or a crash.

> `frontend-conventions` names three states (loading, error, empty) as a
> component-writing convention. This skill adds **success** as an explicit fourth
> and is the source of truth for screen states.

| State | Condition | What to render |
|---|---|---|
| Loading | A request in flight with no previous data | A skeleton or spinner, never a blank screen |
| Empty | The request finished, and the data is legitimately empty (`[]`, an expected `null`) | A specific empty message plus an action: "Nenhum pedido ainda — criar o primeiro" |
| Error | The request failed | An actionable message plus retry (section 3), never the same layout as empty |
| Success | Data arrived and has content | The normal content |

```
// ❌ Only the happy path — loading, error and empty are undefined
function OrderList({ orders }) {
  return <ul>{orders.map(o => <li key={o.id}>{o.name}</li>)}</ul>;
  // orders undefined → crash; orders [] → an unexplained empty list; an earlier error → never reaches here
}

// ✅ All four states, explicit
function OrderList({ state }) {
  if (state.status === 'loading') return <OrderListSkeleton />;
  if (state.status === 'error') return <ErrorState message={state.message} onRetry={state.retry} />;
  if (state.data.length === 0) return <EmptyState text="Nenhum pedido ainda" />;
  return <ul>{state.data.map(o => <li key={o.id}>{o.name}</li>)}</ul>;
}
```

An error is **not** the same visual state as empty. Empty means "it worked and
there is nothing"; error means "it did not work". Merging them hides a real failure
behind a "nothing found" message.

```
// ❌ Treating a network failure as an empty list
if (!data || data.length === 0) return <EmptyState />; // hides timeouts, 500s and the rest

// ✅ Error and empty are distinct states, with different causes and actions
if (error) return <ErrorState />;
if (data.length === 0) return <EmptyState />;
```

## 3. Manual vs. automatic retry

Not every error deserves the same retry strategy; it depends on the cause.

| Error | Typical cause | Automatic retry | Manual retry |
|---|---|---|---|
| Network / timeout | Unstable connection | Yes — exponential backoff, two or three attempts | A "try again" button once automatic retries are exhausted |
| 5xx | A transient backend failure | Yes, same backoff | Likewise |
| 429 | Rate limited | Yes, honouring `Retry-After` when the header is present | Do not leave it manual only, or the user immediately hits it again |
| 4xx other than 429 — validation, permission, not found | A malformed or unauthorised request | **No** — repeating the same request gives the same error | Not a retry: the user takes corrective action, fixing a field or requesting access |
| Render error caught by a boundary | Malformed data, a component bug | Not automatically; it risks a loop | A button that remounts the subtree, only where the data plausibly changed |

```
// ❌ Automatic retry on a 4xx — it repeats the same error indefinitely
async function fetchWithRetry(url) {
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    await delay(1000 * i); // resends the same invalid request three times
  }
}

// ✅ Automatic retry only for recoverable classes (network, 5xx, 429)
async function fetchWithRetry(url) {
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    if (!isRetryable(res.status)) throw new HttpError(res); // 4xx: fail now, no retry
    await delay(backoff(i, res.headers.get('Retry-After')));
  }
  throw new HttpError(lastResponse);
}

function isRetryable(status) {
  return status >= 500 || status === 429 || status === 0; // 0 = network failure or timeout
}
```

Rule of thumb: an automatic retry solves a **transient** problem — the same action,
tried again, might work. When the error is about the request's content (validation,
permission, a resource that does not exist), repeating changes nothing, and the UI
has to ask the user to act rather than insisting on its own.

## 4. Actionable error messages

An exception's `error.message` is not a UX message. It is an implementation detail
leaking to someone who can do nothing with it.

```
// ❌ A technical exception straight onto the screen
<ErrorState message={error.message} />
// "TypeError: Cannot read properties of undefined (reading 'map')"
// "Request failed with status code 403"

// ✅ Map the technical error to an actionable message; the technical detail goes to the tracker
function toUserMessage(error) {
  if (error.status === 403) return { text: 'Você não tem permissão para ver isso.', action: 'Solicitar acesso' };
  if (error.status === 404) return { text: 'Este item não existe mais.', action: 'Voltar' };
  if (error.status >= 500 || !error.status) return { text: 'Algo deu errado do nosso lado. Tente novamente.', action: 'Tentar novamente' };
  return { text: 'Não foi possível completar a ação.', action: 'Tentar novamente' };
}

reportToTracker(error); // the stack trace stays in observability
<ErrorState {...toUserMessage(error)} />
```

The user-facing strings stay in Portuguese, because the product's users read them.

Every UI error message has three parts:

- **What happened**, in the user's language rather than the exception's. Avoid
  "error 500", "undefined", or the name of an internal function
- **Why, when it helps** — only where it informs the next action: "your session
  expired" rather than a generic "error"
- **What to do now** — a button or link (retry, go back, contact support). Never
  leave the user with text and no way out

A per-field validation error inside a form is not a screen state: it is
`forms-validation`. The same 422 becomes a message beside the field, not an error
screen. This skill covers what fails around the form.

## Checklist

- [ ] Every section rendering external or third-party data has its own boundary, not just the app's top-level one
- [ ] Boundaries report the caught error to the error tracker before showing the fallback
- [ ] Every fetching screen handles loading, empty, error and success explicitly — none implicit
- [ ] Error state and empty state use visually distinct components and messages
- [ ] Automatic retry covers only network, 5xx and 429 errors, with backoff; never a 4xx
- [ ] A 4xx shows corrective action ("fix the field", "request access"), not a retry button that repeats the same error
- [ ] No screen exposes a raw `error.message` or stack trace; everything passes through a message mapper
- [ ] Every error message carries an action — retry, back, support — and never leaves the user stranded
- [ ] Async errors (fetch, timers, callbacks) are converted into state before reaching render; a boundary does not replace that

## By stack

Boundaries, the four states and the message mapper implemented in React, Vue and
Svelte: [references/stacks.md](references/stacks.md).

## Anti-patterns

- ❌ A render error in one card taking down the whole page for want of a boundary
- ❌ A boundary that does not report to the error tracker, so a silent fallback hides the bug
- ❌ A screen covering only the success path, leaving loading, empty and error undefined or crashing
- ❌ Empty state and error state sharing one generic component and message
- ❌ Automatic retry on a 4xx validation or permission error, repeating the same failure
