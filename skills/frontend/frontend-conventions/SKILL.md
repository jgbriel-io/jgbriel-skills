---
name: frontend-conventions
description: Conventions for WRITING new frontend code — component structure and extraction, page files that only compose components, UI text centralized in *.content.ts, state placement, Tailwind scale, accessibility, file organisation (React + TypeScript + Tailwind + shadcn/ui). Use when creating or editing any .tsx/.jsx/.vue/.svelte file, when asked where a component, page, or UI string should live, or when reviewing frontend code against the house checklist. Performance debugging is react-best-practices.
---

# Frontend Conventions

Stack: React 18 + TypeScript + Tailwind + shadcn/ui + TanStack Query, on Vite or
Next.js depending on the project.

## Components

- Function components, written as arrow functions
- Around 150 lines at most; extract once it grows past that
- Minimal, clear props, destructured in the signature
- Early returns instead of nested ternaries

```tsx
// ✅
const UserCard = ({ user, onEdit }: Props) => {
  if (!user) return null;
  if (user.status === 'inactive') return <InactiveCard />;
  return <ActiveCard user={user} onEdit={onEdit} />;
};
```

## State

- `useState` only for local UI state: modals, toggles, inputs
- Server state always through TanStack Query, never `useState` plus `useEffect`
- Avoid global state that nothing shares

## UI states

- Every data-bearing screen handles all three: **loading**, **error** and **empty**
- Loading: a skeleton shaped like the final layout, not a generic spinner
- Error: a clear, localised message, inline in forms
- Empty: composed on purpose, showing how to populate it
- The depth is in `error-ux`, the skill dedicated to screen states — four states
  including success, plus retry and error boundaries

## Performance

- No inline objects or arrays in props; each render creates a new reference:

```tsx
// ❌
<List filters={{ status: 'active', userId }} />

// ✅
const filters = useMemo(() => ({ status: 'active', userId }), [userId]);
<List filters={filters} />
```

- `useMemo`/`useCallback` only with evidence of a problem
- Direct imports, never barrels:

```tsx
// ❌
import { Button, Card } from '@/components/ui'

// ✅
import { Button } from '@/components/ui/button'
```

## Tailwind

- A consistent scale: `gap-4`, `gap-6`, `gap-8` — multiples of 4
- Semantic colours: `text-destructive`, not `text-red-500`
- Mobile-first responsiveness: `text-base md:text-lg`
- The project's design tokens where they exist

## Accessibility

The floor every new component meets. Auditing what already exists — axe in CI,
keyboard navigation, contrast, screen readers — is `accessibility-audit`.

- Descriptive `alt` on images
- Buttons carry text or an `aria-label`
- Inputs always have an associated `label`
- Never remove the `focus-visible` outline

## Organisation

- One component per file
- Custom hooks in `src/hooks/`, prefixed `use`
- Business logic outside components, in hooks

## Pages only compose

- A page or route file (`app/**/page.tsx`, `pages/*.tsx`, `routes/*.tsx`) **only
  imports and composes components**: no raw JSX beyond structural wrappers
  (`<div>`, `<Suspense>`, a layout grid), no business logic, no direct fetching, no
  loose UI strings.
- A page orchestrates, a component presents, a hook holds logic and state. Once the
  page grows beyond composition and prop wiring, extract.
- **Scope:** new pages are born this way. A fat legacy page is not a refactor
  target during an unrelated fix — note it as a follow-up and move on.

```tsx
// ❌ — real JSX and a loose string inside the page
export default function CheckoutPage() {
  const { data } = useQuery(...);
  return (
    <div>
      <h1>Finalizar compra</h1>
      {data.items.map(i => <div key={i.id}>{i.name}</div>)}
    </div>
  );
}

// ✅ — the page only composes
export default function CheckoutPage() {
  return (
    <PageLayout>
      <CheckoutSummary />
      <CheckoutForm />
    </PageLayout>
  );
}
```

## UI copy

- Every string the user sees — headings, labels, messages, CTAs, placeholders,
  error copy — is centralised in `<page-or-feature>.content.ts`, one file per page
  or feature, exporting a typed const.
- Components import from there. Never a loose literal in JSX, except for dynamic
  values coming from data (`user.name`, a count).
- Why: copy can be reviewed without opening a component, and i18n later needs no
  refactor.
- **Scope:** applies to new code, and to files that already have a `.content.ts` or
  i18n. In a legacy file full of loose strings, **do not migrate along the way**
  during an unrelated fix — mention it as a follow-up. Legacy migration happens
  when the user asks for it.

The copy itself stays in Portuguese, because the product's users read it.

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

## Review checklist

- [ ] Does the component do only UI, with logic in a custom hook?
- [ ] Is it under about 150 lines?
- [ ] No nested ternaries (early returns instead)?
- [ ] Descriptive names (`isLoading`, `hasError`, `userId`)?
- [ ] No dead code, commented-out blocks or `console.log`?
- [ ] Loading, error and empty states handled?
- [ ] Semantic colours rather than hardcoded ones?
- [ ] No barrel imports?
- [ ] No inline objects or arrays in props?
- [ ] `useEffect` not used for data fetching?
- [ ] Props typed, with no unnecessary `any`?
- [ ] The page only composes components — no raw JSX, logic or fetching?
- [ ] UI copy coming from `*.content.ts` rather than loose strings in JSX?
