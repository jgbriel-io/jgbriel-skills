---
name: ci-cd-pipeline
description: Defines standard CI/CD pipeline stages (lint, type-check, test, build), dependency caching, running migrations in CI, and merge-blocking quality gates — stack-agnostic, with GitHub Actions as the default example. Use when user asks about pipeline stages, GitHub Actions workflows, .gitlab-ci.yml, Jenkinsfiles, CI caching, or quality gates for merge.
---

# CI/CD Pipeline — Estágios e Boas Práticas

Conceito de pipeline independe da ferramenta (GitHub Actions, GitLab CI, Jenkins, CircleCI...). O que muda é só a sintaxe do arquivo de configuração.

## Estágios padrão (ordem importa)

```
lint → type-check → test → build → deploy
```

| Estágio | O que verifica | Custo | Se falhar |
|---|---|---|---|
| lint | Estilo, código morto, regras estáticas | Segundos | Bloqueia merge |
| type-check | Tipos (TS, mypy, Go build, javac) | Segundos-baixo | Bloqueia merge |
| test | Unit + integração | Médio | Bloqueia merge |
| build | Compila/empacota artefato de produção | Médio-alto | Bloqueia merge |
| deploy | Publica o artefato | Alto (efeito real) | Requer gate manual em prod |

**Fail-fast**: ordenar do mais barato/rápido pro mais caro. Não faz sentido rodar a suíte de testes (minutos) antes do lint (segundos) — se o lint falha, o resto nem deveria começar. Cada estágio só roda se o anterior passou.

Estágios independentes entre si (ex: lint de backend e lint de frontend num monorepo) rodam em paralelo, não em série.

## Cache de dependências

Sem cache, toda execução reinstala tudo do zero — minutos desperdiçados por run.

- Chave de cache = hash do lockfile (`package-lock.json`, `pnpm-lock.yaml`, `poetry.lock`, `go.sum`, `Gemfile.lock`) + versão da linguagem/runtime.
- Cache muda só quando as dependências mudam — não a cada commit.
- Restaura no início do job, salva no final (só se a instalação teve sucesso).
- Cachear a pasta de dependências resolvidas (`node_modules`, `.venv`, `vendor`, `~/.m2`), nunca o artefato de build final — isso é output do estágio `build`, não input.
- Cache por branch/chave errada trava versões antigas silenciosamente — sempre incluir o lockfile hash na chave, nunca uma chave fixa tipo `cache-v1`.

## Migrations no banco em CI

- **No estágio `test`**: aplicar migrations num banco efêmero (container descartável, ou `supabase start` local, criado e destruído no próprio job) — nunca contra um banco compartilhado ou de outro ambiente.
- **No estágio `deploy`**: migration roda como job separado, antes de subir a nova versão da aplicação, contra o banco real do ambiente-alvo.
- Migrations precisam ser idempotentes e reversíveis (ter down/rollback) — CI não corrige migration quebrada, só expõe.
- Nunca rodar migration de teste contra banco de produção, mesmo "só pra conferir".
- Ambiente de produção: migration destrutiva (drop de coluna/tabela) passa por gate manual, nunca automática mesmo com pipeline verde (ver `safe-migrations`).

## Gates de qualidade (o que bloqueia merge)

Checklist de branch protection / required checks:

- [ ] Lint sem erro (warning pode ou não bloquear — decisão consciente, não default)
- [ ] Type-check sem erro
- [ ] Testes passando — nenhum teste pulado (`.skip`/`xit`) sem justificativa no PR
- [ ] Cobertura não regride abaixo do threshold acordado (se o projeto usa)
- [ ] Build de produção completa sem erro
- [ ] Sem segredo/credencial commitado (scan de secrets)
- [ ] Branch atualizada com a base antes do merge (sem merge de branch desatualizada)

Pipeline verde é pré-requisito pro merge, não sugestão — configurar como **required status check** na branch protegida, não deixar como "recomendado".

## Variáveis e segredos

- Segredo nunca hardcoded no `.yml`/`Jenkinsfile` nem em `.env` commitado — sempre no cofre de secrets da ferramenta de CI (GitHub Actions secrets, GitLab CI protected/masked variables).
- Escopo por ambiente: secret de produção não fica acessível a job rodando em branch de feature.
- Variável de build-time (embutida no bundle, ex: `VITE_*`/`NEXT_PUBLIC_*`) é diferente de secret runtime — nunca colocar chave sensível numa variável que vai pro bundle do client (ver `secrets-management`).

## Artefatos entre estágios

- `build` gera o artefato uma vez; `deploy` reaproveita — nunca rebuildar dentro do job de deploy.
- Artefato tem tempo de vida curto (expira em dias, não fica acumulando storage).
- Matrix/paralelização: mesma suíte de teste rodando em múltiplas versões de runtime ou browsers roda em jobs paralelos, resultado agregado no final.

## Exemplos por stack

### GitHub Actions

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint && npm run type-check

  test:
    needs: lint
    runs-on: ubuntu-latest
    services:
      postgres: { image: postgres:16, ports: ["5432:5432"] }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run migrate:up
      - run: npm test -- --coverage

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci && npm run build
      - uses: actions/upload-artifact@v4
        with: { name: dist, path: dist/, retention-days: 1 }

  deploy_production:
    needs: build
    runs-on: ubuntu-latest
    environment: production   # gate manual via required reviewers no environment
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@v4
        with: { name: dist }
      - run: ./deploy.sh
```

### GitLab CI

```yaml
stages: [lint, test, build, deploy]

.node_cache:
  cache:
    key:
      files: [package-lock.json]
    paths: [node_modules/]

lint:
  stage: lint
  extends: .node_cache
  script: [npm ci, npm run lint, npm run type-check]

test:
  stage: test
  extends: .node_cache
  services: [postgres:16]
  variables:
    DATABASE_URL: postgres://postgres:postgres@postgres:5432/test
  script:
    - npm ci
    - npm run migrate:up
    - npm run test -- --coverage

build:
  stage: build
  script: [npm ci, npm run build]
  artifacts:
    paths: [dist/]
    expire_in: 1 day

deploy_production:
  stage: deploy
  script: [npm run migrate:up:prod, ./deploy.sh]
  environment: production
  when: manual
  only: [main]
```

Python (pytest/mypy/ruff), Go (`go vet`/`go test`/`go build`) ou o próprio wrangler (Cloudflare Workers/Pages, ver skill `wrangler`) entram nos mesmos estágios — só troca o comando dentro do `run`/`script`.

## Anti-patterns

- ❌ Rodar testes antes do lint/type-check (gasta minutos num commit que já falharia em segundos)
- ❌ Cache com chave fixa (não invalida quando o lockfile muda)
- ❌ Migration de teste rodando contra banco compartilhado ou de produção
- ❌ Segredo em variável de ambiente commitada no repo ou hardcoded no pipeline
- ❌ Merge liberado com pipeline vermelho ou com check "recomendado" em vez de obrigatório
- ❌ Rebuildar o artefato dentro do job de deploy em vez de reaproveitar o artifact do estágio `build`
- ❌ Teste pulado (`.skip`/`xit`) mergeado sem justificativa
- ❌ Deploy em produção automático sem gate manual para migration destrutiva
