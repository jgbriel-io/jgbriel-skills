#!/usr/bin/env bash
# Usage: owner-queue.sh <queue-file> [log-file]
set -u
if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then echo "Usage: owner-queue.sh <queue-file> [log-file]" >&2; exit 2; fi
queue=$1
log=${2:-"$queue.log"}
lock=${TMPDIR:-/tmp}/land-prs-owner-queue.lock
if [ ! -r "$queue" ]; then echo "Cannot read queue: $queue" >&2; exit 2; fi
if ! mkdir "$lock" 2>/dev/null; then echo "Queue lock held: $lock" >&2; exit 1; fi
trap 'rmdir "$lock"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
if ! touch "$log"; then exit 1; fi
result=0
while read -r wt branch expected extra || [ -n "${wt:-}" ]; do
  [ -z "${wt:-}" ] && continue
  if [ -z "${branch:-}" ] || [ -z "${expected:-}" ] || [ -n "${extra:-}" ]; then
    echo "FAILED ${branch:-invalid-line}" | tee -a "$log"; result=1; continue
  fi
  if ! remote=$(git -C "$wt" ls-remote --exit-code origin "refs/heads/$branch" 2>>"$log"); then
    echo "FAILED $branch" | tee -a "$log"; result=1; continue
  fi
  now=${remote%%[[:space:]]*}
  if [ "$now" != "$expected" ]; then
    echo "SKIP $branch: remote is $now, expected $expected" | tee -a "$log"; result=1; continue
  fi
  if git -C "$wt" push --force-with-lease="refs/heads/$branch:$expected" origin "HEAD:refs/heads/$branch" >>"$log" 2>&1 < /dev/null; then
    short=$(git -C "$wt" rev-parse --short HEAD)
    echo "PUSHED $branch $short" | tee -a "$log"
  else
    echo "FAILED $branch" | tee -a "$log"; result=1
  fi
done < "$queue"
exit "$result"
