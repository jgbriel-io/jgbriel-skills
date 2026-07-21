---
name: frontend-conventions
description: Conventions for WRITING new frontend code — component structure, state placement, Tailwind scale, accessibility, file organisation (React + TypeScript + Tailwind + shadcn/ui). Use when creating or refactoring components, when the user asks how to structure frontend code, or when reviewing frontend code against the house checklist. Performance debugging is react-best-practices.
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
