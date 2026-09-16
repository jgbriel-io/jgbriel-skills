---
name: token-audit
description: Audit Claude Code token consumption across all sessions and projects — weekly trend, heaviest sessions/projects, marathon-session detection (long-lived sessions that compound cache_read cost every turn), and turn-dense skill detection (a skill burning many turns in a short window, independent of session length, catching loop-style skills like a past "impeccable" incident before they become chronic). Use when the user says "quanto token eu gastei", "token audit", "quais skills custam mais", "sessão gastando muito", "check my usage", or as periodic maintenance (suggested monthly).
allowed-tools: Bash, Read
---

# Token Audit

Run the bundled script — it reads `~/.claude/projects/**/*.jsonl` (all
projects, all sessions) and prints only derived summaries, never raw
transcript content:

```bash
node "$(dirname "$0")/scripts/analyze.mjs"
```

(Or reference the absolute path directly:
`~/.claude/skills/token-audit/scripts/analyze.mjs`.)

## What it reports

1. **Weekly totals** (last 8 weeks) — spot a spike week over week.
2. **Top 10 projects** by total tokens.
3. **Marathon sessions** — span > 4h or > 500 turns. These are the #1 cost
   driver: a long-lived session re-sends (cache_read) its entire
   accumulated history every turn, so cost compounds with turn count, not
   with actual work done. If one shows up, the fix is session hygiene —
   checkpoint (commit / update tasks / save to memory) and `/clear`, not a
   skill-level fix.
4. **Turn-dense skills** — a single skill running >100 turns inside a
   session *under* 6h. This is the check a marathon-only view misses: a
   skill can be expensive on its own terms (a long critique/iteration loop)
   without the session itself being a marathon. If a skill shows up here
   repeatedly, that skill's own loop behavior is the thing to fix or retire
   — not session hygiene.
5. **Top 15 skills/plugins by total tokens**, with avg tokens/turn. High
   avg/turn alone is not damning — cross-check against #3 and #4 first:
   most "expensive skills" turn out to be ordinary skills that happened to
   run inside an already-marathon session, not independently wasteful.

## Interpreting results

- Marathon session + skill NOT turn-dense → session hygiene problem, not a
  skill problem. Don't touch the skill.
- Skill turn-dense in a short session → skill-loop problem. Consider
  retiring/replacing the skill (precedent: `impeccable`, swapped out in the
  2026-08 design-skills rotation for exactly this reason).
- Neither → no action needed, this is normal usage.

## Thresholds

Tunable at the top of `scripts/analyze.mjs`: `MARATHON_HOURS` (4),
`MARATHON_TURNS` (500), `SKILL_LOOP_TURNS` (100), `SKILL_LOOP_HOURS` (6).
Adjust if normal workflow trips false positives.
