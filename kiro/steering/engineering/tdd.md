---
inclusion: manual
description: Test-driven development with red-green-refactor loop — vertical slices, behavior over implementation
---

# Test-Driven Development

## Philosophy

Tests verify behavior through public interfaces, not implementation details. A good test reads like a specification — "user can checkout with valid cart." These tests survive refactors because they don't care about internal structure.

**Anti-pattern**: Tests that mock internal collaborators or verify through external means. Warning sign: test breaks on refactor but behavior hasn't changed.

## Anti-Pattern: Horizontal Slices

**DO NOT** write all tests first, then all implementation. This produces tests that test imagined behavior.

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4
  GREEN: impl1, impl2, impl3, impl4

RIGHT (vertical):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  ...
```

## Workflow

### 1. Planning

Before writing any code:
- [ ] Confirm interface changes needed
- [ ] Confirm which behaviors to test (prioritize)
- [ ] Design interfaces for testability
- [ ] List behaviors to test (not implementation steps)
- [ ] Get user approval on the plan

### 2. Tracer bullet

Write ONE test that confirms ONE behavior → proves the path works end-to-end.

### 3. Incremental loop

For each remaining behavior:
- RED: write next test → fails
- GREEN: minimal code to pass → passes

Rules: one test at a time, only enough code to pass current test, don't anticipate future tests.

### 4. Refactor

After all tests pass:
- [ ] Extract duplication
- [ ] Deepen modules
- [ ] Run tests after each refactor step

**Never refactor while RED.**

## Checklist per cycle

```
[ ] Test describes behavior, not implementation
[ ] Test uses public interface only
[ ] Test would survive internal refactor
[ ] Code is minimal for this test
[ ] No speculative features added
```
