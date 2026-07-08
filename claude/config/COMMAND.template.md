---
description: One line — what /name does. Shown in the command list; the user picks by reading this.
argument-hint: "<arg>  or  [optional-arg]"        # omit if no args
allowed-tools: Bash(git status:*), Read            # scope to the minimum
# model: haiku                                     # optional — mechanical commands run cheaper
---

Imperative instructions for what to do when the user runs /name.

- `$ARGUMENTS` contains whatever the user typed after the command.
- Keep it short: a command is a shortcut, not a skill. If it needs sections,
  workflows, or reference files, it should be a skill instead
  (`/skill-creator`).
- Delegating to an agent? One line: "Invoque o agent <nome> com <input>."

Expected output format (if the command produces a report):

```
<literal shape>
```
