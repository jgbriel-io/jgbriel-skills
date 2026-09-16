---
name: docs-writing
description: Technical documentation style guide for README, docs/, ADRs, JSDoc/TSDoc, and inline code comments. Use when writing or reviewing technical documentation, READMEs, API docs, architecture decision records, or any non-academic prose in the codebase. Does NOT apply to TCC academic writing (separate skill).
---

# Estilo de Documentação Técnica

Aplica-se a README, `docs/`, ADRs, guias de uso, JSDoc/TSDoc e comentários longos. Não vale para texto acadêmico (TCC tem regras próprias).

## Estrutura

Ordem típica de um doc:
1. **Título** — uma linha, descreve o quê.
2. **Intro** — 1-3 frases, contexto + para quem.
3. **Uso / Quick start** — código antes de explicação.
4. **Conceitos** — só o necessário pra entender o uso.
5. **Referência** — API, opções, flags (se aplicável).
6. **Exemplos** — cenários reais, copia-e-cola.
7. **Troubleshooting** — erros comuns + fix.

Não obrigar todas as seções. Cortar o que não agrega.

## Títulos e Cabeçalhos

- **Sentence case**, não Title Case.
  - ✅ `## Instalando dependências`
  - ❌ `## Instalando Dependências`
- **Um único H1** por arquivo (o título).
- Hierarquia: H1 → H2 (seções) → H3 (subseções). Não pular níveis.
- Sem pontuação no fim do cabeçalho.
- Cabeçalhos descritivos, não genéricos (`## Configuração do Supabase` > `## Configuração`).

## Voz

- **Imperativa** para instruções:
  - ✅ `Run npm install` / `Rode npm install`
  - ❌ `You should run npm install` / `Você deve rodar npm install`
- **Declarativa** para descrições:
  - ✅ `O componente aceita uma prop opcional onClick`
  - ❌ `Você pode passar uma prop opcional onClick`
- Evitar "vamos", "podemos", "iremos". Vai direto ao ponto.

## Code Blocks

- **Sempre** com language tag, mesmo trechos curtos:
  - ✅ ` ```ts `
  - ❌ ` ``` ` (sem tag)
- Linguagens comuns: `ts`, `tsx`, `js`, `jsx`, `sh`, `bash`, `powershell`, `sql`, `json`, `yaml`, `md`, `diff`.
- Para comandos shell, usar `bash` ou `powershell` conforme contexto. Não misturar.
- Sem `$` no início de comandos (`npm install`, não `$ npm install`).
- Comentários no código em PT-BR (escopo do projeto), código em inglês.

## Referências a Código

- Sempre formato `caminho:linha` para apontar localização exata:
  - ✅ `Veja src/hooks/useStudents.ts:42`
  - ❌ `Veja o hook useStudents`
- Para função/símbolo, usar backticks: `` `useStudents()` ``.
- Caminhos relativos à raiz do repo, não absolutos.

## Listas vs Prosa

- **Lista** quando há 3+ itens enumeráveis sem conexão lógica forte.
- **Prosa** quando os itens têm conexão narrativa (causa-efeito, sequência).
- Listas sem fim — sem ponto final no item, exceto se for frase completa.
- Sem listas de 1 item — virar prosa.

## Exemplos

- **Antes da regra** para conceitos óbvios pelo exemplo.
- **Depois da regra** para conceitos abstratos que precisam de motivação.
- Exemplos sempre executáveis ou copia-e-cola. Sem `// ...` no meio sem contexto.
- Mostrar o erro junto da solução quando for fix:
  ```ts
  // ❌
  useEffect(() => fetchData(), []);
  
  // ✅
  const { data } = useQuery({ queryKey: ['data'], queryFn: fetchData });
  ```

## Line Wrapping

- Quebrar linhas em ~100 caracteres em prosa.
- Não quebrar code blocks (deixar scroll horizontal se preciso).
- Tabelas: sem wrap, mesmo que largas.

## Links

- **Inline** para links curtos e contextuais: `[shadcn/ui](https://ui.shadcn.com)`.
- **Reference** para links repetidos ou longos:
  ```md
  Ver [docs do Supabase][supabase-docs].

  [supabase-docs]: https://supabase.com/docs
  ```
- Link descritivo, não "clique aqui" / "veja link":
  - ✅ `Ver [guia de migração](./MIGRATION.md)`
  - ❌ `Veja [aqui](./MIGRATION.md)`

