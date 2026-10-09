#!/usr/bin/env node
/**
 * Writes `agents/openai.yaml` beside every SKILL.md: the picker metadata Codex
 * reads, and the one place it learns that a skill is user-invoked only.
 *
 * The file is derived, never edited. `disable-model-invocation: true` in the
 * frontmatter becomes `allow_implicit_invocation: false`, so a skill is
 * user-invoked in Claude Code and Codex or in neither.
 *
 *     node scripts/gen-openai-yaml.mjs            rewrite what is stale
 *     node scripts/gen-openai-yaml.mjs --check    exit 1 if any file is stale
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS = join(ROOT, "skills");
const ACRONYMS = new Set(["api", "ci", "cd", "cv", "e2e", "lgpd", "pr", "tcc", "tdd", "ux", "wip"]);
const SHORT_MAX = 100;

export function frontmatter(text) {
  const head = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const field = (key) => head.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1].trim();
  return { name: field("name"), description: field("description"), userInvoked: field("disable-model-invocation") === "true" };
}

export function displayName(name) {
  return name
    .split("-")
    .map((w) => (ACRONYMS.has(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

export function shortDescription(description) {
  const sentence = description.split(/(?<=[.!?])\s+/)[0];
  if (sentence.length <= SHORT_MAX) return sentence;
  const cut = sentence.slice(0, SHORT_MAX - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

export function openaiYaml({ name, description, userInvoked }) {
  const lines = [
    "interface:",
    `  display_name: ${JSON.stringify(displayName(name))}`,
    `  short_description: ${JSON.stringify(shortDescription(description))}`,
  ];
  if (userInvoked) lines.push("policy:", "  allow_implicit_invocation: false");
  return `${lines.join("\n")}\n`;
}

function skillDirs() {
  return readdirSync(SKILLS).flatMap((category) =>
    readdirSync(join(SKILLS, category))
      .map((name) => join(SKILLS, category, name))
      .filter((dir) => existsSync(join(dir, "SKILL.md"))),
  );
}

function main() {
  const check = process.argv.includes("--check");
  const stale = [];
  for (const dir of skillDirs()) {
    const meta = frontmatter(readFileSync(join(dir, "SKILL.md"), "utf8"));
    const target = join(dir, "agents", "openai.yaml");
    const wanted = openaiYaml(meta);
    const current = existsSync(target) ? readFileSync(target, "utf8").replace(/\r\n/g, "\n") : null;
    if (current === wanted) continue;
    stale.push(target);
    if (!check) {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, wanted);
    }
  }
  if (check && stale.length) {
    console.error(`${stale.length} openai.yaml stale or missing; run node scripts/gen-openai-yaml.mjs`);
    process.exit(1);
  }
  console.log(check ? "openai.yaml in sync" : `wrote ${stale.length} openai.yaml`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
