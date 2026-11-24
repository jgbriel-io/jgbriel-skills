---
name: land-prs
description: Lands a backlog of open pull requests in conflict-aware rounds, minimizing expensive push and CI cycles. Use when the user says "merge all open PRs", "land the backlog", "mergear tudo", or "sweep the PRs". For one conflicted rebase use resolving-merge-conflicts; for judging one PR use pr-acceptance; for CI design use ci-cd-pipeline.
---

1. **Inventory.** List open PRs oldest first and their touched files. Identify conflict sets: sequential records or migrations with a journal, changelog sequences, single-line lists, and overlapping code regions. Build rounds greedily in age order, with at most one PR from each conflict set per round. Route PRs touching CI workflows to the human owner. Confirm the base, merge style, required checks, and authorization for force-pushes and merges before those actions.

2. **Prepare the round.** Fetch the current base; rebase each PR in its own worktree. If an offline coding agent is available and delegation is authorized, hand it conflicts. Inspect the resolution and grep for remaining conflict markers, even if the agent exits successfully. Resolve conflicts using `resolving-merge-conflicts`. Renumber sequence holders to the next free number on the current base immediately before their round; never reserve numbers across future rounds.

3. **Verify locally.** Install dependencies, run typecheck, full lint, unit tests, focused integration suites touched by each PR, and project-standard checks. For a failing test, rerun it alone and on the plain base. If it also fails on base, cite its tracking issue and treat it as pre-existing; otherwise fix it before pushing. Record results per PR.

4. **Queue pushes.** Prepare a queue file with one whitespace-delimited `<worktree> <branch> <expected remote sha>` per line; paths and branch names must not contain whitespace. The human runs `scripts/owner-queue.sh <queue-file> [log-file]` once, with explicit force-push authorization. Keep the machine idle: pre-push suites compete for local resources. The script checks the remote SHA, uses a force-with-lease and leaves hooks enabled. It refuses concurrent queues. Read the log on failure; prepare a new queue with only `FAILED` lines. Investigate `SKIP` lines separately; never overwrite a moved remote. Remove a stale lock only after confirming no queue is running.

5. **Poll CI.** Run `scripts/poll-checks.sh <pr>...`, not a watch command that can exit while checks are pending. Verify the rollup includes every required check; wait until all are terminal and green. Keep the machine quiet if its self-hosted runner runs CI. Investigate failed, missing, or cancelled checks; never merge on red.

6. **Merge one at a time.** Before each merge, run `scripts/merge-check.sh <pr> <scratch-worktree> [base]` against the freshly fetched base. The scratch worktree must be clean and disposable. Set `MERGE_CHECK_CMD` for the project's typecheck and unit commands; default installs dependencies, then runs `bun run typecheck && bun run test:unit`. On success, copy the full SHA from its output and use `gh pr merge <N> --rebase --match-head-commit <full sha>`, or the repository's merge style with an equivalent head guard. Confirm required CI is green for that SHA. If the host cannot rebase, rebase locally and re-queue with a fresh lease. Do not merge after a failed check.

7. **Repeat.** Start the next round from the new base until the backlog is empty. Propose issues for structural causes, such as a slow CI job or a single-line list.

**Time:** Each round costs one owner push queue plus a CI cycle bounded by the slowest job. Rounds sharing a sequence cannot overlap. Hosted runners are not automatically faster when a global job timeout is tuned for a self-hosted machine.
