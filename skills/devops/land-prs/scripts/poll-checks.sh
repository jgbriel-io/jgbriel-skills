#!/usr/bin/env bash
# Usage: poll-checks.sh <pr>...
# Polls every 120 s until no check is pending; exits 1 when any finished check is not green.
set -u
if [ "$#" -eq 0 ]; then echo "Usage: poll-checks.sh <pr>..." >&2; exit 2; fi
summary='[.statusCheckRollup[] | {n: (.name // .context), r: (if .__typename == "StatusContext" then (if .state == "PENDING" or .state == "EXPECTED" then "PENDING" else .state end) elif .status == "COMPLETED" then (.conclusion // "UNKNOWN") else "PENDING" end)}]
  | (if length == 0 then "PENDING" elif any(.[]; .r == "PENDING") then "PENDING" elif all(.[]; .r == "SUCCESS" or .r == "SKIPPED" or .r == "NEUTRAL") then "GREEN" else "RED" end)
    + " " + (map("\(.n)=\(.r)") | join(" "))'
while :; do
  pending=0
  red=0
  for pr in "$@"; do
    line=$(gh pr view "$pr" --json statusCheckRollup --jq "$summary") || { echo "$pr FAIL: cannot read checks" >&2; exit 1; }
    echo "$pr $line"
    case $line in
      PENDING*) pending=1 ;;
      RED*) red=1 ;;
    esac
  done
  [ "$pending" -eq 0 ] && exit "$red"
  sleep 120
done
