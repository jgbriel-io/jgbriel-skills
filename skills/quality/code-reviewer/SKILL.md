---
name: code-reviewer
description: Stack-specific review checklist for React + TanStack Query + Supabase multi-tenant apps — hook architecture, RLS/tenant isolation, render performance, design tokens, TypeScript. Use when the user wants to validate a feature or PR against the project's stack standards, says "revisa contra o checklist", "valida os padrões do stack", or asks for a React/Supabase code review. Not a general diff reviewer — for diff findings use the built-in /code-review.
---

# Code Review — Stack Checklist

Validate code against the React + TanStack Query + Supabase standards below.
Walk every section; an item only appears in the report when it fails.

## Architecture

- [ ] Component does UI only? Logic lives in a custom hook?
- [ ] Hook uses TanStack Query for server data?
- [ ] Database/API client called only inside hooks, never in components?
- [ ] No deep prop drilling?

## Quality

- [ ] Component under ~150 lines?
- [ ] No nested ternaries? (prefer early returns)
- [ ] Descriptive names? (`isLoading`, `hasError`, `userId`)
- [ ] No dead or commented-out code?
- [ ] No `console.log` shipping to production?

## Security

- [ ] Inputs validated with a schema (Zod, Yup, etc)?
- [ ] Queries filter by the authenticated user's ID (tenant isolation)?
- [ ] No sensitive data in logs?
- [ ] Backend errors handled (`if (error) throw error`)?
- [ ] RLS/policies enabled on new tables?

## Performance

- [ ] No barrel imports (`import { X } from '@/components/ui'`)?
- [ ] No objects/arrays created inline in props?
- [ ] `useEffect` not used for data fetching?
- [ ] Real-time subscriptions cleaned up on unmount?

## UI/UX

- [ ] Semantic colors (`text-destructive`, not `text-red-500`)?
- [ ] Consistent spacing (4px scale: `gap-4`, `gap-6`, `gap-8`)?
- [ ] Loading, error, and empty states handled?
- [ ] Error messages localized?
- [ ] Project design tokens used?

## TypeScript

- [ ] No unnecessary explicit `any`?
- [ ] Props typed?
- [ ] Database/API types used (generated via codegen)?

## Common problem patterns

```tsx
// ❌ useState + useEffect for data fetching
const [data, setData] = useState();
useEffect(() => { api.fetch().then(setData) }, []);

// ✅ TanStack Query
const { data } = useResource(id);
```

```tsx
// ❌ Hardcoded color
<p className="text-red-500">Erro</p>

// ✅ Semantic token
<p className="text-destructive">Erro</p>
```

```tsx
// ❌ Inline object (new ref every render)
<List filters={{ status: 'active', userId }} />

// ✅ Memoize
const filters = useMemo(() => ({ status: 'active', userId }), [userId]);
<List filters={filters} />
```

## Reporting format

List only failed items, grouped by section:

```
## Security
- src/hooks/useOrders.ts:12 — query missing tenant filter — add .eq('user_id', userId)

## Performance
- src/pages/Dashboard.tsx:40 — inline object prop — wrap in useMemo
```

End with a one-line verdict: pass, pass with notes, or needs changes. If every
section passes, say so in one line — no empty section headers.
