#!/usr/bin/env bash
# Mirrors the runtime skills (~/.claude/skills) into the Obsidian vault docs copy.
#
# NOTE: ~/.claude/skills is a REAL DIRECTORY, not a junction into this repo --
# unlike ~/.claude/agents, ~/.claude/commands and ~/.claude/CLAUDE.md, which are.
# So the runtime and this repo drift apart silently unless something reconciles
# them. `--check` below is that something; run it before committing.
#
# The vault's category folders ARE the mapping: a new skill must be placed in a
# category once by hand, after which this keeps it in sync. A skill that never
# gets a folder never syncs at all, and says nothing about it.
#
#   mirror-to-vault.sh            mirror runtime -> vault
#   mirror-to-vault.sh --check    report runtime vs repo drift, change nothing
#
# Run from Git Bash.
set -euo pipefail

SRC="$HOME/.claude/skills"
DST="/c/Users/jgabriel/Documents/Obsidian Vault/wiki/Tools/Claude Code/skills"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/claude/skills"

# Installed as its own external checkout rather than as a fleet skill; not tracked.
IGNORED="impeccable"

is_ignored() { case " $IGNORED " in *" $1 "*) return 0 ;; *) return 1 ;; esac; }

if [ "${1:-}" = "--check" ]; then
  drift=0
  for d in "$SRC"/*/; do
    name=$(basename "$d")
    is_ignored "$name" && continue
    if [ ! -d "$REPO/$name" ]; then
      echo "only in runtime: $name          (commit it, or it is lost on any reinstall)"
      drift=$((drift + 1))
    elif ! diff -rq --strip-trailing-cr "$d" "$REPO/$name" >/dev/null 2>&1; then
      echo "differs:         $name"
      drift=$((drift + 1))
    fi
  done
  for d in "$REPO"/*/; do
    name=$(basename "$d")
    is_ignored "$name" && continue
    [ -d "$SRC/$name" ] || { echo "only in repo:    $name          (not installed)"; drift=$((drift + 1)); }
  done
  echo "---"
  [ "$drift" -eq 0 ] && echo "Runtime and repo agree." || echo "$drift item(s) drifted. Git is NOT authoritative here -- check which side is newer before copying."
  exit 0
fi

updated=0
warned=0

for catdir in "$DST"/*/; do
  for skdir in "$catdir"*/; do
    [ -d "$skdir" ] || continue
    name=$(basename "$skdir")
    # Category-level archive folders are not skills.
    case "$name" in _archived|_*) continue ;; esac
    is_ignored "$name" && continue
    if [ -d "$SRC/$name" ]; then
      if ! diff -rq --strip-trailing-cr "$SRC/$name" "$skdir" >/dev/null 2>&1; then
        cp -r "$SRC/$name/." "$skdir"
        echo "synced: $(basename "$catdir")/$name"
        updated=$((updated + 1))
      fi
    else
      echo "WARN: $(basename "$catdir")/$name is in the vault but not in the runtime (renamed, archived or deleted?)"
      warned=$((warned + 1))
    fi
  done
done

unplaced=0
for d in "$SRC"/*/; do
  name=$(basename "$d")
  is_ignored "$name" && continue
  if ! find "$DST" -mindepth 2 -maxdepth 2 -type d -name "$name" | grep -q .; then
    echo "UNPLACED: $name has no vault folder -- it has never synced and never will until one exists"
    unplaced=$((unplaced + 1))
  fi
done

echo "---"
echo "Mirror complete: $updated synced, $warned warnings, $unplaced unplaced."
[ "$warned" -gt 0 ] && echo "Warnings need manual attention -- the script never deletes vault dirs."
[ "$unplaced" -gt 0 ] && echo "Create a category folder for each unplaced skill, then re-run."
exit 0
