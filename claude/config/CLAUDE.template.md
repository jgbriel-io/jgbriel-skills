# <Global work rules | Project: name> — Claude Code

<!--
Global (~/.claude/CLAUDE.md): rules for EVERY session. Paid every turn —
prune hardest of all file types.
Project (<repo>/.claude/CLAUDE.md): only what diverges from or extends the
global. Never repeat global rules here.
Litmus per line: "must Claude ALWAYS obey this?" If only sometimes → skill.
If only on request → command. If it's a fact about the domain → context file.
-->

## 1. <Domain of rules — e.g. Language, Environment, Git>

- Rule stated as behavior, not aspiration ("Never commit without being asked",
  not "be careful with commits").
- Why, in one line, when the reason makes the rule generalizable.

## 2. <Next domain>

| When | Do |
|---|---|
| <situation> | <behavior> |

<!--
Section menu that earns its place in most setups:
Language · Environment/shell · Model & costs · Response style · Code editing
rules · Risky operations (confirm-first list) · Git & commits · Security ·
Memory · When in doubt.

Anti-patterns:
- Narrating defaults Claude already follows (no-op lines).
- Duplicating what a skill/command already encodes — point to it instead.
- Stale facts (versions, model names, metrics) — they rot; keep them in ONE
  place and reference it.
-->

---

_Last revised: YYYY-MM-DD. Update as standards change._
