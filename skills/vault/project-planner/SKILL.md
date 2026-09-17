---
name: project-planner
description: Scaffolds a project's wiki pages in wiki/Projetos/ — index.md with frontmatter, subpage stubs and ADRs — from a direction that is already settled, collecting any missing field first. Use when user says "documenta esse projeto", "cria página do projeto X", "novo projeto no wiki", or wants a project recorded in the vault. Thinking the idea through before it gets written is `discuss`; this is Phase 1 of project-kickoff; for projects with existing docs/ on disk use project-sync.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
disable-model-invocation: true
---

# project-planner

Entrevista o usuário sobre um projeto novo e cria as páginas wiki em `wiki/Projetos/` seguindo a convenção do vault.

## Quando usar

- Usuário descreve ideia de projeto e quer documentar
- Usuário quer criar estrutura wiki para projeto ainda não documentado
- Usuário diz "vamos planejar X", "tenho ideia de Y", "cria projeto Z no wiki"

Não usar quando: projeto tem `docs/` existente em disco → usar `project-sync` em vez disso.

---

## Profundidade adaptável

Dois níveis — decidir pelo estágio do projeto, não perguntar:

| Nível | Quando | O que muda |
|-------|--------|-----------|
| **Mínimo** | Ideia solta, side-project, sem stack definida | Só os tópicos essenciais (Passo 1); index.md enxuto, subpáginas como stub |
| **Completo** | Projeto com arquitetura, stack ou repos existentes | Tópicos essenciais + arquitetura (domínios, papéis de usuário, decisões); decisões relevantes viram ADR |

Sinal para nível completo: usuário menciona stack, repos, módulos, migração, ou decisão arquitetural.

---

## Passo 1 — Insumos

**A conversa é do `discuss`.** Ele constrói a direção uma decisão por vez, com intenção, audiência, cenários, precedentes, opções e fronteiras, e fecha num brief confirmado — é mais fundo do que esta skill precisa fazer sozinha. Se o usuário chegou aqui com um brief do `discuss`, extraia os campos abaixo dele e não pergunte de novo.

Sem brief, colete o que falta você mesmo: o usuário trouxe a info → aceita; não sabe → **sugere** com base no contexto e confirma; quer avançar logo → respeita e marca o resto como `> [!gap]`. Nunca mais de 1–2 perguntas por turno. Para uma ideia ainda crua que precisa ser pensada antes de virar página, mande pro `discuss` primeiro.

### Campos exigidos pelo scaffold (todo projeto)

1. **Nome** — se ainda não foi dito, sugerir baseado na descrição.
2. **Objetivo** — o que resolve / entrega em 1 frase. Sugerir se não estiver claro.
3. **Stack** — perguntar ou sugerir camada a camada (frontend, backend, banco, infra). Sugerir stack comum pro tipo de projeto se o usuário não souber.
4. **Status** — sem código (`seed`), em desenvolvimento (`developing`), em produção (`evergreen`).
5. **Subpáginas** — propor as que fazem sentido pro projeto e confirmar.
6. **Docs/repo em disco?** — perguntar só se parecer projeto já iniciado. Se
   existir (ou estiver planejada) pasta em na pasta de projetos do disco, registrar o
   caminho em `sources:` do frontmatter — é o que o project-sync usa depois.
7. **Fora do escopo (v1)** — o que o projeto NÃO vai fazer na primeira versão.
   Sugerir 2–3 candidatos com base no objetivo (integrações, mobile, admin,
   multi-tenant...) e confirmar. Entregável obrigatório da Fase 1 do
   project-kickoff — sem isso, scope creep entra de graça.

### Tópicos de arquitetura (nível completo — só quando o sinal acima aparecer)

8. **Domínios/módulos** — quais as áreas do sistema e a responsabilidade de cada uma. Se o usuário não pensou nisso, propor divisão a partir do objetivo.
9. **Papéis de usuário** — roles e permissões, se o sistema tiver auth.
10. **Decisões já tomadas** — arquitetura, monorepo vs polyrepo, hosting… Cada decisão relevante e não-óbvia vira **ADR** (ver Passo 3b).

### Confirmar antes de escrever

Com nome, objetivo, stack (mesmo que parcial) e subpáginas em mãos → apresentar resumo final:

```
Resumo antes de criar:

**Nome**: <nome>
**Objetivo**: <frase>
**Stack**: Frontend: X · Backend: Y · Banco: Z · Infra: W
**Status**: seed
**Subpáginas**: Arquitetura · Backend · Frontend · Database
**Fora do escopo (v1)**: A · B · C
[se nível completo] **Domínios**: ... **Papéis de usuário**: ... **Decisões a virar ADR**: ...

Crio os arquivos?
```

Só criar após confirmação explícita. Se o usuário der "sim" / "pode" / "vai" → criar.

---

## Passo 2 — Criar index.md e subpáginas

Frontmatter obrigatório, corpo do index por nível, template de subpágina stub e as
seções que só entram no nível completo:
[references/templates.md](references/templates.md). Escreva na ordem de lá — é o
que faz duas páginas de projeto ficarem comparáveis.

## Passo 4 — Reportar o que foi criado

Após criar os arquivos, listar:

```
Criado:
- wiki/Projetos/<nome>/index.md
- wiki/Projetos/<nome>/architecture/<Nome> - Arquitetura.md
- [se houver] wiki/Projetos/<nome>/architecture/<Nome> - ADR-001-slug.md
- ...

Próximos passos:
- Preencher seções marcadas com > [!gap]
- Se tiver docs no disco, rodar project-sync pra enriquecer
- [se não veio de um brief] Fechar a direção: /discuss · ou pressionar o que já existe: /grill-me
- Fluxo completo (spec → design → implementação): project-kickoff — esta skill foi a Fase 1
```

---

## Convenções do vault (não violar)

- Nunca criar `.md` na raiz do vault
- Alias no frontmatter deve ser único — checar com `Grep` se alias já existe
- `related:` usa aspas duplas: `"[[Nome]]"`, não `[[Nome]]`
- Nome de arquivo: Title Case com espaços (`<Nome> - Backend.md`)
- Nome de pasta: lowercase com hífens (`backend/`, `architecture/`)
- Wikilinks em tabelas: escapar o pipe do display — `[[caminho\|Texto]]` — senão o `|` parte a célula e quebra link e tabela (regra do CLAUDE.md do vault)
