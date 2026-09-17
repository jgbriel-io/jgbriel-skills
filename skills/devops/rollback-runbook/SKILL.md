---
name: rollback-runbook
description: Defines a deploy-tool-agnostic rollback runbook — reverting a code deploy (blue-green/canary/previous artifact), why reverting a database migration is usually the wrong move, feature flags as a faster alternative to full rollback, and rollback-vs-forward-fix decision criteria. Use when user asks about rollback, revert deploy, incident response, kill switch, hotfix, or rolling back a release.
---

# Rollback Runbook

Rollback is a procedure, not a tool. Vercel, Cloudflare Pages and Workers,
Kubernetes, ECS, Heroku and a bare-metal box with systemd differ only in the
command; the decisions — what to revert, in what order, and when not to — are the
same everywhere. This runbook assumes any stack: Vite/Next.js, NestJS,
Supabase/Postgres, Python, Go.

## Deciding: rollback or forward fix

| Situation | Action |
|---|---|
| Obvious root cause, a one-line fix, already tested | Forward fix — faster than orchestrating a rollback |
| Uncertain root cause, or a non-trivial fix | Rollback — stop the bleeding first, investigate after |
| A destructive migration already ran and dirtied data | A code rollback does not solve it alone — see the migration section |
| An isolated feature behind a flag | Turn the flag off, which beats a full rollback |
| A client or SLA is affected and time matters | Rollback, no debate. Investigate with the system already stable |

Rule of thumb: if "revert or fix?" is still an open question five minutes into the
incident, the answer is revert. Forward fixes under pressure have a high error
rate.

## Reverting the code deploy

| Strategy | How it reverts | Speed | Note |
|---|---|---|---|
| Blue-green | Switch routing back to the old environment, which is still up | Seconds | Requires keeping both environments alive — double cost during the window |
| Canary | Cut traffic to the canary; 100% returns to stable | Seconds to minutes | If the canary already expanded past a small fraction, treat it as a full deploy |
| Previous artifact | Reapply version N-1, the same build and tag | Minutes | Never rebuilds — reusing the tested artifact is what makes rollback fast |
| Rolling update in flight | Pause the rollout, set the target version back, let the orchestrator converge | Minutes | Rolling back a half-finished rollout leaves mixed state until it converges |

Principles that hold for any tool:

- A code rollback reapplies an already-validated artifact. It is never "git revert,
  rebuild, redeploy" under pressure. If rollback depends on a build, the pipeline
  is wrong.
- Revert to the last known-good version, not to "some earlier one". Confirm which
  deploy was healthy before reverting.
- Rollback changes the running code, not the database schema. The two are
  independent by design — see `safe-migrations`.
- After rolling back, freeze further deploys until the root cause is understood, or
  the bug gets reintroduced unnoticed.

## Feature flags: the fastest rollback is not rolling back

When the problematic change sits behind a flag, turning the flag off is faster and
safer than reverting the whole deploy:

- It does not depend on the deploy pipeline, the orchestrator or infrastructure
  propagation. It is one write to the flag provider — GrowthBook, LaunchDarkly,
  Unleash, Flagsmith, or a table of your own in Postgres.
- It takes effect in seconds, with no redeploy and no restart.
- It reverts only the new behaviour, so other changes in the same deploy — another
  bug fix, an updated dependency — survive.
- It requires the feature to have shipped behind a flag from the start. You cannot
  add the flag once the incident has begun.

Where a flag is not an option — the change was not flagged, or the bug is in shared
infrastructure code — fall back to a normal deploy rollback.

## Migrations: rarely the rollback strategy

Reverting a schema migration in production, mid-incident, almost always makes
things worse:

- If the migration followed expand-contract (see `safe-migrations`), the schema
  never needed reverting: old and new code coexist on the same schema throughout.
  A code rollback alone resolves it.
- `DROP COLUMN` and `DROP TABLE` have no undo. Deleted data does not return without
  a restore (see `backup-restore`). "Reverting the migration" there means a
  restore, not `migrate down`.
- Running `down` on a migration whose `up` already ran in production, with real
  data written afterwards, corrupts or loses data that did not exist when `up` ran.
- With a migration's lock still held, cancelling the query is safer than trying to
  revert halfway.

In practice:

- First revert the code to the version that does not depend on the schema change.
- Revert the schema itself only when the migration broke something on its own — a
  badly built index degrading performance, say — and even then with a confirmed
  backup first.
- If a destructive migration already ran without expand-contract, that is the root
  cause to address after the incident (see `incident-postmortem`). No destructive
  migration should reach production outside the phased pattern.

## Communication during the incident

- Declare the incident before touching anything — even if only for your own record
  on a solo project, or in the client's channel on freelance work.
- Announce the action ("reverting deploy X to version Y") before executing it,
  which prevents conflicting actions when more than one person is involved.
- Confirm when the rollback is done and the system is operating normally.
- Afterwards: a blameless postmortem with the root cause documented (see
  `incident-postmortem`). If the rollback was slow, that becomes an action item —
  automate the manual step, add the flag.

## Checklist

- [ ] The last healthy deploy identified before reverting, not "some earlier version"
- [ ] Checked whether the change sits behind a flag before choosing a full rollback
- [ ] Code rollback done by reapplying a tested artifact, with no rebuild
- [ ] Verified whether the production migration followed expand-contract; if so, a code rollback suffices and the schema stays untouched
- [ ] Where a destructive migration already ran, a backup confirmed before any schema action
- [ ] Incident declared and the action announced before execution
- [ ] Further deploys frozen until the root cause is confirmed
- [ ] Confirmation that the system is back to normal
- [ ] A postmortem scheduled, with the root cause and an improvement to the rollback process

## Anti-patterns

- ❌ A rollback that depends on building under pressure — if it is not reapplying a ready artifact, it is not a fast rollback
- ❌ Running `migrate down` in production without checking whether new data was written after the `up`
- ❌ Reverting a whole deploy when turning off a feature flag would take seconds
- ❌ A destructive migration shipped without expand-contract, forcing a schema rollback mid-incident
- ❌ Rolling back without telling anyone involved, producing conflicting actions
- ❌ Closing the incident with no postmortem, and meeting the same root cause later
- ❌ Resuming normal deploys right after the rollback, with no freeze, reintroducing the bug

## By stack

**Vercel (Next.js)** — promote a previous deployment from the dashboard or CLI, no
rebuild:
```bash
vercel rollback <deployment-url-or-id>
```

**Cloudflare Pages/Workers** — revert to an earlier deployment from the dashboard,
or republish the previous version through wrangler (see the `wrangler` skill):
```bash
wrangler rollback [deployment-id]
```

**Kubernetes** — roll the deployment back to its previous revision, reusing the
tested image:
```bash
kubectl rollout undo deployment/api
kubectl rollout undo deployment/api --to-revision=42   # a specific revision
```

**Heroku and PaaS with releases** — reapply an earlier release:
```bash
heroku releases:rollback v122 -a api-prod
```

**Feature flag (platform-independent)** — a kill switch with no redeploy:
```bash
curl -X PATCH https://app.growthbook.io/api/v1/features/checkout-v2 \
  -H "Authorization: Bearer $GROWTHBOOK_API_KEY" \
  -d '{"environments":{"production":{"enabled":false}}}'
```

**Supabase/Postgres — do not revert; check expand-contract first.** If the
migration followed the pattern, rollback means reverting the application deploy
alone: the old column or table stays in the schema until the `contract` step, so
there is no schema to undo mid-incident.
