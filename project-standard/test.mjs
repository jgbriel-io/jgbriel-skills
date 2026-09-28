#!/usr/bin/env node
/** Self-test for the shared check and the generator. Builds throwaway git repos in the temp dir.
 *
 *     node project-standard/test.mjs
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkAgentsCap, checkDrift, expandBraces, sync } from "./lib/agents.mjs";
import { checkDecisions, checkFrontmatter, checkLinks, parseFrontmatter } from "./lib/docs.mjs";
import { checkGitleaks } from "./lib/gitleaks.mjs";
import { changes, listFiles, reader, resolveBase } from "./lib/git.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const roots = [];
const git = (root, ...args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });

function write(root, files) {
  for (const [p, content] of Object.entries(files)) {
    if (content === null) rmSync(join(root, p));
    else {
      mkdirSync(dirname(join(root, p)), { recursive: true });
      writeFileSync(join(root, p), content);
    }
  }
}

function repo(files) {
  const root = mkdtempSync(join(tmpdir(), "project-standard-"));
  roots.push(root);
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "test@example.invalid");
  git(root, "config", "user.name", "test");
  git(root, "config", "core.autocrlf", "false");
  write(root, files);
  git(root, "add", "-A");
  git(root, "commit", "-q", "--allow-empty", "-m", "base");
  return root;
}

function stage(root, files) {
  write(root, files);
  git(root, "add", "-A");
}

function run(root, kind, base) {
  const scope = kind === "base" ? { kind, base: resolveBase(root, base) } : { kind };
  const read = reader(root, kind === "staged");
  const tracked = listFiles(root);
  const diff = changes(root, scope);
  return [
    ...checkFrontmatter(diff, read),
    ...checkLinks(diff, new Set(tracked), read),
    ...checkDecisions(diff, tracked, read),
    ...checkAgentsCap(tracked, read),
    ...checkDrift(tracked, read),
  ];
}

const messages = (findings) => findings.map((f) => `${f.path}:${f.line}: [${f.check}] ${f.message}`);
const doc = (type, status, extra = "") => `---\ntype: ${type}\nstatus: ${status}\n${extra}---\n# Title\n`;
const decision = (n, status = "accepted", extra = "") => `---\ntype: decision\nstatus: ${status}\nnumber: ${n}\ndate: 2026-09-28\nsuperseded_by:\n${extra}---\n# ${n}\n`;

// Frontmatter parser: empty value is null, block and inline lists, anything else is reported.
{
  const fm = parseFrontmatter("---\nsuperseded_by:\nlabels: [domain:a, 'domain:b']\ndepends_on:\n  - 3\n  - 4\ntitle: \"A: B\"\n---\nbody");
  assert.equal(fm.data.superseded_by, null);
  assert.deepEqual(fm.data.labels, ["domain:a", "domain:b"]);
  assert.deepEqual(fm.data.depends_on, ["3", "4"]);
  assert.equal(fm.data.title, "A: B");
  assert.equal(parseFrontmatter("---\n{ nope }\n---\n").errors.length, 1);
  assert.equal(parseFrontmatter("# no frontmatter"), null);
}

// Frontmatter check on changed docs only; archive is exempt; an unmigrated file elsewhere never blocks.
{
  const root = repo({ "docs/legacy.md": "# no frontmatter, untouched\n" });
  stage(root, {
    "docs/product/vision.md": "# no frontmatter\n",
    "docs/product/scope.md": doc("product", "live"),
    "docs/archive/old.md": "# moved unchanged\n",
    "docs/decisions/0001-a.md": decision(2, "superseded"),
  });
  const found = messages(run(root, "staged")).join("\n");
  assert.match(found, /vision\.md:1: \[frontmatter\] missing frontmatter/);
  assert.match(found, /scope\.md:3: \[frontmatter\] status live/);
  assert.match(found, /0001-a\.md:4: \[frontmatter\] number 2 does not match/);
  assert.match(found, /0001-a\.md:6: \[frontmatter\] a superseded decision needs superseded_by/);
  assert.doesNotMatch(found, /legacy\.md|docs\/archive\//);
}

// Links resolve against tracked files with exact case; untracked, wikilinks and escapes fail; code is skipped.
{
  const root = repo({
    "docs/product/visão geral.md": doc("product", "current"),
    "docs/product/guide.md": doc("product", "current"),
    "src/app.ts": "",
  });
  stage(root, {
    "docs/README.md": [
      doc("index", "current"),
      "[ok](product/guide.md#setup) [dir](../src) [root](/src/app.ts) [web](https://x.dev) [anchor](#top)",
      "[encoded](product/vis%C3%A3o%20geral.md) [angled](<product/visão geral.md>)",
      "[case](product/Guide.md) [untracked](product/untracked.md) [out](../../x.md) [[wiki]]",
      "`[code](nope.md)`",
      "```",
      "[fenced](nope.md)",
      "```",
    ].join("\n"),
  });
  write(root, { "docs/product/untracked.md": "x" });
  const found = messages(run(root, "staged"));
  assert.equal(found.length, 4, found.join("\n"));
  assert.match(found.join("\n"), /product\/Guide\.md does not resolve/);
  assert.match(found.join("\n"), /product\/untracked\.md does not resolve/);
  assert.match(found.join("\n"), /\.\.\/\.\.\/x\.md leaves the repository/);
  assert.match(found.join("\n"), /\[\[wiki\]\] is a wikilink/);
}

// A removal reports only links to the removed file, never an old broken link elsewhere.
{
  const root = repo({
    "docs/a.md": `${doc("product", "current")}[b](b.md)\n`,
    "docs/b.md": doc("product", "current"),
    "docs/c.md": `${doc("product", "current")}[old](gone-long-ago.md)\n`,
  });
  git(root, "rm", "-q", "docs/b.md");
  const found = messages(run(root, "staged"));
  assert.deepEqual(found, ["docs/a.md:6: [links] b.md points at a file this change removes"]);
}

// Decisions: contiguous numbers, one index row per file, row status matching the file.
{
  const index = (rows) => `${doc("index", "current")}\n| # | Date | Title | Status |\n|---|---|---|---|\n${rows.join("\n")}\n`;
  const root = repo({});
  stage(root, {
    "docs/decisions/0001-first.md": decision(1),
    "docs/decisions/0003-third.md": decision(3, "rejected"),
    "docs/decisions/0004-Bad_Name.md": decision(4),
    "docs/decisions/README.md": index([
      "| 0001 | 2026-09-28 | [First](0001-first.md) | accepted |",
      "| 0001 | 2026-09-28 | [First again](0001-first.md) | accepted |",
      "| 0003 | 2026-09-28 | [Third](0003-third.md) | accepted |",
    ]),
  });
  const found = messages(run(root, "staged").filter((f) => f.check === "decisions")).join("\n");
  assert.match(found, /0004-Bad_Name\.md:1: \[decisions\] decision files are named/);
  assert.match(found, /README\.md:1: \[decisions\] decision 0002 is missing/);
  assert.match(found, /README\.md:\d+: \[decisions\] second row for 0001-first\.md/);
  assert.match(found, /row status accepted differs from 0003-third\.md, which is rejected/);

  const clean = repo({});
  stage(clean, {
    "docs/decisions/0001-first.md": decision(1),
    "docs/decisions/0002-second.md": decision(2, "superseded", "").replace("superseded_by:\n", "superseded_by: 1\n"),
    "docs/decisions/README.md": index([
      "| 0001 | 2026-09-28 | [First](0001-first.md) | accepted |",
      "| 0002 | 2026-09-28 | [Second](0002-second.md) | superseded |",
    ]),
  });
  assert.deepEqual(messages(run(clean, "staged")), []);
}

// AGENTS.md cap counts real imports and path-less rules; package names and emails are not imports.
{
  const lines = (n) => `${Array.from({ length: n }, (_, i) => `line ${i}`).join("\n")}\n`;
  const root = repo({
    "AGENTS.md": `${lines(150)}See @docs/engineering/more.md, @t3-oss/env-core and dev@example.invalid.\n`,
    "docs/engineering/more.md": `${lines(20)}back to @../../AGENTS.md\n`,
    ".claude/rules/always.md": lines(10),
    ".claude/rules/scoped.md": `---\npaths:\n  - "src/**/*.ts"\n---\n${lines(500)}`,
  });
  assert.deepEqual(checkAgentsCap(listFiles(root), reader(root, false)), []);
  write(root, { ".claude/rules/always.md": lines(40) });
  git(root, "add", "-A");
  const [cap] = checkAgentsCap(listFiles(root), reader(root, false));
  assert.match(cap.message, /^212 lines/);

  const imported = repo({ "AGENTS.md": "@.claude/rules/always.md\n", ".claude/rules/always.md": lines(150) });
  assert.deepEqual(checkAgentsCap(listFiles(imported), reader(imported, false)), []);
}

