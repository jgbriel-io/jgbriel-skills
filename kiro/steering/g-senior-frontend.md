---
inclusion: fileMatch
fileMatchPattern: ['**/*.tsx', '**/*.ts']
description: Boas práticas React — componentes, estado, performance, Tailwind, acessibilidade e organização de arquivos
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
const StudentCard = ({ student, onEdit }: Props) => {
  if (!student) return null;
  if (student.status === 'inativo') return <InactiveCard />;
  return <ActiveCard student={student} onEdit={onEdit} />;
};
```

## Estado

- `useState` apenas para UI state local (modais, toggles, inputs controlados)
- Server state sempre via TanStack Query — nunca `useState` + `useEffect` para dados
- Evitar estado global desnecessário

## Performance

- Não criar objetos/arrays inline em props
- `useMemo` / `useCallback` só quando há evidência de problema
- Imports diretos, não barrel:

```tsx
// ❌
import { Button, Card, Input } from '@/components/ui'

// ✅
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
```

## Tailwind

- Escala consistente: `gap-4`, `gap-6`, `gap-8` (múltiplos de 4)
- Cores semânticas: `text-destructive` não `text-red-500`
- Responsivo mobile-first: `text-base md:text-lg`
- Design tokens do projeto: `typography()`, `stack()`, `iconSize()`

## Acessibilidade

- `alt` descritivo em imagens
- Botões com texto ou `aria-label`
- Inputs sempre com `label` associado
- Não remover `focus-visible` outline

## Organização

- Um componente por arquivo
- Hooks customizados em `src/hooks/` com prefixo `use`
- Lógica de negócio fora de componentes — sempre em hooks
