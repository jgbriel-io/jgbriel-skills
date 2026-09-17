# Final output and review checklist

When the skill is done:

1. **Confirm where it was written.** A fleet skill goes in the repo, inside the
   category plugin it belongs to: `skills/<categoria>/<name>/SKILL.md`.
   Choosing the category is part of creating the skill — say which one and why.
   A project-local skill stays at `<project>/.claude/skills/<name>/SKILL.md` and
   none of the publishing below applies to it.
2. **Publish it**, or it exists only in the repo: bump the plugin's `version` in
   `.claude-plugin/plugin.json`, commit, then
   `claude plugin update <categoria>@jgbriel`. The runtime is a versioned copy
   pinned to a commit — without the bump, nothing reaches any machine.
3. Tell them to restart Claude Code (or open a new session) so it loads — skills are read at session start.
4. Suggest a test invocation: `/<skill-name>` or a natural-language trigger.
5. Note if they need to add tool permissions to `settings.json` for any
   commands the skill uses.
6. Mirror the skill to the vault docs copy
   (`Obsidian Vault\wiki\Tools\Claude Code\skills\<categoria>\<name>\`) and
   add it to `skills/index.md` there. The mirror is manual: a skill that skips
   this step is simply absent from the vault docs.

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
