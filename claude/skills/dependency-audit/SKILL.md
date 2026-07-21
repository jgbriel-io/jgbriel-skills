---
name: dependency-audit
description: Audits third-party dependencies for security and maintainability — lockfile discipline, upgrade cadence (automatic patch vs. manual minor/major), evaluating a new package before adding it, and automated vulnerability scanning in CI. Package-manager-agnostic. Use when user asks about lockfiles, dependency upgrades, adding a new dependency, npm audit, pip-audit, Dependabot, Snyk, or CVE scanning.
---

# Auditoria de Dependências

Toda dependência de terceiro é código que roda com a mesma confiança que o seu — vulnerabilidade, dependência abandonada ou licença incompatível viram problema seu, não do mantenedor upstream. O conceito é o mesmo em qualquer gerenciador (npm, pnpm, pip, Maven, Bundler, NuGet); muda só o comando.

## Lockfile: por que sempre commitar

| Sem lockfile | Com lockfile commitado |
|---|---|
| Cada `install` pode resolver versões diferentes das transitivas | Toda instalação resolve exatamente a mesma árvore de dependências |
| Bug/CVE novo em transitiva entra silenciosamente no próximo install | Só entra quando alguém atualiza o lockfile de propósito |
| Build de hoje ≠ build de amanhã com o mesmo `package.json`/`requirements.txt` | Reprodutibilidade: mesmo manifesto + mesmo lockfile = mesma árvore, sempre |
| Impossível auditar "o que realmente está rodando em produção" | Lockfile é a fonte de verdade do que está instalado, não o manifesto |

- Lockfile é código, não artefato de build — vai pro Git (`package-lock.json`, `pnpm-lock.yaml`, `poetry.lock`/`Pipfile.lock`, `Gemfile.lock`, `packages.lock.json`). Nunca no `.gitignore`.
- Instalação em CI/produção usa o comando que **respeita** o lockfile e falha se ele estiver desatualizado em relação ao manifesto (`npm ci`, não `npm install`) — nunca deixar o CI resolver versões novas por conta própria.
- Manifesto (`package.json`, `pyproject.toml`, `pom.xml`, `Gemfile`, `.csproj`) declara faixas de versão aceitáveis; lockfile trava a versão exata resolvida. Os dois são commitados, os dois têm papel diferente.
- Conflito de lockfile em merge não se resolve editando o arquivo à mão — resolve o manifesto e regenera o lockfile.

## Política de upgrade

| Tipo de mudança | Automação | Cadência |
|---|---|---|
| Patch (`x.y.Z`) — bugfix, sem API nova | Automática (bot ou job agendado), merge direto se CI verde | Contínua |
| Minor (`x.Y.0`) — feature nova, retrocompatível | PR automático, revisão humana antes do merge | Semanal/quinzenal |
| Major (`X.0.0`) — breaking change | Manual, dedicado, com changelog lido e testes de regressão | Planejado, com tempo reservado |

- Patch automático só é seguro com suíte de teste real cobrindo o caminho crítico — sem teste, todo upgrade é um salto no escuro, patch ou não.
- Minor/major nunca em lote silencioso: um PR por dependência (ou por grupo relacionado) — upgrade em massa sem isolamento torna impossível saber qual pacote quebrou o quê.
- Dependência presa numa versão antiga por "medo de quebrar" acumula dívida de segurança — CVE não corrigido em versão antiga não desaparece, só fica invisível até virar incidente.
- Congelar upgrade é decisão explícita e documentada (ex: incompatibilidade conhecida com outra lib), não default por inércia.

## Avaliando pacote novo antes de adicionar

Antes de rodar o `install`, checar:

