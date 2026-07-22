---
name: skill-sync
description: Sync the skill fleet across its three points and against upstream mattpocock/skills — diff local vs upstream, pull updates preserving local adaptations, adapt matt-specific cross-refs, mirror to the vault, and stage the D: repo commit. Use when the user says "sincroniza as skills", "atualiza do mattpocock", "verifica updates do repo do matt", "puxa as skills novas", or after noticing upstream drift. Quality scoring is skill-audit; creating skills is skill-creator.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Skill Sync

Keeps the three-point skill system consistent and current against upstream.
Validated workflow from the 2026-07-08 sync.

## The three points

1. `~/.claude/skills/` — runtime (symlinked to point 2; editing one edits both)
2. `D:\Projetos\projetos-pessoais\jgabriel-skills\claude\skills\` — git repo, where commits happen
3. `Obsidian Vault\wiki\Ferramentas\Claude\skills\<categoria>\` — docs mirror, manual copy

Upstream: `https://github.com/mattpocock/skills` (skills under
`skills/<category>/<name>/`). Vendor packs (Cloudflare) have their own
upstream — out of scope here.

## Process

### 1. Fetch upstream

Shallow-clone to the scratchpad (never into a repo):
`git clone --depth 1 https://github.com/mattpocock/skills <scratchpad>/mattpocock-skills`
Note the latest commit date — tells how stale the last sync is.

### 2. Classify every skill

For each upstream skill vs `~/.claude/skills/<name>`, using
`diff -rq --strip-trailing-cr` (CRLF noise otherwise flags whole files):

- **SAME** — nothing to do
- **DIFF** — count divergent lines (`diff | grep -c '^[<>]'`); inspect small
  diffs inline before deciding
- **MISSING-LOCAL** — upstream skill not installed (adoption candidate)
- **LOCAL-ONLY** — the user's own skills; upstream irrelevant

Watch for upstream **renames** (e.g. diagnose → diagnosing-bugs): a MISSING +
LOCAL-ONLY pair with near-identical content is a rename, not two skills.

### 3. Protected local adaptations — never overwrite

- `obsidian-vault` — full local rewrite for the user's actual vault
- `setup-pre-commit` — local ask-before-committing rule (step 8)
- `diagnose` — local name kept (upstream calls it diagnosing-bugs)
- Any skill whose divergence IS a local fix from an audit — check
  `wiki/Ferramentas/Claude/docs/SKILL-QUALITY.md` audit history when unsure

For these, pull upstream content only by merging around the local adaptation,
never by wholesale copy.

### 4. Present the plan, then pull

Show a table (skill · divergence · recommendation: pull / keep local / merge /
adopt / skip) and wait for approval. Then copy approved dirs wholesale
(`cp -r upstream/. local/`) — reference files travel with the skill.

### 5. Adapt matt-specific context

Imported skills are never ready as-is. After pulling, grep the pulled skills for:

- `/setup-matt-pocock-skills` → replace with "configured in the project's
  `CLAUDE.md` or equivalent context file"
- `diagnosing-bugs` → `diagnose` · `grill-me` → `grill-me`
- `ask-matt`, matt's URLs/paths → remove or adapt

Verify with a final grep — zero leftovers.

### 6. Mirror and record

- Run `scripts/mirror-to-vault.sh` (repo root) to sync every changed skill to the vault; new skills also get
  a row in the vault `skills/index.md` (and update the counts there and in the
  Claude `index.md`).
- Append a sync entry to SKILL-QUALITY.md's audit section: date, pulled,
  adopted, protected.
- New skills go on the pending list for a `/skill-audit` pass.

### 7. Commit

Changes land in the D: repo working tree automatically (symlink). Ask the
user before committing; Conventional Commits, English. The vault auto-commits
via its Obsidian Git hook.
