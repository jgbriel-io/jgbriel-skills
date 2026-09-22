#!/usr/bin/env node
/**
 * Brings a machine from "Claude Code installed" to this whole setup: the four
 * plugins, uv, serena with its hooks, cocoindex, and the codebase-memory MCP.
 *
 * Node, not bash + PowerShell, because the repo's hooks are already `.mjs`:
 * a machine that cannot run this file cannot run the plugin either, and two
 * scripts would drift the moment one of them is edited.
 *
 *     node scripts/bootstrap.mjs             install what is missing
 *     node scripts/bootstrap.mjs --dry-run   print the plan, change nothing
 *
 * Every step is idempotent and skips what is already there, so re-running it
 * after a partial failure is the normal way to use it.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, readdirSync } from "node:fs";
import { homedir, platform, arch, tmpdir } from "node:os";
import { join } from "node:path";

const DRY = process.argv.includes("--dry-run");
const WIN = platform() === "win32";
const HOME = homedir();
const BIN = join(HOME, ".local", "bin");
const SETTINGS = join(HOME, ".claude", "settings.json");
const EXE = (n) => (WIN ? `${n}.exe` : n);

const done = [];
const skipped = [];
const failed = [];

function say(step, state, detail) {
  const mark = { ok: "+", skip: "=", fail: "!" }[state];
  console.log(`  ${mark} ${step}${detail ? ` — ${detail}` : ""}`);
  ({ ok: done, skip: skipped, fail: failed })[state].push(step);
}

function run(cmd, args, { capture = false } = {}) {
  if (DRY) {
    console.log(`  · would run: ${cmd} ${args.join(" ")}`);
    return "";
  }
  const r = spawnSync(cmd, args, {
    encoding: "utf8",
    shell: WIN, // .cmd shims (claude, uv) are not executable without a shell on Windows
    env: { ...process.env, PATH: `${BIN}${WIN ? ";" : ":"}${process.env.PATH}` },
  });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || "").trim().split("\n").slice(-3).join("\n"));
  return capture ? r.stdout : "";
}

function have(cmd) {
  const r = spawnSync(WIN ? "where" : "command", WIN ? [cmd] : ["-v", cmd], { shell: !WIN, encoding: "utf8" });
  return r.status === 0 || existsSync(join(BIN, EXE(cmd)));
}

/** Parsed JSON file, or null when it is absent or unreadable. */
function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

/** State read from disk, so --dry-run reports what is really missing. */
const pluginInstalled = (plugin, market) =>
  Boolean(readJson(join(HOME, ".claude", "plugins", "installed_plugins.json"))?.plugins?.[`${plugin}@${market}`]);
const mcpRegistered = (name) => Boolean(readJson(join(HOME, ".claude.json"))?.mcpServers?.[name]);

/** Release asset for this OS+CPU, or null when the project does not ship one. */
export function assetFor(project, os = platform(), cpu = arch()) {
  if (project === "uv") {
    const target = {
      "linux:x64": "x86_64-unknown-linux-gnu",
      "linux:arm64": "aarch64-unknown-linux-gnu",
      "darwin:x64": "x86_64-apple-darwin",
      "darwin:arm64": "aarch64-apple-darwin",
      "win32:x64": "x86_64-pc-windows-msvc",
    }[`${os}:${cpu}`];
    if (!target) return null;
    const ext = os === "win32" ? "zip" : "tar.gz";
    return {
      url: `https://github.com/astral-sh/uv/releases/latest/download/uv-${target}.${ext}`,
      file: `uv-${target}.${ext}`,
    };
  }
  if (project === "codebase-memory-mcp") {
    // The release ships linux and darwin only; there is no Windows build.
    const target = {
      "linux:x64": "linux-amd64",
      "linux:arm64": "linux-arm64",
      "darwin:x64": "darwin-amd64",
      "darwin:arm64": "darwin-arm64",
    }[`${os}:${cpu}`];
    if (!target) return null;
    return {
      url: `https://github.com/DeusData/codebase-memory-mcp/releases/latest/download/codebase-memory-mcp-${target}.tar.gz`,
      file: `codebase-memory-mcp-${target}.tar.gz`,
    };
  }
  throw new Error(`unknown project: ${project}`);
}

/** The serena hooks, exactly as oraios documents them for Claude Code. */
export const SERENA_HOOKS = (bin) => ({
  SessionStart: [{ matcher: "", command: `${bin} activate --client=claude-code` }],
  PreToolUse: [
    { matcher: "", command: `${bin} remind --client=claude-code` },
    { matcher: "mcp__serena__*", command: `${bin} auto-approve --client=claude-code` },
  ],
  SessionEnd: [{ matcher: "", command: `${bin} cleanup --client=claude-code` }],
});

/**
 * Adds any missing hook entry to a settings object. Returns the commands added,
 * so a second run over the same object returns [] — that is the idempotency the
 * whole script relies on.
 */
export function mergeHooks(settings, wanted) {
  const hooks = (settings.hooks ??= {});
  const added = [];
  for (const [event, entries] of Object.entries(wanted)) {
    const list = (hooks[event] ??= []);
    for (const { matcher, command } of entries) {
      const present = list.some((g) => (g.hooks ?? []).some((h) => h.command === command));
      if (present) continue;
      list.push({ matcher, hooks: [{ type: "command", command }] });
      added.push(command);
    }
  }
  return added;
}

async function download(url, dest) {
  if (DRY) return console.log(`  · would download: ${url}`);
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

/** tar is present on Windows 10+ (bsdtar) and reads .zip as well as .tar.gz. */
function extract(archive, into) {
  if (DRY) return;
  execFileSync("tar", ["-xf", archive, "-C", into], { stdio: "pipe" });
}

function findBinary(dir, name) {
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.name === EXE(name)) return p;
    }
  }
  return null;
}

