#!/usr/bin/env node
/** What link-agents must do, and the one thing it must never do: touch a file it did not write.
 *
 *     node scripts/test_link_agents.mjs
 *
 * The second half runs the real script twice against a throwaway home. The
 * second run changing nothing is the property that makes it safe to re-run.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { mcpServers, rescueForeignTables, mergeCodexHook, mergeCodexMode, mergeCodexProject, mergeCursorHook, mergeCursorMode, parseAgent, renderCodexMcp, setBlock, toCodexAgent, toCursorAgent } from "./link-agents.mjs";
import { modeContext, skillBody } from "../hooks/inject-mode.mjs";
import { memoryDir } from "../hooks/inject-memory.mjs";
import { denial, matches } from "../hooks/project-pretooluse.mjs";

const reviewer = parseAgent("---\nname: reviewer\ndescription: Reviews a diff.\ntools: Read, Grep, Bash\n---\n\nFind bugs.\n");
assert.equal(reviewer.body, "Find bugs.");
assert.match(toCodexAgent(reviewer), /sandbox_mode = "read-only"/);
assert.match(toCodexAgent(reviewer), /developer_instructions = '''\nFind bugs\.\n'''/);
assert.match(toCursorAgent(reviewer), /readonly: true/);
const builder = parseAgent("---\nname: builder\ndescription: Edits.\ntools: Read, Edit\n---\nGo.\n");
assert.doesNotMatch(toCodexAgent(builder), /sandbox_mode/);
assert.throws(() => toCodexAgent({ ...reviewer, body: "a ''' b" }), /TOML literal/);

const once = setBlock("[hooks.state]\nx = 1\n", "t", "a = 1", "top");
assert.equal(setBlock(once, "t", "a = 1", "top"), once);
assert.equal(setBlock(once, "t", "a = 2", "top").match(/a = \d/g).length, 1);
assert.ok(setBlock("x = 1\n", "t", "[m]", "bottom").endsWith("# <<< t <<<\n"));
assert.equal(setBlock("", "t", "a", "top"), "# >>> t >>>\na\n# <<< t <<<\n");
assert.equal(setBlock(once, "t", null, "top"), "[hooks.state]\nx = 1\n");

const invaded = "x = 1\n\n# >>> m >>>\n[mcp_servers.serena]\na = 1\n\n[projects.'d:\\p']\ntrust_level = \"trusted\"\n# <<< m <<<\n";
const rescued = rescueForeignTables(invaded, "m", ["serena"]);
assert.equal(rescued, "x = 1\n\n[projects.'d:\\p']\ntrust_level = \"trusted\"\n");
assert.equal(rescueForeignTables(rescued, "m", ["serena"]), rescued);

const toml = renderCodexMcp({ s: { command: "c", args: ["a"], env: { K: "v" } } });
assert.equal(toml, '[mcp_servers.s]\ncommand = "c"\nargs = ["a"]\n\n[mcp_servers.s.env]\nK = "v"');
assert.ok(!("socraticode" in mcpServers("codex", {})));
const env = Object.fromEntries(["OLLAMA_MODE", "OLLAMA_URL", "EMBEDDING_MODEL", "EMBEDDING_DIMENSIONS", "QDRANT_MODE", "QDRANT_URL"].map((k) => [k, 1]));
assert.ok("socraticode" in mcpServers("codex", env));
assert.notEqual(mcpServers("codex", {}).serena.args[2], mcpServers("cursor", {}).serena.args[2]);

const foreign = { matcher: "Bash", hooks: [{ type: "command", command: "orca" }] };
const codex = mergeCodexHook({ hooks: { PreToolUse: [foreign] } }, "node guard-dangerous-bash.mjs");
assert.equal(codex.hooks.PreToolUse[0], foreign);
assert.equal(mergeCodexHook(codex, "node guard-dangerous-bash.mjs").hooks.PreToolUse.length, 2);
const cursor = mergeCursorHook({ hooks: { preToolUse: [{ command: "orca" }] } }, "node guard-dangerous-bash.mjs");
assert.equal(mergeCursorHook(cursor, "node guard-dangerous-bash.mjs").hooks.preToolUse.length, 2);
const reordered = { hooks: { preToolUse: [cursor.hooks.preToolUse[1], cursor.hooks.preToolUse[0]] } };
assert.match(mergeCursorHook(reordered, "node guard-dangerous-bash.mjs").hooks.preToolUse[0].command, /guard/, "owned hook keeps its position");

const codexMode = mergeCodexMode(codex, "node inject-mode.mjs caveman:ultra");
assert.equal(codexMode.hooks.SessionStart.length, 1);
assert.equal(mergeCodexMode(codexMode, "node inject-mode.mjs caveman:ultra").hooks.SessionStart.length, 1);
assert.equal(mergeCodexMode(codexMode, null).hooks.SessionStart.length, 0);
const cursorMode = mergeCursorMode(cursor, "node inject-mode.mjs --cursor caveman:ultra");
assert.equal(mergeCursorMode(cursorMode, "node inject-mode.mjs --cursor caveman:ultra").hooks.sessionStart.length, 1);
assert.equal(cursorMode.hooks.preToolUse.length, 2);

const project = mergeCodexProject(mergeCodexProject({}, "node project-pretooluse.mjs", "node inject-memory.mjs"), "node project-pretooluse.mjs", "node inject-memory.mjs");
assert.equal(project.hooks.PreToolUse.length, 1);
assert.equal(project.hooks.SessionStart.length, 1);
assert.equal(mergeCodexProject(project, null, null).hooks.PreToolUse.length, 0);

assert.ok(matches(undefined, "Bash") && matches("*", "Bash") && matches("Bash|Edit", "Bash"));
assert.ok(!matches("Edit", "Bash") && !matches("Bas", "Bash"));
assert.equal(denial(0, "", ""), null);
assert.equal(denial(2, "", "red checks\n"), "red checks");
assert.equal(denial(0, JSON.stringify({ hookSpecificOutput: { permissionDecision: "deny", permissionDecisionReason: "sonar red" } }), ""), "sonar red");
assert.equal(denial(0, JSON.stringify({ hookSpecificOutput: { permissionDecision: "allow" } }), ""), null);
assert.equal(
  memoryDir("D:\\Projetos\\Freelas\\BARUK\\whitelabel-crm", "H"),
  join("H", ".claude", "projects", "D--Projetos-Freelas-BARUK-whitelabel-crm", "memory"),
);

assert.equal(skillBody("---\nname: x\n---\nRules.\n"), "Rules.");

const script = fileURLToPath(new URL("./link-agents.mjs", import.meta.url));
const home = mkdtempSync(join(tmpdir(), "link-agents-"));
try {
  mkdirSync(join(home, ".codex"), { recursive: true });
  mkdirSync(join(home, ".cursor"), { recursive: true });
  mkdirSync(join(home, ".claude"), { recursive: true });
  mkdirSync(join(home, ".agents", "skills", "caveman"), { recursive: true });
  writeFileSync(join(home, ".agents", "skills", "caveman", "SKILL.md"), "---\nname: caveman\n---\nDrop articles.\n");
  const elsewhere = join(home, "elsewhere");
  mkdirSync(join(elsewhere, "commit"), { recursive: true });
  mkdirSync(join(elsewhere, "gone"), { recursive: true });
  const linkType = process.platform === "win32" ? "junction" : "dir";
  symlinkSync(join(elsewhere, "commit"), join(home, ".agents", "skills", "commit"), linkType);
  symlinkSync(join(elsewhere, "gone"), join(home, ".agents", "skills", "gone"), linkType);
  rmSync(join(elsewhere, "gone"), { recursive: true });
  writeFileSync(join(home, ".codex", "config.toml"), "[hooks.state]\n\n[hooks.state.'x']\nenabled = true\n\n[tui]\nproject_doc_max_bytes = 5\n");
  writeFileSync(join(home, ".codex", "AGENTS.md"), "mine\n");
  writeFileSync(join(home, ".cursor", "mcp.json"), "﻿" + JSON.stringify({ mcpServers: { other: { command: "o" }, playwright: { command: "mine" } } }));
  const run = () => spawnSync(process.execPath, [script], { env: { ...process.env, LINK_AGENTS_HOME: home, CODEX_HOME: "" }, encoding: "utf8" });
  const snapshot = () =>
    ["config.toml", "AGENTS.md", "hooks.json"].map((f) => join(home, ".codex", f)).concat([join(home, ".cursor", "mcp.json"), join(home, ".cursor", "hooks.json")])
      .map((f) => (existsSync(f) ? readFileSync(f, "utf8") : "")).join("\0") + readdirSync(join(home, ".agents", "skills")).join(",");

  const first = run();
  assert.equal(first.status, 0, first.stderr + first.stdout);
  const skills = readdirSync(join(home, ".agents", "skills"));
  assert.ok(skills.length > 80 && lstatSync(join(home, ".agents", "skills", "diagnose")).isSymbolicLink(), "skills linked");
  assert.equal(realpathSync(join(home, ".agents", "skills", "commit")), realpathSync(join(elsewhere, "commit")), "foreign link with a fleet name kept");
  assert.ok(lstatSync(join(home, ".agents", "skills", "gone")).isSymbolicLink(), "broken foreign link kept");
  assert.equal(JSON.parse(readFileSync(join(home, ".cursor", "mcp.json"), "utf8")).mcpServers.playwright.command, "mine", "user MCP server kept");
  assert.ok(lstatSync(join(home, ".agents", "skills", "caveman")).isDirectory() && !lstatSync(join(home, ".agents", "skills", "caveman")).isSymbolicLink(), "real folder untouched");
  assert.equal(readFileSync(join(home, ".codex", "AGENTS.md"), "utf8"), "mine\n");
  assert.match(readFileSync(join(home, ".codex", "agents", "reviewer.toml"), "utf8"), /^# generated by/);
  assert.match(readFileSync(join(home, ".cursor", "agents", "reviewer.md"), "utf8"), /^---\nname: reviewer/);
  const config = readFileSync(join(home, ".codex", "config.toml"), "utf8");
  assert.ok(config.startsWith("# >>> jgabriel-skills-top >>>") && config.includes("[mcp_servers.serena]") && config.includes("enabled = true"));
  assert.ok(JSON.parse(readFileSync(join(home, ".cursor", "mcp.json"), "utf8")).mcpServers.other, "foreign MCP server kept");
  assert.equal(JSON.parse(readFileSync(join(home, ".cursor", "hooks.json"), "utf8")).hooks.preToolUse.length, 1);
  const codexHooks = JSON.parse(readFileSync(join(home, ".codex", "hooks.json"), "utf8")).hooks;
  assert.match(codexHooks.SessionStart[0].hooks[0].command, /inject-mode\.mjs$/);
  const cursorSession = JSON.parse(readFileSync(join(home, ".cursor", "hooks.json"), "utf8")).hooks.sessionStart;
  assert.match(cursorSession[0].command, /inject-mode\.mjs --cursor$/);
  const injected = spawnSync(cursorSession[0].command, { shell: true, env: { ...process.env, LINK_AGENTS_HOME: home }, encoding: "utf8" });
  assert.match(JSON.parse(injected.stdout).additional_context, /^CAVEMAN MODE ACTIVE, level: ultra\..*Drop articles\./s);
  assert.equal(modeContext(["ponytail:ultra"], home), "", "a mode whose skill is absent adds nothing");

  const before = snapshot();
  const second = run();
  assert.equal(second.status, 0, second.stderr);
  assert.equal(snapshot(), before, "second run changed something");

  const configPath = join(home, ".codex", "config.toml");
  writeFileSync(configPath, "project_doc_max_bytes = 1000\n" + readFileSync(configPath, "utf8"));
  assert.equal(run().status, 0);
  const owned = readFileSync(configPath, "utf8");
  assert.ok(!owned.includes("jgabriel-skills-top") && !owned.includes("65536") && owned.startsWith("project_doc_max_bytes = 1000\n"), "user root key replaces the managed one");

  writeFileSync(join(home, ".cursor", "hooks.json"), "{ // comment\n}");
  const untouched = snapshot();
  const broken = run();
  assert.equal(broken.status, 1);
  assert.match(broken.stderr, /nothing was changed/);
  assert.equal(snapshot(), untouched, "a parse failure wrote something");
} finally {
  rmSync(home, { recursive: true, force: true });
}

console.log("ok — link-agents");
