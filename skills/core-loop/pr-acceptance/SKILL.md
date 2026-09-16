---
name: pr-acceptance
description: Judge whether a PR delivers what was asked — loads the originating issue/spec, the PR description and its discussions, then checks the diff for criteria met, requirements missing and scope nobody asked for. Delegates defect hunting to /code-review and folds in its confirmed findings. Ends with an accept / don't-accept recommendation, published on the PR when asked. Use when the user asks whether a PR is ready to merge, wants a PR reviewed for acceptance, or asks whether the work matches the ticket. Hunting bugs in a plain diff is /code-review; applying the changes a reviewer asked for is /resolve-review.
argument-hint: <PR URL/number, or a fixed point — commit, branch, tag> [--publish]
---

# PR Acceptance

The deliverable is a recommendation on whether this PR can be accepted, in the
conversation or published on the PR when asked. Do not change code, apply your
own findings or spawn sub-agents: `/implement` executes, `/resolve-review`
applies what a reviewer asked for.

A requirement that was never implemented has no line of code to point at, so a
diff-only reviewer cannot find it. That gap is this skill's whole reason to
exist — the correctness half belongs to `/code-review` and is not re-derived here.

With no target, identify the PR for the current branch; ask only if ambiguous.

## 1. Pin what is under review

Resolve the target before anything else — a bad ref or an empty diff must fail
here.

- **PR**: record repository, number, base SHA, head SHA and merge-base. Read
  `git diff <base-sha>...<head-sha>` and confirm the checkout matches the head.
  Use a separate worktree when local work would be disturbed.
- **Fixed point**: confirm it resolves (`git rev-parse`) and that
  `git diff <fixed-point>...HEAD` is non-empty — three dots, so the comparison is
  against the merge-base. Capture the commits with `git log <fixed-point>..HEAD --oneline`.
- **Local review**: clarify whether the target is the commit range, the
  uncommitted changes, or both. Do not fold local changes into a PR review
  without verifying they belong to the remote head.

## 2. Load the intent

Follow [the GitHub context protocol](references/github-pr.md). Load the **full
description, linked issues with their comments, reviews, inline discussions with
replies, commits and checks** before concluding what was asked. `gh pr diff` and
`gh pr view --comments` are not enough on their own.

Reading it all is what gives coverage: a requirement you never saw cannot be a
finding. Using it is a separate problem — what was read early sits far from where
it is needed, and a comment rarely uses the same words as the code it is about.
Bring the criterion back in front of you at the moment you check it.

Find the originating spec in this order: issue references in the commit messages
(`#123`, `Closes #45`, GitLab `!67`); a path the user passed; a spec under
`docs/`, `specs/` or `.scratch/` matching the branch or feature; otherwise ask.
If there is genuinely no spec, say so and review against the description alone —
never invent a specification.

Read the `AGENTS.md`/`CLAUDE.md` files covering the changed paths and the rules
or plans they cite. Map the expected criteria and their sources. The description
explains the proposal; it does not prove the implementation is correct. A
divergence between issue, description, plan and discussion gets explained, not
settled by your preference. An unreachable source becomes a stated limitation.

## 3. Check the diff against the intent

Per criterion: **met**, **partial**, **missing**, or **implemented wrong**. Then
the mirror: behaviour in the diff that nobody asked for (scope creep), and
documented rules the change breaks.

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

## 4. Fold in the correctness axis

Run `/code-review` on the same target for defects and cleanups, at a level
matching the change's risk. Take its **CONFIRMED** findings into the report as
they are; mention `PLAUSIBLE` ones only when the requirements context makes them
material. Do not re-derive defects yourself and do not rerank across axes.

Requirements and correctness stay **labelled separately** in the output. A change
can follow every standard while implementing the wrong thing, or do exactly what
the issue asked while breaking the project's conventions — merging the two lets
one hide the other.

## 5. Deliver

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

## 6. Publish when asked

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
not invoke `/resolve-review` automatically. If the API blocks publishing, keep
the finished report and say what is missing.

---

Requirements axis, evidence discipline, severity scheme and publishing protocol
from [lucasmonstrox/utevo-lux](https://github.com/lucasmonstrox/utevo-lux)'s
`look`; the two-axis separation and its rationale from
[Matt Pocock's `code-review`](https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md).
Defect hunting is delegated to Claude Code's built-in `/code-review`.
