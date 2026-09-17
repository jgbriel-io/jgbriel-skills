# Estrutura da pasta `docs/`

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
