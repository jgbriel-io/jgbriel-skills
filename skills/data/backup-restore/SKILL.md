---
name: backup-restore
description: Explains backup strategy and restore testing for relational databases — full vs. incremental vs. PITR, RPO/RTO, retention, and the periodic restore drill that proves a backup is actually usable. Database/tool-agnostic. Use when user asks about backup, disaster recovery, RPO, RTO, PITR, restore, or snapshot.
---

# Backup & Restore

A backup that has never been restored is not a backup — it is an untested bet.
The question that matters is not "do we have backups?" but "when did we last
restore one, and how long did it take?". This holds for any relational database
and any tool: `pg_dump`, `mysqldump`, native PITR, a managed cloud snapshot.

## RPO and RTO — decide before picking a tool

| Metric | Question | Determines |
|---|---|---|
| RPO (Recovery Point Objective) | How much data can we afford to lose? | Backup frequency, whether PITR is required |
| RTO (Recovery Time Objective) | How long can we be down? | Restore strategy, database size, automation |

Without RPO and RTO, "do backups" is a task with no success criterion. A 5-minute
RPO demands PITR (WAL/binlog replay); a nightly dump cannot meet it. A 15-minute
RTO demands a tested, automated restore, not a 40-step manual runbook.

## Backup types

| Type | What it is | When to use |
|---|---|---|
| Logical (dump) | Exports data as SQL or a portable format (`pg_dump`, `mysqldump`) | Migrating across versions or engines, small backups, portability |
| Physical (snapshot) | Copies the raw data files from disk | Large databases, fast restore, same engine and version |
| Full | A complete copy at one instant | The base of any strategy; most expensive in space and time |
| Incremental | Only what changed since the last backup | Smaller window and cost, but chains dependencies — lose one link and the chain breaks |
| PITR | A full backup plus a continuous transaction log (WAL/binlog) | Restoring to a specific second, not just to whenever the backup ran |

Logical is portable but slow to restore at size: it rebuilds indexes and
re-checks constraints. Physical restores fast but usually demands the same engine
version and architecture.

## Retention and storage

```
# ❌ backup on the same instance and disk as the production database
/var/lib/postgresql/backups/dump.sql

# ✅ replicated to storage outside the original database's blast radius
# (another region, another account or project, immutable storage where available)
```

- 3-2-1 as the floor: 3 copies, 2 different media or storage systems, 1 off-site
  or in another region.
- Layered retention: daily (7–14 days) plus weekly (4–8 weeks) plus monthly
  (6–12 months), adjusted to whatever the client's contract or regulator demands.
- Encrypted at rest and in transit. A backup is the same data in another format,
  so it deserves the same protection as the live database.
- Retention or immutability policy (WORM, object lock) where the threat model
  includes ransomware or malicious deletion: a backup that whoever holds database
  access can also delete does not cover that case.
- A multi-tenant backup carries every client's data, so access to it must be at
  least as restricted as access to the live database — see
  `multi-tenant-isolation-audit`.

## The restore drill is the product, not the backup

A green backup job proves the dump was produced. It does not prove the dump
restores, that the data is intact, or that the agreed RTO is reachable.

```
# ❌ "the backup runs nightly and has never failed" — with no restore ever performed
# ✅ a real restore, in an isolated environment, with content validation, on a fixed cadence
```

Minimum drill runbook:

1. Provision an isolated environment — not the same instance and not the same
   network as production.
2. Restore the most recent backup, or a random point inside the retention window,
   so the drill does not always exercise the easiest path.
3. Validate content: row counts on key tables, a checksum, and one known business
   query whose answer you can predict (last month's order total, say).
4. Measure the whole thing — download plus restore plus validation — and compare
   it against the agreed RTO.
5. Record the result: date, success or failure, elapsed time, version restored.
   The history of drills is the evidence that the backup is trustworthy; the
   existence of a file is not.
6. On failure, treat it as an incident rather than something to retry later. The
   cause — a corrupt dump, an expired credential, unreachable storage — probably
   affects the next backup too.

Cadence: quarterly at a minimum, monthly for critical or regulated data, and
always after a relevant infrastructure change (engine upgrade, storage migration,
replication topology change).

## Signs the backup is not trustworthy

| Sign | Risk |
|---|---|
| Only ever generated, never restored | The dump may be corrupt or incomplete and nobody would know |
| Restore only ever tested against a small, empty dev database | The real RTO is unknown; production volume changes everything |
| Access to backup storage untested for months | A key rotation may have broken the job silently |
| Backup and production in the same account and region, unisolated | One compromised account or regional outage takes both |
| No alert on backup job failure | The job can be broken for weeks unnoticed |
| PITR with no replay test to a specific point | "A full backup exists" is not "I can restore to 14:32 on Tuesday" |

## Checklist

- [ ] RPO and RTO defined and written down per system or client, not one generic number for everything
- [ ] Backup automated, with an active alert when the job fails
- [ ] Backup replicated to storage separate from the production instance (3-2-1 as the floor)
- [ ] Layered retention configured and matched to contractual or regulatory demands (see `lgpd-checklist`)
- [ ] Encrypted at rest and in transit
- [ ] Restore drilled in an isolated environment on a fixed cadence, with content validation — not just "the command exited zero"
- [ ] Restore time measured and compared against the agreed RTO
- [ ] Every drill recorded: date, success or failure, elapsed time
- [ ] Backup access restricted as strictly as live database access — critical in multi-tenant
- [ ] PITR, where used, tested by replaying to a specific point rather than by the log's existence

## By stack

**Supabase** — daily automated backups on every plan; PITR from Pro up. The
restore drill is still manual: restore into a fresh, isolated Supabase project,
run the content validation, measure the time. Managed backups do not remove the
need to test the restore.

**PostgreSQL (self-managed)** — logical with `pg_dump -Fc` (custom format,
restored by `pg_restore`, supports parallel and per-table restore); PITR with
`pg_basebackup` plus continuous WAL archiving (`archive_command`), restored via
`restore_command` and `recovery_target_time`.

**RDS / Cloud SQL (managed snapshots)** — automated backups and native PITR. The
drill is still manual: restore the snapshot or PITR target into a fresh, isolated
instance, validate, measure.

**MySQL/MariaDB** — logical with `mysqldump --single-transaction`, which avoids
locking InnoDB; PITR by combining a full snapshot with binlog replay
(`mysqlbinlog --start-datetime`) up to the chosen point.

## Anti-patterns

- ❌ Trusting "the backup job has never failed" without ever having restored
- ❌ Drilling only against an empty dev database, never at production volume
- ❌ Backup in the same account, region or instance as the original, with no isolated copy
- ❌ No alert for a silently failing backup job
- ❌ A generic retention window (7 days, say) chosen without checking the client's contractual or regulatory requirement
- ❌ Unencrypted backups, or backups with looser access control than the live database
- ❌ RPO and RTO never discussed with the client, and discovered during the incident
- ❌ PITR configured but never replayed to a specific point in time
- ❌ A multi-tenant backup reachable by someone who could not reach every tenant in the live database
