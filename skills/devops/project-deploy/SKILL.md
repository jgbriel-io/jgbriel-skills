---
name: project-deploy
description: Executa o deploy de um projeto seguindo o runbook documentado no vault — checklist passo a passo, confirmação antes de ação irreversível, verificação pós-deploy e registro da release. Use quando o usuário disser "publica o site", "sobe pra produção", "faz o deploy", ou nomear o deploy de um projeto dele. Se o runbook não existir, entrevista e cria. Tooling Cloudflare específico é wrangler/cloudflare.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Project Deploy

Deploy guiado por runbook. A fonte de verdade de COMO cada projeto sobe é a
página de deployment dele no vault — esta skill executa, verifica e registra.

## Processo

### 1. Localizar o runbook

- Vault: `wiki/Projetos/<nome>/deployment/<Nome> - Deploy.md`
- Fallback: `D:/Projetos/<caminho>/docs/deployment/`

Se não existir: entrevistar (uma pergunta por vez) e criar a página antes de
executar — onde hospeda, como builda, como sobe (git push / FTP / painel /
wrangler), domínio/DNS, o que verificar depois. Deploy sem runbook escrito é
como o erro entra.

### 2. Pré-deploy

- Working tree limpo? Mudança commitada? (nunca subir estado não versionado)
- Build local passa? (`build` + type-check do projeto)
- Algo no runbook marcado como "antes de subir" (env vars, migrations)?

### 3. Executar o checklist

Seguir o runbook passo a passo, na ordem. Regras:

- **Ação irreversível ou voltada pro público** (apontar DNS, subir pra
  produção, rodar migration em banco de produção) → confirmar com o usuário
  antes, mesmo que o runbook autorize.
- Passo falhou → parar, reportar o erro exato, não improvisar workaround por
  conta própria.

### 4. Verificação pós-deploy

Mínimo, mesmo que o runbook não liste:

- URL de produção responde e renderiza (não só HTTP 200)
- Console do browser sem erro novo
- Cache: mudança visível? (hard refresh / purge se o host cacheia)
- Fluxo crítico do projeto funciona (login, form de contato — o runbook define)

### 5. Registrar a release

Na página de deployment do vault, apender uma linha:

```
| 2026-07-08 | <commit sha curto> | <o que mudou em 1 frase> |
```

Criar a tabela `## Releases` se não existir. Atualizar `updated:` do frontmatter.

## Qual projeto, e onde está o runbook

Cada projeto tem o próprio runbook em `wiki/Projetos/<nome>/deployment/`, no
vault. Resolva o nome pelo mapa em `~/.claude/projects-map.md` — arquivo de
máquina, fora deste repo, o mesmo que `project-sync` lê. Projeto que não estiver
lá: pergunte a hospedagem e o caminho, e ofereça acrescentar a linha.

Nunca escreva o nome de um projeto de cliente aqui: este repositório é público, e
uma tabela de clientes num arquivo versionado é exposição, não conveniência.
