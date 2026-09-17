#!/usr/bin/env bash
# Reports project-scope skills that can never run.
#
# Claude Code resolves same-named skills by SCOPE, and personal beats project:
# with a skill in both ~/.claude/skills/ and <repo>/.claude/skills/, the personal
# one runs and the project one is never invoked or offered. Scope is decided
# before type, so a personal *command* also beats a project *skill* of the same
# name. Nothing errors -- the project skill simply stops existing.
#   https://code.claude.com/docs/en/skills.md#where-skills-live
#
# That makes a project skill reachable only while no personal skill shares its
# name, which the fleet can break at any time without the repo knowing. This is
# the detector for that. Run it after adding any skill to the fleet.
#
#   check-project-skills.sh              scan the default roots
#   check-project-skills.sh <dir> ...    scan specific roots
#
# Exit 0 = every project skill is reachable. Exit 1 = at least one is dead.
# Run from Git Bash.
set -uo pipefail

# A PLUGIN skill does not shadow anything: it is listed under its own namespace,
# so a project `tdd` and a plugin `tdd` coexist as `tdd` and `jgbriel-skills:tdd`.
# Measured, not assumed -- a project skill and a fleet skill with the same name
# were both offered in the same session. The plugin cache is therefore not
# scanned; only unnamespaced personal scope can take a project skill's name.
FLEET="$HOME/.claude/skills"
CMDS="$HOME/.claude/commands"

# Prints the directory of a personal skill by name, or nothing when absent.
fleet_dir() {
  [ -d "$FLEET/$1" ] && printf '%s' "$FLEET/$1"
}
ROOTS=("$@")
[ ${#ROOTS[@]} -eq 0 ] && ROOTS=("/d/Projetos")

shadowed=0
reachable=0
current_repo=""

while IFS= read -r skdir; do
  name=$(basename "$skdir")
  repo=${skdir%/.claude/skills/*}

  if [ "$repo" != "$current_repo" ]; then
    printf '\n%s\n' "${repo#*/Projetos/}"
    current_repo="$repo"
  fi

  by=""
  fdir=$(fleet_dir "$name")
  [ -n "$fdir" ] && by="personal skill"
  [ -f "$CMDS/$name.md" ] && by="${by:+$by and }personal command"

  if [ -n "$by" ]; then
    # A byte-identical copy is dead weight; a divergent one is lost work.
    if [ -n "$fdir" ] && diff -rq --strip-trailing-cr "$skdir" "$fdir" >/dev/null 2>&1; then
      printf '  DEAD (copy)   %-34s shadowed by %s -- identical, safe to delete\n' "$name" "$by"
    else
      printf '  DEAD (BESPOKE)%-34s shadowed by %s -- rename it or the work is lost\n' " $name" "$by"
    fi
    shadowed=$((shadowed + 1))
  else
    printf '  ok            %s\n' "$name"
    reachable=$((reachable + 1))
  fi
done < <(
  # Locate the skills DIRECTORIES, then glob their children -- a plain
  # `find -type f .../SKILL.md` silently skips skills that are symlinks into a
  # shared .agents/skills/, which several repos here use to serve more than one
  # AI tool from one copy. Those are shadowed exactly like any other.
  for root in "${ROOTS[@]}"; do
    find "$root" -type d -name node_modules -prune -o \
                 -type d -path "*/.claude/skills" -print 2>/dev/null
  done | sort -u | while IFS= read -r sd; do
    for d in "$sd"/*/; do
      [ -f "$d/SKILL.md" ] && printf '%s\n' "${d%/}"
    done
  done
)

echo "---"
echo "$reachable reachable, $shadowed dead."
if [ "$shadowed" -gt 0 ]; then
  echo "A DEAD (copy) is only clutter -- the fleet version runs instead."
  echo "A DEAD (BESPOKE) is project-specific work that has never run once: rename it to a name the fleet does not use."
  exit 1
fi
echo "Every project skill is reachable."
exit 0
