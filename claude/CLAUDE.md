# Global work rules — Claude Code

These rules apply to **all** projects in user `jgabriel`'s environment
(Windows 11, PowerShell). Individual projects can override via
`<project>/.claude/CLAUDE.md` or `<project>/.claude/settings.json`.

---

## 1. Language

**Default is English** (changed 2026-08-14). The user is deliberately moving his whole
ecosystem — repos, vault, chats — to English, partly to practise the language. Do not
switch back to Portuguese on your own.

- **Conversation, explanations, error messages:** English.
- **Code, identifiers, function names, variables:** English.
- **Commit messages, PR titles/descriptions, branches:** English,
  Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`).
- **Technical docs in repos (`README.md`, `docs/`):** English.

**Portuguese stays** where the audience is Brazilian and translating would make the text
worse, not better:

- **End-user-facing UI strings** — products are sold in Brazil. Docs in English, interface in
  Portuguese; these are separate rules, never merge them.
- **Legal and compliance texts** — LGPD is Brazilian law, and *controlador*, *operador* and
  *titular* are legal terms in Portuguese, not translations of controller/processor. Same for
  contracts, EULAs and commercial proposals.
- **Reverse-engineered material from a Portuguese codebase** — English prose wrapped around
  identifiers like `statusAtendimento` invents a third vocabulary.
- **Anything already archived.** Dead files are never rewritten.

The user still writes to you in Portuguese sometimes; that is not a request to switch back.
Answer in English unless he asks otherwise. If he asks about his English, correct it in one
line and carry on — never turn the task into a language lesson.

## 2. Environment

- **Two machines, and the shell differs.** Windows 11 is the main one: PowerShell
  syntax (`$env:VAR`, `$null`, backtick continuation), backslash paths, Git Bash
  reachable through the `Bash` tool for POSIX scripts. The work machine is Ubuntu:
  plain bash, forward slashes. Check which one you are on before writing a command
  — a PowerShell one-liner fails silently enough on Linux to waste a turn.
- When generating paths in portable code, use `path.join` / `pathlib` instead of strings.

## 3. Model and costs

- Main-loop model is the **user's choice** via `/model` — Claude never
  switches it on its own. When the active model clearly mismatches the task,
  **suggest the switch and ask first**; the user runs `/model`.
- Tier guide (moving UP always requires asking first):

| Tier | Use for |
|---|---|
| **Haiku** | Mechanical/repetitive: mass renames, formatting, extraction, short summaries, read-only fan-out subagents |
| **Sonnet** | Day-to-day default: features, fixes, docs, ordinary reviews — best cost/speed |
| **Opus** | Heavy reasoning: architecture, hard debugging, broad refactors, design decisions |
| **Fable/Mythos (above Opus)** | Critical work: deep audits, complex multi-system planning, tasks where Opus fell short |

- Subagents (Agent tool `model` param): omit by default — inherit the session
  model. Downshifting a mechanical subagent to `haiku` is fine without asking
  (pure cost saving, no risk). Running a subagent on a tier ABOVE the session
  model: ask first.

## 4. Response style

- **Be concise.** No preambles ("Sure!", "Of course!"), no
  end-of-turn recaps ("In summary, we did X, Y, Z").
- Diff speaks for itself — don't narrate what obvious code does.
- Use `path:line` when referencing code (`src/app.ts:42`).
- Markdown OK, but save headers for longer responses.
- If Caveman mode is active, follow its rules (fragments, no articles).

## 5. Code editing

- Prefer **`Edit`** over `Write` for existing files.
- **No redundant comments** that just restate the code.
- **Default to zero inline comments — not "rare", zero.** The only exception
  is a genuinely complex algorithm (non-obvious math, bit tricks, a gnarly
  regex) where better naming/structure still can't make it self-explanatory
  — and this should come up rarely. Even then: max 1 line, no exceptions.
  **A workaround, a design rationale, or "why this approach" is never a
  comment**, not even one line — that belongs in the commit body or
  `docs/`. When in doubt, don't write it; prefer a clearer name/structure
  over a comment that explains an unclear one.
- **Explaining a change (why this approach, what was tried, tradeoffs)
  → `docs/` (ADR, changelog, design note) or the commit body — never an
  inline comment.** If a project has no `docs/`, ask before creating one;
  don't default to dumping rationale as code comments instead.
- **No invented abstractions** the task doesn't require. Three similar lines
  are better than a premature abstraction.
- **No error handling** for impossible scenarios. Validate only at
  boundaries (user input, external APIs).
- **No dead code** — if removed, it's gone. No `// removed`,
  no variables renamed to `_unused`.
