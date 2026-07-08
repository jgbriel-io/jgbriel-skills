---
name: short-kebab-slug
description: One line used to decide recall relevance — say WHAT the fact is, concretely
metadata:
  type: user | feedback | project | reference
---

The fact itself, stated plainly.

**Why:** (feedback/project types) the reason behind it — context that makes the
rule generalizable.

**How to apply:** what Claude should do differently because of this fact.

Link related memories with [[other-memory-slug]].

<!--
Types:
- user      → who the user is (role, expertise, preferences)
- feedback  → guidance the user gave on how to work (include the why)
- project   → ongoing work/constraints not derivable from code or git
- reference → pointers to external resources (URLs, dashboards)

Rules:
- One fact per file. Update or delete stale files instead of duplicating.
- After writing, add one line to MEMORY.md: - [Title](file.md) — hook
- Never store: code, ephemeral state, anything derivable from git log/CLAUDE.md.
-->
