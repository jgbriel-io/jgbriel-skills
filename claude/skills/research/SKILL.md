---
name: research
description: Investigate a question or topic against primary sources and the repo's own history, then capture verified findings as a Markdown file. Use when the user asks to research or investigate something, asks "does this already exist / how did we do it before", or wants reading legwork delegated.
argument-hint: <topic or question> [focus]
---

Investigate: `$ARGUMENTS`

The deliverable is the investigation. **Implement nothing.** Where the project has already settled something in a recorded decision, this does not re-open it — new evidence may contest it, but contesting ends in a proposed decision, never a silent reversal.

## 0. Tier and budget — declare before spending anything

Effort is decided here, not discovered halfway through.

| Tier | Signal | Budget | Deliverable |
| --- | --- | --- | --- |
| **Lookup** | one verifiable fact | yourself, a handful of fetches | a direct answer with its source — **no document** |
| **Comparison** | 2–5 nameable options | a few subagents, one per option or angle | a document |
| **Broad** | a whole domain, or code + history + external landscape | subagents per front | a document |

Then compress the request into a **3–6 line brief**: scope, the questions that must be answered, and what "answered" means. Every search and the final summary get judged against it.

**Name the implicit requirements the request didn't state** but the project imposes — the constraints any recommendation must satisfy to be usable here. Ignoring one is roughly half of all research-agent failures: the answer is correct and unusable.

Pressure to go faster lowers the **tier**; it never removes verification. A lookup still cites a source it actually fetched.

## 1. What's already known

- **Prior work is mandatory reading, not optional.** Search existing notes, decisions and docs for the topic before searching the web. **A question already answered — or a finding already refuted — is not re-researched without new evidence.** Re-litigating settled ground is the most common way a long investigation produces nothing.
- Anything explicitly ruled out stays out unless its stated re-entry condition has actually occurred. Wanting it again is not the condition.

## 2. Internal archaeology — before the web

The repo usually knows more than it appears to.

- **Code**: search conceptually first, then by symbol and its references, then read narrowly. Separate **real** from **stubbed** from **documented-but-absent**. Existing code is not proof of a current pattern — check it against what's been decided since it was written.
- **History as a source**: `git log --grep`, `git log -S "<excerpt>"` to find when something entered or left, `git log --follow` across renames. Merged PRs and closed issues carry decisions that never made it into docs.
- **Delegate the sweeps.** Mapping how X connects to Y, or reading N candidate files, goes to subagents — read-only, one per front. The main thread should receive conclusions, not file contents. Direct search is for an exact string.
- **A multi-step survey is a script, not thirty tool calls.** Counting, cross-referencing, measuring — write it, run it, print the result.

**Citation is mandatory and internal findings are not exempt.** On first mention: code as `path/from/root.ts:line`; a decision by its number; a commit by short hash plus one sentence on what it proves. **The line number must come from a read in this session** — never from an older document or from memory, because line numbers drift and a wrong citation is worse than none.

## 3. External research

- **Fan out by perspective**, not by keyword. Each front generates its own sub-questions; the ones that pay off become sections.
- **Brief each subagent in four fields**: objective, exact output format, allowed sources, and what *not* to cover. Vague delegation returns four copies of the same angle. Subagents return **distilled notes and sources — never prose to paste**.
- **Broad, then narrow.** Short general queries to map the terrain, then targeted ones. Search in more than one language where the topic warrants it.
- **Two failed phrasings means change strategy** — different terms, different source type, different language — not "it doesn't exist". And **"no reliable source found" is a valid finding**, recorded as a gap. It beats citing something weak.
- **Between batches, write one line**: answered X · still missing Y · next Z. A new sub-question goes to the front of the queue; the parent question closes only when the queue below it drains.
- **Source ladder**: official documentation > the source code of the thing itself (behaviour's only real oracle) > dated technical forums and issue trackers > third-party posts and videos, which are **never sufficient alone**. If the behaviour is testable locally, **test it** — that outranks every citation.

## 4. Verification — where research agents actually fail

- **Fetch, don't trust the snippet.** Any claim carrying the recommendation gets the real page opened. Search snippets are stale and sometimes fabricated.
- **URLs only from this session's tool results.** Zero from memory: a meaningful share of agent-cited URLs don't exist.
- **A verdict per atomic claim** — supported (with source and date) · refuted (which is worth as much) · not-established (goes to open questions, **never** to the summary).
- **Triangulate with real independence.** Twenty posts reciting one announcement is one source. A behavioural claim wants two genuinely independent sources, or one local test.
- **Extra rigour on the first sources of each front** — an early error anchors everything after it.
- **Freshness matters most where things move fastest.** An old page about a current limit is suspect; when sources conflict, the newer primary wins and the conflict gets noted.
- **Label every finding**: `verified-fetch` · `tested-locally` · `read-in-code` · `snippet` · `inference` — with a date.
- **Budget spent → conclusion mode.** Write what's verified; what isn't becomes an open question. Chasing "just one more" past the budget is how investigations die undelivered.

## 5. Counter-review — when the answer carries a decision

Dispatch one subagent **role-locked to refute** your preliminary recommendation, with its own fresh searches and without your reasoning — it gets the recommendation and the brief, nothing else. Quota: **three real problems**, or you go back and examine it yourself. What survives becomes the recommendation's strength; what doesn't becomes a declared risk.

## 6. Deliver

**Write it in one pass**, from the brief and the distilled notes — never as a collage of subagent output. Spine:

- **Summary and a firm recommendation** — only verified or locally-tested claims reach this section
- Context, and the implicit requirements you assumed
- **What's actually true in the code today**, with citations, gaps included
- External findings — atomic claims, each with source, confidence label and date
- **Options with trade-offs**, then the recommendation, including what the counter-review raised
- Risks and gotchas
- **Refuted**, with the evidence that killed each one, and **Open questions** — emptiness is stated, not omitted

**Then audit the citations as a separate pass**, not while drafting:

- Did every URL come from this session?
- Reopen three cited claims — does the source still say that?
- Reopen two cited `path:line` — does the line still show what you claim?
- Did load-bearing claims come from a fetch or a test, not a snippet?
- Does the document answer every question in the §0 brief?
- Refuted and empty-search sections filled in, even if "none"?

Few solid citations beat many weak ones. Close by proposing the next step — usually a plan — and surface any decision the work now requires.