| Critério | O que olhar | Sinal de alerta |
|---|---|---|
| Manutenção ativa | Data do último release, issues/PRs respondidos | Sem commit há anos, mantenedor sumiu |
| Tamanho da árvore transitiva | Quantas dependências a mais o pacote arrasta | Um utilitário pequeno trazendo dezenas de transitivas |
| Licença | Compatível com o uso comercial do projeto/cliente | GPL/AGPL em produto fechado, licença não declarada |
| Histórico de CVE | Vulnerabilidade recorrente, tempo de resposta a report | CVEs abertos sem patch há meses |
| Popularidade/adoção | Downloads, quem mais usa, alternativas mais estabelecidas | Pacote novo e obscuro fazendo o que uma lib madura já faz |
| Necessidade real | Dá pra resolver com poucas linhas próprias? | Puxar dependência pesada pra uma função trivial |

- Preferir a dependência já usada em outro projeto próprio a introduzir uma nova pra fazer a mesma coisa.
- Dependência transitiva importa tanto quanto a direta — ela também roda no seu processo. Auditar árvore completa, não só o top-level.
- Pacote descontinuado (deprecated, "unmaintained" no README) é sinal de troca, mesmo funcionando hoje.

## Scan automatizado de vulnerabilidade no CI

- Scan roda em todo PR que toca manifesto/lockfile, e também agendado (diário/semanal) — CVE nova pode afetar dependência já instalada sem nenhuma mudança de código.
- Severidade define o gate: crítica/alta bloqueia merge; média/baixa abre issue de acompanhamento sem travar a pipeline (senão o hábito vira ignorar o alerta).
- Falso positivo (CVE que não afeta o caminho de código usado) se resolve com exceção documentada e datada de revisão — nunca desabilitando o scan inteiro.
- Scan de dependência é adicional ao SAST de código próprio — cobre uma superfície diferente (código de terceiro vs. código escrito por você).
- Resultado do scan vira artefato/relatório do pipeline, não só log perdido — facilita auditoria depois.

## Checklist

- [ ] Lockfile commitado e atualizado junto com o manifesto em todo PR
- [ ] CI instala com o comando que trava no lockfile (`ci`, não `install`/`update`)
- [ ] Patch automático configurado, com CI verde como critério de merge
- [ ] Minor/major upgrade revisado por PR isolado por pacote/grupo
- [ ] Scan de vulnerabilidade rodando em PR e agendado, com gate por severidade
- [ ] Critério de avaliação de pacote novo (manutenção, árvore, licença, CVE) checado antes de adicionar dependência
- [ ] Dependência deprecated/sem manutenção identificada e com plano de substituição
- [ ] Exceção de CVE aceita documentada com motivo e data de revisão

## Anti-patterns

- ❌ Lockfile no `.gitignore` ou desatualizado em relação ao manifesto
- ❌ CI rodando `install`/`update` em vez do comando que respeita o lockfile
- ❌ Upgrade de major em lote, sem isolar por pacote, "pra economizar tempo"
- ❌ Dependência travada em versão antiga por medo, sem plano de atualização
- ❌ Adicionar pacote novo sem checar manutenção, licença ou tamanho da árvore transitiva
- ❌ Scan de vulnerabilidade sem gate — alerta gerado e nunca lido
- ❌ Desabilitar o scan inteiro por causa de um falso positivo pontual
- ❌ Dependência transitiva ignorada na auditoria por não aparecer no manifesto direto

## Exemplos por stack

**npm/pnpm** — `npm ci` (ou `pnpm install --frozen-lockfile`) em CI; `npm audit --audit-level=high` ou `pnpm audit` para scan; `npm outdated` para ver o que está atrás.

**pip** — `pip-compile`/`poetry.lock` como lockfile; `pip install -r requirements.txt --require-hashes` em CI; `pip-audit` ou `safety check` para CVE.

**Maven** — `pom.xml` fixando versões (ou `dependencyManagement`), `mvn versions:display-dependency-updates` para ver upgrades disponíveis; `mvn org.owasp:dependency-check-maven:check` para scan de vulnerabilidade.

**Bundler** — `Gemfile.lock` sempre commitado; `bundle install --deployment` em CI; `bundle audit` para CVE conhecido nas gems instaladas.

**NuGet** — `packages.lock.json` (via `RestorePackagesWithLockFile`); `dotnet list package --vulnerable` para CVE; `dotnet list package --outdated` para política de upgrade.
