---
name: container-conventions
description: Defines multi-stage Docker builds, minimal base images, non-root users, .dockerignore, layer cache ordering, and docker-compose for local dev dependencies — stack-agnostic, independent of the runtime inside the container. Use when user asks about Dockerfile, docker-compose, image size, non-root container, or build cache.
---

# Convenções de Container

Conceito de imagem independe da linguagem de dentro (Node, Python, Java, Go, Ruby, .NET...). O que muda é só o comando de build/runtime. Objetivo sempre: imagem final pequena, sem ferramenta de build, rodando como usuário não-root.

## Multi-stage: separar build de runtime

Um único estágio carrega compilador, dependências de dev e cache de build para dentro da imagem que vai pra produção — infla o tamanho e a superfície de ataque.

```dockerfile
# ❌ single-stage: SDK, devDependencies e cache de build viajam pra produção
FROM node:20
WORKDIR /app
COPY . .
RUN npm install && npm run build
CMD ["node", "dist/server.js"]
```

```dockerfile
# ✅ multi-stage: estágio de build descartado, só o artefato final vai pra imagem runtime
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
CMD ["node", "dist/server.js"]
```

O estágio `build` pode ter compilador, headers, devDependencies — nada disso é copiado pro estágio final, só o `COPY --from=build` explícito.

## Imagem base mínima

| Base | Tamanho | Shell/pacote gerenciador | Uso |
|---|---|---|---|
| `*-full` / `ubuntu` / `debian` | Centenas de MB | Sim, completo | Só se precisar de ferramenta de SO em runtime |
| `*-slim` | Dezenas de MB | Sim, mínimo | Padrão pra maioria dos casos |
| `*-alpine` | ~5-10MB | `sh`, `apk` | Quando não há dependência nativa incompatível com musl |
| `distroless` / `scratch` | Poucos MB, sem shell | Nenhum | Runtime compilado (Go, binário estático), máxima redução de superfície |

- Cada pacote/lib a mais na imagem final é superfície de ataque e CVE em potencial — base mínima que atenda ao runtime, nada de "por garantia".
- Alpine usa musl libc, não glibc — libs nativas compiladas pra glibc (algumas bindings Python/Node com C extension) podem quebrar; testar antes de trocar `slim` por `alpine`.
- Distroless/scratch não tem shell nem package manager — bom pra binário estático (Go, Rust), inviável se a aplicação precisa de shell pra debug ou script de entrypoint.

```dockerfile
# ❌ imagem completa carregando ferramenta que nunca roda em produção
FROM golang:1.22
COPY . .
RUN go build -o server .
CMD ["./server"]

# ✅ build compila, imagem final só tem o binário
FROM golang:1.22 AS build
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o server .

FROM gcr.io/distroless/static-debian12
COPY --from=build /app/server /server
ENTRYPOINT ["/server"]
```

## Non-root user

Container rodando como `root` por padrão: se a aplicação for comprometida, o processo dentro do container tem privilégio total dentro dele (e mais fácil de escapar pro host em runtime mal configurado).

```dockerfile
# ❌ roda como root (padrão implícito se não declarar USER)
FROM node:20-slim
WORKDIR /app
COPY . .
CMD ["node", "server.js"]
```

```dockerfile
# ✅ cria usuário dedicado, sem privilégio de root
FROM node:20-slim
RUN groupadd -r app && useradd -r -g app app
WORKDIR /app
COPY --chown=app:app . .
USER app
CMD ["node", "server.js"]
```

- Muitas imagens oficiais já trazem usuário não-root pronto (`node` na imagem `node`, `nonroot` na distroless) — só falta o `USER`.
- `--chown` no `COPY`/`ADD` evita passo extra de `chown -R` depois (que duplica a camada e o tamanho).
- Se a aplicação precisa bindar porta < 1024, redirecionar pra porta alta e mapear no compose/orquestrador, não rodar como root pra contornar.

## .dockerignore

Sem `.dockerignore`, o `COPY . .` manda `node_modules`, `.git`, `.env`, artefato de build antigo e log local pro contexto de build — infla a imagem e pode vazar segredo local pra dentro da camada.

```
# .dockerignore
.git
.env
.env.*
node_modules
dist
build
*.log
.vscode
.idea
__pycache__
*.pyc
.venv
target
bin
obj
```

- `.env` local nunca deve entrar no contexto de build — se estiver ausente do `.dockerignore`, um `COPY . .` copia segredo de dev pra dentro da imagem (ver `secrets-management`).
- Contexto de build menor também acelera o build (menos dado enviado ao daemon).

## Cache de layer — ordem importa

Docker cacheia camada por camada; a primeira instrução que muda invalida ela e todas as seguintes. Copiar código-fonte antes de instalar dependências invalida o cache de instalação a cada mudança de linha de código.

