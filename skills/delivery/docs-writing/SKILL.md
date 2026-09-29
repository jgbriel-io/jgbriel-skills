---
name: docs-writing
description: Technical documentation style guide and the docs/ layout — README, the docs/ tree (product, architecture, engineering, decisions, specs, plans, handoffs), frontmatter, decision records, JSDoc/TSDoc and code comments. Use when writing or reviewing technical documentation, READMEs, API docs, decision records/ADRs, AGENTS.md, where a doc should live in docs/, or any non-academic prose in the codebase. Does NOT apply to the TCC's academic prose, which has its own voice and norms — that is tcc-rascunho for drafting and tcc-revisao-impessoal for the final pass.
---

# Technical Documentation Style

Applies to READMEs, `docs/`, ADRs, usage guides, JSDoc/TSDoc and long comments.
Not to academic writing — the TCC has its own rules.

## Structure

The usual order:
1. **Title** — one line, says what this is.
2. **Intro** — one to three sentences: context, and who it is for.
3. **Usage / quick start** — code before explanation.
4. **Concepts** — only what is needed to understand the usage.
5. **Reference** — API, options, flags, where applicable.
6. **Examples** — real scenarios, copy-and-paste.
7. **Troubleshooting** — common errors and their fix.

None of these is mandatory. Cut what adds nothing.

## Headings

- **Sentence case**, not Title Case.
  - ✅ `## Installing dependencies`
  - ❌ `## Installing Dependencies`
- **One H1** per file: the title.
- Hierarchy H1 → H2 (sections) → H3 (subsections). Do not skip levels.
- No trailing punctuation.
- Descriptive rather than generic: `## Supabase configuration` beats
  `## Configuration`.

## Voice

- **Imperative** for instructions:
  - ✅ `Run npm install`
  - ❌ `You should run npm install`
- **Declarative** for descriptions:
  - ✅ `The component accepts an optional onClick prop`
  - ❌ `You can pass an optional onClick prop`
- Avoid "let's", "we can", "we will". Go straight to it.

## Code blocks

- **Always** tagged with a language, even short ones:
  - ✅ ` ```ts `
  - ❌ ` ``` `
- Common tags: `ts`, `tsx`, `js`, `jsx`, `sh`, `bash`, `powershell`, `sql`,
  `json`, `yaml`, `md`, `diff`.
- For shell commands use `bash` or `powershell` to match the context, and do not
  mix them in one block.
- No `$` prefix on commands (`npm install`, not `$ npm install`).
- Comments in code are English, like the code itself.

## Referring to code

- Always `path:line` to point at an exact location:
  - ✅ `See src/hooks/useStudents.ts:42`
  - ❌ `See the useStudents hook`
- For a function or symbol, use backticks: `` `useStudents()` ``.
- Paths relative to the repo root, never absolute.

## Lists vs prose

- A **list** when there are three or more enumerable items with no strong logical
  connection.
- **Prose** when the items connect narratively — cause and effect, a sequence.
- No terminal punctuation on list items, unless the item is a full sentence.
- Never a one-item list; make it prose.

## Examples

- **Before the rule** for concepts the example makes obvious.
- **After the rule** for abstract concepts that need motivation first.
- Examples are always runnable or copy-and-paste. No bare `// ...` in the middle
  without context.
- Show the mistake next to the fix when the point is a fix:
  ```ts
  // ❌
  useEffect(() => fetchData(), []);

  // ✅
  const { data } = useQuery({ queryKey: ['data'], queryFn: fetchData });
  ```

## Line wrapping

- Wrap prose around 100 characters.
- Never wrap code blocks; horizontal scroll is fine.
- Tables do not wrap, however wide they get.

## Links

- **Inline** for short, contextual links: `[shadcn/ui](https://ui.shadcn.com)`.
- **Reference style** for repeated or long ones:
  ```md
  See the [Supabase docs][supabase-docs].

  [supabase-docs]: https://supabase.com/docs
  ```
- Between docs, relative paths (`../decisions/0012-slug.md`), never wikilinks:
  they resolve on GitHub, in a notes app and for agents alike.
- Descriptive link text, never "click here":
  - ✅ `See the [migration guide](./MIGRATION.md)`
  - ❌ `See [here](./MIGRATION.md)`

## Tables

Use them for multi-column comparison, not for simple lists. Two columns only earn
a table when the second adds information rather than restating the first.

```md
| Component | When to use | Example |
|-----------|-------------|---------|
| `Dialog`  | Forms       | `StudentDialog` |
| `Sheet`   | Side panel  | `StudentDetailSheet` |
```

## Code comments

- **Zero by default.** Better names and structure first; a comment explaining
  unclear code is the second-best fix for it.
- The one exception: an algorithm still not self-explanatory after that
  (non-obvious math, bit tricks, a gnarly regex). One line.
- A workaround, a design rationale or "why this approach" goes in the commit
  body or a decision, never in a comment, which rots silently when the code
  under it changes.
  - ❌ `// increment the counter`
  - ❌ `// Daily reset at 00:00 BRT, not UTC — HR policy` → a decision in `docs/decisions/`
- A TODO is a comment too; the follow-up goes in an issue.

## JSDoc / TSDoc

- Only on public APIs, or functions whose contract is not obvious.
- Never document types TypeScript already infers.
- Shape:
  ```ts
  /**
   * Calculates the monthly amount owed per student.
   * @param studentId student UUID
   * @param month YYYY-MM
   * @throws StudentNotFoundError when the student does not exist or was soft-deleted
   */
  ```

## Decisions

Record one when the choice is not obvious (a library, a pattern, infrastructure)
or carries a trade-off someone will question later. Files are
`docs/decisions/NNNN-slug.md`, numbered contiguously, listed one row each in
`docs/decisions/README.md`:

```md
---
type: decision
status: accepted
number: 12
date: 2026-09-27
superseded_by:
---
# 0012 Clerk for auth

## Context
## Decision
## Consequences
## Rejected alternatives
```

- A decision is recorded only when every doc it contradicts is updated in the
  same commit; otherwise the docs disagree with the log from day one.
- Superseded, never rewritten: the old file gets `status: superseded` and
  `superseded_by`, the new one explains what changed.

## The `docs/` folder

The tree, what each folder answers, naming, frontmatter, lifecycle rules and
`AGENTS.md` live in [references/docs-tree.md](references/docs-tree.md). Work to
build next is a spec in `docs/specs/`, its execution a plan in `docs/plans/`
with the same number, and a session's stopping point a handoff in
`docs/handoffs/` — no sprint files.

## Anti-patterns

- ❌ A doc that no longer matches the code. If it is not maintained, delete it.
- ❌ A doc that restates what the code says. Document the **why**.
- ❌ "TODO: document this later" in a published README.
- ❌ Screenshots for information that could be text — text is versioned, a screenshot rots.
- ❌ Generic headings: `## Overview`, `## Introduction`, `## Notes`.
- ❌ Nested lists three levels deep. Rethink the structure.
- ❌ Documenting a bug as a feature ("the component sometimes renders twice — just ignore it").
