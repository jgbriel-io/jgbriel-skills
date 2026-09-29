---
name: setup-pre-commit
description: Set up a repo's git hooks with Husky — lint-staged running Oxlint and Oxfmt plus a typecheck on pre-commit, the full test run with coverage on pre-push. Use when the user wants pre-commit or pre-push hooks, Husky, lint-staged, commit-time lint/format/typecheck, or to move hooks off Prettier and ESLint. Which jobs CI runs is ci-cd-pipeline.
---

# Setup Pre-Commit Hooks

Two hooks, split by cost. Pre-commit must finish in seconds or it gets bypassed,
so it touches only staged files. The full suite goes on pre-push, and without
branch protection (any free GitHub plan) that hook is the real gate: CI can
only warn after the fact.

| Hook | Runs |
|---|---|
| pre-commit | `lint-staged` (Oxlint + Oxfmt on staged files), typecheck, `project-standard check --staged` when the repo pins it |
| pre-push | `test:coverage` — unit + integration + e2e, full run, threshold enforced |

## 1. Detect the package manager

`packageManager` in `package.json` first, then the lockfile: `bun.lock` or
`bun.lockb` (bun), `pnpm-lock.yaml` (pnpm), `package-lock.json` (npm). Below,
`{pm}` is that manager and `{exec}` its exec form: `npx --no`, `bunx --bun` or
`pnpm exec`.

## 2. Install

```
husky lint-staged oxlint oxlint-tsgolint oxfmt
```

As dev dependencies pinned to an **exact** version (`--save-exact`,
`bun add -d --exact`). An Oxfmt upgrade reformats files, so it is its own PR,
never a caret range drifting in. `oxlint-tsgolint` runs the type-aware rules.

Remove what they replace: `prettier`, `eslint` and its plugins, their configs
and their lint-staged entries. `npx @oxlint/migrate` turns an existing flat
ESLint config into `.oxlintrc.json` as a starting point; review it against §3.

## 3. `.oxlintrc.json` (if missing)

```json
{
  "plugins": ["typescript", "unicorn", "oxc", "import", "promise"],
  "categories": { "correctness": "error", "suspicious": "error", "perf": "error" },
  "rules": {
    "typescript/no-explicit-any": "error",
    "typescript/consistent-type-imports": "error",
    "typescript/ban-ts-comment": "error"
  }
}
```

- Add `react`, `jsx-a11y` and `nextjs` only where the repo uses that stack.
  Listing `plugins` replaces the defaults, which is why `typescript`, `unicorn`
  and `oxc` are spelled out.
- Other categories stay off as a whole. Turned on together they contradict
  each other (`import/no-default-export` against `import/prefer-default-export`)
  or ban plain language features (`oxc/no-optional-chaining`), and an agent
  treats every error as work. Enable single rules one by one instead.
- No warnings: a rule is an error or it is off. `--deny-warnings` holds that.

## 4. Hooks

`{exec} husky init` creates `.husky/` and adds `"prepare": "husky"`. Then
overwrite the hook it wrote.

`.husky/pre-commit` — same as `project-standard/templates/hooks/pre-commit` in
this fleet. The last line is the secret scan (it runs Gitleaks); without
`project-standard` as a dev dependency, replace it with
`gitleaks git --pre-commit --staged --redact`, never drop it — a secret that
reaches the remote stays in the history:

```
{exec} lint-staged
{pm} run typecheck
project-standard check --staged
```

`.husky/pre-push`:

```
{pm} run test:coverage
```

`.lintstagedrc.json` — the globs do not overlap, because lint-staged runs
separate globs concurrently and two tools rewriting one file race:

```json
{
  "*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}": ["oxlint --type-aware --fix --deny-warnings", "oxfmt --no-error-on-unmatched-pattern"],
  "*.astro": "oxlint --type-aware --fix --deny-warnings",
  "*.{json,jsonc,md,css,yml,yaml}": "oxfmt --no-error-on-unmatched-pattern"
}
```

`.astro` gets lint only: Oxlint reads its script, and Oxfmt does not format it yet.

A script the repo does not have (`typecheck`, `test:coverage`) is left out of
the hook and reported, never swapped for something that passes. A hook line
that always succeeds reads as a gate and is not one.

If type-aware lint plus typecheck makes pre-commit slow on a large repo, move
`--type-aware` to a pre-push `oxlint --type-aware` run. Do not drop it: an
unawaited database write is the costliest bug those rules catch.

## 5. Existing code: baseline, never loosen

A first run on an existing codebase reports hundreds of violations. Loosening
the config to get green throws the gate away. Instead:

1. `{exec} oxlint --fix`
2. `{exec} oxlint --suppress-all` records the rest in `oxlint-suppressions.json`, committed
3. CI runs `oxlint --prune-suppressions`, so the file only shrinks

These flags are hidden in the Oxlint CLI and may change; without them, fix every
violation instead. Existing type errors get a `@ts-expect-error` each (a
`suppress-ts-errors`-style tool), and those directives land in the lint
baseline, so `ban-ts-comment` fails only a new one.

## 6. Verify

- [ ] `node_modules` is installed. A fresh clone or worktree without it has no
      `.husky/_`, and git skips every hook without a word
- [ ] A staged file with a deliberate violation is refused; fixed, it passes
- [ ] `sh .husky/pre-push` ran once by hand, green or with its failure reported
- [ ] `prepare` in `package.json` is `"husky"`

## 7. Commit (ask first)

Never commit on your own. If the user agrees, commit as
`chore: add git hooks (husky, lint-staged, oxlint, oxfmt)`. That commit runs
the new pre-commit hook, which is the smoke test.

Done when a commit with a violation is refused, a clean one passes, and the
pre-push body has run once.
