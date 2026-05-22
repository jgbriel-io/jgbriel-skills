---
inclusion: manual
description: Checklist de code review — arquitetura, qualidade, segurança, performance, UI/UX e TypeScript
---

# Code Review — Checklist

## Arquitetura

- [ ] Componente faz apenas UI? Lógica está em hook customizado?
- [ ] Hook usa TanStack Query (ou equivalente) para dados do servidor?
- [ ] Cliente do banco/API chamado apenas em hooks, não em componentes?
- [ ] Sem prop drilling profundo?

## Qualidade

- [ ] Componente tem menos de ~150 linhas?
- [ ] Sem ternários aninhados? (usar early returns)
- [ ] Nomes descritivos? (`isLoading`, `hasError`, `userId`)
- [ ] Sem código morto ou comentado?
- [ ] Sem `console.log` em produção?

## Segurança

- [ ] Inputs validados com schema (Zod, Yup, etc)?
- [ ] Queries filtram pelo ID do usuário autenticado (tenant isolation)?
- [ ] Sem dados sensíveis em logs?
- [ ] Erros do backend tratados (`if (error) throw error`)?
- [ ] RLS/policies habilitadas em novas tabelas?

## Performance

- [ ] Sem barrel imports (`import { X } from '@/components/ui'`)?
- [ ] Sem objetos/arrays criados inline em props?
- [ ] `useEffect` não usado para data fetching?
- [ ] Subscriptions real-time limpas no cleanup?

## UI/UX

- [ ] Cores semânticas (`text-destructive` não `text-red-500`)?
- [ ] Spacing consistente (escala de 4px: `gap-4`, `gap-6`, `gap-8`)?
- [ ] Estados de loading, error e empty tratados?
- [ ] Mensagens de erro localizadas (PT-BR ou idioma do projeto)?
- [ ] Design tokens do projeto usados (quando existir)?

## TypeScript

- [ ] Sem `any` explícito desnecessário?
- [ ] Props tipadas?
- [ ] Tipos do banco/API usados (gerados via codegen)?

## Padrões comuns de problema

```tsx
// ❌ useState + useEffect para data fetching
const [data, setData] = useState();
useEffect(() => { api.fetch().then(setData) }, []);

// ✅ TanStack Query (ou equivalente)
const { data } = useResource(id);
```

```tsx
// ❌ Cor hardcoded
<p className="text-red-500">Erro</p>

// ✅ Semântica
<p className="text-destructive">Erro</p>
```

```tsx
// ❌ Objeto inline (novo ref a cada render)
<List filters={{ status: 'active', userId }} />

// ✅ Memoizar ou extrair
const filters = useMemo(() => ({ status: 'active', userId }), [userId]);
<List filters={filters} />
```