// Two rules that flatten to the same generated name are an error, never a silent overwrite.
{
  const root = repo({ ".claude/rules/db/migrations.md": "# a\n", ".claude/rules/db-migrations.md": "# b\n" });
  assert.match(sync(root).errors.map((e) => e.message).join("\n"), /same file name as \.claude\/rules\//);
}

assert.deepEqual(expandBraces("src/**/*.{ts,tsx}"), ["src/**/*.ts", "src/**/*.tsx"]);
assert.deepEqual(expandBraces("{a,b}/{c,d}"), ["a/c", "a/d", "b/c", "b/d"]);

// Generator: sync writes the copies, check passes, a hand edit and an orphan fail, sync repairs both.
{
  const mcp = {
    mcpServers: {
      sonarqube: { command: "docker", args: ["run", "-i", "--rm", "-e", "SONARQUBE_TOKEN", "sonarsource/sonarqube-mcp"], env: { SONARQUBE_TOKEN: "${SONARQUBE_TOKEN}", MODE: "ci" } },
      remote: { type: "http", url: "https://mcp.example.invalid/mcp", headers: { Authorization: "Bearer ${REMOTE_TOKEN}", "X-Region": "us" } },
    },
  };
  const root = repo({
    ".mcp.json": JSON.stringify(mcp, null, 2),
    ".claude/rules/db/migrations.md": "---\npaths:\n  - \"db/**/*.{sql,ts}\"\ndescription: Migration rules\n---\n\n# Migrations\n",
    ".claude/rules/general.md": "# Always\n",
    ".claude/skills/demo-skill/SKILL.md": "---\nname: demo-skill\ndescription: demo\n---\nBody\n",
    ".cursor/rules/hand-written.mdc": "stale\n",
  });
  const { written, removed, errors } = sync(root);
  assert.deepEqual(errors, []);
  assert.deepEqual(removed, [".cursor/rules/hand-written.mdc"]);
  assert.equal(written.length, 9);

  const cursor = JSON.parse(readFileSync(join(root, ".cursor/mcp.json"), "utf8")).mcpServers;
  assert.equal(cursor.sonarqube.type, "stdio");
  assert.equal(cursor.sonarqube.env.SONARQUBE_TOKEN, "${env:SONARQUBE_TOKEN}");
  assert.equal(cursor.remote.headers.Authorization, "Bearer ${env:REMOTE_TOKEN}");
  assert.equal(cursor.remote.type, undefined);
  const kiro = JSON.parse(readFileSync(join(root, ".kiro/settings/mcp.json"), "utf8")).mcpServers;
  assert.equal(kiro.sonarqube.env.SONARQUBE_TOKEN, "${SONARQUBE_TOKEN}");
  const codex = readFileSync(join(root, ".codex/config.toml"), "utf8");
  assert.match(codex, /\[mcp_servers\.sonarqube\]\ncommand = "docker"\nargs = \[.*\]\nenv_vars = \["SONARQUBE_TOKEN"\]\nenv = \{ MODE = "ci" \}/);
  assert.match(codex, /bearer_token_env_var = "REMOTE_TOKEN"\nhttp_headers = \{ X-Region = "us" \}/);
  const mdc = readFileSync(join(root, ".cursor/rules/db-migrations.mdc"), "utf8");
  assert.match(mdc, /^---\ndescription: Migration rules\nglobs: db\/\*\*\/\*\.sql,db\/\*\*\/\*\.ts\nalwaysApply: false\n---\n<!-- Generated/);
  assert.match(readFileSync(join(root, ".cursor/rules/general.mdc"), "utf8"), /^---\nalwaysApply: true\n---\n/);
  assert.match(readFileSync(join(root, ".kiro/steering/db-migrations.md"), "utf8"), /^---\ninclusion: fileMatch\nfileMatchPattern: \["db\/\*\*\/\*\.sql","db\/\*\*\/\*\.ts"\]\n---\n/);
  assert.equal(readFileSync(join(root, ".kiro/skills/demo-skill/SKILL.md"), "utf8"), readFileSync(join(root, ".claude/skills/demo-skill/SKILL.md"), "utf8"));

  git(root, "add", "-A");
  assert.deepEqual(messages(run(root, "staged")), []);
  git(root, "commit", "-q", "-m", "sync");

  stage(root, { ".cursor/mcp.json": "{}\n", ".kiro/steering/orphan.md": "x\n" });
  const found = messages(run(root, "staged")).join("\n");
  assert.match(found, /\.cursor\/mcp\.json:1: \[drift\] differs from its source/);
  assert.match(found, /\.kiro\/steering\/orphan\.md:1: \[drift\] has no source/);

  assert.deepEqual(sync(root).removed, [".kiro/steering/orphan.md"]);
  write(root, { ".cursor/mcp.json": readFileSync(join(root, ".cursor/mcp.json"), "utf8").replace(/\n/g, "\r\n") });
  git(root, "add", "-A");
  assert.deepEqual(messages(run(root, "staged")), []);
  assert.deepEqual(sync(root).written, []);

  write(root, { ".mcp.json": JSON.stringify({ mcpServers: { x: { command: "a", args: ["${TOKEN:-none}"] } } }) });
  assert.match(sync(root).errors[0].message, /server x: \$\{VAR:-default\} is not portable/);
  write(root, { ".mcp.json": JSON.stringify({ mcpServers: { x: { command: "a", args: ["--token=${TOKEN}"] } } }) });
  assert.match(sync(root).errors.map((e) => e.message).join("\n"), /cannot expand|expands \$\{VAR\} only/);
}

// --base: an all-zeros ref (first push of a branch) falls back to HEAD^ instead of failing or scanning everything.
{
  const root = repo({ "docs/a.md": doc("product", "current") });
  write(root, { "docs/b.md": "# no frontmatter\n" });
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "second");
  const found = messages(run(root, "base", "0000000000000000000000000000000000000000"));
  assert.deepEqual(found, ["docs/b.md:1: [frontmatter] missing frontmatter (type, status)"]);
}