## Tabelas

Usar quando há comparação multi-coluna. Não para listas simples (2 colunas só faz sentido se a segunda agrega info, não repete).

```md
| Componente | Quando usar | Exemplo |
|------------|-------------|---------|
| `Dialog`   | Forms       | `StudentDialog` |
| `Sheet`    | Lateral     | `StudentDetailSheet` |
```

## Comentários no Código

- Apenas o **por quê**, não o **o quê**. Código bem nomeado explica o quê.
  - ❌ `// incrementa o contador`
  - ✅ `// Reset diário às 00:00 BRT, não UTC — política do RH`
- Uma linha máximo. Se precisar mais, vira doc separado.
- Sem comentários óbvios (`// imports`, `// helper functions`).
- TODO/FIXME com contexto e responsável: `// TODO(joao): expirar token em 24h após validação de RFC`.

## JSDoc / TSDoc

- Apenas em APIs públicas (lib expostas) ou funções com contrato não óbvio.
- Não documentar tipos que TypeScript já infere.
- Estrutura:
  ```ts
  /**
   * Calcula valor mensal devido por aluno.
   * @param studentId UUID do aluno
   * @param month YYYY-MM
   * @throws StudentNotFoundError se aluno não existe ou foi soft-deleted
   */
  ```

## ADRs (Architecture Decision Records)

Quando criar um ADR:
- Decisão arquitetural não óbvia (escolha de lib, padrão, infra).
- Trade-off explícito que pode ser questionado depois.

Template mínimo (`docs/adr/NNNN-titulo.md`):
```md
# NNNN. Título da decisão

Status: aceita | substituída por XXXX | depreciada
Data: YYYY-MM-DD

## Contexto
Qual problema motivou a decisão.

## Decisão
O que foi decidido.

## Consequências
Boas, ruins, riscos aceitos.

## Alternativas consideradas
Por que foram descartadas.
```

## Estrutura da pasta `docs/`

Todo projeto tem `docs/` na raiz. Estrutura padrão tiered.

### Tier 1 — Sempre

- `docs/README.md` — índice/navegação. Links pros outros docs, status, last update.

### Tier 2 — Quando aplicável

- `docs/architecture.md` — camadas, diagramas, fluxos principais, decisões macro.
- `docs/database.md` — schema, migrations, índices, views, RLS (se houver banco).
- `docs/deployment.md` — CI/CD, infra, ambientes (se deploy automatizado).

### Tier 3 — Opcional (projetos grandes ou em equipe)

- `docs/frontend.md` — stack UI, padrões, design system.
- `docs/backend.md` — APIs, services, integrações externas.
- `docs/security.md` — auth, RLS, secrets policy, LGPD/GDPR.
- `docs/adr/NNNN-titulo.md` — Architecture Decision Records.
- `docs/runbooks/*.md` — playbooks operacionais (deploy rollback, incident response).

### Convenções de pasta

- Arquivos em **kebab-case** minúsculo (`deployment.md`, não `Deployment.md`).
- Um tópico por arquivo. Não misturar (database em `architecture.md` polui).
- Diagramas inline (Mermaid no markdown) ou em `docs/diagrams/`.
- Schemas grandes em `docs/schemas/` (SQL, JSON Schema, OpenAPI).
- README do projeto na **raiz** linka pra `docs/README.md` quando existe.

### Template `docs/README.md`

````md
# Documentação — <Nome do Projeto>

## Índice

- [Arquitetura](./architecture.md) — camadas, fluxos
- [Banco de Dados](./database.md) — schema, migrations
- [Deploy](./deployment.md) — CI/CD, ambientes
- [ADRs](./adr/) — decisões arquiteturais

## Status

| Doc              | Última revisão | Status        |
|------------------|----------------|---------------|
| architecture.md  | YYYY-MM-DD     | ✅ atualizada |
| database.md      | YYYY-MM-DD     | 🟠 parcial    |
| deployment.md    | YYYY-MM-DD     | 🔴 pendente   |
````

### Anti-patterns de estrutura

- ❌ `docs/notes/`, `docs/misc/`, `docs/tmp/` — pasta despejo, vira lixo.
- ❌ Arquivo único `docs/everything.md` com tudo dentro.
- ❌ Espelhar 1:1 estrutura do código em `docs/` (`docs/src/components/...`) — código já é a doc.
- ❌ Versionar PDFs gerados — versionar fonte (`.md`, `.tex`).
- ❌ Pasta `docs/` sem `README.md` — ninguém sabe por onde começar.

