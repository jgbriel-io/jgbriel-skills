---
name: frontend-conventions
description: Conventions for WRITING new frontend code — component structure and extraction, page files that only compose components, UI text centralized in *.content.ts, state placement, Tailwind scale, accessibility, file organisation (React + TypeScript + Tailwind + shadcn/ui). Use when creating or editing any .tsx/.jsx/.vue/.svelte file, when asked where a component, page, or UI string should live, or when reviewing frontend code against the house checklist. Performance debugging is react-best-practices.
---

# Senior Frontend — Boas Práticas

Stack: React 18 + TypeScript + Tailwind + shadcn/ui + TanStack Query (Vite ou Next.js, conforme o projeto).

## Componentes

- Functional components com arrow functions
- Máximo ~150 linhas — extrair se crescer
- Props mínimas e claras, desestruturadas na assinatura
- Early returns para evitar ternários aninhados

```tsx
// ✅
const UserCard = ({ user, onEdit }: Props) => {
  if (!user) return null;
  if (user.status === 'inactive') return <InactiveCard />;
  return <ActiveCard user={user} onEdit={onEdit} />;
};
```

## Estado

- `useState` apenas para UI state local (modais, toggles, inputs)
- Server state sempre via TanStack Query — nunca `useState` + `useEffect` para dados
- Evitar estado global desnecessário

## Estados de UI

- Toda tela com dados trata os três estados: **loading**, **error** e **empty**
- Loading: skeleton com o shape do layout final, não spinner genérico
- Error: mensagem clara e localizada, inline em forms
- Empty: composto de propósito, indicando como popular
- Aprofundamento em `error-ux` — skill dedicada aos estados de tela (4 estados incluindo success, retry e error boundaries)

## Performance

- Não criar objetos/arrays inline em props (novo ref a cada render):

```tsx
// ❌
<List filters={{ status: 'active', userId }} />

// ✅
const filters = useMemo(() => ({ status: 'active', userId }), [userId]);
<List filters={filters} />
```

- `useMemo`/`useCallback` só com evidência de problema
- Imports diretos, não barrel:

```tsx
// ❌
import { Button, Card } from '@/components/ui'

// ✅
import { Button } from '@/components/ui/button'
```

## Tailwind

- Escala consistente: `gap-4`, `gap-6`, `gap-8` (múltiplos de 4)
- Cores semânticas: `text-destructive` não `text-red-500`
- Responsivo mobile-first: `text-base md:text-lg`
- Design tokens do projeto quando disponível

## Acessibilidade

- `alt` descritivo em imagens
- Botões com texto ou `aria-label`
- Inputs sempre com `label` associado
- Não remover `focus-visible` outline

## Organização

- Um componente por arquivo
- Hooks customizados em `src/hooks/` com prefixo `use`
- Lógica de negócio fora de componentes — em hooks

## Páginas só compõem

- Arquivo de página/rota (`app/**/page.tsx`, `pages/*.tsx`, `routes/*.tsx`)
  **só importa e compõe componentes** — sem JSX cru além de wrappers
  estruturais (`<div>`, `<Suspense>`, layout grid), sem lógica de negócio,
  sem fetch direto, sem string de UI solta.
- Página = orquestração. Componente = apresentação. Hook = lógica/estado.
  Se a página cresce além de composição + wiring de props, extrair.
- **Escopo:** página nova nasce assim. Página legada gorda não vira alvo de
  refactor durante um fix pontual — apontar como follow-up e seguir.

```tsx
// ❌ — JSX de verdade e string solta dentro da página
export default function CheckoutPage() {
  const { data } = useQuery(...);
  return (
    <div>
      <h1>Finalizar compra</h1>
      {data.items.map(i => <div key={i.id}>{i.name}</div>)}
    </div>
  );
}

// ✅ — página só compõe
export default function CheckoutPage() {
  return (
    <PageLayout>
      <CheckoutSummary />
      <CheckoutForm />
    </PageLayout>
  );
}
```

## Conteúdo de UI (texto)

- Todo texto visível ao usuário (heading, label, mensagem, CTA, placeholder,
  copy de erro) fica centralizado em `<page-ou-feature>.content.ts`, um
  arquivo por página/feature, exportando const tipada.
- Componente importa de lá — nunca string literal solta em JSX, exceto
  valor dinâmico vindo de dado (`user.name`, contagem, etc).
- Motivo: revisão de copy sem abrir componente, terreno pronto pra
  i18n sem refactor futuro.
- **Escopo:** vale para código novo (componente/página criada agora) e para
  arquivo que já tem `.content.ts` ou i18n. Em arquivo legado com string
  solta, **não migrar de carona** num fix pontual — mencionar como
  follow-up e seguir. Migração de legado só quando o usuário pedir.

```tsx
// checkout.content.ts
export const checkoutContent = {
  title: 'Finalizar compra',
  emptyCart: 'Seu carrinho está vazio',
  submitCta: 'Confirmar pedido',
} as const;

// CheckoutSummary.tsx
import { checkoutContent } from './checkout.content';
const CheckoutSummary = () => <h1>{checkoutContent.title}</h1>;
```

## Checklist de review

Ao revisar frontend, verificar:

- [ ] Componente faz apenas UI? Lógica em hook customizado?
- [ ] Componente tem menos de ~150 linhas?
- [ ] Sem ternários aninhados (early returns)?
- [ ] Nomes descritivos (`isLoading`, `hasError`, `userId`)?
- [ ] Sem código morto, comentado, ou `console.log`?
- [ ] Estados de loading, error e empty tratados?
- [ ] Cores semânticas, não hardcoded?
- [ ] Sem barrel imports?
- [ ] Sem objetos/arrays inline em props?
- [ ] `useEffect` não usado para data fetching?
- [ ] Props tipadas, sem `any` desnecessário?
- [ ] Página só compõe componentes (sem JSX cru, sem lógica, sem fetch)?
- [ ] Texto de UI vem de `*.content.ts`, não string solta em JSX?
