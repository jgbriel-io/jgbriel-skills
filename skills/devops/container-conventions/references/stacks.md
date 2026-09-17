# By stack

**Node/Vite or Next.js** (multi-stage, production-only `node_modules`):

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
