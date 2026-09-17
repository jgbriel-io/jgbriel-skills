---
name: environment-config
description: Environment-based configuration conventions — .env.example, startup-time env validation (fail fast, not mid-request), and dev/staging/prod parity, applicable to any language or framework. Use when user asks about env vars, .env files, config setup, or "works on my machine" environment drift. Vault/rotation is secrets-management, not this skill.
---

# Environment Config

Configuration conventions per environment. Applies to Node, Python, Java, Go,
Ruby, .NET — any stack that reads config from the environment.

## `.env.example`

Every repo carries a versioned `.env.example` mirroring one-to-one the keys the
app reads, with no real values.

```bash
# .env.example — committed to git
DATABASE_URL=postgres://user:password@localhost:5432/app_dev
API_PORT=3000
JWT_SECRET=changeme
EXTERNAL_API_KEY=
LOG_LEVEL=info
```

```gitignore
# .gitignore
.env
.env.local
.env.*.local
```

Rules:

- `.env.example` documents the **shape** — the key's name, its format, a harmless
  example — never the real value.
- The real `.env` is never committed, never appears in a PR, and never shows up in
  a screenshot.
- Every new key the code reads enters `.env.example` in the same commit. If it is
  not there, it does not exist for the next developer, or for you in six months.
- Variable names describe the data, not the environment: `DATABASE_URL`, not
  `PROD_DATABASE_URL`. The environment is determined by which `.env` was loaded,
  not by the key's name.

## Validation at startup

Missing or invalid config is a **startup** error, not a request error. The process
must not come up — let alone accept traffic — with incomplete config.

```
❌ wrong: the app boots, request 3,847 calls the external API,
   EXTERNAL_API_KEY is undefined, and the client gets a mysterious 500

✅ right: the app tries to boot, validates the environment, prints
   "EXTERNAL_API_KEY is required and was not set", and exits non-zero
```

The pattern: define a config schema and validate against it before anything else
runs — before opening a port, before connecting to the database, before
registering routes.

```ts
// conceptual, library-independent
const schema = {
  DATABASE_URL: { type: 'string', required: true },
  API_PORT: { type: 'number', default: 3000 },
  JWT_SECRET: { type: 'string', required: true, minLength: 16 },
  LOG_LEVEL: { type: 'enum', values: ['debug', 'info', 'warn', 'error'], default: 'info' },
};

const config = validate(process.env, schema); // throws and kills the process when invalid
```

The validator's checklist:

- [ ] Fails the process (non-zero exit) when a required variable is missing or empty
- [ ] Validates type and format, not just presence — `API_PORT` must be a number, `DATABASE_URL` must parse as a URL
- [ ] The error message names the missing key, rather than showing a generic stack trace
- [ ] Validation runs once, at boot, before the app accepts connections — never per request
- [ ] One config module owns the parsing; the rest of the code imports the validated config and never reads `process.env` (or its equivalent) directly

## Dev, staging and production parity

The same config shape in every environment. What changes is the **value**, never
the **key** and never the logic that reads it.

| | Dev | Staging | Production |
|---|---|---|---|
| Required keys | The same | The same | The same |
| `DATABASE_URL` | A local, Docker or local-Supabase database | The staging database | The production database |
| Behaviour in code | Identical | Identical | Identical |
| Where the value comes from | A local `.env` | A secret manager or CI | A secret manager or CI |

- There is never an `if (env === 'dev') { skipValidation() }`. Config required in
  production is required in dev too, with a dev value.
- There is never a business-logic branch on the environment's name
  (`if (env === 'staging')`). Behaviour is controlled by feature flags, not by
  environment.
- Infrastructure differences — a database URL, an API key — live in config.
  Behavioural differences should never depend on the environment.
- An environment that exists only for manual testing before production must use the
  same config mechanism as production, or the test proves nothing.

## The boundary with secrets-management

This skill covers **convention**: where a key lives, how it is named, how the app
validates that it exists. It does not cover:

- Credential rotation
- Vaults (Vault, AWS Secrets Manager, Doppler)
- Who has access to which secret

Those belong to `secrets-management`. "How do I rotate `JWT_SECRET`?" and "where do
I store a production credential safely?" are answered there. Here the claim is only
that the key exists, is documented, and that the app fails fast without it.

## Multiple clients (freelance work)

Across clients, each project has its own set of values rather than its own set of
keys: the same `.env.example`, a different `.env` per client and environment. Never
hardcode a client-specific value in the code. If one client needs different
behaviour, that is a new config key or a feature flag, never an
`if (client === 'x')`.

## By stack

**Vite/React** (validated with Zod at boot):
```ts
import { z } from 'zod';
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
});
export const config = envSchema.parse(import.meta.env); // throws when invalid
```

**Node.js/NestJS** (validated with Zod):
```ts
import { z } from 'zod';
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(16),
});
export const config = envSchema.parse(process.env); // throws and kills the boot
```

**Python** (Pydantic Settings):
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    api_port: int = 3000
    jwt_secret: str

    class Config:
        env_file = ".env"

settings = Settings()  # a ValidationError takes the process down at import
```

**Go** (validated by hand in `main`, before `http.ListenAndServe`):
```go
func loadConfig() Config {
    dbURL := os.Getenv("DATABASE_URL")
    if dbURL == "" {
        log.Fatal("DATABASE_URL is required and was not set")
    }
    return Config{DatabaseURL: dbURL}
}
```

## Anti-patterns

- ❌ A real `.env` committed to git, or a real value left in `.env.example` by accident
- ❌ Reading `process.env` or `import.meta.env` scattered through the code instead of through one config module
- ❌ Missing config discovered only when the request that needs the key runs in production
- ❌ An environment variable with no type validation, so `API_PORT` is the string `"abc"` and only breaks at a later `parseInt`
- ❌ Business logic branching on the environment's name (`if (env === 'staging')`)
- ❌ A config key with the environment baked into its name (`PROD_DATABASE_URL`)
- ❌ A client-specific value hardcoded instead of coming from config
- ❌ A manual-testing environment skipping validation that production enforces