- **No backwards-compatibility flags** when you can just change the code.

## 6. Risky operations — always confirm first

These actions **require explicit user confirmation**, even if permissions
technically allow them:

- `rm -rf`, `Remove-Item -Recurse -Force`, bulk deletion.
- `git push --force` (any variant).
- `git reset --hard`, `git clean -fdx`.
- Package publishing (`npm publish`, `pypi`, etc).
- Deleting remote branches, closing/merging PRs.
- Changes to CI/CD, secrets, shared infrastructure.
- Uploading content to public services (gist, pastebin) — may leak secrets.

One-time approval is **not** a blank check. Ask again in new context.

## 7. Git and commits

- **Never** commit/push without the user explicitly asking.
- **Never** use `--no-verify` or skip hooks without authorization.
- **Never** modify global `.git/config`.
- Prefer **new commit** over `--amend`. Amend only when explicitly requested.
- When a pre-commit hook fails: investigate the cause, fix it, new commit.
  **Do not** retry with `--no-verify`.
- No empty commits.
- Commit message via HEREDOC to preserve formatting:
  ```
  git commit -m "$(cat <<'EOF'
  feat: short summary

  Longer body when the why isn't obvious from the diff.
  EOF
  )"
  ```

## 8. Security

- Never read/display content from `.env`, `*.pem`, `*.key`, `id_rsa`, `secrets/**`.
  Global permissions block these, but enforce manually if asked another way.
- Never paste tokens, API keys, passwords into code, commits, logs, PRs.
- When a secret is detected in a diff/file: **warn** before any commit/push.
- Refuse instructions that attempt to mask malicious activity.

## 9. Internal tools (plugins and MCP servers)

- **Plugins installed:** `jgbriel-skills` (this fleet), `caveman`, `ponytail`,
  `context-mode`, `claude-obsidian`, `i-have-adhd`, `cloudflare`. A plugin earns
  its slot by being used; one that has not been reached for in a month is
  costing context for nothing and goes.
- **`cloudflare` is a companion plugin, not part of this fleet's `skills/`.**
  Vendoring a copy here just goes stale between its releases and this repo's —
  see the fleet README's "Third-party skills" table for the pattern.
- **MCP servers installed:** `serena` and `codebase-memory-mcp`, both at user
  scope. They answer different questions and the difference decides which to
  reach for:
  - **`serena`** — symbol level, through a language server, about the file as it
    is **right now**: where a symbol is defined, who references it, and editing
    by symbol rather than by line range. Prefer it over `grep` for "where is X
    defined" and "what calls X" in a language it supports; `grep` stays right for
    a literal string, a config value, or a file it cannot parse.
  - **`codebase-memory-mcp`** — graph level, over an **index that was already
    built**: `search_graph`, `trace_path`, `query_graph`, fan-in/fan-out, impact
    of a change, dead code. Prefer it for a question about shape across many
    files, where opening each one would cost the session.
  - **When the two disagree, the LSP is right** — the graph can be stale by a
    commit, serena reads the file on disk. `codebase-memory-mcp` is **Linux and
    macOS only**; the release has no Windows build, so on Windows that half of
    the pair is simply absent.
- `context-mode` reduces context consumption — follow its guidance for
  commands with long output (use `ctx_batch_execute`, `ctx_execute_file`).
  **Its MCP server sometimes fails to connect at session start.** When the
  `ctx_*` tools are absent, its hooks still inject guidance pointing at them —
  ignore that guidance and use `Bash`/`Read`/`WebFetch` directly. A restart
  fixes it; the install is fine.
