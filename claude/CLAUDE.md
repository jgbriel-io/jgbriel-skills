# Global work rules — Claude Code

These rules apply to **all** projects in user `<username>`'s environment
(Windows 11, PowerShell). Individual projects can override via
`<project>/.claude/CLAUDE.md` or `<project>/.claude/settings.json`.

---

## 1. Language

- **Conversation, explanations, error messages, user-facing comments:** Portuguese (PT-BR).
  Use all diacritics — never replace "não" with "nao".
- **Code, identifiers, function names, variables:** English.
- **Commit messages, PR titles/descriptions, branches:** English,
  Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`).
- **Technical docs in repos (`README.md`, `docs/`):** English by default,
  unless the project is already in Portuguese.

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

## 9. Internal tools (caveman/context-mode)

- **Installed plugins:** `caveman`, `context-mode`. Both active globally.
- `context-mode` reduces context consumption — follow its guidance for
  commands with long output (use `ctx_batch_execute`, `ctx_execute_file`).
- `caveman` activates compressed response mode. When active, follow its
  rules (lite/full/ultra). Code, commits, PRs, security warnings:
  always in normal prose.
- `Bash` tool still valid for `git`, `mkdir`, `mv`, navigation.

## 10. Persistent memory

- Directory: `C:\Users\<username>\.claude\projects\<project>\memory\`.
- Save learnings about the user, recurring feedback, non-obvious project
  decisions. **Do not** save ephemeral state, code, or things
  derivable from `git log`.
- Always update `MEMORY.md` when creating a new memory file.

## 11. Large tasks

- For any work with 3+ steps, use `TaskCreate` / `TaskUpdate`.
- Mark `in_progress` when starting, `completed` immediately when done
  (not in batch).
- Don't invent tasks — only those within the requested scope.
- **Método de execução padrão:** para tarefa multi-step que nenhuma skill
  específica cobre, seguir o loop da skill `fable-method` (classify → define
  done → gather evidence → act surgically → verify by observation → report
  outcome-first). Gate de trivialidade dela vale: mudança óbvia de ≤10 linhas
  em 1 arquivo pula o loop. As linhas nomeadas do método (INTENT quando muda
  comportamento, AUTH quando faz ação externa, TWINS quando corrige defeito,
  PENDING quando deixa follow-up prescrito) são compatíveis com as regras 6/7
  acima — reforçam, não substituem.

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

_Last revised: 2026-08-11. Update as standards change._
