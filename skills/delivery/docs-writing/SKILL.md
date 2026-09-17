---
name: docs-writing
description: Technical documentation style guide for README, docs/, ADRs, JSDoc/TSDoc, and inline code comments. Use when writing or reviewing technical documentation, READMEs, API docs, architecture decision records, or any non-academic prose in the codebase. Does NOT apply to the TCC's academic prose, which has its own voice and norms — that is tcc-rascunho for drafting and tcc-revisao-impessoal for the final pass.
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

- The **why**, never the **what**. Well-named code already says what.
  - ❌ `// increment the counter`
  - ✅ `// Daily reset at 00:00 BRT, not UTC — HR policy`
- One line. If it needs more, it belongs in a document.
- No obvious comments (`// imports`, `// helper functions`).
- TODO/FIXME with context and an owner:
  `// TODO(joao): expire the token after 24h, pending RFC validation`.

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

## ADRs (Architecture Decision Records)

Write one when:
- The architectural decision is not obvious — a library, a pattern, infrastructure.
- There is an explicit trade-off someone may question later.

Minimum template (`docs/adr/NNNN-title.md`):
```md
# NNNN. Decision title

Status: accepted | superseded by XXXX | deprecated
Date: YYYY-MM-DD

## Context
The problem that motivated the decision.

## Decision
What was decided.

## Consequences
Good, bad, and the risks accepted.

## Alternatives considered
Why they were rejected.
```

## The `docs/` folder

The standard tree by tier, the index with its status table, and the shape of each
file live in [references/docs-tree.md](references/docs-tree.md). Tier 1 applies to
every project; the rest arrive when the project justifies them.

## Sprint documentation

### Naming

```
sprint-NN-type-description-kebab.md
```

- `NN` — zero-padded: `01`, `12`
- `type` — `mvp` | `refactor` | `fix`
- Unimplemented ones: `sprint-NN-type-description-NAO-IMPLEMENTADA.md`

### Required sections

| Section | Content |
|---------|---------|
| **Problem Statement** | Current state, symptoms, impact, quantified |
| **Requirements** | Functional, non-functional, acceptance criteria, out of scope |
| **Background** | Stack involved, relevant architecture, project patterns, affected files |
| **Proposed Solution** | Approach, folder structure, patterns, why this one |
| **Task Breakdown** | Tasks with goal, implementation, affected files, test, demo |
| **Implementation Details** | Tables by category: migrations, components, hooks |
| **Files Created** | File tree with a brief description |
| **Files Modified** | `path` — what changed and why |
| **Testing & Validation** | Checklist: build, type-check, lint, tests, manual test |
| **Results & Impact** | Quantitative metrics plus qualitative improvements |
| **Technical Debt** | Identified but unresolved, with the reason |
| **Lessons Learned** | What worked, what to improve, where it applies next |
| **Next Steps** | Following actions and the suggested next sprint |
| **References** | Links to issues, PRs, ADRs, related docs |

### `sprints/README.md`

The status table is mandatory:

```md
| Sprint | Period | Focus | Status | File |
|--------|--------|-------|--------|------|
| Sprint 1 | DD–DD month YYYY | Description | ✅ Implemented | [sprint-01](./sprint-01-...) |
| Sprint N | — | Description | ❌ Not implemented | [sprint-N](./sprint-N-...) |
```

Sections: history by type (MVP / Refactor / Fix), then Not Implemented, then
References.

## Anti-patterns

- ❌ A doc that no longer matches the code. If it is not maintained, delete it.
- ❌ A doc that restates what the code says. Document the **why**.
- ❌ "TODO: document this later" in a published README.
- ❌ Screenshots for information that could be text — text is versioned, a screenshot rots.
- ❌ Generic headings: `## Overview`, `## Introduction`, `## Notes`.
- ❌ Nested lists three levels deep. Rethink the structure.
- ❌ Documenting a bug as a feature ("the component sometimes renders twice — just ignore it").
