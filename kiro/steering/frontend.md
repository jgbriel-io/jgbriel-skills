# Frontend / UI

- Mudanças visuais exigem **teste real no navegador**. Subir dev server, abrir a feature, validar happy path + ao menos 1 edge case.
- `tsc --noEmit` ou test suite verifica correção de código, **não** correção da feature. Se não der pra testar manualmente, dizer.
- Não criar abstrações para componente de uso único.
- Reutilizar antes de criar — verificar `src/components/ui/` (shadcn) e componentes de domínio.
- Design tokens > Tailwind cru quando o projeto tem (`typography()`, `stack()`, `iconSize()`).
- Cores semânticas (`text-destructive`) > hardcoded (`text-red-500`).
