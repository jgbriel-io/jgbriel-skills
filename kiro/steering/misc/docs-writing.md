---
inclusion: manual
description: "Technical documentation style guide for README, docs/, ADRs, JSDoc/TSDoc, and inline code comments. Does NOT apply to TCC academic writing."
---

# Estilo de Documentação Técnica

Aplica-se a README, `docs/`, ADRs, guias de uso, JSDoc/TSDoc e comentários longos. Não vale para texto acadêmico (TCC tem regras próprias).

## Estrutura

Ordem típica de um doc:
1. **Título** — uma linha, descreve o quê
2. **Intro** — 1-3 frases, contexto + para quem
3. **Uso / Quick start** — código antes de explicação
4. **Conceitos** — só o necessário pra entender o uso
5. **Referência** — API, opções, flags (se aplicável)
6. **Exemplos** — cenários reais, copia-e-cola
7. **Troubleshooting** — erros comuns + fix

Cortar seções que não agregam.

## Títulos e cabeçalhos

- **Sentence case**, não Title Case: ✅ `## Instalando dependências` ❌ `## Instalando Dependências`
- Um único H1 por arquivo. Hierarquia: H1 → H2 → H3. Não pular níveis.
- Sem pontuação no fim. Cabeçalhos descritivos (`## Configuração do Supabase` > `## Configuração`).

## Voz

- **Imperativa** para instruções: `Run npm install`, não `Você deve rodar npm install`
- **Declarativa** para descrições: `O componente aceita prop opcional onClick`
- Evitar "vamos", "podemos", "iremos".

## Code blocks

- Sempre com language tag: ✅ ` ```ts ` ❌ ` ``` `
- Linguagens: `ts`, `tsx`, `js`, `sh`, `bash`, `powershell`, `sql`, `json`, `yaml`
- Sem `$` no início de comandos
- Comentários em PT-BR, código em inglês

## Referências a código

- Formato `caminho:linha` para localização exata: `src/hooks/useStudents.ts:42`
- Funções/símbolos com backticks: `` `useStudents()` ``
- Caminhos relativos à raiz do repo

## Listas vs prosa

- **Lista** quando 3+ itens sem conexão lógica forte
- **Prosa** quando há causa-efeito ou sequência
- Sem listas de 1 item — virar prosa

## Comentários no código

- Só o **por quê**, não o **o quê**
  - ❌ `// incrementa o contador`
  - ✅ `// Reset diário às 00:00 BRT, não UTC — política do RH`
- Uma linha máximo. TODO com contexto: `// TODO(joao): expirar token em 24h`

## JSDoc / TSDoc

Apenas em APIs públicas ou funções com contrato não óbvio. Não documentar o que TypeScript já infere.

```ts
/**
 * Calcula valor mensal devido por aluno.
 * @param studentId UUID do aluno
 * @throws StudentNotFoundError se aluno não existe
 */
```

## ADRs

Template mínimo (`docs/adr/NNNN-titulo.md`):
```md
# NNNN. Título da decisão

Status: aceita | substituída por XXXX
Data: YYYY-MM-DD

## Contexto
## Decisão
## Consequências
## Alternativas consideradas
```

## Estrutura `docs/`

- `docs/README.md` — sempre (índice/navegação)
- `docs/architecture.md` — camadas, fluxos, decisões macro
- `docs/database.md` — schema, migrations, RLS
- `docs/deployment.md` — CI/CD, infra, ambientes
- `docs/adr/` — Architecture Decision Records

Arquivos em kebab-case. Um tópico por arquivo.

### Domain subfolder pattern

Quando domínio tem 3+ arquivos, virar subpasta com `overview.md` como entry point:

```
docs/
├── README.md              ← índice + status table + quick guide
├── project/overview.md    ← o quê, para quem, stack, status
├── architecture/          ← overview, patterns, decisions, flows, troubleshooting, technical-debt
├── backend/               ← overview, bugs, edge-functions, rpcs, integrations
├── database/              ← overview, schema, migrations, rls
├── security/              ← overview, auth-rls, validations
├── frontend/              ← overview, components, design-tokens, hooks, content
├── git/                   ← overview, workflow, conventions
└── sprints/               ← README, TEMPLATE, historico-completo, sprint-NN-tipo-desc.md
```

Regra: arquivo único até 3+ docs no domínio → então subfolder.

## Sprint documentation

### Nomenclatura

```
sprint-NN-tipo-descricao-kebab.md
```
- `tipo` — `mvp` | `refactor` | `fix`
- Não implementadas: sufixo `-NAO-IMPLEMENTADA.md`

### Seções obrigatórias

Problem Statement → Requirements → Background → Proposed Solution → Task Breakdown → Implementation Details → Files Created → Files Modified → Testing & Validation → Results & Impact → Technical Debt → Lessons Learned → Next Steps → References

### `sprints/README.md`

Status table obrigatória:
```md
| Sprint | Período | Foco | Status | Arquivo |
|--------|---------|------|--------|---------|
```
Seções: histórico por tipo (MVP / Refactor / Fix) + Não Implementadas + Referências.

## Anti-patterns

- Doc desatualizado vs código — se não mantém, deletar
- Doc que só repete o que o código diz — documentar o **por quê**
- Cabeçalhos genéricos: `## Overview`, `## Introduction`, `## Notes`
- Screenshots para info que pode ser texto
