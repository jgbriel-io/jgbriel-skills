---
name: backup-restore
description: Explains backup strategy and restore testing for relational databases — the daily encrypted off-provider dump, RPO/RTO, retention bounded by LGPD, PITR, and the weekly automatic restore check that proves a backup is usable, with its alert outside the backup host. Database/tool-agnostic. Use when user asks about backup, disaster recovery, RPO, RTO, PITR, restore, snapshot, or how long to keep backups.
---

# Backup & Restore

A backup that has never been restored is not a backup — it is an untested bet.
The question that matters is not "do we have backups?" but "when did the last
restore pass, and how long did it take?". This holds for any relational database
and any tool: `pg_dump`, `mysqldump`, native PITR, a managed snapshot.

## RPO and RTO — decide before picking a tool

| Metric | Question | Determines |
|---|---|---|
| RPO (Recovery Point Objective) | How much data can we afford to lose? | Backup frequency, whether PITR is required |
| RTO (Recovery Time Objective) | How long can we be down? | Restore strategy, database size, automation |

Without RPO and RTO, "do backups" has no success criterion. A 5-minute RPO
demands PITR (WAL/binlog replay); a nightly dump cannot meet it. Write the
accepted data-loss window at the top of the runbook and tell the client — it is
discovered during the incident otherwise.

## The default: a daily encrypted dump, off-provider, 30 days

