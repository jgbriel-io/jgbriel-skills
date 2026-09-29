# The `docs/` folder

`{repo}/docs/` is the only source of a project's documentation. Agents, code
search, CI and clones on other machines all read it there. A copy kept anywhere
else (a wiki mirror, a notes app) drifts by construction; link to the repo
instead.

The primary reader is an agent, then the owner. A developer inheriting the repo
gets the root `README.md`: what it is, setup, scripts, a link to `docs/README.md`.

## Tree

```
{repo}/
  README.md            human entry
  AGENTS.md            agent entry
  CLAUDE.md            stub: @AGENTS.md
  docs/
    README.md          index: each folder, the question it answers, read-first list
    product/           what this is and for whom
    architecture/      how the system works today
    engineering/       how we build it
    decisions/         why it is this way
    specs/             what to build next
    plans/             how approved work gets executed
    handoffs/          where the last session stopped, live ones only
    research/          investigations, spikes          (only when it has content)
    legal/             LGPD, licenses, EULA            (only when it has content)
    archive/           superseded docs kept unchanged  (only when it has content)
```

**A folder never exists as an empty stub**, and neither does a file. `TODO` stubs
linked from the index as if they were real are worse than no file: they read as
coverage.

| Folder | Answers | Typical files | Edited how |
|---|---|---|---|
| `product/` | What is this, for whom, what is in scope? | `vision.md`, `CONTEXT.md` (domain glossary), `scope.md` | In place |
| `architecture/` | How does the system work right now? | See below | In place, same commit as the code change |
| `engineering/` | How do we build, test and ship it? | `local-setup.md`, `testing-strategy.md`, `runbook.md` | In place |
| `decisions/` | Why is it this way? | `README.md` (index) + `NNNN-slug.md` | Append; supersede, never rewrite |
| `specs/` | What do we build next? | `NNN-slug.md` | The file is truth, a GitHub issue is a copy |
| `plans/` | How is an approved spec executed and proven? | `NNN-slug.md`, same number as its spec | Until the spec ships |
| `handoffs/` | Where did the last session stop? | `YYYY-MM-DD-slug.md` | Deleted once absorbed |
| `research/` | What did we find out, with sources? | `YYYY-MM-DD-slug.md` | Frozen once it feeds a decision or spec |
| `legal/` | What does the law or the contract require? | `lgpd.md`, `eula.md` | In place; Portuguese allowed |
| `archive/` | What used to be true? | Moved files, unchanged | Never edited |

`engineering/` stays apart from `architecture/`: "how we work" changes with
tooling, "how the system works" changes with code.

## `architecture/`

One folder per layer the project actually has, each opening with `overview.md`.
A static site has no `backend/` or `database/`.

```
docs/architecture/
  overview.md          stack, context diagram, main flows, links to each layer
  frontend/            overview.md, components.md, state.md, design-tokens.md, content.md
  backend/             overview.md, api.md, integrations.md, jobs.md
  database/            overview.md, schema.md, rls.md, migrations.md, seed-data.md
  security/            overview.md, auth.md, validation.md, secrets.md
  infrastructure/      overview.md, deployment.md, ci.md, observability.md
```

Topic files beyond `overview.md` are created when there is something to write,
never in advance.

## Naming

| What | Convention | Example |
|---|---|---|
| Folders and files | English, lowercase kebab-case | `design-tokens.md` |
| Fixed exceptions | Uppercase by convention | `README.md`, `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md` |
| Decisions | `NNNN-slug.md`, 4 digits, contiguous | `0012-clerk-for-auth.md` |
| Specs, plans | `NNN-slug.md`, 3 digits; a plan shares its spec's number and slug | `004-inventory-control.md` |
| Handoffs, research | `YYYY-MM-DD-slug.md` | `2026-09-27-webhook-retry.md` |

## Frontmatter

Every doc carries `type` and `status`; other fields exist only where a tool
reads them. **No `updated:` field**: git knows, and a hand-typed date drifts.

| Field | Values | On |
|---|---|---|
| `type` | `index`, `product`, `architecture`, `engineering`, `decision`, `spec`, `plan`, `handoff`, `research`, `legal` | Every doc |
| `status` | `draft`, `current`, `superseded`, `archived` | Every doc except decisions |
| `status` | `proposed`, `accepted`, `rejected`, `superseded` | Decisions |
| `number`, `date`, `superseded_by` | Integer, ISO date, integer | Decisions |
| `labels`, `depends_on` | `domain:*` labels, spec numbers | Specs |

Status lives in each file, never in a status column of `docs/README.md`: the
column drifts the moment a doc changes without the index being touched. The
decisions index is the exception: its Status column is checked against each
decision file by the docs check.

## Lifecycle

- **A decision is recorded only when every doc it contradicts is updated in the
  same commit.**
- **Decisions are superseded, never rewritten.** The old file gets
  `status: superseded` and `superseded_by`; its index row changes status.
- **Handoffs are deleted** once their lasting content has moved into
  `decisions/`, `specs/` or `plans/`. Old session state returned by code search
  as if it were still true is the failure this prevents.
- Superseded non-decision docs move to `archive/` unchanged.

## Links

Relative Markdown links, never wikilinks: `[Decision 12](../decisions/0012-slug.md)`
works on GitHub, in a notes app and for agents alike.

## `AGENTS.md` and `CLAUDE.md`

`AGENTS.md` stays under 200 lines **including everything it `@imports`** (an
import organizes, it saves no context). Sections in order: what this is,
commands, where things live, code search, hard rules (at most 10), workflow,
definition of done. A section past 15 lines of non-table detail moves to
`docs/` and leaves a pointer. An instruction that matters only for some files
goes in a path-scoped `.claude/rules/` file with `paths:`.

`CLAUDE.md` is a two-line stub, never a symlink (a symlink checks out as a
broken one-line file on Windows clones):

```md
@AGENTS.md
Read AGENTS.md.
```

## Templates

The fleet ships them in `project-standard/templates/docs/` — the index, the
architecture overview, decisions, specs, plans, handoffs and research —
with `{placeholders}` to fill. The same package's `project-standard check`
enforces the frontmatter, the links, contiguous decision numbers and the
`AGENTS.md` cap on changed files.

## Structural anti-patterns

- ❌ `docs/notes/`, `docs/misc/`, `docs/tmp/` — a dumping ground
- ❌ Mirroring the code tree inside `docs/` — the code already is that
- ❌ Versioning generated PDFs; version the source
- ❌ A `docs/` with no `README.md`: nobody knows where to start
- ❌ A status table with emoji in the index instead of `status:` in each file
