#!/usr/bin/env node
/**
 * Prints the ruleset of installed mode skills (caveman, ponytail) as session
 * context, so a mode stays on in an agent that has no plugin hook for it.
 * The rules are read from the installed SKILL.md at run time, never copied
 * here, so an update of the skill is an update of the mode.
 *
 *     node hooks/inject-mode.mjs [--cursor] <skill>[:<level>] ...
 *
 * Codex adds plain stdout as developer context; Cursor wants
 * `{ "additional_context": ... }` from its sessionStart hook.
 */
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const SKILL_DIRS = [".agents/skills", ".cursor/skills", ".codex/skills", ".claude/skills"];

export function skillBody(text) {
  return text.replace(/\r\n/g, "\n").replace(/^---\n[\s\S]*?\n---\n/, "").trim();
}

export function modeContext(specs, home = process.env.LINK_AGENTS_HOME ?? homedir()) {
  return specs
    .map((spec) => {
      const [skill, level] = spec.split(":");
      const path = SKILL_DIRS.map((dir) => join(home, dir, skill, "SKILL.md")).find(existsSync);
      if (!path) return null;
      const header = `${skill.toUpperCase()} MODE ACTIVE${level ? `, level: ${level}` : ""}. It applies to every response until the user says "stop ${skill}" or "normal mode".`;
      return `${header}\n\n${skillBody(readFileSync(path, "utf8"))}`;
    })
    .filter(Boolean)
    .join("\n\n---\n\n");
}

function main() {
  const args = process.argv.slice(2);
  const text = modeContext(args.filter((a) => !a.startsWith("--")));
  if (args.includes("--cursor")) process.stdout.write(JSON.stringify(text ? { additional_context: text } : {}));
  else if (text) process.stdout.write(text);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
