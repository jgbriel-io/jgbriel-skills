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

- Default shell: **PowerShell**. Use PowerShell syntax in shell commands
  (`$env:VAR`, `$null`, backtick for line continuation).
- Bash via WSL/Git Bash available through the `Bash` tool for POSIX scripts.
- System: Windows 11 — backslash paths (`C:\Users\...`).
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
- **Inline comments: rare, max 1 line, code-relevant only.** Reserve for
  genuinely obscure/complex logic (non-obvious algorithm, regex, bit
  tricks, workaround forced by an external bug/API). Not one per function.
  **Never** a multi-line justification block, and never changelog-style
  phrasing ("mudamos de X pra Y porque o usuário pediu Z" — that belongs
  in a commit message or `docs/`, not in the source file).
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

## 9. Internal tools (plugins)

- **Enabled:** `caveman`, `context-mode`, `claude-obsidian`, `i-have-adhd`.
  **Disabled:** `socraticode`, `claude-seo`, `claude-blog` (the last two dropped
  2026-08-17 — 63 skills, ~7.6k tokens/session, near-zero use).
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

## 10. Persistent memory

- Directory: `C:\Users\jgabriel\.claude\projects\<project>\memory\`.
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
  The method's named lines (INTENT when behaviour changes, AUTH before an
  external action, TWINS when fixing a defect, PENDING when leaving a
  prescribed follow-up) reinforce rules 6 and 7 above — they don't replace them.

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

- UI testing is the **user's responsibility**. Do not start the dev server
  or claim to validate UI — `tsc --noEmit` + type-check is the sign-off.
- `tsc --noEmit` or a test suite verifies code correctness,
  **not** feature correctness. After type-check passes, report done.
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

---

_Last revised: 2026-08-17 — substituted the unresolved username placeholders, corrected the plugin list,
removed the mandate to call nonexistent task tools, translated §11 to English per §1,
added §11a (session hygiene) after the cost audit. Update as standards change._
