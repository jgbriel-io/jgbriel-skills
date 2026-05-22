---
name: senior-frontend
description: Apply senior frontend standards — React components, state management, Tailwind, accessibility, file organisation. Use when user asks for frontend review, component structure, or Tailwind best practices.
---

# Senior Frontend — Boas Práticas

Stack: React 18 + TypeScript + Vite + Tailwind + shadcn/ui + TanStack Query.

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

## Performance

- Não criar objetos/arrays inline em props
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
