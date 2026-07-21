---
name: secrets-management
description: Manage secrets and sensitive config across environments and CI — classify sensitive vs. public vars, avoid leaking secrets into repos/logs/builds, rotate credentials, respond to a leak. Provider/vault/CI-agnostic. Use when user asks about env vars, .env files, API keys, CI secrets, secret rotation, or a credential leak.
---

# Gestão de Segredos

Segredo = qualquer valor que concede acesso ou identifica um sistema de forma privilegiada (API key, senha, token, connection string, certificado privado, webhook secret). Se vazar, alguém de fora ganha acesso não autorizado.

## Classificação: sensível vs. público

Nem toda variável de ambiente é um segredo. Confundir os dois lados causa dois erros opostos: segredo exposto como se fosse config pública, ou paranoia travando config que não precisa de proteção.

| Sinal | Sensível (segredo) | Público (config) |
|---|---|---|
| Concede acesso a um sistema | Sim (API key, senha de DB, token) | Não |
| Aparece embutido no bundle do client | Nunca deveria | OK (ex: URL de API, feature flag) |
| Rotação necessária se vazar | Sim | Não se aplica |
| Exemplo | `DATABASE_PASSWORD`, `STRIPE_SECRET_KEY`, `JWT_SIGNING_KEY` | `APP_NAME`, `PUBLIC_API_URL`, `LOG_LEVEL` |

Prefixos tipo `NEXT_PUBLIC_`, `VITE_`, `PUBLIC_` **não tornam o valor seguro** — só controlam se o bundler injeta no client. Nunca colocar segredo atrás desse prefixo:

```bash
# ❌ vaza para o bundle do browser
VITE_STRIPE_SECRET_KEY=sk_live_...

# ✅ só acessível no server
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

Se o valor concede acesso ou é assinatura/hash reversível de algo privado, trate como segredo — independente de onde ele mora hoje.

## Onde segredo não pode estar

```bash
# ❌ hardcoded no código
const apiKey = "sk_live_51H8x...";

# ❌ commitado em .env versionado
git add .env

# ❌ em log, mesmo que "só" debug
console.log('config carregada:', process.env);
logger.info(`chamando API com key ${apiKey}`);

# ❌ em mensagem de erro que sobe pro frontend
throw new Error(`Falha ao autenticar com token ${token}`);

# ❌ em query string
fetch(`https://api.exemplo.com/dados?api_key=${key}`);
```

```bash
# ✅ nunca commitar o arquivo real, só o template
# .gitignore
.env
.env.local
.env.*.local

# .env.example (commitado, sem valores reais)
DATABASE_URL=
STRIPE_SECRET_KEY=
```

Segredo em query string vaza em logs de proxy/CDN/browser history — usar header (`Authorization`, `X-Api-Key`) ou body.

## Segredo em pipeline de CI

Regra geral, válida em qualquer provedor (GitHub Actions, GitLab CI, Azure DevOps, Jenkins, CircleCI):

- Segredo nunca em texto plano no arquivo de pipeline versionado — usar o cofre de secrets nativo do provedor (encrypted secrets/variables), injetado como env var só no step que precisa.
- Restringir por ambiente/branch quando o provedor suportar (secret de produção não disponível em PR de fork/branch não protegida).
- Mascarar no log: a maioria das plataformas mascara automaticamente valores de secret registrados como tal — mas isso quebra se o segredo for concatenado, base64'd ou transformado antes de aparecer no log. Nunca fazer `echo $SECRET` ou printar variável de ambiente inteira para debug.
- PRs de fork/contribuidor externo não devem ter acesso a secrets do repositório (comportamento padrão da maioria dos provedores — não desabilitar).
- Build artifact (imagem Docker, bundle) não deve conter segredo de build embutido — usar build secrets/multi-stage build para que a camada final não carregue a chave.

```dockerfile
# ❌ segredo persiste na camada da imagem
ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc && npm install

# ✅ build secret não persiste (BuildKit)
RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN=$(cat /run/secrets/npm_token) npm install
```

## Rotação

- Segredo de longa duração (API key estática, senha de serviço) precisa de rotação periódica — não só reativa a incidente.
- Rotação sem downtime: gerar credencial nova, atualizar consumidores, aguardar propagação, revogar a antiga. Nunca revogar antes de confirmar que a nova está em uso.
- Preferir credencial de curta duração (token com expiração, STS/assume-role) a chave estática sempre que o provedor suportar — reduz o custo de rotação e o blast radius de um vazamento.
- Automatizar quando possível: cofre de segredos com rotação nativa (ex: rotação agendada de credencial de banco) elimina o processo manual, que é o que mais falha.

## Checklist de resposta a vazamento

Segredo vazou (commit, log público, screenshot, repositório tornado público por engano). Ordem importa — revogar primeiro, investigar depois:

- [ ] Revogar/invalidar a credencial vazada imediatamente no provedor de origem (não esperar confirmar o impacto)
- [ ] Gerar credencial nova e atualizar todos os consumidores (app, CI, outros serviços)
- [ ] Se vazou em commit: assumir que está no histórico do Git para sempre — revogar é o que importa, não `git rm` (reescrever histórico não remove de forks/clones já feitos)
- [ ] Auditar logs de uso da credencial vazada no provedor (acesso indevido no intervalo entre vazamento e revogação)
- [ ] Verificar se a credencial dava acesso a dados de outros sistemas/clientes — avaliar necessidade de notificação (LGPD, contrato com cliente — ver skill lgpd-checklist)
- [ ] Identificar a causa raiz (env var sem `.gitignore`, log verboso, secret hardcoded) e corrigir para não repetir
- [ ] Se o segredo estava em repositório público, considerar o vazamento definitivo — não há "desfazer" um push público
- [ ] Documentar o incidente: o que vazou, janela de exposição, ação tomada

## Anti-patterns

- ❌ Segredo de produção igual ao de dev/staging (um vazamento compromete todos os ambientes)
- ❌ `.env` real commitado, mesmo que "privado" (repositório pode virar público depois)
- ❌ Confiar em prefixo de bundler (`PUBLIC_`, `VITE_`, `NEXT_PUBLIC_`) para decidir o que é seguro expor
- ❌ Segredo compartilhado entre múltiplos serviços/clientes (um vazamento derruba isolamento multi-tenant)
- ❌ Rotação só depois de vazamento confirmado, nunca periódica
- ❌ Log de request/response completo sem redigir headers de auth e body com credenciais
- ❌ Secret de CI acessível em pipeline de branch não protegida ou PR de fork
- ❌ Reescrever histórico do Git achando que isso "remove" um segredo já vazado publicamente

## Exemplos por stack

**Vite / Next.js / Node** — variáveis lidas via `process.env` (ou `import.meta.env` no Vite); sem prefixo público, ficam só no server/build local; segredo real em `.env.local` (gitignored), template em `.env.example`.

**Supabase** — `SUPABASE_SERVICE_ROLE_KEY` nunca no client (bypassa RLS); só a `anon key` vai pro frontend, protegida pelas policies RLS.

**Python** — `python-dotenv` ou `os.environ` para carregar `.env` local; em produção, variável injetada pelo runtime (não versionar `.env`); libs como `python-decouple` separam config de segredo.

**Go** — segredo lido de env var (`os.Getenv`) ou de um client de vault (Vault, AWS Secrets Manager SDK) no boot da aplicação; evitar `flag` com default contendo valor real.
