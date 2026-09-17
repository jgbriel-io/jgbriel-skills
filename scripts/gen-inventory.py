#!/usr/bin/env python3
"""Regenerates the inventory blocks in README.md and claude/STRUCTURE.md from the tree.

These tables were hand-maintained and drifted every time a skill moved: STRUCTURE.md
claimed 33 skills while the repo held 92, and listed a dozen that had been deleted
months earlier. Anything a human has to remember to update is a table that lies.

Each block lives between markers and is replaced wholesale:

    <!-- inventory:skills:start -->  ... <!-- inventory:skills:end -->
    <!-- inventory:commands:start --> ... <!-- inventory:commands:end -->
    <!-- inventory:agents:start -->  ... <!-- inventory:agents:end -->

    gen-inventory.py           rewrite the blocks
    gen-inventory.py --check   exit 1 if any block is stale, change nothing

Run it after adding, removing or moving anything. `--check` is the CI-shaped form.
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def frontmatter(path):
    """Returns (name, description) from a SKILL.md, falling back to the dirname."""
    text = open(path, encoding="utf-8").read()
    fm = re.match(r"^---\n(.*?)\n---", text, re.S)
    body = fm.group(1) if fm else ""
    name = re.search(r"^name:\s*(.+)$", body, re.M)
    desc = re.search(r"^description:\s*(.+)$", body, re.M)
    return (
        name.group(1).strip() if name else os.path.basename(os.path.dirname(path)),
        desc.group(1).strip().strip('"') if desc else "",
    )


def first_sentence(text, limit=120):
    """Descriptions are written for the model and run long; tables need one line."""
    s = re.split(r"(?<=[.!?])\s+", text.strip())[0] if text else ""
    return (s[: limit - 1] + "…") if len(s) > limit else s


def skills():
    out = {}
    for p in sorted(glob.glob(os.path.join(ROOT, "skills", "*", "*", "SKILL.md"))):
        cat = os.path.basename(os.path.dirname(os.path.dirname(p)))
        out.setdefault(cat, []).append(frontmatter(p))
    return out


def flat(kind):
    out = []
    for p in sorted(glob.glob(os.path.join(ROOT, kind, "*.md"))):
        name = os.path.basename(p)[:-3]
        text = open(p, encoding="utf-8").read()
        fm = re.search(r"^description:\s*(.+)$", text, re.M)
        out.append((name, first_sentence(fm.group(1).strip().strip('"')) if fm else ""))
    return out


def block_skills():
    cats = skills()
    total = sum(len(v) for v in cats.values())
    lines = [f"**{total} skills**, across {len(cats)} category folders:", ""]
    for cat in sorted(cats):
        entries = cats[cat]
        lines.append(f"<details><summary><code>{cat}</code> — {len(entries)} skills</summary>")
        lines += ["", "| Skill | What it is for |", "|---|---|"]
        lines += [f"| `{n}` | {first_sentence(d)} |" for n, d in sorted(entries)]
        lines += ["", "</details>"]
    return "\n".join(lines)


def block_commands():
    rows = flat("commands")
    return "\n".join(
        [f"**{len(rows)} slash commands:**", "", "| Command | Description |", "|---|---|"]
        + [f"| `/{n}` | {d} |" for n, d in rows]
    )


def block_agents():
    rows = flat("agents")
    return "\n".join(
        [f"**{len(rows)} agents** — they run in an isolated subagent:", "", "| Agent | What it is for |", "|---|---|"]
        + [f"| `{n}` | {d} |" for n, d in rows]
    )


BLOCKS = {"skills": block_skills, "commands": block_commands, "agents": block_agents}
TARGETS = ["README.md", os.path.join("claude", "STRUCTURE.md")]


def main():
    check = "--check" in sys.argv
    stale, written = [], []
    for rel in TARGETS:
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            continue
        text = original = open(path, encoding="utf-8").read()
        for key, build in BLOCKS.items():
            pattern = re.compile(
                rf"<!-- inventory:{key}:start -->.*?<!-- inventory:{key}:end -->", re.S
            )
            if not pattern.search(text):
                continue
            replacement = (
                f"<!-- inventory:{key}:start -->\n{build()}\n<!-- inventory:{key}:end -->"
            )
            text = pattern.sub(lambda _: replacement, text)
        if text != original:
            (stale if check else written).append(rel)
            if not check:
                open(path, "w", encoding="utf-8").write(text)

    if check:
        if stale:
            print("inventory out of date: " + ", ".join(stale))
            print("run scripts/gen-inventory.py")
            return 1
        print("inventory in sync")
        return 0
    print("updated: " + (", ".join(written) if written else "nothing to do"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
