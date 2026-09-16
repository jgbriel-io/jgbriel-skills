---
name: skill-audit
description: Audit installed Claude Code skills against the C1–C11 quality rubric — per-skill scores, automatic blockers, trigger-collision analysis across sibling skills, and fixes applied in the repo and republished to the runtime. Use when the user says "auditar skills", "revisar as skills", "skill audit", "minhas skills estão boas?", after importing skills from external repos (imported skills are never ready as-is), or as periodic maintenance. Audits one category at a time by default.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Skill Audit

Audit the user's Claude Code skills with the rubric below. Full rubric,
scoring rationale, and audit history live in the vault:
`wiki/Tools/Claude Code/docs/Skills Quality Criteria.md` — read it first if available,
and append results there when done.

## Where skills live

1. `plugins/<categoria>/skills/<name>/` in the repo — **the only place to edit,
   and the only place to fix anything this audit finds.** Commits happen here
   (Conventional Commits, English).
2. `~/.claude/plugins/cache/<marketplace>/<plugin>/<versão>/` — the runtime, a
   versioned copy. Audit **reads** it only to confirm what is actually loaded;
   never write there, since the next `plugin update` replaces the version dir.
3. `Obsidian Vault\wiki\Tools\Claude Code\skills\<categoria>\<name>\` —
   documentation mirror, manual copy.

A fix therefore lands as: edit the repo → bump the plugin's `version` → commit →
`claude plugin update`. An audit that edits the cache fixes nothing.

Vendor packs (Cloudflare) are tracked in the repo but deliberately not
mirrored to the vault.

## Process

1. **Confirm you are scoring what actually loads.** The repo is canonical, but
   the runtime is a pinned copy, so a repo edit that was never published is not
   in play yet: `diff -rq --strip-trailing-cr plugins/<cat>/skills/<name> ~/.claude/plugins/cache/<marketplace>/<cat>/<versão>/skills/<name>`.
   CRLF vs LF makes whole files look changed — always strip. A difference means
   the plugin needs a version bump and an update, and it is worth saying so
   before scoring. Then diff the vault mirror the same way; it may hold skills
   that were never published at all.
2. **Score each skill** against the rubric (below). Check automatic blockers
   first — they fail the skill regardless of score.
3. **Audit the category as a set**, not just skill by skill. Trigger overlap
   and contradictions between siblings (two skills both claiming "code
   review"; one mandating what another bans) only show up when descriptions
   and rules are compared side by side.
4. **Apply fixes in the repo only**, then publish: edit
   `plugins/<cat>/skills/<name>/`, bump that plugin's `version`, and copy to the
   vault mirror. Editing the runtime cache fixes nothing — the next update
   overwrites it. Big files: split by line ranges (`sed -n 'A,Bp'`) into
   `references/` + pointer stubs — content moves verbatim, nothing gets rewritten
   or loaded into context.
5. **Deletions always need explicit user confirmation.** Recommend, wait, then
   delete from the repo and the vault mirror, prune index references, and bump
   the plugin so the removal actually reaches the runtime.
6. **Commit in the repo** when the user asks, then `claude plugin update`; the
   vault auto-commits via its Obsidian Git hook (watch for stale 0-byte
   `.git/index.lock`).
7. **Record results** in `Critérios de Qualidade das Skills.md`'s audit section: date, per-category
   state, unresolved items.

## Rubric (C1–C11)

Score 0 (violates) / 1 (partial) / 2 (meets) per applicable criterion.

| # | Criterion | What passes |
|---|---|---|
| C1 | Discovery | Valid `name` (≤64 chars, kebab); description states what + when, concrete triggers the user would actually type, third person, no overlap with sibling skills |
| C2 | Concision | Body < 500 lines as target (Anthropic guidance); up to 750 acceptable when the content is dense rules with no filler; assumes Claude is smart; every section earns its tokens |
| C3 | Progressive disclosure | SKILL.md as navigable overview; references one level deep; mutually-exclusive contexts in separate files |
| C4 | Degrees of freedom | Rigid instructions for fragile operations, latitude for open-ended tasks — matched, not defaulted |
| C5 | Workflows | Numbered steps, feedback loops (validate → fix → repeat), explicit exit condition |
| C6 | Rules with reasons | "Do X because Y" over ALL-CAPS MUSTs — the reason generalizes to unforeseen cases |
| C7 | Templates/examples | Input/output pairs where quality depends on them; strictness proportional to need |
| C8 | Terminology | One term per concept throughout |
| C9 | Code/scripts | Explicit dependencies, run-vs-read clarity, no magic constants, MCP tools fully qualified |
| C10 | Timelessness | No data that rots (dates, stale metrics, versions without need) |
| C11 | Tested | Iterated against real usage, not assumptions |

**Automatic blockers** (fail regardless of score): vague description ·
body > 750 lines with no split · trigger overlap with an installed sibling ·
leftover context from the original author (foreign paths, other tools like
Codex/Cursor, someone else's project data — imported skills are never ready
as-is).

**Verdict:** ≥85% keep · 60–84% adjust · <60% rewrite or delete.

## Report format

Per category, deliver:

```
## <categoria>/<skill> — <OK|Ajustar|Reescrever> (<pts>/<max> · <pct>%)
<table or bullets: only criteria scoring < 2, with evidence file:line>
Fix: <one line per fix, or "nenhum">
```

End the category with cross-skill findings (collisions, contradictions,
undocumented or uninstalled skills) and the applied-fixes list. Cheap
unambiguous fixes: apply directly. Structural decisions (delete, merge,
demote to explicit preset via `disable-model-invocation`) — present options
and ask.