On managed free plans the provider keeps nothing usable (Supabase has no backups
below Pro; Neon's free plan restores only the last 6 hours). The floor that
costs nothing:

- **A daily `pg_dump`.** It accepts losing up to 24 hours. A tighter window is
  paid (PITR) and is offered when the client pays for it.
- **Off-provider**, in storage owned by whoever owns the repo. A copy inside the
  same project dies with the project, the account or a leaked admin key.
- **Encrypted before it leaves the job, with a public key** (`age -r`). The job
  holds only the public key; the private key lives with the restore check and in
  a password manager, so a leaked storage credential exposes nothing readable.
- **30 days, then deleted automatically** by a lifecycle rule, plus a 30-day
  bucket lock so whoever holds the credential cannot delete early. 14 days misses
  corruption noticed at a monthly close; 90 keeps deleted people's data for three
  months, and LGPD does not allow keeping personal data in backups indefinitely.
  State the period in `docs/legal/lgpd.md` (see `lgpd-checklist`).
- **The backup credential and the private key never sit in CI secrets, and the
  app never holds them.** Anyone who can push a branch can read CI secrets. Run
  the dump from a host you control.
- At contract end, the client's dumps are handed to the client and deleted from
  the operator's account.
- A free Supabase project pauses after a week without database activity; the
  daily dump counts as activity and keeps it awake.

## Backup types

| Type | What it is | When to use |
|---|---|---|
| Logical (dump) | Exports data as SQL or a portable format (`pg_dump`, `mysqldump`) | The default above; migrating across versions or engines |
| Physical (snapshot) | Copies the raw data files | Large databases, fast restore, same engine and version |
| Incremental | Only what changed since the last backup | Smaller cost, but chained — lose one link and the chain breaks |
| PITR | A base backup plus the continuous transaction log | Restoring to a specific second, not just to when the backup ran |

Logical is portable but slow to restore at size: it rebuilds indexes and
re-checks constraints. `pg_dump`'s major version must be at least the server's.

## The restore check is the product, not the backup

A green backup job proves a file was produced. It does not prove the file
restores, that the data is intact, or that the RTO is reachable.

**Weekly and automatic.** A calendar drill is the one that gets skipped. The
check restores the newest dump into a throwaway Postgres, checks the schema and
a few row counts on key tables, and alerts when the restore fails or the newest
dump is more than a day old.

- **The alert never runs on the machine that makes the dump.** If that host goes
  down, the backup and its alarm go silent together. Each job pings an external
  heartbeat (healthchecks.io's free plan does this) — period 1 day for the
  backup, 7 days for the restore check — and a missed ping alerts.
- What it catches: a key rotation that broke storage access, a scheduled CI
  workflow GitHub disabled after 60 days without commits, a free project paused
  a week after that.

## A real restore

1. **Throwaway database first**, never straight into production. Production is
   restored only in a real disaster, after the throwaway copy checked out.
2. Validate content: row counts on key tables and one business query whose
   answer you can predict (last month's order total).
3. **Re-apply deletions before it goes live**: every deletion request received
   after the dump's date, from the written request trail (email or ticket).
   Otherwise the restore resurrects people who asked to be erased.
4. Measure download plus restore plus validation against the RTO.
5. Record date, result, elapsed time and the dump restored.
6. A failure is an incident, not a retry-later: its cause probably affects the
   next backup too.

Run one by hand after any relevant infrastructure change (engine upgrade,
storage move), on top of the weekly check.

## Signs the backup is not trustworthy

| Sign | Risk |
|---|---|
| Only ever generated, never restored | The dump may be corrupt and nobody would know |
| The failure alert runs on the backup host | Host down means backup and alarm silent together |
| Backup and production in the same account or provider | One compromised account takes both |
| The backup credential or private key in CI secrets | Anyone who can push a branch can read or delete the backups |
| Retention "forever" or a round number nobody checked | Deleted people's data kept past what LGPD allows |
| PITR never replayed to a specific point | "A base backup exists" is not "I can restore to 14:32 on Tuesday" |

## Checklist

- [ ] RPO and RTO written down per system; the data-loss window at the top of the runbook, told to the client
- [ ] A daily dump, encrypted with a public key before it leaves the job, stored off-provider
- [ ] 30-day lifecycle rule and bucket lock; the period stated in `docs/legal/lgpd.md`
- [ ] Backup credential and private key outside CI and outside the app
- [ ] A weekly automatic restore check into a throwaway database, validating schema and row counts
- [ ] Heartbeats for backup and restore check, alerting from outside the backup host
- [ ] Deletion requests after the dump's date re-applied before any restored database goes live
- [ ] Backup access restricted as strictly as live database access — critical in multi-tenant (see `multi-tenant-isolation-audit`)

## By stack

**PostgreSQL (any host, including Supabase and Neon)** — the dump, encrypted on
the way out, and its restore into a throwaway database:
```bash
set -euo pipefail
pg_dump -Fc "$DATABASE_URL" | age -r "$AGE_PUBLIC_KEY" > "db-$(date -u +%F).dump.age"
age -d -i restore-key.txt db-2026-09-28.dump.age | pg_restore --no-owner -d "$THROWAWAY_URL"
```
`pipefail` is what makes a failed `pg_dump` fail the job: without it the pipe
exits with `age`'s status, and a truncated dump reports green. Ping the heartbeat
only after the upload succeeded.
PITR on self-managed Postgres: `pg_basebackup` plus WAL archiving
(`archive_command`), restored via `restore_command` and `recovery_target_time`.

**Supabase** — no backups on the free plan; daily backups from Pro, PITR as a
paid add-on. Take the off-provider dump either way: a provider backup inside the
same project does not survive losing the project.

**Neon** — the free plan's restore window is 6 hours of history; paid plans
extend it. It covers "undo the last hour", not "the account is gone".

**RDS / Cloud SQL** — automated snapshots and native PITR. The restore check is
still yours: restore into a fresh, isolated instance, validate, measure.

**MySQL/MariaDB** — `mysqldump --single-transaction` avoids locking InnoDB; PITR
by a full snapshot plus binlog replay (`mysqlbinlog --start-datetime`).

## Anti-patterns

- ❌ Trusting "the backup job has never failed" without a passing restore
- ❌ The only copy inside the same provider project as the database
- ❌ A dump uploaded unencrypted, or encrypted with a key the backup job also holds
- ❌ The backup alert running on the machine that makes the backup
- ❌ Restoring straight into production, or going live before deletions are re-applied
- ❌ Backup credentials in CI secrets
- ❌ Keeping backups with personal data indefinitely
