---
name: project-kickoff
description: Orchestrates the full workflow for starting a project from scratch — idea to production-ready spec, design system, and implementation plan. Runs 5 phases in order: ideation, spec, design, implementation, maintenance. Invokes project-planner, grill-me, domain-modeling, design-direction, setup-pre-commit, and project-sync at the right moment. Use when user says "novo projeto", "vou começar um projeto", "quero criar X do zero", "fluxo completo de projeto", "como começo o projeto X", or starts describing a project idea and wants to build it properly without rework.
---

# project-kickoff

Guia o usuário pelo fluxo completo de criação de projeto, fase por fase, garantindo que nada seja pulado. Foco em evitar retrabalho — as decisões que mais custam (design system, schema, escopo) são tomadas antes de escrever código.

---

## Fase 1 — Ideação & Escopo

**Objetivo:** entender o que é o projeto e o que NÃO é.

1. Invocar `/project-planner` para capturar a ideia conversacionalmente e criar o wiki em `wiki/Projetos/<nome>/`.
   - Ao final do planner, o index.md e stubs das subpáginas já existem.

2. Após o planner, invocar `/grill-me` para stress-test da ideia:
   - Quem é o usuário real? Como chega ao produto?
   - Como monetiza? O modelo sustenta?
   - O que pode dar errado na v1?
   - Qual o diferencial concreto vs. o que já existe?

3. **Definir fora do escopo explicitamente** — criar seção `## Fora do escopo (v1)` no index.md com lista em texto (sem emoji — regra do vault). Isso evita scope creep durante o desenvolvimento.

**Entregáveis da Fase 1:**
- `wiki/Projetos/<nome>/index.md` completo
- Fora do escopo documentado
- Ideia stress-testada

---

## Fase 2 — Spec

**Objetivo:** documentar o que o sistema deve fazer antes de qualquer código.

Criar `wiki/Projetos/<nome>/<Nome> - Spec.md` cobrindo:

### 2.1 Requisitos funcionais
Lista de comportamentos que o sistema DEVE ter. Formato de checkbox:
```markdown
- [ ] Usuário pode fazer X sem login
- [ ] Ao finalizar Y, sistema faz Z automaticamente
```

### 2.2 Requisitos não-funcionais
Performance, SEO, acessibilidade, LGPD, segurança, mobile-first. Sempre incluir LGPD se produto coleta dados de usuário.

### 2.3 Mapa de rotas
Tabela com todas as URLs, tipo (SSR vs estático) e o que renderiza. Não deixar rotas implícitas — nomear tudo.

### 2.4 Fluxos UX por tela
Para cada rota principal: o que o usuário vê, o que faz, o que acontece. 3–5 bullets por tela. Não wireframe — prose de intenção.

### 2.5 Motor de negócio
A lógica central do produto (scoring, cálculo, regras de negócio). Se tem algoritmo, documentar em pseudocódigo ou TypeScript antes de implementar.

### 2.6 Inventário de componentes
Lista de componentes Astro/React/Vue que existirão. Ajuda a ver duplicações antes de criar.

### 2.7 Invocar `/domain-modeling`
Para fixar terminologia antes de nomear variáveis, rotas, tabelas e tipos. Nomes inconsistentes geram refatoração.

**Entregáveis da Fase 2:**
- `<Nome> - Spec.md` completo
- Terminologia fixada pelo domain-modeling

---

## Fase 3 — Design

**Objetivo:** definir a identidade visual ANTES de escrever frontend.

Mudar design system depois = refatorar CSS do projeto inteiro.

### 3.1 Direção visual
Perguntar ao usuário:
- Qual estética? (ex: clean/minimalista, quente/aconchegante, escuro/premium, editorial, etc.)
- Referências visuais (sites, apps, marcas)
- Público e tom (jovem/formal, feminino/neutro, tech/popular)

