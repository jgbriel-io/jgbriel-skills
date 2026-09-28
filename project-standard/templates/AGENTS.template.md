# {Project}

## What this is

{Two lines: what it is and who it is for.} More in [docs/product/](docs/product/vision.md).

## Commands

| Task | Command |
|---|---|
| Dev server | `{pm} run dev` |
| Tests | `{pm} run test`; one level with `test:unit`, `test:integration`, `test:e2e`, `test:browser` |
| Lint, format | `{pm} run lint`, `{pm} run format` |
| Typecheck | `{pm} run typecheck` |
| Build | `{pm} run build` |
| Standard check | `{exec} project-standard check --staged` (the pre-commit hook runs it) |
| Regenerate agent copies | `{exec} project-standard sync` |

## Where things live

| Path | Holds |
|---|---|
| [docs/README.md](docs/README.md) | Map of the docs and what to read first |
| `docs/architecture/` | How the system works today; updated in the same commit as the code |
| `docs/decisions/` | Why it is this way; append or supersede, never rewrite |
| `docs/specs/`, `docs/plans/` | What gets built next, and how it is executed and proven |

## Code search

socraticode first; grep when its tools are unavailable (no Docker). Details in [docs/engineering/code-intelligence.md](docs/engineering/code-intelligence.md).

## Hard rules

1. Agent config is edited only in `.mcp.json`, `.claude/skills/` and `.claude/rules/`. `.cursor/`, `.codex/`, `.kiro/` and `.agents/skills/` are generated: run `{exec} project-standard sync` and commit the result.
2. Never bypass a hook (`--no-verify`).
3. {Project rule; at most 10 in total.}

## Workflow

- Branch `type/slug` from `main`, with the Conventional Commits types. Squash merge only.
- PR description, one heading each: **What** the user or system sees change; **Why**, with `Closes #N` when it implements an issue; **How**, including any rejected alternative a reviewer would miss; **Result**, the commands run and what they asserted, plus a screenshot or trace for UI; **Follow-ups**, deleted when empty. No placeholder text: the description becomes the commit message on `main`.
- Issue labels: exactly one `state:` and one `model:` on every open issue, at most one `type:`.

## Definition of done

- Pre-commit and pre-push hooks green, then CI green on the PR.
- A screen change carries a browser spec that renders it.
- Docs the change contradicts are updated in the same commit.
