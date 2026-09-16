---
name: wish
description: Capture, enrich and organise future ideas in a project's wishlist file, before they become tracked work. Use when the user drops an idea ("would be nice if…", "one day I want…", "note this down"), asks to see or edit the wishlist, or wants an idea promoted into real work.
argument-hint: <free-form idea> | list | <W-ID> [edit] | done <W-ID> | drop <W-ID> | promote <W-ID>
---

The wishlist is the project's **raw idea inbox** — what someone wants one day, before it becomes tracked work. One hand-curated file, `docs/wishlist.md` by default (match the project's existing location if it keeps one elsewhere). Input: `$ARGUMENTS`.

**Altitude:** a wishlist is desire, not commitment. It is **not** the official record — the project's decision log, its specs, and its list of deliberate cuts remain the sources of truth. No decision numbers, no acceptance criteria, no tests here. Don't rebuild those machines; bridge to them when an idea matures.

**One special case:** an idea that collides with something already cut, or with a recorded decision, does **not** enter as if it were new. It enters annotating the collision — "reopens the X cut; the stated condition for revisiting was Y". Otherwise the wishlist quietly becomes a place to re-propose settled questions.

## 0. Route the mode

| Signal in `$ARGUMENTS` | Mode |
| --- | --- |
| free text describing a desire *(default)* | **add** — §1 |
| `list`, `show`, empty, or a question about the wishlist | **list** — §2 |
| an existing `W-NNN` plus text | **edit** — §3 |
| `done <W-ID>` | **done** — §3 |
| `drop <W-ID>`, "don't want it any more" | **drop** — §3 |
| `promote <W-ID>`, "let's actually build it" | **promote** — §4 |

When torn between *add* and anything else, **add wins** — capturing is the most common act and the cheapest to get wrong.

Read the wishlist file whole before any write; it's small.

**Get the highest `W-NNN` from a command, never by reading.** The file is ordered by desire, not by number, so the highest ID is not where you'd expect it. Nothing enforces uniqueness, and a reused ID makes every back-reference ambiguous forever.

```sh
grep -o "^### W-[0-9]*" docs/wishlist.md | sed 's/.*W-//' | sort -n | tail -1   # next = this + 1
```

## 1. Add — capture, then enrich

The value isn't appending a line. It's turning a loose desire into something the author will still understand in six months with no memory of saying it.

1. **Resolve duplicates first.** Search the topic in the wishlist, in the project's list of cuts, and across its specs. A similar entry exists → enrich that one instead and say so. Already in scope somewhere → say where, and ask whether they still want a side note.
2. **Enrich by inferring, not interrogating.** From the idea plus what you know of the repo, fill in the layer, a rough effort, the connection to existing work, and any obvious prerequisite. Shallow lookups only — one search when it genuinely changes the effort guess. A full investigation is `research`, not this.
3. **Ask at most one question, and only if it changes the outcome** — usually the desire level, or a scope that forks the idea in two. Never a volley of questions; this exists to make capturing *cheap*.
4. **Write the entry** under the right desire bucket, using the template below. ID = highest + 1, never reused, including from archived entries. Date = today's **actual** date.
5. **Confirm in one line**, and offer the natural next step.

### Entry template

```markdown
### W-NNN · <short concrete title> · 🔥|✨|💤 · effort S|M|L|❓ · `layer`

<added: YYYY-MM-DD · status: idea>

**What:** one or two sentences, in the project's own vocabulary. Concrete beats vague.

**Why:** the pain or the opportunity — why this is worth doing one day.

**Inspiration:** where it came from — another product, a conversation, a client. (omit if none)

**Depends on / touches:** prerequisites and what it would affect. (omit if nothing obvious)

**Notes:** alternatives, open doubts, scribbles. (grows over time)
```

Empty field → drop the whole line. Never leave "N/A". The entry has to breathe.

## 2. List

- **No filter** → grouped by desire, one line per entry: `W-NNN · title · effort · layer · status`. Archived entries only if asked.
- **Implicit filter** ("what's there for the frontend?") → show only that slice.
- **"What should I do first?"** → order by desire descending, effort ascending; suggest one or two with a sentence each. Quick wins first, respecting whatever build order the project has already committed to. Recommend — don't produce a report.

## 3. Edit · Done · Drop

- **edit** — apply the change; *accumulate* notes rather than overwriting the reasoning history. A status change stamps the date.
- **done** — `status: done`, move to Archived with the date, and note what it became. Don't delete: the archive preserves *why this existed*.
- **drop** — `status: dropped`, move to Archived with the date and one sentence of why. An archived "no" is worth as much as a living idea; it's what stops the same thing being re-proposed in three months. **If the cut has real cost, propose an entry in the project's out-of-scope record with a re-entry condition** — propose, don't file it unilaterally. Confirm first if the entry had substance.

## 4. Promote — the bridge out

When an idea stops being desire and becomes work, it leaves. **Delegate; don't rebuild the pipeline here.**

1. **Confirm it's really a promote** — that's the user's call, not yours.
2. Pick the handoff and say which:
   - still fuzzy, or "does this already exist?" → **`research`**, with the entry as the brief
   - clear, only the approach missing → **`plan`**, with the entry as the brief
   - changes architecture, vendor or scope → a **recorded decision** first, before any code
3. **Carry everything the entry accumulated** into that brief — what, why, inspiration, dependencies, notes. That's the entire payoff of enriching at capture time.
4. Mark it `status: promoted`, archive it with the date and a link to whatever it became. Record the link on both sides.

## Cross-cutting

- **The project's own vocabulary goes in the title and the "What"** — that's what makes an entry findable a year later.
- **Absolute dates, always.** Convert "next week" to a real date. Never store a relative one.
- **One idea, one entry.** Three desires in one message means three entries.
- **Don't invent priority.** Desire level is the user's call — ask once, or mark it lowest and say you assumed conservatively.
- **Stay light.** If you're doing heavy investigation here, it stopped being a wishlist. Hand off to `research`.