// The CLI runs through its own entry point and exits 1 on a finding: it is never silently a no-op.
{
  const root = repo({ "docs/a.md": "# no frontmatter\n" });
  const cli = spawnSync(process.execPath, [join(here, "cli.mjs"), "check", "--all"], { cwd: root, encoding: "utf8" });
  assert.equal(cli.status, 1, cli.stderr);
  assert.match(cli.stdout, /docs\/a\.md:1: \[frontmatter\]/);
  assert.equal(spawnSync(process.execPath, [join(here, "cli.mjs"), "check"], { cwd: root }).status, 2);
}

// Gitleaks: a staged token fails the commit, a clean change passes. Downloads the pinned binary once.
{
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const token = `ghp_${[...randomBytes(36)].map((b) => alphabet[b % alphabet.length]).join("")}`;
  const root = repo({ "README.md": "# demo\n" });
  stage(root, { "config.ts": `export const token = "${token}";\n` });
  const leaks = await checkGitleaks(root, { kind: "staged" });
  assert.equal(leaks.length, 1, JSON.stringify(leaks));
  assert.match(leaks[0].message, /github-pat/);
  git(root, "rm", "-q", "--cached", "config.ts");
  stage(root, { "config.ts": "export const token = process.env.TOKEN;\n" });
  assert.deepEqual(await checkGitleaks(root, { kind: "staged" }), []);
}

for (const root of roots) rmSync(root, { recursive: true, force: true });
console.log("project-standard: all checks passed");
