#!/usr/bin/env bash
# Usage: merge-check.sh <pr> <scratch-worktree> [base]
set -u
if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then echo "Usage: merge-check.sh <pr> <scratch-worktree> [base]" >&2; exit 2; fi
pr=$1
wt=$2
base=${3:-main}
cmd=${MERGE_CHECK_CMD:-'bun install --ignore-scripts && bun run typecheck && bun run test:unit'}
fail() { echo "$pr FAIL: $*"; exit 1; }
cd "$wt" || fail "cannot enter scratch worktree"
[ -z "$(git status --porcelain)" ] || fail "scratch worktree is not clean"
git fetch -q origin || fail "fetch failed"
sha=$(gh pr view "$pr" --json headRefOid --jq .headRefOid) || fail "cannot read PR head"
[ -n "$sha" ] || fail "empty PR head"
git checkout -q --detach "origin/$base" || fail "cannot check out base"
cleanup() {
  if [ -f "$(git rev-parse --git-path MERGE_HEAD)" ]; then git merge --abort >/dev/null 2>&1 || return 1; fi
  git checkout -q --detach "origin/$base"
}
trap 'cleanup || echo "$pr FAIL: scratch cleanup failed" >&2' EXIT
if ! git merge -q --no-ff --no-edit "$sha"; then echo "$pr CONFLICT: merge failed"; exit 1; fi
if ! bash -c "$cmd"; then fail "merge checks failed"; fi
if ! cleanup; then trap - EXIT; fail "scratch cleanup failed"; fi
trap - EXIT
echo "$pr OK $sha"
