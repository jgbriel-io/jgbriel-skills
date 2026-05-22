---
inclusion: manual
description: Grilling session that challenges a plan against the domain model, sharpens terminology, and updates CONTEXT.md and ADRs inline
---

# Grill With Docs

Interview relentlessly about every aspect of a plan until reaching shared understanding. Walk down each branch of the design tree, resolving dependencies one-by-one. Provide a recommended answer for each question. Ask one question at a time.

If a question can be answered by exploring the codebase, explore instead.

## During the session

**Challenge against glossary.** When user uses a term conflicting with `CONTEXT.md`: "Your glossary defines X as Y, but you seem to mean Z — which is it?"

**Sharpen fuzzy language.** When vague terms appear, propose a precise canonical term.

**Discuss concrete scenarios.** Stress-test domain relationships with specific edge cases.

**Cross-reference with code.** If user states how something works, check if code agrees. Surface contradictions.

**Update `CONTEXT.md` inline.** When a term is resolved, update right there — don't batch. `CONTEXT.md` is a glossary only, not a spec or scratch pad.

**Offer ADRs sparingly.** Only when all three are true:
1. Hard to reverse
2. Surprising without context
3. Result of a real trade-off with genuine alternatives

## File structure

```
/
├── CONTEXT.md          ← glossary (create lazily when first term resolved)
└── docs/adr/           ← ADRs (create lazily when first ADR needed)
```

If `CONTEXT-MAP.md` exists at root, repo has multiple bounded contexts — each has its own `CONTEXT.md`.
