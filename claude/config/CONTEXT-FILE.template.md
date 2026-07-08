# <DOMAIN>.md — domain context file

<!--
Pattern for per-domain context files a project keeps next to its code:
DESIGN.md (visual language), CONTEXT.md (glossary — see
../../templates/CONTEXT.template.md), SECURITY.md, docs/adr/NNNN-*.md.

They are NOT loaded automatically. They work because something points at
them: the project CLAUDE.md says "read docs/DESIGN.md before UI work", or a
skill reads them by convention (grill-with-docs, domain-modeling, diagnose).

Rules:
- One domain per file; the filename is the domain.
- Facts and decisions only — no narration, no history (git has that).
- If a rule must ALWAYS apply, it belongs in CLAUDE.md, not here.
-->

## <Section per stable fact-group>

- Decision/constraint, stated as the rule the reader must follow.
- Why, in one line, when non-obvious.

## Pointers

- Related: `docs/adr/0003-....md` · `CONTEXT.md` entry "<term>"
