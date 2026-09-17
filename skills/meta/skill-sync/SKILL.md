---
name: skill-sync
description: Sync the skill fleet against its upstreams — mattpocock/skills and lucasmonstrox/utevo-lux — diffing repo vs upstream, pulling updates around local adaptations, adapting upstream-specific cross-refs, then republishing through the plugin marketplace. Use when the user says "sincroniza as skills", "atualiza do mattpocock", "verifica updates do upstream", "puxa as skills novas", or after noticing upstream drift. Quality scoring is skill-audit; creating skills is skill-creator.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Skill Sync

Keeps the fleet current against upstream. The fleet ships as **plugins**, so the
repo is the only place anything is edited.

## Where everything lives

1. `skills/<categoria>/<name>/` in this repo — **the source of truth.**
   Every edit happens here, and nowhere else.
2. `~/.claude/plugins/cache/<marketplace>/<plugin>/<versão>/` — the runtime.
   A **versioned copy** pinned to a `gitCommitSha`; `claude plugin update` is what
   refreshes it. Never edit it: the next update overwrites the whole version dir.
3. `Obsidian Vault\wiki\Tools\Claude Code\skills\<categoria>\` — docs mirror,
   manual copy.

On the machine where skills get written, register the working copy itself:
`claude plugin marketplace add <path do repo>`. A **directory** marketplace reads
straight from the working tree — no clone — so a pull lands the moment you bump
the plugin's `version` and run `claude plugin update`. Other machines add the
GitHub repo instead.

Upstreams: `https://github.com/mattpocock/skills` (skills under
`skills/<category>/<name>/`) and `https://github.com/lucasmonstrox/utevo-lux`
(under `plugins/utevo-lux/skills/<name>/`), which is the second upstream for the
core loop. Vendor packs (Cloudflare) have their own upstream — out of scope here.

## Process

### 1. Fetch upstream

Shallow-clone to the scratchpad (never into a repo):
`git clone --depth 1 https://github.com/mattpocock/skills <scratchpad>/mattpocock-skills`
Note the latest commit date — tells how stale the last sync is.

### 2. Classify every skill

For each upstream skill vs its counterpart in `skills/*/<name>`, using
`diff -rq --strip-trailing-cr` (CRLF noise otherwise flags whole files). Resolve
the local path once — `find skills -maxdepth 2 -type d -name <name>` — because a
skill can sit in any category:

- **SAME** — nothing to do
- **DIFF** — count divergent lines (`diff | grep -c '^[<>]'`); inspect small
  diffs inline before deciding
- **MISSING-LOCAL** — upstream skill absent from every plugin (adoption candidate;
  adopting it means choosing which category plugin it joins)
- **LOCAL-ONLY** — the user's own skills; upstream irrelevant

Watch for upstream **renames** (e.g. diagnose → diagnosing-bugs): a MISSING +
LOCAL-ONLY pair with near-identical content is a rename, not two skills.

### 3. Protected local adaptations — never overwrite

- `obsidian-vault` — full local rewrite for the user's actual vault
- `setup-pre-commit` — local ask-before-committing rule (step 8)
- `diagnose` — local name kept (upstream calls it diagnosing-bugs)
- `grill-me` — local name kept, but the content tracks upstream **`grilling`**,
  not upstream `grill-me`. Diffing it against the same-named skill will always
  show total divergence; diff against `grilling` instead.
- **The core loop — `discuss`, `research`, `plan`, `implement`, `diagnose`,
  `pr-acceptance` (which absorbed `resolve-review`).** Each is a three-way merge of this repo's
  version, `mattpocock/skills` and [`lucasmonstrox/utevo-lux`](https://github.com/lucasmonstrox/utevo-lux),
  and utevo-lux is a **second upstream** for them. A wholesale pull from Matt
  reverts that merge. `plan` and `pr-acceptance` have no upstream counterpart at
  Matt's at all. Treat divergence here as intentional until diffed against both.
- Any skill whose divergence IS a local fix from an audit — check
  `wiki/Tools/Claude Code/docs/Skills Quality Criteria.md` audit history when unsure

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
- `diagnosing-bugs` → `diagnose` · upstream `grilling` → `grill-me`
- `ask-matt`, matt's URLs/paths → remove or adapt

Verify with a final grep — zero leftovers.

### 6. Mirror and record

- Mirror every changed skill into the vault docs copy by hand
  (`Obsidian Vault\wiki\Tools\Claude Code\skills\<categoria>\<name>\`); new
  skills also get a row in the vault `skills/index.md`, and the counts there and
  in the Claude `index.md` get updated. The old `mirror-to-vault.sh` was removed —
  it hardcoded one machine's vault path and only ever ran from Git Bash.
- Append a sync entry to the audit section of `Skills Quality Criteria.md`: date, pulled,
  adopted, protected.
- New skills go on the pending list for a `/skill-audit` pass.

### 7. Commit and republish

1. **Bump `version` in `.claude-plugin/plugin.json`.** The fleet is one plugin.
   The runtime is pinned to a version and a commit; without a bump, `update` has
   nothing to install and the pull silently never reaches any machine.
2. Ask the user before committing; Conventional Commits, English.
3. `claude plugin update jgbriel-skills` on this machine to land it, then the
   same on the others. `claude plugin validate .` before pushing catches a broken
   manifest earlier than any of them.

The vault auto-commits via its Obsidian Git hook.
