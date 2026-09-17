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

# Vendor packs are tracked here but authored upstream. Editing one to satisfy a
# local rule is what makes the next `skill-sync` a merge conflict, so their
# findings are reported and never blocking.
VENDOR = {"cloudflare"}
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
    """Returns (line count, [(severity, message)]) for one SKILL.md."""
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

    # A slash-only skill never enters the model's skill listing, so its
    # description costs no context and is human-facing by design: a one-line
    # summary with the trigger list stripped, per `meta/writing-great-skills`.
    # Nothing about its length is this script's business.
    slash_only = "disable-model-invocation: true" in body
    if not desc:
        out.append(("BLOCKER", "no `description` — the skill is never discovered"))
    else:
        d = desc.group(1).strip().strip('"')
        if slash_only:
            pass
        elif len(d) < MIN_DESC:
            out.append(("BLOCKER", f"description is {len(d)} chars: no room for what it does plus when to use it"))
        elif not re.search(r"\b(use\b|used\b|usar|use quando|use when)", d, re.I):
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

    if len(re.findall(r"^```", text, re.M)) % 2:
        out.append(("BLOCKER", "unbalanced code fence — a split cut through a block"))

    out += shared(text, os.path.dirname(path))
    return lines, out


def shared(text, base):
    """Checks that read the same on a skill, an agent and a command."""
    out = []
    if len(re.findall(r"^```", text, re.M)) % 2:
        out.append(("BLOCKER", "unbalanced code fence — a split cut through a block"))
    for link in re.findall(r"\[[^\]]+\]\(([^)]+\.md)\)", prose(text)):
        if link.startswith(("http", "#")):
            continue
        if not os.path.exists(os.path.join(base, link)):
            out.append(("BLOCKER", f"link to `{link}`, which does not exist"))
    # Machine paths are read from the raw text on purpose: the one that bit here
    # was inside a fenced block, which is where a command's steps live.
    for machine in sorted(set(re.findall(r"/home/\w+|/Users/\w+|[A-Z]:\\[\w\\]+", text))):
        out.append(("BLOCKER", f"hardcoded machine path `{machine}` — it does not exist on the other machine"))
    if re.search(r"(?<![\w/])/tmp/", text):
        out.append(("WARN", "writes under /tmp/ — absent on Windows, and rarely what the step actually needs"))
    return out


# An agent or a command is one file with frontmatter, not a folder, and the two
# defects that bit here are structural: a body that delegates to an agent the
# frontmatter never allowed the Task tool for, and a name that points nowhere.
DELEGATES = re.compile(r"`([a-z0-9-]+)` agent|\bagent `([a-z0-9-]+)`")


def audit_flat(path, kind):
    """Returns (line count, [(severity, message)]) for one agents/ or commands/ file."""
    text = open(path, encoding="utf-8").read()
    head = frontmatter(text)
    lines = text.count("\n") + 1
    stem = os.path.basename(path)[:-3]
    out = []

    if not head:
        out.append(("BLOCKER", "no frontmatter"))
    desc = re.search(r"^description:\s*(.+)$", head, re.M)
    if not desc:
        out.append(("BLOCKER", "no `description` — nothing says what this is for"))

    # An agent is addressed by its `name`; a command is addressed by its filename.
    if kind == "agents":
        name = re.search(r"^name:\s*(.+)$", head, re.M)
        if not name:
            out.append(("BLOCKER", "no `name` in the frontmatter"))
        elif name.group(1).strip() != stem:
            out.append(("BLOCKER", f"`name: {name.group(1).strip()}` does not match file `{stem}.md`"))

    tools = re.search(r"^(?:allowed-tools|tools):\s*(.+)$", head, re.M)
    granted = tools.group(1) if tools else ""
    # Not prose(): the agent's name is always in backticks, and prose() drops
    # exactly that. Fences come out, because a briefing block names it too.
    delegated = sorted({(a or b) for a, b in DELEGATES.findall(re.sub(r"```.*?```", "", text, flags=re.S))})
    for agent in delegated:
        if not os.path.exists(os.path.join(ROOT, "agents", agent + ".md")):
            out.append(("BLOCKER", f"delegates to agent `{agent}`, which is not in agents/"))
    if delegated and tools and "Task" not in granted:
        out.append(("BLOCKER", "delegates to " + ", ".join(f"`{a}`" for a in delegated) +
                    " but the frontmatter never grants `Task` — the delegation cannot run"))

    if lines > BENCHMARK_MAX:
        out.append(("WARN", f"{lines} lines, past the {BENCHMARK_MAX} of the largest reference skill"))

    out += shared(text, os.path.dirname(path))
    return lines, out


def collect(arg):
    """(paths, kind) for a category name, `agents`, `commands`, or everything."""
    if arg in ("agents", "commands"):
        return sorted(glob.glob(os.path.join(ROOT, arg, "*.md"))), arg
    return sorted(glob.glob(os.path.join(ROOT, "skills", arg or "*", "*", "SKILL.md"))), "skills"


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    arg = args[0] if args else None
    targets = [collect(arg)] if arg else [collect(None), collect("agents"), collect("commands")]
    paths = [p for group, _ in targets for p in group]
    if not paths:
        print("nothing matched")
        return 1

    if "--sizes" in sys.argv:
        sizes = sorted((audit(p)[0], os.path.basename(os.path.dirname(p)))
                       for group, kind in targets if kind == "skills" for p in group)
        mid = sizes[len(sizes) // 2][0]
        print(f"{len(sizes)} skills · smallest {sizes[0][0]} ({sizes[0][1]}) · median {mid} · largest {sizes[-1][0]} ({sizes[-1][1]})")
        print(f"reference: utevo-lux 64-185 (median 76) · core-loop 28-257 (median 95)")
        for n, s in sizes[-8:][::-1]:
            print(f"  {n:4} {s}")
        return 0

    blocked = 0
    for group, kind in targets:
        for path in group:
            if kind == "skills":
                _, findings = audit(path)
                for ref in sorted(glob.glob(os.path.join(os.path.dirname(path), "references", "*.md"))):
                    if len(re.findall(r"^```", open(ref, encoding="utf-8").read(), re.M)) % 2:
                        findings.append(("BLOCKER", f"unbalanced fence in references/{os.path.basename(ref)}"))
            else:
                _, findings = audit_flat(path, kind)
            if not findings:
                continue
            rel = os.path.relpath(path, ROOT)
            vendor = kind == "skills" and rel.split(os.sep)[1] in VENDOR
            label = os.path.dirname(rel) if kind == "skills" else rel
            print(f"\n{label}" + ("  [vendor]" if vendor else ""))
            for sev, msg in findings:
                if vendor and sev == "BLOCKER":
                    sev = "VENDOR"
                print(f"  {sev:9} {msg}")
                blocked += sev == "BLOCKER"

    total = len(paths)
    print(f"\n{total} file(s) swept, {blocked} blocker(s).")
    print("Passing here is not the same as being read: judgement is the second pass.")
    return 1 if blocked else 0


if __name__ == "__main__":
    sys.exit(main())