```dockerfile
# ❌ qualquer mudança de código invalida a instalação de dependências (reinstala tudo)
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt

# ✅ dependências só reinstalam quando o lockfile/manifest muda
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
```

- Regra geral: copiar primeiro o(s) arquivo(s) que descrevem dependências (`package.json`+lock, `requirements.txt`, `go.sum`, `Gemfile.lock`), instalar, só depois copiar o resto do código.
- Instruções que mudam com mais frequência (código-fonte) sempre por último no Dockerfile.
- Combinar `RUN apt-get update && apt-get install -y pacote && rm -rf /var/lib/apt/lists/*` numa única instrução — camadas separadas de `update`/`install`/`cleanup` deixam lixo de apt na imagem mesmo limpando depois, porque cada `RUN` vira uma camada imutável.

## Segredo em build time

Não repetir aqui: usar `RUN --mount=type=secret` (BuildKit) pra segredo necessário só durante o build (token de registry privado, credencial de módulo privado) — nunca `ARG`/`ENV` com valor sensível, que persiste na camada mesmo se removido depois. Detalhe completo em `secrets-management`.

## Compose para ambiente de dev local

Serviço de aplicação quase nunca roda sozinho — depende de banco, cache, fila. `docker-compose` sobe tudo junto, com rede e volume isolados por projeto.

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports: ["3000:3000"]
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - .:/app
      - /app/node_modules # evita node_modules do host sobrescrever o da imagem

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  db_data:
```

Para projetos Supabase, `supabase start` já sobe o equivalente local (Postgres + Auth + Storage + Studio) via Docker sem precisar montar esse compose manualmente — usar `docker-compose` direto só quando o projeto tem dependências além do stack Supabase (Redis, worker separado, etc).

- `depends_on` com `condition: service_healthy` espera o banco aceitar conexão, não só o container subir — sem isso, a aplicação tenta conectar antes do Postgres estar pronto e cai em retry/crash loop.
- Volume nomeado (`db_data`) persiste dado entre `docker compose down`/`up`; `docker compose down -v` remove de propósito.
- Bind mount do código-fonte (`.:/app`) é só pra dev (hot-reload); imagem de produção nunca monta o código de fora, ele já está copiado na imagem.
- Um `.env` por ambiente de compose (dev local), nunca o mesmo `.env` usado em produção.

## Checklist

- [ ] Build multi-stage: estágio final não tem compilador/SDK/devDependencies
- [ ] Base mínima escolhida de forma consciente (slim/alpine/distroless), não a imagem "full" por padrão
- [ ] `USER` não-root declarado no estágio final
- [ ] `.dockerignore` cobre `.git`, `.env`, dependências instaladas, artefato de build antigo
- [ ] Manifesto de dependências copiado e instalado antes do restante do código-fonte
- [ ] Nenhum `ARG`/`ENV` carregando segredo — build secret via `--mount=type=secret`
- [ ] Imagem final testada rodando como non-root (sem `sudo`/rebind de porta pra contornar)
- [ ] `docker-compose.yml` de dev sobe todas as dependências (banco, cache, fila) com healthcheck
- [ ] Volume nomeado para dado persistente; bind mount de código só em dev, nunca em produção
- [ ] Tamanho final da imagem verificado (`docker images`) — sem salto inesperado após mudança

## Anti-patterns

- ❌ Single-stage build carregando compilador e devDependencies pra imagem de produção
- ❌ Rodar container como root sem `USER` declarado
- ❌ `.dockerignore` ausente ou incompleto, vazando `.env`/`.git` pro contexto de build
- ❌ Copiar código-fonte antes do manifesto de dependências (invalida cache a cada commit)
- ❌ Segredo de build em `ARG`/`ENV` em vez de `--mount=type=secret`
- ❌ Trocar `slim` por `alpine` sem testar dependência nativa (quebra silenciosa em produção)
- ❌ Bind mount de código-fonte em imagem de produção (mistura ambiente dev com runtime real)
- ❌ `depends_on` sem healthcheck — aplicação sobe antes do banco aceitar conexão
- ❌ Camada de `apt-get install` sem limpeza na mesma instrução, deixando cache de pacote na imagem

## Exemplos por stack

**Node/Vite ou Next.js** (multi-stage, `node_modules` só de produção):

```dockerfile
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/server.js"]
```

**Python** (venv isolado do estágio de build):

```dockerfile
FROM python:3.12-slim AS build
WORKDIR /app
COPY requirements.txt .
RUN python -m venv /venv && /venv/bin/pip install -r requirements.txt

FROM python:3.12-slim AS runtime
RUN useradd -r app
COPY --from=build /venv /venv
WORKDIR /app
COPY --chown=app:app . .
USER app
ENV PATH="/venv/bin:$PATH"
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8000"]
```

**Go** (binário estático em distroless):

```dockerfile
FROM golang:1.22 AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /app/server /server
USER nonroot:nonroot
ENTRYPOINT ["/server"]
```
