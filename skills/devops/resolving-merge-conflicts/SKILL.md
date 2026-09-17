---
name: resolving-merge-conflicts
description: Resolve os conflitos de um merge ou rebase já em andamento — lê a intenção original de cada lado antes de escolher, preserva as duas onde dá, roda os checks do projeto e fecha o merge. Use quando o usuário disser "resolve os conflitos", "deu conflito no merge", "conflito no rebase", ou quando um comando git parar em estado de conflito. Nunca aborta o merge por conta própria.
---

1. **See the current state** of the merge/rebase. Check git history, and the conflicting files.

2. **Find the primary sources** for each conflict. Understand deeply why each change was made, and what the original intent was. Read the commit messages, check the PRs, check original issues/tickets.

3. **Resolve each hunk.** Preserve both intents where possible. Where incompatible, pick the one matching the merge's stated goal and note the trade-off. Do **not** invent new behaviour. Always resolve; never `--abort`.

4. Discover the project's **automated checks** and run them — typically typecheck, then tests, then format. Fix anything the merge broke.

5. **Finish the merge/rebase.** Stage everything and commit. If rebasing, continue the rebase process until all commits are rebased.
