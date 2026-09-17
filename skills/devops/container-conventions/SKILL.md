---
name: container-conventions
description: Defines multi-stage Docker builds, minimal base images, non-root users, .dockerignore, layer cache ordering, and docker-compose for local dev dependencies — stack-agnostic, independent of the runtime inside the container. Use when user asks about Dockerfile, docker-compose, image size, non-root container, or build cache.
---

# Container Conventions

Image design is independent of the language inside it — Node, Python, Java, Go,
Ruby, .NET. Only the build and runtime commands change. The goal is always the
same: a small final image, with no build tooling, running as a non-root user.

## Multi-stage: separate build from runtime

A single stage carries the compiler, the dev dependencies and the build cache into
the image that ships to production, inflating both its size and its attack
surface.

```dockerfile
# ❌ single-stage: the SDK, devDependencies and build cache all travel to production
FROM node:20
WORKDIR /app
COPY . .
RUN npm install && npm run build
CMD ["node", "dist/server.js"]
```

```dockerfile
# ✅ multi-stage: the build stage is discarded; only the artifact reaches the runtime image
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

The `build` stage may carry compilers, headers and devDependencies. None of it is
copied into the final stage — only what `COPY --from=build` names explicitly.

## A minimal base image

| Base | Size | Shell and package manager | Use |
|---|---|---|---|
| `*-full`, `ubuntu`, `debian` | Hundreds of MB | Yes, complete | Only when OS tooling is needed at runtime |
| `*-slim` | Tens of MB | Yes, minimal | The default for most cases |
| `*-alpine` | ~5-10MB | `sh`, `apk` | When no native dependency is incompatible with musl |
| `distroless` / `scratch` | A few MB, no shell | None | Compiled runtimes (Go, a static binary), for the smallest surface |

- Every extra package in the final image is attack surface and a potential CVE.
  Take the smallest base the runtime needs, and nothing "just in case".
- Alpine uses musl rather than glibc. Native libraries compiled for glibc — some
  Python and Node C extensions — can break, so test before swapping `slim` for
  `alpine`.
- Distroless and scratch have no shell and no package manager. Excellent for a
  static binary, unworkable when the application needs a shell for debugging or an
  entrypoint script.

```dockerfile
# ❌ a full image carrying tooling that never runs in production
FROM golang:1.22
COPY . .
RUN go build -o server .
CMD ["./server"]

# ✅ build compiles; the final image holds only the binary
FROM golang:1.22 AS build
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o server .

FROM gcr.io/distroless/static-debian12
COPY --from=build /app/server /server
ENTRYPOINT ["/server"]
```

## Non-root user

A container running as `root` by default means a compromised application has full
privilege inside the container — and an easier path to the host on a poorly
configured runtime.

```dockerfile
# ❌ runs as root, which is the implicit default when USER is not declared
FROM node:20-slim
WORKDIR /app
COPY . .
CMD ["node", "server.js"]
```

```dockerfile
# ✅ a dedicated user with no root privilege
FROM node:20-slim
RUN groupadd -r app && useradd -r -g app app
WORKDIR /app
COPY --chown=app:app . .
USER app
CMD ["node", "server.js"]
```

- Many official images already ship a non-root user (`node` in the node image,
  `nonroot` in distroless). Often only the `USER` line is missing.
- `--chown` on `COPY`/`ADD` avoids a later `chown -R`, which would duplicate the
  layer and the size.
- If the application must bind a port below 1024, redirect to a high port and map
  it in compose or the orchestrator, rather than running as root to work around it.

## .dockerignore

Without a `.dockerignore`, `COPY . .` sends `node_modules`, `.git`, `.env`, old
build artifacts and local logs into the build context — inflating the image and
possibly baking a local secret into a layer.

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

- A local `.env` must never enter the build context. Missing from `.dockerignore`,
  a `COPY . .` copies a dev secret into the image (see `secrets-management`).
- A smaller context also speeds the build, since less data goes to the daemon.

## Layer cache — order matters

Docker caches layer by layer, and the first instruction that changes invalidates it
and everything after. Copying source before installing dependencies invalidates the
install cache on every line of code changed.

```dockerfile
# ❌ any code change invalidates the dependency install, reinstalling everything
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt

# ✅ dependencies reinstall only when the manifest changes
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
```

- The general rule: copy the dependency manifests first (`package.json` plus its
  lock, `requirements.txt`, `go.sum`, `Gemfile.lock`), install, and only then copy
  the rest of the code.
- Instructions that change most often — the source — go last.
- Combine `RUN apt-get update && apt-get install -y package && rm -rf /var/lib/apt/lists/*`
  into one instruction. Split across separate `RUN`s, the apt cache stays in an
  earlier immutable layer even after being removed later.

## Build-time secrets

Use `RUN --mount=type=secret` (BuildKit) for a secret needed only during the build
— a private registry token, a private module credential. Never `ARG` or `ENV` with
a sensitive value: it persists in the layer even when removed afterwards. The full
detail is in `secrets-management`.

## Compose for local development

An application service rarely runs alone; it depends on a database, a cache, a
queue. `docker-compose` brings them all up with a network and volumes isolated per
project.

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
      - /app/node_modules # keeps the host's node_modules from shadowing the image's

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

For Supabase projects, `supabase start` already brings up the local equivalent —
Postgres, Auth, Storage and Studio — through Docker, with no compose file needed.
Reach for `docker-compose` when the project has dependencies beyond the Supabase
stack: Redis, a separate worker.

- `depends_on` with `condition: service_healthy` waits for the database to accept
  connections rather than merely for the container to start. Without it the
  application connects too early and crash-loops on retries.
- A named volume (`db_data`) survives `docker compose down` and `up`;
  `docker compose down -v` removes it deliberately.
- A source bind mount (`.:/app`) is for development hot-reload only. A production
  image never mounts code from outside — it is already copied in.
- One `.env` per compose environment, never the production one.

## Checklist

- [ ] Multi-stage build: the final stage carries no compiler, SDK or devDependencies
- [ ] The base image was chosen deliberately (slim, alpine, distroless), not defaulted to "full"
- [ ] A non-root `USER` declared in the final stage
- [ ] `.dockerignore` covers `.git`, `.env`, installed dependencies and old build output
- [ ] Dependency manifests copied and installed before the rest of the source
- [ ] No `ARG` or `ENV` carrying a secret; build secrets go through `--mount=type=secret`
- [ ] The final image tested running as non-root, with no `sudo` or port rebinding to work around it
- [ ] The development `docker-compose.yml` brings up every dependency with a healthcheck
- [ ] Named volumes for persistent data; source bind mounts only in development
- [ ] The final image size checked (`docker images`), with no unexplained jump after a change

## Anti-patterns

- ❌ A single-stage build carrying the compiler and devDependencies into production
- ❌ Running as root with no `USER` declared
- ❌ A missing or incomplete `.dockerignore`, leaking `.env` or `.git` into the build context
- ❌ Copying source before the dependency manifest, invalidating the cache on every commit
- ❌ A build secret in `ARG`/`ENV` instead of `--mount=type=secret`
- ❌ Swapping `slim` for `alpine` without testing native dependencies — the breakage is silent in production
- ❌ A source bind mount in a production image, mixing the development environment into the real runtime
- ❌ `depends_on` with no healthcheck, so the application starts before the database accepts connections
- ❌ An `apt-get install` layer with no cleanup in the same instruction, leaving the package cache in the image

## By stack

Ready Dockerfiles and compose files per stack — Node/Vite, Next.js, Python, Go —
are in [references/stacks.md](references/stacks.md). They are a starting point
rather than a template: base versions and native dependencies differ per project.
