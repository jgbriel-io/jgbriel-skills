#!/usr/bin/env bash
# Mirrors the runtime skills (~/.claude/skills = this repo's claude/skills via
# symlink) into the Obsidian vault docs copy. The vault's category folders ARE
# the mapping: a new skill must be placed in a category once by hand; after
# that, this script keeps it in sync. Run from Git Bash.
set -euo pipefail

SRC="$HOME/.claude/skills"
DST="/c/Users/jgabriel/Documents/Obsidian Vault/wiki/Ferramentas/Claude Code/skills"

updated=0
warned=0

for catdir in "$DST"/*/; do
  for skdir in "$catdir"*/; do
    [ -d "$skdir" ] || continue
    name=$(basename "$skdir")
    if [ -d "$SRC/$name" ]; then
      if ! diff -rq --strip-trailing-cr "$SRC/$name" "$skdir" >/dev/null 2>&1; then
        cp -r "$SRC/$name/." "$skdir"
        echo "synced: $(basename "$catdir")/$name"
        updated=$((updated + 1))
      fi
    else
      echo "WARN: $(basename "$catdir")/$name exists in vault but not in runtime (renamed or deleted?)"
      warned=$((warned + 1))
    fi
  done
done

echo "---"
echo "Mirror complete: $updated synced, $warned warnings."
[ "$warned" -gt 0 ] && echo "Warnings need manual attention — the script never deletes vault dirs."
exit 0
