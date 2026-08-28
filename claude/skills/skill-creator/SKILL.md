---
name: skill-creator
description: Create new Claude Code skills from scratch and iteratively improve existing ones. Use whenever the user wants to build a skill, scaffold a SKILL.md, turn a recurring workflow into a reusable skill, edit an existing skill, fix a skill that isn't triggering, or rewrite a skill's description to trigger more reliably. Also use when the user says things like "make this a skill", "let's bundle this workflow", "I want a /something command", or mentions skills, plugins, or progressive disclosure even without naming the skill explicitly.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Skill Creator

Builds and refines Claude Code skills. The point of this skill is to keep the
process of authoring a skill **lightweight** — capture intent, write a draft,
try it on a couple of realistic prompts, fix what's bad, ship.

Heavy machinery (subagent grading, eval viewers, automated description
optimizers) is **out of scope** here. If you want that, install the upstream
`anthropics/skills` repo separately.

## When to use

- User says: "make a skill for X", "turn this into a /command", "scaffold a skill",
  "this workflow keeps repeating, can we save it", "fix my skill, it's not
  triggering", "rewrite this skill's description".
- User pastes a SKILL.md and asks for review.
- Conversation contains a recurring workflow (3+ similar invocations) the user
  hasn't yet named — proactively suggest turning it into a skill.

## Core loop

1. **Capture intent** — what the skill does, when it triggers, what it outputs.
2. **Draft SKILL.md** — name, description (pushy), body, optional bundles.
3. **Test on 2–3 realistic prompts** — try them inline, look at outputs.
4. **Review with user** — show outputs, ask what's wrong.
5. **Revise** — change instructions, not just examples. Generalize.
6. **Repeat** until user happy or feedback runs dry.

Don't skip step 1. Most bad skills come from charging into draft mode without
knowing what the user actually wants.

---

## Step 1 — Capture intent

Ask the user (or extract from conversation):

1. **What should this skill let Claude do?** Concrete output, not vibes.
2. **When should it trigger?** What phrases would a user actually say? Include
   the lazy/typo versions, not just clean prose.
3. **What's the output format?** File? Inline markdown? Modified code? Report?
4. **Is the output objectively verifiable** (file transform, code gen, fixed
   workflow) or subjective (style, design)? Verifiable skills benefit from
   test prompts. Subjective skills you can vibe-check.
5. **Any bundled scripts/templates needed?** If the workflow always runs the
   same 50-line Python snippet, that snippet belongs in `scripts/`, not in
   the prose of SKILL.md.
6. **Auto-invocable or explicit-only?** Model-invoked costs context load (the
   description sits in the window every turn) but lets Claude and other skills
   reach it; user-invoked (`disable-model-invocation: true`) is zero context
   load but the user must remember it exists. Pick model-invocation only when
   the agent must fire it on its own. Full framework: `/writing-great-skills`.

If user is vague, propose 2–3 concrete versions and ask which matches.

### Red-line check (before anything else)

Some domains must not get a skill at all. If the domain requires professional
licensure or a wrong answer causes physical, legal, or financial harm — medical
or clinical diagnosis/treatment, legal advice (vs. compliance *research*),
specific financial buy/sell/allocation advice (vs. *analysis*), mental health,
safety-critical engineering — **refuse to build the checklist and route to a
qualified human.** A skill wearing the costume of competence in these areas is
worse than none: a test prompt can't catch advice that gets someone hurt or
sued. Anything adjacent ships only with human sign-off, never on a vibe-check
alone.

### Collision check (before drafting)

Grep the frontmatter descriptions of installed skills
(`~/.claude/skills/*/SKILL.md`) plus the plugin skills you can see in context
for the new skill's trigger territory. Two skills answering the same trigger =
invocation lottery — the top defect found in the 2026-07 audit. If territory
overlaps: rename, narrow the description, or add mutual negative cases before
writing any body.

## Step 2 — Draft the skill

### Anatomy

```
<skill-name>/
├── SKILL.md          (required — frontmatter + body)
├── scripts/          (optional — executable helpers)
├── references/       (optional — docs loaded on demand)
├── templates/        (optional — files copied into outputs)
└── assets/           (optional — images, fonts, etc.)
```

### Frontmatter

```yaml
---
name: kebab-case-name
description: One sentence on what it does + explicit triggering contexts. Be pushy — say "use this whenever X, Y, or Z, even if the user doesn't say 'skill'". Claude under-triggers skills by default.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep   # optional, restricts tools
---
```

**The description is the single most important field.** It's the only thing
Claude sees when deciding whether to load the skill. Cover:

- What the skill does (active verb).
- Specific trigger phrases / keywords.
- Adjacent contexts where it should still fire ("even if the user says...").
- Optional: 1–2 negative cases to avoid undertrigger AND overtrigger.

**Description constraints:**
- Max **1024 characters** (Anthropic hard limit).
- Write in **third person** ("Create skills" not "I create skills").
- First sentence: what it does. Second sentence: "Use when ...".

**Naming (C1.1):** kebab-case; the name says what the skill does or its
domain — never a persona or vibe (no `senior-*`, `elite-*`, `*-pro-max`).
Use a domain-prefix family when 3+ skills share a domain (`tcc-*`,
`project-*`). Command-style skills may be imperative (`setup-pre-commit`).