### 3.2 Invocar design skill
- `/design-direction` — para landing pages e sites de conteúdo
- `/high-end-visual-design` — para produtos premium
- `/minimalist-ui` — para interfaces editoriais e clean

### 3.3 Documentar design tokens
Criar seção `## Design system` no Spec (ou arquivo separado) com:

```css
:root {
  --color-primary: ;
  --color-background: ;
  --color-surface: ;
  --color-text: ;
  --color-text-muted: ;
  --font-heading: ;
  --font-body: ;
  --radius-card: ;
}
```

**Entregáveis da Fase 3:**
- Design tokens definidos
- Direção visual documentada no wiki

---

## Fase 4 — Implementação

**Objetivo:** codar com fundação sólida, feature por feature.

### 4.1 Scaffold + qualidade desde o dia 1
```bash
# scaffold do projeto (Next, Astro, etc.)
# depois:
```
Invocar `/setup-pre-commit` — lint, type-check e testes no pre-commit. Não deixar para depois.

### 4.2 Ordem de implementação
1. **Schema do banco primeiro** — migrations mudam e quebram tudo. Definir antes de criar qualquer query.
2. **Types/domain layer** — interfaces TypeScript que modelam o domínio. Sem UI ainda.
3. **Feature por feature end-to-end** — uma rota funcionando completamente antes de partir para a próxima. Não fazer todas as rotas em paralelo.
4. **Edge cases por último** — MVP funcionando > casos raros tratados.

### 4.3 Skills durante implementação
- `/supabase-hooks` — hooks, mutations, queries Supabase/TanStack
- `/supabase-postgres` — schema, RLS, índices, migrations
- `/react-best-practices` — performance, bundle, re-renders
- `/tdd` — quando feature tem lógica complexa

**Entregáveis da Fase 4:**
- Projeto rodando localmente
- Pre-commit configurado
- Schema de banco em migrations versionadas

---

## Fase 5 — Manutenção

**Objetivo:** manter o wiki em sync com o código real.

- Invocar `/project-sync` sempre que docs do projeto em `D:/Projetos/<nome>/docs/` forem atualizadas.
- Atualizar `status:` no frontmatter do index.md conforme projeto avança (`seed` → `developing` → `evergreen`).
- Registrar decisões arquiteturais não óbvias no wiki (por que mudou de X para Y).

---

## Checklist de fases

```
Fase 1 — Ideação
  [ ] /project-planner executado — wiki stub criado
  [ ] /grill-me feito — ideia stress-testada
  [ ] Fora do escopo documentado no index.md

Fase 2 — Spec
  [ ] Requisitos funcionais (checkboxes)
  [ ] Requisitos não-funcionais
  [ ] Mapa de rotas completo
  [ ] Fluxos UX por tela
  [ ] Motor de negócio documentado
  [ ] /domain-modeling feito — terminologia fixada

Fase 3 — Design
  [ ] Direção visual definida
  [ ] Design tokens documentados
  [ ] Design skill invocada

Fase 4 — Implementação
  [ ] /setup-pre-commit configurado
  [ ] Schema do banco definido antes de queries
  [ ] Feature por feature, end-to-end

Fase 5 — Manutenção
  [ ] /project-sync configurado
  [ ] status: atualizado no wiki
```

---

## O que mais gera retrabalho (por ordem)

1. Design system definido tarde — refatora CSS do projeto inteiro
2. Schema sem pensar nos fluxos — migrations que quebram tudo
3. Fora do escopo não definido — scope creep constante
4. Terminologia inconsistente — refatora types, variáveis, rotas

---

## Quando pular fases

- Projeto de 1 dia / throwaway → pular Fase 3 e 5
- Projeto sem UI → pular Fase 3
- Projeto com docs existentes em `D:/Projetos/` → substituir Fase 1 por `/project-sync`
- Refatoração de projeto existente → começar da Fase 4, usar `/project-sync` para atualizar wiki
