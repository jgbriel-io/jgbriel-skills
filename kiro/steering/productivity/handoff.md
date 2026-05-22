---
inclusion: manual
description: Compact the current conversation into a handoff document for another agent or session to pick up
---

# Handoff

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to a temp file (`mktemp -t handoff-XXXXXX.md`).

- Suggest skills to be used by the next session, if any
- Do not duplicate content already in other artifacts (PRDs, plans, ADRs, issues, commits, diffs) — reference by path or URL
- If user passed arguments, treat them as description of what the next session will focus on and tailor accordingly
