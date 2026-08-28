---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work.

## Where it goes

**Look for a handoff folder in the current project first** — check `docs/handoffs/`, `docs/handoff/`
and `handoffs/`, relative to the working directory and to the repository root if they differ.

- **A folder exists** → write there. It is the project's convention and it wins over anything below.
  - **Read its `README.md` first, if it has one.** A project that keeps handoffs usually has rules
    about what belongs in one, and those rules override this file.
  - **Match the existing filenames.** List the folder and copy the pattern rather than inventing one —
    most use `YYYY-MM-DD-slug.md`.
  - The file is a normal repository artifact and may be committed: no throwaway paths, and no
    machine-specific absolute paths in the text.
- **No folder** → write to the OS temporary directory, not into the workspace. Do not create a
  handoff folder the project does not already have; say where you put it and offer to start the
  convention if the user wants one.

## What goes in it

Do not duplicate content already captured in other artifacts (PRDs, plans, ADRs, issues, commits,
diffs). Reference them by path or URL instead. A handoff that restates the decision log is worse than
no handoff — it becomes a second source of truth and drifts.

A handoff answers one question: **what would a fresh agent need in order to continue, that is not
already written somewhere else?** In practice that is:

- What is mid-flight, uncommitted or half-done right now
- Findings and questions the user has not ruled on yet
- Traps that cost this session real time and are invisible from the code
- Environment facts a fresh session would otherwise rediscover the hard way

Include a **"suggested skills"** section naming the skills the next agent should invoke, and when.

Redact sensitive information — API keys, passwords, connection strings, personally identifiable
information. Throwaway test values are fine; say so explicitly when you include one.

If the user passed arguments, treat them as a description of what the next session will focus on and
tailor the document accordingly.
