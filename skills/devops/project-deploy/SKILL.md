---
name: project-deploy
description: Deploys a project by following its runbook (docs/engineering/runbook.md in the repo) — a step-by-step checklist, confirmation before anything irreversible, post-deploy verification and a release record. Use when the user says "publica o site", "sobe pra produção", "faz o deploy", or names the deploy of one of their projects. Where no runbook exists, it interviews and writes one. Cloudflare-specific tooling is wrangler/cloudflare.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Project Deploy

Deployment driven by a runbook. The source of truth for HOW each project ships is
its runbook in the repo; this skill executes it, verifies the result and records
the release. Where a merge to `main` deploys through the host's git integration,
deploying is merging the PR: the skill then runs the pre-deploy checks, watches
the host's build and verifies the result.

## Process

### 1. Find the runbook

1. `docs/engineering/runbook.md` in the repo, its Deploy section
2. A repo not migrated yet: `docs/deployment/`, or the project's deployment page
   in the vault

If none exists, interview the user — one question at a time — and write
`docs/engineering/runbook.md` before deploying (its six sections are in
`rollback-runbook`): where it is hosted, how it builds, how it ships (git push,
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

Where a merge deploys, the squash commits on `main` are the release record;
append nothing. Otherwise append a row to a `## Releases` table in the runbook:

```
| 2026-07-08 | <short commit sha> | <what changed, in one sentence> |
```

Create the table if it is missing. Bump `updated:` only on a vault page; docs in
the repo carry no such field, because git already knows.

## Which project, and where its runbook is

Each project's runbook lives in its repo. Resolve the project's name to its repo
path through the map in `~/.claude/projects-map.md` — a machine file outside this
repo. For a project that is
not there, ask for the host and the path, and offer to append the line.

Never write a client project's name here: this repository is public, and a table
of clients in a versioned file is exposure, not convenience.