async function installBinary(project, binName) {
  const asset = assetFor(project);
  if (!asset) return say(project, "skip", `no release build for ${platform()}/${arch()}`);
  const work = join(tmpdir(), `bootstrap-${project}-${Date.now()}`);
  mkdirSync(work, { recursive: true });
  const archive = join(work, asset.file);
  await download(asset.url, archive);
  extract(archive, work);
  if (DRY) return say(project, "ok", "would install into ~/.local/bin");
  const found = findBinary(work, binName);
  if (!found) throw new Error(`${binName} not found inside ${asset.file}`);
  mkdirSync(BIN, { recursive: true });
  renameSync(found, join(BIN, EXE(binName)));
  if (!WIN) execFileSync("chmod", ["+x", join(BIN, EXE(binName))]);
  say(project, "ok", join(BIN, EXE(binName)));
}

const PLUGINS = [
  ["jgbriel", "jgbriel-io/jgbriel-skills", "jgbriel-skills"],
  ["caveman", "JuliusBrussee/caveman", "caveman"],
  ["ponytail", "DietrichGebert/ponytail", "ponytail"],
  ["context-mode", "mksglu/context-mode", "context-mode"],
];

async function main() {
  console.log(`bootstrap · ${platform()}/${arch()}${DRY ? " · dry run" : ""}\n`);

  if (!have("claude")) {
    console.error("claude is not on PATH — install Claude Code first, then re-run.");
    process.exit(1);
  }

  console.log("plugins");
  for (const [market, repo, plugin] of PLUGINS) {
    if (pluginInstalled(plugin, market)) {
      say(plugin, "skip", "already installed");
      continue;
    }
    try {
      run("claude", ["plugin", "marketplace", "add", repo]);
    } catch {
      /* already registered — the CLI says so and exits non-zero */
    }
    try {
      run("claude", ["plugin", "install", `${plugin}@${market}`]);
      say(plugin, "ok");
    } catch (e) {
      const msg = String(e.message);
      if (/already/i.test(msg)) say(plugin, "skip", "already installed");
      else say(plugin, "fail", msg);
    }
  }

  console.log("\ntools");
  try {
    if (have("uv")) say("uv", "skip", "already on PATH");
    else await installBinary("uv", "uv");
  } catch (e) {
    say("uv", "fail", e.message);
  }

  if (have("uv") || DRY) {
    for (const [label, args] of [
      ["serena", ["tool", "install", "-p", "3.13", "serena-agent"]],
      ["cocoindex", ["tool", "install", "cocoindex"]],
    ]) {
      try {
        if (have(label)) say(label, "skip", "already installed");
        else {
          run("uv", args);
          say(label, "ok");
        }
      } catch (e) {
        say(label, "fail", e.message);
      }
    }
  }

  try {
    if (have("codebase-memory-mcp")) say("codebase-memory-mcp", "skip", "already installed");
    else await installBinary("codebase-memory-mcp", "codebase-memory-mcp");
  } catch (e) {
    say("codebase-memory-mcp", "fail", e.message);
  }

  console.log("\nmcp servers");
  if (have("serena") && mcpRegistered("serena")) {
    say("serena mcp", "skip", "already registered");
  } else if (have("serena")) {
    try {
      run("serena", ["setup", "claude-code"]);
      say("serena mcp", "ok", "registered at user scope");
    } catch (e) {
      say("serena mcp", "fail", e.message);
    }
  }
  if (have("codebase-memory-mcp") && mcpRegistered("codebase-memory-mcp")) {
    say("codebase-memory mcp", "skip", "already registered");
  } else if (have("codebase-memory-mcp")) {
    try {
      run("claude", ["mcp", "add", "-s", "user", "codebase-memory-mcp", "--", join(BIN, EXE("codebase-memory-mcp"))]);
      say("codebase-memory mcp", "ok", "registered at user scope");
    } catch (e) {
      const msg = String(e.message);
      if (/already|exists/i.test(msg)) say("codebase-memory mcp", "skip", "already registered");
      else say("codebase-memory mcp", "fail", msg);
    }
  }

  console.log("\nhooks");
  if (!have("serena")) {
    say("serena hooks", "skip", "serena not installed");
  } else {
    try {
      const settings = existsSync(SETTINGS) ? JSON.parse(readFileSync(SETTINGS, "utf8")) : {};
      const added = mergeHooks(settings, SERENA_HOOKS(join(BIN, EXE("serena-hooks"))));
      if (!added.length) say("serena hooks", "skip", "all 4 already present");
      else if (DRY) say("serena hooks", "ok", `would add ${added.length} entries to settings.json`);
      else {
        mkdirSync(join(HOME, ".claude"), { recursive: true });
        writeFileSync(SETTINGS, JSON.stringify(settings, null, 2));
        say("serena hooks", "ok", `${added.length} added`);
      }
    } catch (e) {
      say("serena hooks", "fail", e.message);
    }
  }

  console.log(`\n${done.length} done · ${skipped.length} already there · ${failed.length} failed`);
  if (failed.length) console.log(`failed: ${failed.join(", ")}`);
  console.log("Restart Claude Code to load the plugins, the MCP servers and the hooks.");
  if (!WIN) console.log(`Make sure ${BIN} is on PATH (Ubuntu's ~/.profile adds it when it exists).`);
  else console.log(`Add ${BIN} to your PATH if it is not there — the MCP entries call the bare command name.`);
  process.exit(failed.length ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
