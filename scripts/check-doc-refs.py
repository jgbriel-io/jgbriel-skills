#!/usr/bin/env python3
"""Fails when the docs name a command, skill or agent the repo does not have.

Every inventory in this repo has been wrong at least once: STRUCTURE.md claimed
33 skills with 92 on disk, WORKFLOWS.md routed to skills archived months earlier,
GUIDE.md listed commands that never survived the move to a plugin. The generator
fixed the tables it owns. This covers the prose around them, where a name is
written by hand and nothing ever checks it again.

    check-doc-refs.py          report every dead reference, exit 1 if any
    check-doc-refs.py --list   print what the repo actually provides

A name is dead when a Markdown file writes `/name` — backticked in prose, or bare
inside the fenced recipes, which is where the rot actually lived — and it matches
nothing: no command, no skill, no agent, no archived skill, and not one of the
built-ins or installed plugins below. Archived skills count as known so a
sentence can still say something was archived; referring to one as if it were
live is caught by the generator's own counts, not here.
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Claude Code's own commands and the plugins installed alongside this one. A
# name here is not ours to provide, but it is legitimate in a sentence.
EXTERNAL = {
    # built-in
    "code-review", "simplify", "security-review", "init", "model", "config",
    "update-config", "fewer-permission-prompts", "skills", "plugin", "help",
    "compact", "clear", "resume", "agents", "hooks", "memory", "loop", "schedule",
    # third-party plugins
    "caveman", "ctx-stats", "ctx-doctor", "ctx-upgrade", "ctx-purge", "ctx-index",
    "ctx-search", "ctx-insight", "ponytail", "ponytail-review", "ponytail-audit",
    "ponytail-debt", "ponytail-gain", "ponytail-help", "caveman-review", "caveman-commit",
}

# Absolute paths read as a slash-name and are not references to anything.
NOT_A_NAME = {
    "tmp", "etc", "home", "usr", "var", "bin", "opt", "dev", "root", "mnt",
    "media", "proc", "sys", "srv", "run", "boot", "lib", "src", "docs", "path",
    "caminho", "projetos", "users", "claude",
}


def provided():
    """Everything this repo ships, by name, plus what it keeps archived."""
    names = {os.path.basename(p)[:-3] for p in glob.glob(os.path.join(ROOT, "commands", "*.md"))}
    names |= {os.path.basename(p)[:-3] for p in glob.glob(os.path.join(ROOT, "agents", "*.md"))}
    names |= {os.path.basename(os.path.dirname(p))
              for p in glob.glob(os.path.join(ROOT, "skills", "*", "*", "SKILL.md"))}
    archived = {os.path.basename(p) for p in glob.glob(os.path.join(ROOT, "claude", "skills-archived", "*"))}
    return names, archived


def docs():
    for rel in ["README.md"] + sorted(glob.glob(os.path.join(ROOT, "claude", "*.md"))):
        path = rel if os.path.isabs(rel) else os.path.join(ROOT, rel)
        yield os.path.relpath(path, ROOT), path


def main():
    live, archived = provided()
    if "--list" in sys.argv:
        print(f"{len(live)} vivos: " + " ".join(sorted(live)))
        print(f"{len(archived)} arquivados: " + " ".join(sorted(archived)))
        return 0

    known = live | archived | EXTERNAL
    dead = []
    for rel, path in docs():
        for n, line in enumerate(open(path, encoding="utf-8"), 1):
            line = re.sub(r"<[^>]*>", " ", line)  # </details> is not a reference
            hits = re.findall(r"`/([a-z][a-z0-9-]{2,})[ `]", line)
            hits += re.findall(r"(?<![\w:/`.-])/([a-z][a-z0-9-]{2,})(?![\w/.-])", line)
            for name in dict.fromkeys(hits):
                if name not in known and name not in NOT_A_NAME:
                    dead.append((rel, n, name, line.strip()[:70]))

    if dead:
        print(f"{len(dead)} referência(s) para algo que não existe:\n")
        for rel, n, name, line in dead:
            print(f"  {rel}:{n}  /{name}\n      {line}")
        print("\nOu o nome mudou, ou a skill foi arquivada, ou falta em EXTERNAL.")
        return 1
    print("nenhuma referência morta")
    return 0


if __name__ == "__main__":
    sys.exit(main())
