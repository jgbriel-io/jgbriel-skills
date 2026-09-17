#!/usr/bin/env python3
"""Mechanical pre-pass for the skill audit: everything a script can settle.

Reading 86 skills by hand to find the two that are broken is the expensive way.
This settles the criteria that need no judgement — size, frontmatter, leftovers
from another tool, references that point nowhere — so the reading budget goes to
the ones that do.

    audit-sweep.py                every skill
    audit-sweep.py core-loop      one category
    audit-sweep.py --sizes        the size distribution against the benchmark

Findings are ranked: BLOCKER fails the skill on its own, WARN is worth a look.
Exit is 0 unless something is blocked, so it can gate a commit when wanted.

The size numbers come from the reference implementation, not from a round number
someone liked: utevo-lux ships seven skills of 64 to 185 lines, median 76, and
this fleet's own core-loop runs 28 to 257, median 95. A skill past ~260 lines is
not automatically wrong, but it is past everything that has been shown to work
here, and the burden is on it.
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HARD_MAX = 750          # Anthropic's ceiling; past this a split is not optional
BENCHMARK_MAX = 260     # the largest skill in either reference set
MIN_DESC = 120          # shorter than this has no room for what + when

# Names of other agent tools. A skill that still *addresses* one was imported and
# never adapted -- but naming one in passing ("a coding agent: Claude, Copilot")
# is ordinary prose, so this only ever warns. "cursor" is excluded on purpose:
# here it is a pagination term.
FOREIGN = re.compile(r"\b(codex|windsurf|cline|aider|copilot)\b", re.I)


def prose(text):
    """Drops fenced blocks and inline code: an example link is not a link."""
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    return re.sub(r"`[^`\n]*`", "", text)


def frontmatter(text):
    m = re.match(r"^---\n(.*?)\n---", text, re.S)
    return m.group(1) if m else ""


def audit(path):
    """Returns [(severity, message)] for one SKILL.md."""
    text = open(path, encoding="utf-8").read()
    body = frontmatter(text)
    lines = text.count("\n") + 1
    out = []

    name = re.search(r"^name:\s*(.+)$", body, re.M)
    desc = re.search(r"^description:\s*(.+)$", body, re.M)
    folder = os.path.basename(os.path.dirname(path))

    if not name:
        out.append(("BLOCKER", "no `name` in the frontmatter"))
    elif name.group(1).strip() != folder:
        out.append(("BLOCKER", f"`name: {name.group(1).strip()}` does not match folder `{folder}`"))

    # A slash-only skill is chosen by the user, not matched by the model, so a
    # short description costs it nothing.
    slash_only = "disable-model-invocation: true" in body
    if not desc:
        out.append(("BLOCKER", "no `description` — the skill is never discovered"))
    else:
        d = desc.group(1).strip().strip('"')
        if len(d) < MIN_DESC:
            sev = "WARN" if slash_only else "BLOCKER"
            out.append((sev, f"description is {len(d)} chars: no room for what it does plus when to use it"))
        elif not slash_only and not re.search(r"\b(use\b|used\b|usar|use quando|use when)", d, re.I):
            out.append(("WARN", "description never says *when* to reach for it"))

    if lines > HARD_MAX:
        out.append(("BLOCKER", f"{lines} lines, past the {HARD_MAX} ceiling with no split"))
    elif lines > BENCHMARK_MAX:
        out.append(("WARN", f"{lines} lines, past the {BENCHMARK_MAX} of the largest reference skill"))

    found = sorted({m.lower() for m in FOREIGN.findall(text)})
    if found:
        out.append(("WARN", "names another tool (" + ", ".join(found) +
                    ") — check whether it is an inherited instruction or just prose"))

    if re.search(r"\b(MUST|NEVER|ALWAYS|CRITICAL)\b", text):
        n = len(re.findall(r"\b(MUST|NEVER|ALWAYS|CRITICAL)\b", text))
        if n >= 8:
            out.append(("WARN", f"{n} rules shouted in caps — a rule with a reason generalizes, a shout does not"))

    skill_dir = os.path.dirname(path)
    for link in re.findall(r"\[[^\]]+\]\(([^)]+\.md)\)", prose(text)):
        if link.startswith(("http", "#")):
            continue
        if not os.path.exists(os.path.join(skill_dir, link)):
            out.append(("BLOCKER", f"link to `{link}`, which does not exist"))

    return lines, out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    pattern = os.path.join(ROOT, "skills", args[0] if args else "*", "*", "SKILL.md")
    paths = sorted(glob.glob(pattern))
    if not paths:
        print("no skills matched")
        return 1

    if "--sizes" in sys.argv:
        sizes = sorted((audit(p)[0], os.path.basename(os.path.dirname(p))) for p in paths)
        mid = sizes[len(sizes) // 2][0]
        print(f"{len(sizes)} skills · smallest {sizes[0][0]} ({sizes[0][1]}) · median {mid} · largest {sizes[-1][0]} ({sizes[-1][1]})")
        print(f"reference: utevo-lux 64-185 (median 76) · core-loop 28-257 (median 95)")
        for n, s in sizes[-8:][::-1]:
            print(f"  {n:4} {s}")
        return 0

    blocked = 0
    for path in paths:
        _, findings = audit(path)
        if not findings:
            continue
        rel = os.path.relpath(path, ROOT)
        print(f"\n{os.path.dirname(rel)}")
        for sev, msg in findings:
            print(f"  {sev:9} {msg}")
            blocked += sev == "BLOCKER"

    total = len(paths)
    print(f"\n{total} skills swept, {blocked} blocker(s).")
    print("Passing here is not the same as being read: judgement is the second pass.")
    return 1 if blocked else 0


if __name__ == "__main__":
    sys.exit(main())
