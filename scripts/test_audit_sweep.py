#!/usr/bin/env python3
"""One runnable check that the agents/ and commands/ rules actually fire.

A sweep rule that never triggers is worse than no rule: it reports a clean run
over the files it cannot see. These three fixtures are the defects the fleet
actually shipped (PR #38) — `Task` missing from a delegating command, a machine
path, an agent `name` that disagrees with its filename.

    python3 scripts/test_audit_sweep.py
"""
import importlib.util
import os
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("sweep", os.path.join(HERE, "audit-sweep.py"))
sweep = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sweep)


def findings(kind, stem, text):
    with tempfile.TemporaryDirectory() as d:
        path = os.path.join(d, stem + ".md")
        open(path, "w", encoding="utf-8").write(text)
        return [m for _, m in sweep.audit_flat(path, kind)[1]]


def has(msgs, needle):
    return any(needle in m for m in msgs)


def demo():
    delegating = findings("commands", "where", """---
description: Locates where a symbol is defined. Delegates to the researcher agent.
allowed-tools: Read, Grep, Glob
---

Call the `researcher` agent to locate: $ARGUMENTS
""")
    assert has(delegating, "never grants `Task`"), delegating

    granted = findings("commands", "where", """---
description: Locates where a symbol is defined. Delegates to the researcher agent.
allowed-tools: Task, Read, Grep, Glob
---

Call the `researcher` agent to locate: $ARGUMENTS
""")
    assert not has(granted, "never grants `Task`"), granted

    ghost = findings("commands", "map", """---
description: Maps a directory.
allowed-tools: Task, Read
---

Call the `nobody-home` agent to map it.
""")
    assert has(ghost, "not in agents/"), ghost

    machine = findings("commands", "diff", """---
description: Diffs two refs.
allowed-tools: Bash(git diff:*)
---

```
git diff --name-only > /home/b2ml/our.txt
```
""")
    assert has(machine, "hardcoded machine path"), machine

    mismatch = findings("agents", "planner", """---
name: plannr
description: Breaks a task into steps.
tools: Read
---

# Planner
""")
    assert has(mismatch, "does not match file"), mismatch

    with tempfile.TemporaryDirectory() as d:
        same_a = os.path.join(d, "a.md")
        same_b = os.path.join(d, "b.md")
        other = os.path.join(d, "c.md")
        for f in (same_a, same_b):
            open(f, "w", encoding="utf-8").write("# protocol\nsame bytes\n")
        open(other, "w", encoding="utf-8").write("# protocol\ndifferent\n")
        dupes = sweep.duplicate_refs([same_a, same_b, other])
        assert len(dupes) == 1, dupes
        assert sorted(next(iter(dupes.values()))) == sorted([same_a, same_b]), dupes

    # The defect this rule was written for: inside references/, a link written
    # as `references/adr.md` points at a level that does not exist. Replayed
    # from the real file, not invented.
    with tempfile.TemporaryDirectory() as d:
        open(os.path.join(d, "adr.md"), "w", encoding="utf-8").write("# adr\n")
        dead = [m for _, m in sweep.shared("See [adr.md](references/adr.md).\n", d)]
        assert has(dead, "link to `references/adr.md`"), dead
        live = [m for _, m in sweep.shared("See [adr.md](adr.md).\n", d)]
        assert not has(live, "does not exist"), live

    print("ok — 7 checks")


if __name__ == "__main__":
    demo()
