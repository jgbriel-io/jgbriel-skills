---
name: project-deploy
description: Deploys a project by following the runbook documented in the vault — a step-by-step checklist, confirmation before anything irreversible, post-deploy verification and a release record. Use when the user says "publica o site", "sobe pra produção", "faz o deploy", or names the deploy of one of their projects. Where no runbook exists, it interviews and writes one. Cloudflare-specific tooling is wrangler/cloudflare.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Project Deploy

Deployment driven by a runbook. The source of truth for HOW each project ships is
its deployment page in the vault; this skill executes it, verifies the result and
records the release.

## Process

### 1. Find the runbook

- Vault: `wiki/Projetos/<name>/deployment/<Name> - Deploy.md`
- Fallback: `docs/deployment/` inside the project itself

If neither exists, interview the user — one question at a time — and write the
page before deploying: where it is hosted, how it builds, how it ships (git push,
FTP, a control panel, wrangler), the domain and DNS, and what to check afterwards.
A deploy with no written runbook is how the mistake gets in.

### 2. Pre-deploy

- Is the working tree clean, and the change committed? Never ship unversioned state
- Does the local build pass, including the project's type-check?
- Does the runbook mark anything as "before shipping" — environment variables,
  migrations?

### 3. Work the checklist

Follow the runbook step by step, in order. Two rules:

- **Anything irreversible or public-facing** — pointing DNS, shipping to
  production, running a migration against the production database — is confirmed
  with the user first, even where the runbook authorises it.
- A failed step stops the process. Report the exact error, and do not improvise a
  workaround.

### 4. Post-deploy verification

The minimum, even when the runbook does not list it:

- The production URL responds and renders — not merely HTTP 200
- No new errors in the browser console
- Cache: is the change actually visible? Hard refresh, or purge where the host
  caches
- The project's critical flow works — login, the contact form, whatever the
  runbook names

### 5. Record the release

Append a row on the vault's deployment page:

```
| 2026-07-08 | <short commit sha> | <what changed, in one sentence> |
```

Create the `## Releases` table if it is missing, and bump `updated:` in the
frontmatter.

## Which project, and where its runbook is

Each project has its own runbook under `wiki/Projetos/<name>/deployment/` in the
vault. Resolve the name through the map in `~/.claude/projects-map.md` — a machine
file outside this repo, the same one `project-sync` reads. For a project that is
not there, ask for the host and the path, and offer to append the line.

Never write a client project's name here: this repository is public, and a table
of clients in a versioned file is exposure, not convenience.