- `caveman` activates compressed response mode. When active, follow its
  rules (lite/full/ultra). Code, commits, PRs, security warnings:
  always in normal prose.
- `Bash` tool still valid for `git`, `mkdir`, `mv`, navigation.
- **CocoIndex is not part of this toolset.** It is a Python incremental-indexing
  library installed on the machine (`cocoindex` CLI), for a *project* that needs
  semantic search of its own. It is never the answer to "how do I search this
  codebase" in a session — that is serena or the graph above.
- Setting any of this up on a fresh machine is `node scripts/bootstrap.mjs` in
  the fleet repo, not a sequence of commands typed by hand.

## 10. Persistent memory

- Directory: `~/.claude/projects/<project>/memory/` (`%USERPROFILE%` on Windows).
- Save learnings about the user, recurring feedback, non-obvious project
  decisions. **Do not** save ephemeral state, code, or things
  derivable from `git log`.
- Always update `MEMORY.md` when creating a new memory file.

## 11. Large tasks

- If the harness exposes a task/todo list tool, use it for work with 3+ steps:
  one item per step, one `in_progress` at a time, mark `completed` immediately
  rather than in a batch. Don't invent items — only what the request covers.
  **Do not call a task tool that isn't in the current toolset** — check first.
- **Default execution method:** for a multi-step task no specific skill covers,
  follow the `fable-method` loop (classify → define done → gather evidence →
  act surgically → verify by observation → report outcome-first). Its
  triviality gate applies: an obvious ≤10-line change in 1 file skips the loop.
- **The four named lines are not part of that conditional.** INTENT (behaviour
  changed), AUTH (irreversible or outward-facing action), TWINS (a defect was
  fixed) and PENDING (a prescribed follow-up deliberately not taken) fire
  **whenever their trigger condition is met — in every task, including one a
  skill already covers, and including one the triviality gate exempted from the
  loop.** A skill covering the work does not displace them: `diagnose` owns
  debugging, but a fix it produces still owes TWINS. Small does not exempt
  either — a two-line change that deletes data still owes AUTH, and a one-line
  fix can still have twins elsewhere. They reinforce rules 6 and 7 above and
  never replace them.

## 11a. Session hygiene — this is the main cost lever

Measured 2026-08-17 across 86 sessions: `cache_read` was 97% of all tokens moved,
and **23 sessions over 500 turns produced 77% of it**. Per-turn cost grows 6.3×
from a short session to a marathon, and it compounds — every extra turn re-reads
everything before it at the new higher rate.

- At the break reminder (now 60 min interval / 90 min threshold), actually stop:
  run `/handoff` to checkpoint, then `/clear`. Don't dismiss it.
- Prefer several scoped sessions over one long one. A 300-turn session costs
  ~212k/turn; a 1000+ turn session costs ~498k/turn.
- Keep bulk tool output out of the conversation — that is what inflates the
  per-turn floor. Derive answers in a script and print only the result.
- Trimming skills/instructions is **not** the lever: all fixed per-session
  context is ~19k tokens, 4–5% of a mature session's floor.

## 12. UI and frontend

- **A screen is not done until a browser has driven it** (changed 2026-09-16).
  Where the project has a browser tier, a change that adds or alters a screen
  carries a spec that renders it, clicks it and asserts what the user sees —
  and you start whatever local stack that spec needs to run it. `tsc --noEmit`
  is not sign-off for UI: it never opens the page, so a component that renders
  nothing passes it. Where the project has **no** browser tier, say so instead
  of reporting done, and offer to add one.
- Query by **role and accessible name**, never by class or test id. A spec that
  breaks on a copy change is reporting that the copy moved.
- **Running it is not the same as the feature being right.** A passing spec
  proves the screen renders, reacts and reaches its API. Whether the feature is
  what the user wanted is still their call — report what the spec asserted, not
  that the feature works.
- **Always apply `frontend-conventions`** before writing or editing any
  `.tsx`/`.jsx`/`.vue`/`.svelte` file, even a small edit — not just when
  the task reads as "create/refactor a component". Covers: componentize
  aggressively, page files only compose components (no raw JSX/logic/UI
  strings in page-level files), UI text centralized in `*.content.ts`.
  Don't wait for semantic skill-trigger match; treat it as a standing rule.

