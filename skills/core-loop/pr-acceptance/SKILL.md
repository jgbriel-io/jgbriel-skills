---
name: pr-acceptance
description: Work a PR from either end — `accept` judges whether it delivers what was asked (issue/spec, description and discussions against the diff, ending in an accept / don't-accept recommendation), `resolve` applies the change requests a reviewer left (one commit per change, pushed, answered at the source with the evidence). Use when the user asks whether a PR is ready to merge, whether the work matches the ticket, or asks to address review feedback and reply to a reviewer. Hunting bugs in a plain diff is /code-review; applying the findings of an automated review is /code-review --fix.
argument-hint: accept|resolve <PR URL/number, or a fixed point — commit, branch, tag> [--publish] [--local]
---

# PR Acceptance

Two jobs on the same PR, one entry point:

- **`accept`** — read-only. Judge whether the PR delivers what was asked and
  recommend accepting it or not. Changes no code, pushes nothing.
- **`resolve`** — read-write. Apply the change requests a human reviewer left,
  one commit per change, push, and reply in the discussions they came from.

**The mode is always explicit, never inferred.** With no mode given, ask; do not
guess from the state of the PR. One of these modes pushes commits to a remote
branch and the other is a report — a wrong guess is not recoverable by reading.
`--publish` applies to `accept`, `--local` to `resolve`; each is ignored by the
other mode.

Do not spawn sub-agents. `/implement` executes work; `/code-review` hunts
defects; `/code-review --fix` applies what an automated review found.

With no target, identify the PR for the current branch; ask only if ambiguous.

## 1. Load the context (both modes)

Follow [the GitHub context protocol](references/github-pr.md). Load the **full
description, linked issues with their comments, reviews, inline discussions with
replies, commits, diff and checks** before concluding what was asked. `gh pr diff`
and `gh pr view --comments` are not enough on their own.

Reading it all is what gives coverage: a requirement you never saw cannot be a
finding. Using it is a separate problem — what was read early sits far from where
it is needed, and a comment rarely uses the same words as the code it is about.
Bring the criterion back in front of you at the moment you check it.

Find the originating spec in this order: issue references in the commit messages
(`#123`, `Closes #45`, GitLab `!67`); a path the user passed; a spec under
`docs/`, `specs/` or `.scratch/` matching the branch or feature; otherwise ask.
If there is genuinely no spec, say so and work against the description alone —
never invent a specification.

Read the `AGENTS.md`/`CLAUDE.md` files covering the changed paths and the rules
or plans they cite. A divergence between issue, description, plan and discussion
gets explained, not settled by your preference. An unreachable source becomes a
stated limitation.

Pin the target before anything else — a bad ref or an empty diff must fail here.

- **PR**: record repository, number, base SHA, head SHA and merge-base. Read
  `git diff <base-sha>...<head-sha>` and confirm the checkout matches the head.
  Use a separate worktree when local work would be disturbed.
- **Fixed point** (`accept` only): confirm it resolves (`git rev-parse`) and that
  `git diff <fixed-point>...HEAD` is non-empty — three dots, so the comparison is
  against the merge-base. Capture the commits with `git log <fixed-point>..HEAD --oneline`.
- **Local review**: clarify whether the target is the commit range, the
  uncommitted changes, or both. Do not fold local changes into a PR review
  without verifying they belong to the remote head.

---

# Mode: accept

The deliverable is a recommendation on whether this PR can be accepted, in the
conversation or published on the PR when asked. Do not change code or apply your
own findings.

A requirement that was never implemented has no line of code to point at, so a
diff-only reviewer cannot find it. That gap is this mode's whole reason to
exist — the correctness half belongs to `/code-review` and is not re-derived here.

## 2. Check the diff against the intent

Per criterion: **met**, **partial**, **missing**, or **implemented wrong**. Then
the mirror: behaviour in the diff that nobody asked for (scope creep), and
documented rules the change breaks. The description explains the proposal; it
does not prove the implementation is correct.

Follow every suspicion to a concrete scenario — input or trigger → path executed
→ wrong result — and compare against the base to separate a regression this
change introduced from pre-existing debt. Keep a hypothesis apart from a
demonstrated defect; a doubt without evidence stays a question, not a blocker.
Record what you ran and what you could not run: a green CI is complementary
evidence, and an infrastructure failure is not automatically a bug in the PR.

Do not create findings to fill a quota: `raise three nits so the review looks
thorough → report the one demonstrable defect and say the rest was clean`. A
review with nothing to report is a result. Do not repeat comments already open
about the same problem — link the discussion and say whether it still holds.

## 3. Fold in the correctness axis

Run `/code-review` on the same target for defects and cleanups, at a level
matching the change's risk. Take its **CONFIRMED** findings into the report as
they are; mention `PLAUSIBLE` ones only when the requirements context makes them
material. Do not re-derive defects yourself and do not rerank across axes.

Requirements and correctness stay **labelled separately** in the output. A change
can follow every standard while implementing the wrong thing, or do exactly what
the issue asked while breaking the project's conventions — merging the two lets
one hide the other.

## 4. Deliver

Findings by severity, each tagged with its axis; a problem hitting both appears
once with both labels. Each carries:

- **Priority and a concrete title** — P0 critical; P1 high impact; P2 ordinary
  defect; P3 minor improvement demonstrably worth making.
- **Location** — file and smallest sufficient range at the reviewed SHA, or the
  missing requirement it refers to.
- **Problem and impact** — the scenario that fails, and the observable consequence.
- **Evidence** — code, the requirement or comment, or a reproduction.

Close with criteria met / pending / inconclusive, the checks you ran, the
limitations, and the worst issue *within each axis*. Recommend `REQUEST_CHANGES`
for anything that blocks acceptance, `COMMENT` for questions or an inconclusive
review, `APPROVE` only when the scope is covered and nothing blocks. The
recommendation is not a published review.

## 5. Publish when asked

`--publish`, or an explicit request to send the review, authorizes publishing;
otherwise deliver in the conversation. Being selected automatically does not
authorize messages on GitHub, and authorization already given is not asked for
twice.

Before publishing, re-read base, head, description and discussions. If they
moved, review the delta, update positions and drop findings already fixed or
duplicated. Publish one consolidated review at the SHA you actually reviewed —
inline comments where a valid line exists, summary for findings with no anchor.
Publish as `COMMENT` keeping the recommendation in the text; do not formally
approve or request changes on behalf of the PR's own author, do not merge, and do
not switch to `resolve` automatically.  If the API blocks publishing, keep the
finished report and say what is missing.

---

# Mode: resolve

The whole cycle: read the requests, fix, verify, make **one commit per change**,
push those commits to the PR's branch, and reply in the discussions they came
from. `--local` prepares the commits and the replies without pushing or
publishing. For requests in natural language, respect the actions that were
authorized; this skill being selected automatically does not widen that
authorization. Finish the local work and draft the replies before asking for a
publishing authorization that is genuinely missing; never ask again for one
already granted.

## 2. Establish the branch state

Beyond the shared context above:

- Record the PR's source repository and branch and the state of the local tree.
  Confirm the PR is open and that the branch you will change is its own,
  including when it comes from a fork.
- Check whether the PR branch is behind its actual base branch (`out-of-date`)
  and whether it has merge conflicts: a branch can be behind without conflicts.
  Use fresh base/head data and treat an unknown status as unverified.
- If either needs attention, summarize the incoming changes, known conflicts and
  proposed integration, then ask the user whether to update the branch and
  resolve conflicts unless those actions were already authorized. Continue
  independent changes while waiting. Respect a refusal or deferral and report the
  remaining branch state.
- Read the product documentation and the feature/impact record where they exist;
  follow the search flow the local instructions describe.
- Do not rely on `reviewDecision` or the latest review alone. Read the bodies of
  the **`CHANGES_REQUESTED`** reviews, the requests inside `COMMENTED` reviews,
  the general comments and the threads, taking later replies and decisions into
  account.
- An old or dismissed review and a resolved thread are history; do not reopen
  them without evidence that the request still stands. `isOutdated` only means
  the position went stale: **it does not prove the problem was fixed**.

When synchronization is authorized, perform it locally before fixes that depend
on it, in this order:

1. Use a clean PR-head checkout or worktree. Refresh the PR's source branch and
   actual base, then reconcile with the current remote head, preserving other
   people's commits.
2. Merge the latest base into the PR branch and resolve authorized conflicts,
   preserving both sides' intended changes. Keep the integration commit separate
   from review-fix commits. `--local` keeps this integration local too.
3. Run the relevant checks and re-evaluate the feedback against the integrated
   code before making dependent fixes; incoming changes may already satisfy a
   request.

## 3. Turn the feedback into a queue of changes

A **change** is one logical, verifiable request to alter something. A comment
carrying two independent requests produces two changes; several comments about
the same cause can point to a single change. Read the replies before deciding
what the reviewer meant.

Keep a short queue in the conversation, reconstructible from the PR's comments
and commits. Do not create documentation or feature records:

| Origin | Request | State | Commit | Verification | Reply |
|---|---|---|---|---|---|
| URL or ID of the comment, review or item | Expected result | pending / fixed / already met / clarification / disagreement / blocked | SHA once it exists | Proof or limitation | Published URL or draft |

- Confirm each request against the current code. Apply a fix that satisfies the
  intent and the project's rules, not necessarily the suggested patch literally.
- Already met: identify the proof and the existing commit where you can locate
  it; do not create an empty commit.
- Disagreement: explain with evidence why the suggestion breaks a contract,
  contradicts a requirement or does not solve the problem; do not change code
  merely to silence a comment.
- Ambiguity that changes behavior: ask for clarification in the authorized
  channel and carry on with the independent changes. Do not answer on the
  reviewer's behalf or declare the request resolved.
- Distinguish optional suggestions from requirements; implement the ones the
  user's request covers and do not widen the PR on your own.

## 4. Fix one change at a time

1. Work on the correct head, in a clean checkout or your own worktree. Preserve
   other people's files and commits; do not stash, reset, rebase or force-push to
   quietly clear the way.
2. Locate the cause and its consumers before the patch. A fix in a shared
   function has to cover the affected callers. Follow the dependencies between
   changes without mixing independent requests.
3. For a bug or non-trivial logic, get a proof that fails before and passes
   after, preferring the existing harness or test. For a trivial adjustment, use
   proportionate verification; do not write tests that merely restate the
   implementation.
4. Make the smallest change that resolves the request and run the relevant
   checks. UI requires a real browser. Do not create or update documentation; if
   the review request depends on that, mark the item pending and explain the
   limitation.
5. Inspect the diff and the staging area. Make **one commit for this change**,
   including the implementation and any tests it needs. Do not include
   independent changes or work that was already in the workspace. Every commit
   must be coherent and verifiable.
6. Follow the repository's convention, with the feature ID where it applies. In
   the commit body, include `Review: <origin URL>` (every origin, if there are
   duplicates) and the verification you ran. Record the real SHA in the queue.

One comment carrying several requests can receive several commit links. A request
that needs several files changed is still one change. Do not use amend or squash
to merge distinct changes. If a change is blocked, record why and move on to the
independent ones.

## 5. Update the PR and reply

- Run the final checks over the whole set of commits and the impact list. Fix
  failures your work caused before announcing success; pre-existing or external
  failures need evidence and must appear in the result.
- Before pushing, re-read the remote head and base. Preserve and reconcile any
  new head commits without rewriting history. If the base moved or conflicts
  appeared, revisit the synchronization decision above, respecting prior
  authorization or deferral. After any integration, re-evaluate affected feedback
  and rerun the relevant checks before pushing. Push only the expected commits to
  the PR's source branch, with a normal push.
- Confirm the PR contains the commits you pushed. **Only then** reply in each
  discussion with the commit link and the concrete result of the verification. If
  the push fails, or you are in `--local`, keep the drafts; do not publish
  "fixed" pointing at a commit the reviewer cannot reach.
- Reply to inline comments in the original thread. Requests in a review body or a
  general comment get a reply on the PR with a direct link to the origin and the
  item addressed; do not open an artificial inline discussion.
- For duplicates, reply at each origin pointing to the same commit. For "already
  met", a disagreement or a clarification, reply according to the evidence,
  without simulating a fix.
- **Leave the thread open for the reviewer to check**, unless resolving it was
  explicitly requested. Do not dismiss reviews, approve your own work, or merge
  the PR.

A short reply format, adapted to the language of the discussion:

```markdown
Fixed in [<short SHA>](<commit URL>): <what changed and how it meets the request>.
Verification: <command or scenario and the real result>.
Not covered: <what the check does not prove, when that matters>.
```

Before repeating any publication, check the thread and the queue: a resumed run
or a timeout must not duplicate a reply or a commit. Use the same
[shared protocol](references/github-pr.md) to tell review, comment and thread IDs
apart and to check what the API returned.

## 6. Close the round

Re-read the state of the PR, the discussions and the checks to identify changes
still open, new requests, and interference from someone else. Fixed in the code,
answered on GitHub, and accepted by the reviewer are three different states.

Deliver the mapping **request → commit → verification → reply**, including items
already met, disagreements, blocks, new requests and pending checks. Do not
announce "all resolved" while items remain untouched, a publication is missing,
or a necessary verification is inconclusive.

---

Requirements axis, evidence discipline, severity scheme and publishing protocol
from [lucasmonstrox/utevo-lux](https://github.com/lucasmonstrox/utevo-lux)'s
`look`; the two-axis separation and its rationale from
[Matt Pocock's `code-review`](https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md).
Defect hunting is delegated to Claude Code's built-in `/code-review`.