### Domain subfolder pattern (projetos com múltiplos docs por domínio)

Quando um domínio tem 3+ arquivos, virar subpasta. Cada subpasta tem `overview.md` como entry point.

```
docs/
├── README.md                  ← índice + status table + quick guide
├── project/
│   └── overview.md            ← o quê, para quem, problema, stack, status
├── architecture/
│   ├── overview.md            ← entry point obrigatório
│   ├── patterns.md
│   ├── decisions.md           ← ADRs
│   ├── flows.md
│   ├── troubleshooting.md
│   └── technical-debt.md
├── backend/
│   ├── overview.md
│   ├── bugs.md
│   └── ...
├── database/
│   ├── overview.md
│   ├── schema.md
│   ├── migrations.md
│   └── rls.md
├── security/
│   ├── overview.md
│   └── ...
├── frontend/
│   ├── overview.md
│   ├── components.md
│   ├── design-tokens.md
│   └── hooks.md
├── git/
│   ├── overview.md
│   ├── workflow.md
│   └── conventions.md
└── sprints/
    ├── README.md              ← índice com status table
    ├── TEMPLATE.md
    ├── historico-completo.md
    └── sprint-NN-tipo-descricao.md
```

Regras:
- Usar arquivo único (Tier 2) até um domínio precisar de 3+ docs — só então subfolder.
- Todo `README.md` de `docs/` inclui: links por domínio, status table (domínio | arquivos | status), quick guide (comandos, stack, convenções).

---

## Sprint documentation

### Nomenclatura

```
sprint-NN-tipo-descricao-kebab.md
```

- `NN` — número com zero à esquerda: `01`, `12`
- `tipo` — `mvp` | `refactor` | `fix`
- Não implementadas: `sprint-NN-tipo-descricao-NAO-IMPLEMENTADA.md`

### Seções obrigatórias

| Seção | Conteúdo |
|-------|----------|
| **Problem Statement** | Estado atual, sintomas, impacto, quantificação |
| **Requirements** | Requisitos funcionais, não-funcionais, critérios de aceitação, fora do escopo |
| **Background** | Stack envolvido, arquitetura relevante, padrões do projeto, arquivos afetados |
| **Proposed Solution** | Abordagem, estrutura de pastas, padrões, por que foi escolhida |
| **Task Breakdown** | Tasks com objetivo, implementação, arquivos afetados, teste, demo |
| **Implementation Details** | Tabelas por categoria (migrations, components, hooks) |
| **Files Created** | Árvore de arquivos com descrição breve |
| **Files Modified** | Lista `caminho` — o que mudou e por quê |
| **Testing & Validation** | Checklist: build, type-check, lint, testes, teste manual |
| **Results & Impact** | Métricas quantitativas + melhorias qualitativas |
| **Technical Debt** | Itens identificados mas não resolvidos, com justificativa |
| **Lessons Learned** | O que funcionou, o que melhorar, aplicações futuras |
| **Next Steps** | Próximas ações + sprint sugerida |
| **References** | Links para issues, PRs, ADRs, docs relacionados |

### `sprints/README.md`

Status table obrigatória:

```md
| Sprint | Período | Foco | Status | Arquivo |
|--------|---------|------|--------|---------|
| Sprint 1 | DD–DD mês YYYY | Descrição | ✅ Implementada | [sprint-01](./sprint-01-...) |
| Sprint N | — | Descrição | ❌ Não implementada | [sprint-N](./sprint-N-...) |
```

Seções: Histórico por tipo (MVP / Refactor / Fix) + Não Implementadas + Referências.

## Anti-patterns

- ❌ Doc desatualizado vs código. Se não mantém, deletar.
- ❌ Doc que só repete o que o código diz. Documentar o **por quê**.
- ❌ "TODO: documentar isso depois" em README publicado.
- ❌ Screenshots para info que pode ser texto (texto é versionável, screenshot apodrece).
- ❌ Cabeçalhos genéricos: `## Overview`, `## Introduction`, `## Notes`.
- ❌ Listas aninhadas com 3+ níveis. Repensar estrutura.
- ❌ Documentar bug como feature ("o componente às vezes renderiza duas vezes — basta ignorar").
