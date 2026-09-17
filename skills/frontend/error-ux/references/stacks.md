# Exemplos por stack

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