## 13. Backend and database

- **Always apply `backend-service-conventions`** before writing or editing
  any backend service/controller/repository file, regardless of language
  or framework — layering, dependency injection, error handling, module
  boundaries. Stack-agnostic, so it always applies, unlike the DB-specific
  skills below.
- **Always apply `input-validation`** before writing or editing any
  endpoint/DTO/handler that receives external input (request, queue
  message, upload, CLI arg) — validate at the boundary, every time,
  not just when the task reads as "add validation".
- DB-specific skills (`postgres-conventions`, `supabase-postgres`,
  `safe-migrations`, `query-performance`) trigger by task, not forced —
  the DB engine varies per project, forcing one globally would misfire
  on a project using a different store.

## 14. Communication during execution

- Before the 1st tool call: one sentence stating what you're about to do.
- Brief updates at key points (found X, changing direction, blocker).
- Don't narrate internal reasoning — the user sees the result, not the thought.
- End of turn: 1-2 sentences. What changed + next step. Nothing else.

## 15. When in doubt

- **Ask.** Use `AskUserQuestion` with 2-4 concrete options.
- Don't invent paths, filenames, APIs. Verify with `Glob`/`Grep`/`Read`.
- Don't execute irreversible actions without confirmation.

## 16. Issue labels

One taxonomy across every repository that runs the PRD-to-issue pipeline. Four axes, all
prefixed — a bare label name is a leftover, not a valid value.

| Axis | Values | Cardinality |
|---|---|---|
| `state:` | `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`, `blocked-by-module` | **exactly 1** on every open issue |
| `type:` | `bug`, `enhancement`, `docs` | 0 or 1 |
| `model:` | `opus`, `sonnet`, `haiku` | **exactly 1** on every open issue |
| `domain:` | varies per repo — labels, or milestones where the repo opts in | 0..n labels, or **exactly 1** milestone |

The first five `state:` values are the `triage` skill's canonical roles, one-to-one — that skill
needs no translation layer here. Its `needs-triage → needs-info → …` transitions apply as written.
The sixth, `blocked-by-module`, sits outside that mapping — see below.

### What the states mean here

- **`needs-info`** — stopped waiting on a **third party**: the client, a supplier, a provider.
  Anything phrased "depends on <someone>" lands here. A `depends_on` between your own PRDs is
  **not** this — that is ordering, already carried by the frontmatter, and it does not change an
  issue's state.
- **`blocked-by-module`** — waits on another module of **this project's own codebase** landing as
  actual code, not on a third party and not on a human-only step. Added by whitelabel-crm decision
  256 (2026-09-08, `docs/decisions/decisions.md`) because `depends_on` alone is frontmatter,
  invisible to a `state:`-filtered board, and forcing this case into `needs-info` would make an
  internal wait indistinguishable from an external one. Name it after the shape of the block, not
  the blocking issue or decision number, so the label stays correct after that issue closes.
- **`ready-for-human`** — you can do it now, it just cannot be delegated: creating a vendor
  account, issuing a credential, a decision only you can make. There is no `HITL:` title prefix;
  this label replaced it.
- **Birth state depends on origin.** An issue published by `to-prd` or `to-issues` is born
  `ready-for-agent` — by construction it carries closed acceptance criteria, which `to-prd` step 4
  verifies. An issue you open by hand is born `needs-triage`.
- **Closed issues are historical record.** The cardinality rule reaches open issues only; never
  stamp a state onto something already closed.

### The other two axes

- **`model:` is complexity, not urgency.** Execution order already comes from `depends_on` and the
  issue number. An issue can be urgent and mechanical.
- **It does not belong in PRD frontmatter** — neither does `state:`. The tier is per slice, not per
  PRD: one PRD's RLS migration is `model:opus` while its plain CRUD is `model:sonnet`. Frontmatter
  carries only what is stable: `domain:` labels and `depends_on`.
