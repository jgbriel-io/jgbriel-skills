---
inclusion: manual
description: Turn conversation context into a PRD — synthesize without interviewing, publish to issue tracker
---

# To PRD

Synthesize current conversation context and codebase understanding into a PRD. Do **not** interview the user — just synthesize what you already know.

## Process

1. **Explore repo** to understand current codebase state. Use the project's domain glossary throughout.

2. **Sketch major modules** to build or modify. Look for opportunities to extract deep modules testable in isolation. Confirm with user that modules match expectations.

3. **Write PRD** using the template below, then publish to the project issue tracker with `ready-for-agent` label.

## PRD Template

```markdown
## Problem Statement
The problem the user faces, from the user's perspective.

## Solution
The solution, from the user's perspective.

## User Stories
Numbered list. Each: "As a <actor>, I want <feature>, so that <benefit>."
Be extensive — cover all aspects of the feature.

## Implementation Decisions
- Modules to build/modify
- Interface changes
- Architectural decisions
- Schema changes
- API contracts
Do NOT include file paths or code snippets (go stale fast).
Exception: prototype snippets that encode a decision precisely.

## Testing Decisions
- What makes a good test (external behavior, not implementation)
- Which modules will be tested
- Prior art (similar tests in codebase)

## Out of Scope
What is explicitly excluded from this PRD.

## Further Notes
Any additional context.
```
