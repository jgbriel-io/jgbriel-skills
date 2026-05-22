---
inclusion: manual
description: Find deepening opportunities — refactors that turn shallow modules into deep ones for better testability and AI-navigability
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities**. The aim is testability and AI-navigability.

## Vocabulary (use exactly)

- **Module** — anything with an interface and an implementation
- **Interface** — everything a caller must know: types, invariants, error modes, ordering, config
- **Depth** — leverage at the interface: a lot of behaviour behind a small interface
- **Seam** — where an interface lives; a place behaviour can be altered without editing in place
- **Adapter** — a concrete thing satisfying an interface at a seam
- **Deletion test** — imagine deleting the module. If complexity concentrates, it was earning its keep

## Process

### 1. Explore

Read project's domain glossary and ADRs first. Then walk the codebase organically, noting friction:
- Understanding one concept requires bouncing between many small modules?
- Modules shallow — interface nearly as complex as implementation?
- Pure functions extracted just for testability but real bugs hide in how they're called?
- Tightly-coupled modules leaking across seams?
- Hard to test through current interface?

Apply deletion test to anything suspected shallow.

### 2. Present candidates

Numbered list. For each:
- **Files** involved
- **Problem** causing friction
- **Solution** in plain English
- **Benefits** in terms of locality and leverage

Use `CONTEXT.md` vocabulary for domain, architecture vocabulary above for structure. Flag ADR conflicts explicitly.

Do NOT propose interfaces yet. Ask: "Which would you like to explore?"

### 3. Grilling loop

Once user picks a candidate, drop into grilling. Walk the design tree — constraints, shape of deepened module, what tests survive.

Side effects inline as decisions crystallize:
- New concept not in `CONTEXT.md`? Add it right there.
- User rejects with load-bearing reason? Offer an ADR.
