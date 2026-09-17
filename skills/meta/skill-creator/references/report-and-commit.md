# Report layout and commit style

Use this exact structure:

# Title
## Summary
## Findings
## Next steps
```

**Examples block:**
```markdown
## Commit message style
Input: Added JWT auth middleware
Output: feat(auth): add JWT middleware

Input: Fixed off-by-one in pagination
Output: fix(pagination): correct page boundary off-by-one
```

**Domain split** (when skill covers multiple variants):
```
cloud-deploy/
├── SKILL.md            (entry + which variant to load)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```
SKILL.md tells Claude "if user mentions AWS, read `references/aws.md`".

### Anti-patterns

- Pages of ALL-CAPS MUSTs. Better: explain why, trust the model.
- Restating the obvious ("this skill is a skill that...").
- Hyper-specific examples that don't generalize.
- Bundled scripts duplicating what shell tools already do.
- Comments-in-output ("// implementing X") — outputs should be clean.
- The writing-great-skills failure modes: **no-ops** (lines the model already
  obeys by default), **negation** ("don't do X" makes X more available —
  state the positive instead), **sediment**, **duplication**. Run
  `/writing-great-skills` when revising a draft.

---
