---
inclusion: manual
description: Build a throwaway prototype to flesh out a design — logic branch (terminal app) or UI branch (multiple variants)
---

# Prototype

A prototype is **throwaway code that answers a question**. The question decides the shape.

## Pick a branch

- **"Does this logic/state model feel right?"** → Build a tiny interactive terminal app that pushes the state machine through hard cases.
- **"What should this look like?"** → Generate several radically different UI variations on a single route, switchable via URL search param.

If ambiguous: backend module → logic branch; page/component → UI branch.

## Rules (both branches)

1. **Throwaway from day one.** Name it so a casual reader sees it's a prototype, not production.
2. **One command to run.** Use the project's existing task runner.
3. **No persistence by default.** State lives in memory.
4. **Skip the polish.** No tests, no error handling beyond runnable, no abstractions.
5. **Surface the state.** After every action, print/render the full relevant state.
6. **Delete or absorb when done.** Don't leave it rotting in the repo.

## When done

Capture the answer somewhere durable (commit message, ADR, issue, `NOTES.md`) along with the question it was answering. Then delete the prototype or fold the validated decision into real code.