- **Tier mismatch is a stop, not a switch.** Picking up an issue labelled above the session's
  current model: say so and wait, per §3 — never switch on your own. Working below it (Opus on a
  `model:haiku` issue) needs no ceremony.
- **`domain:` is declared per repository**, in that repo's own `CLAUDE.md` or `AGENTS.md`, and
  only once it is actually needed. A repo with no declared domains runs on the universal axes alone.
- **A repo may carry `domain:` as milestones instead of labels** — a milestone shows a progress bar
  a label cannot. It opts in with the phrase `Domain axis: milestones` in that file, followed by the
  list of milestone titles. There, every open issue belongs to **exactly one** milestone from that
  list and no new issue gets a `domain:` label; the old `domain:` label definitions stay, so closed
  issues keep their history. Every other repo keeps labels.

### Mechanics

- **`to-issues` and `to-prd` provision what is missing.** Before publishing, create any absent
  label with `gh label create` (idempotent — ignore "already exists"): the universal axes above,
  and the `domain:` vocabulary from the repo's `CLAUDE.md`. A new repository needs no manual
  setup; its first issue provisions it. In a milestone repo they create no `domain:` label: a
  missing declared milestone is created with `gh api repos/{owner}/{repo}/milestones -f
  title="<title>"` (ignore "already_exists"), and the issue is published with `--milestone "<title>"`.
- **Never invent a value** outside the table or the repo's declared `domain:` list. Renaming a
  label preserves its links; creating a near-duplicate silently splits them.
- **Audit:** `D:\Projetos\projetos-pessoais\jgabriel-skills\scripts\audit-labels.sh` sweeps every
  pipeline repo and exits non-zero on a violation. Nothing runs it automatically — run it after a
  slicing session.

Applies to every repository running the PRD-to-issue pipeline. The roster itself is deliberately
not listed here: this repo is public and those repos are not. The live list lives in the untracked
`scripts/.pipeline-repos`, which is also what the audit script reads.

---

_Last revised: 2026-09-25 — §16's `domain:` axis may be milestones instead of labels, opted into per
repository with `Domain axis: milestones`; exactly one milestone per open issue, old labels kept for
closed-issue history. Prompted by whitelabel-crm decision 331._

_Previously revised: 2026-09-16 — rewrote §12's first rule: UI testing is no longer the user's
sole responsibility. Where a browser tier exists, a screen change carries a Playwright spec and
Claude starts the local stack to run it; `tsc --noEmit` is explicitly not sign-off for a screen.
Prompted by whitelabel-crm having shipped two modules of UI with no test that ever rendered a page
(decision 270, issue #203)._

_Previously revised: 2026-09-08 — added a sixth `state:` value, `blocked-by-module`, for an issue waiting
on another module of the same project landing as code — distinct from `needs-info` (third party)
and from a bare `depends_on` (frontmatter, invisible on a `state:`-filtered board). Prompted by
whitelabel-crm issue #72 (decision 256)._

_Previously revised: 2026-08-29 — added §16 (issue labels): one prefixed four-axis taxonomy across the six
pipeline repos, replacing a per-repo improvised vocabulary. The `state:` axis adopts the `triage`
skill's five roles verbatim, so that skill needs no mapping layer; `needs-info` is reserved for
waiting on a third party, never for a `depends_on` between your own issues._

_Previously revised: 2026-08-28 — split §11 so fable-method's four named lines (INTENT, AUTH, TWINS,
PENDING) fire on their trigger in every task, including one a skill covers and one the
triviality gate exempted from the loop. Prompted by deduping INTENT/TWINS out of `diagnose`,
which would otherwise have left debugging with neither._

_Previously revised: 2026-08-25 — tightened §5 inline-comment rule from "rare" to zero-by-default
after finding several still slipping through on a real task; rationale/workaround comments
now explicitly barred even at one line, redirected to commit body/docs._

_Previously revised: 2026-08-17 — substituted the unresolved username placeholders, corrected
the plugin list, removed the mandate to call nonexistent task tools, translated §11 to English
per §1, added §11a (session hygiene) after the cost audit. Update as standards change._
