---
name: secrets-management
description: Manage secrets and sensitive config across environments and CI — classify sensitive vs. public vars, avoid leaking secrets into repos/logs/builds, rotate credentials, respond to a leak. Provider/vault/CI-agnostic. Use when user asks about env vars, .env files, API keys, CI secrets, secret rotation, or a credential leak.
---

# Secrets Management

A secret is any value that grants access or identifies a system in a privileged
way: an API key, a password, a token, a connection string, a private certificate,
a webhook secret. If it leaks, someone outside gains access they should not have.

## Classification: sensitive vs. public

Not every environment variable is a secret, and conflating the two produces
opposite mistakes — a secret exposed as though it were public config, or paranoia
locking down config that needs no protection.

| Signal | Sensitive (a secret) | Public (config) |
|---|---|---|
| Grants access to a system | Yes — API key, database password, token | No |
| Ends up inside the client bundle | Never should | Fine: an API URL, a feature flag |
| Needs rotation if leaked | Yes | Not applicable |
| Example | `DATABASE_PASSWORD`, `STRIPE_SECRET_KEY`, `JWT_SIGNING_KEY` | `APP_NAME`, `PUBLIC_API_URL`, `LOG_LEVEL` |

Prefixes like `NEXT_PUBLIC_`, `VITE_` and `PUBLIC_` **do not make a value safe**.
They only control whether the bundler injects it into the client. Never put a
secret behind one:

```bash
# ❌ leaks into the browser bundle
VITE_STRIPE_SECRET_KEY=sk_live_...

# ✅ server only
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

If a value grants access, or is a reversible signature or hash of something
private, treat it as a secret regardless of where it currently lives.

## Where a secret must never be

```bash
# ❌ hardcoded
const apiKey = "sk_live_51H8x...";

# ❌ committed in a versioned .env
git add .env

# ❌ in a log, even a debug one
console.log('config loaded:', process.env);
logger.info(`calling the API with key ${apiKey}`);

# ❌ in an error message that reaches the frontend
throw new Error(`Failed to authenticate with token ${token}`);

# ❌ in a query string
fetch(`https://api.example.com/data?api_key=${key}`);
```

```bash
# ✅ never commit the real file, only the template
# .gitignore
.env
.env.local
.env.*.local

# .env.example (committed, no real values)
DATABASE_URL=
STRIPE_SECRET_KEY=
```

A secret in a query string leaks into proxy logs, CDN logs and browser history.
Use a header (`Authorization`, `X-Api-Key`) or the body.

## Secrets in CI

The same rules hold across providers — GitHub Actions, GitLab CI, Azure DevOps,
Jenkins, CircleCI:

- Never in plain text in a versioned pipeline file. Use the provider's native
  secret store, injected as an environment variable only in the step that needs it.
- Restrict by environment or branch where the provider allows it, so a production
  secret is not available to a fork PR or an unprotected branch.
- Masking in logs: most platforms mask registered secret values automatically, but
  that breaks as soon as the secret is concatenated, base64-encoded or otherwise
  transformed before it is printed. Never `echo $SECRET`, and never print the whole
  environment for debugging.
- Fork and external-contributor PRs should not reach repository secrets. That is
  the default on most providers — do not turn it off.
- A build artifact (a Docker image, a bundle) must not carry a build-time secret.
  Use build secrets or a multi-stage build so the final layer does not hold the key.

```dockerfile
# ❌ the secret persists in the image layer
ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc && npm install

# ✅ a build secret that does not persist (BuildKit)
RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN=$(cat /run/secrets/npm_token) npm install
```

## Rotation

- A long-lived secret — a static API key, a service password — needs periodic
  rotation, not only a reaction to an incident.
- Rotate without downtime: create the new credential, update the consumers, wait
  for propagation, then revoke the old one. Never revoke before confirming the new
  one is in use.
- Prefer short-lived credentials — an expiring token, STS or assume-role — over a
  static key wherever the provider supports it. It lowers both the cost of
  rotation and the blast radius of a leak.
- Automate it where possible. A vault with native rotation removes the manual
  process, which is the part that fails.

## Leak response checklist

A secret has leaked — a commit, a public log, a screenshot, a repository made
public by mistake. Order matters: revoke first, investigate afterwards.

- [ ] Revoke the leaked credential immediately at its provider, without waiting to confirm the impact
- [ ] Issue a new credential and update every consumer: the app, CI, other services
- [ ] If it leaked in a commit, assume it is in git history forever. Revoking is what matters, not `git rm` — rewriting history does not reach forks and clones already made
- [ ] Audit the provider's usage logs for the leaked credential, covering the window between exposure and revocation
- [ ] Check whether the credential reached other systems' or clients' data, and assess notification duties (LGPD, client contract — see `lgpd-checklist`)
- [ ] Find the root cause — a missing `.gitignore` entry, a verbose log, a hardcoded secret — and fix it so it does not recur
- [ ] If the secret was in a public repository, treat the leak as permanent. There is no undo for a public push
- [ ] Write the incident down: what leaked, the exposure window, the action taken

## Anti-patterns

- ❌ The same secret in production and in dev or staging — one leak compromises every environment
- ❌ A real `.env` committed, even to a "private" repository, which can become public later
- ❌ Trusting a bundler prefix (`PUBLIC_`, `VITE_`, `NEXT_PUBLIC_`) to decide what is safe to expose
- ❌ One secret shared across services or clients, so a single leak breaks multi-tenant isolation
- ❌ Rotation only after a confirmed leak, never on a schedule
- ❌ Logging full requests and responses without redacting auth headers and credential-bearing bodies
- ❌ A CI secret reachable from an unprotected branch or a fork PR
- ❌ Rewriting git history in the belief that it "removes" a secret already leaked publicly

## By stack

**Vite / Next.js / Node** — variables read through `process.env` (or
`import.meta.env` in Vite); without a public prefix they stay on the server and in
the local build. The real secret lives in `.env.local` (gitignored), with the
template in `.env.example`.

**Supabase** — `SUPABASE_SERVICE_ROLE_KEY` never reaches the client, because it
bypasses RLS. Only the anon key goes to the frontend, protected by the RLS
policies.

**Python** — `python-dotenv` or `os.environ` to load a local `.env`; in production
the variable is injected by the runtime and `.env` is never versioned. Libraries
like `python-decouple` separate config from secrets.

**Go** — read secrets from environment variables (`os.Getenv`) or from a vault
client (Vault, the AWS Secrets Manager SDK) at boot. Avoid a `flag` whose default
carries a real value.
