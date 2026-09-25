#!/usr/bin/env bash
# Audita a taxonomia de label dos repos do pipeline PRD-para-issue.
# Regra canonica: ~/.claude/CLAUDE.md secao 16. Sai 1 se houver violacao.
set -uo pipefail

REPOS="${*:-$(cat "$(dirname "$0")/.pipeline-repos" 2>/dev/null)}"
[ -n "$REPOS" ] || { echo "usage: audit-labels.sh <owner/repo>...  (or list them in scripts/.pipeline-repos)" >&2; exit 2; }

STATES="needs-triage needs-info ready-for-agent ready-for-human wontfix"
TYPES="bug enhancement docs"
MODELS="opus sonnet haiku"

violations=0

in_list() { echo " $2 " | grep -q " $1 "; }

for repo in $REPOS; do
  milestones=0
  for f in CLAUDE.md AGENTS.md; do
    grep -qi 'domain axis: milestones' <<<"$(gh api "repos/$repo/contents/$f" -H "Accept: application/vnd.github.raw" 2>/dev/null)" && milestones=1
  done
  [ "$milestones" -eq 1 ] && echo "== $repo  (domain: milestones)" || echo "== $repo"

  while IFS=$'\t' read -r number milestone labels; do
    [ -z "$number" ] && continue
    nstate=0; ntype=0; nmodel=0
    for l in $labels; do
      case "$l" in
        state:*) nstate=$((nstate+1))
                 in_list "${l#state:}" "$STATES" || { echo "  #$number  valor invalido: $l"; violations=$((violations+1)); } ;;
        type:*)  ntype=$((ntype+1))
                 in_list "${l#type:}" "$TYPES" || { echo "  #$number  valor invalido: $l"; violations=$((violations+1)); } ;;
        model:*) nmodel=$((nmodel+1))
                 in_list "${l#model:}" "$MODELS" || { echo "  #$number  valor invalido: $l"; violations=$((violations+1)); } ;;
        domain:*) [ "$milestones" -eq 1 ] && { echo "  #$number  label domain: em repo de milestones: $l"; violations=$((violations+1)); } ;;
        *) echo "  #$number  sem prefixo conhecido: $l"; violations=$((violations+1)) ;;
      esac
    done
    [ "$nstate" -ne 1 ] && { echo "  #$number  $nstate label state: (esperado 1)"; violations=$((violations+1)); }
    [ "$nmodel" -ne 1 ] && { echo "  #$number  $nmodel label model: (esperado 1)"; violations=$((violations+1)); }
    [ "$ntype" -gt 1 ]  && { echo "  #$number  $ntype label type: (esperado 0 ou 1)"; violations=$((violations+1)); }
    [ "$milestones" -eq 1 ] && [ "$milestone" = "-" ] && { echo "  #$number  sem milestone (esperado 1)"; violations=$((violations+1)); }
  done < <(gh issue list -R "$repo" --state open --limit 300 \
             --json number,labels,milestone --jq '.[] | "\(.number)\t\(.milestone.title // "-")\t\([.labels[].name] | join(" "))"')

  for l in $(gh label list -R "$repo" --limit 200 --json name --jq '.[].name'); do
    case "$l" in
      state:*|type:*|model:*|domain:*) ;;
      *) echo "  label fora da taxonomia: $l"; violations=$((violations+1)) ;;
    esac
  done
done

echo
if [ "$violations" -eq 0 ]; then echo "sem violacoes"; else echo "$violations violacoes"; fi
exit $(( violations > 0 ? 1 : 0 ))