Bad: `Helps with PDFs.`
Good: `Extract structured data from PDFs (invoices, receipts, forms) into JSON or CSV. Use when the user uploads a PDF, mentions extracting tables/fields/text from a PDF, asks to parse a receipt, or wants to convert a scanned form to structured data — even if they don't use the word "extract".`

### Body

Keep under ~500 lines. If longer, split into `references/` and link from body.

Use **imperative** voice. Explain *why* a step matters instead of all-caps
MUSTs. Claude has theory of mind; explain the reasoning and it'll generalize.

#### Patterns that work

**Defining output format:**
```markdown
## Report layout
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

## Step 3 — Test on realistic prompts

Write 2–3 prompts a **real user** would type. Cover:

- Clean/canonical case ("Extract data from invoice.pdf").
- Lazy/casual case ("hey can u pull the numbers out of this thing").
- Near-miss / adjacent case (should NOT trigger, e.g. "summarize this PDF").

Save to `<skill-name>/evals/prompts.json`:

```json
{
  "skill": "skill-name",
  "prompts": [
    {"id": 1, "prompt": "...", "should_trigger": true},
    {"id": 2, "prompt": "...", "should_trigger": true},
    {"id": 3, "prompt": "...", "should_trigger": false}
  ]
}
```

Run them in a **fresh session** (no prior context) so you see what really
happens. Capture outputs to `<skill-name>/evals/run-<N>/eval-<id>.md`.

No subagents, no graders, no viewer. Just read the outputs and judge them.

## Step 4 — Review with user

Show the user:

- Each prompt + output.
- Where the skill triggered (or didn't) and whether that was right.
- Anything weird Claude did despite the skill.

Ask: *"Anything off? What would you change?"*

Empty feedback = good. Specific complaints = signal to revise.

## Step 5 — Revise

Use feedback to update **instructions**, not to bolt on special cases for
the test prompts. If a test fails because of a specific phrasing, generalize:
ask why that phrasing tripped Claude up, and adjust the description or body
to cover the class of inputs.

**Rules of thumb when revising:**

1. **Generalize.** Three test prompts is a sample, not the universe. Don't
   overfit. If a fix only works for prompt 2, it's probably wrong.
2. **Cut, don't add.** Prose-bloat is the #1 skill killer. Read the body
   with fresh eyes and delete anything not pulling weight.
3. **Look for repeated work.** If every test run independently wrote the
   same 30-line helper, that helper goes in `scripts/` and SKILL.md says
   "use `scripts/foo.py` for X".
4. **Explain why.** Replace "ALWAYS DO X" with "Do X because Y". Claude
   reasons better with context.
5. **Description tuning.** If skill under-triggers, make description more
   pushy + add lazy-phrasing examples. If it over-triggers on adjacent
   tasks, add a negative case ("not for Z").

Repeat steps 3–5 until done.

---

## Description optimization (lightweight)

If a skill triggers wrong, fix description before body. Process:

1. Write 10–15 realistic prompts, half should-trigger / half shouldn't.
   Make the should-NOT ones tricky — share keywords with should-trigger.
2. Mentally walk through each: would the current description make Claude
   load this skill? Where does it fail?
3. Rewrite description, addressing failures. Re-walk the prompts.
4. Stop when it gets >80% right.

This is the manual version of the upstream `run_loop.py` optimizer. Good
enough for most skills.

---

## Output to user when finished

When the skill is done:

1. Confirm path: `~/.claude/skills/<name>/SKILL.md` (or `%USERPROFILE%\.claude\skills\<name>\SKILL.md` on Windows) for global,
   or `<project>/.claude/skills/<name>/SKILL.md` for project-local.
2. Tell them to restart Claude Code (or open a new session) so it loads — skills are read at session start.
3. Suggest a test invocation: `/<skill-name>` or a natural-language trigger.
4. Note if they need to add tool permissions to `settings.json` for any
   commands the skill uses.
5. Mirror the skill to the vault docs copy
   (`Obsidian Vault\wiki\Tools\Claude Code\skills\<categoria>\<name>\`) and
   add it to `skills/index.md` there. **A new skill must get its vault folder
   by hand once** — `mirror-to-vault.sh` only refreshes folders that already
   exist, so a skill that skips this step never syncs at all.
6. **Write it to both `~/.claude/skills/` and the D: repo, then commit.**
   Unlike `agents/` and `commands/`, `skills/` is a real directory, **not** a
   junction — the two copies are independent and silently drift apart.

---

## Final review checklist

Score the draft against the C1–C11 rubric in
`wiki/Tools/Claude Code/docs/Skills Quality Criteria.md` — or run `/skill-audit` on
the new skill; that rubric is the single source of truth for quality gates
(description, concision <500-line target, progressive disclosure, reasons
over MUSTs, terminology, timelessness). Creator-specific extras on top:

- [ ] Collision check done — no installed skill shares the trigger territory.
- [ ] Invocation mode chosen deliberately (model-invoked vs `disable-model-invocation`).
- [ ] Tested on 2–3 realistic prompts in a fresh session.
- [ ] Mirrored to the vault docs copy + listed in its `skills/index.md`.

## References

- `references/frontmatter-schema.md` — full frontmatter field list.
- `references/examples.md` — annotated examples of well-built skills.
- `templates/SKILL.template.md` — starter file to copy.
