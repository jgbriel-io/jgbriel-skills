#!/usr/bin/env node
/**
 * Prints Claude Code's persistent memory index for the current repository as
 * Codex session context, so both agents start from the same learned rules.
 *
 * Claude keeps it in `~/.claude/projects/<slug>/memory/MEMORY.md`, where the
 * slug is the main checkout's path with every non-alphanumeric character
 * turned into `-`. A worktree resolves to its main checkout, as in Claude.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

export function memoryDir(checkout, home = homedir()) {
  return join(home, ".claude", "projects", checkout.replace(/[^a-zA-Z0-9]/g, "-"), "memory");
}

function mainCheckout(cwd) {
  const git = spawnSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd, encoding: "utf8" });
  return git.status === 0 ? dirname(git.stdout.trim()) : cwd;
}

function main() {
  let cwd = process.cwd();
  try {
    cwd = JSON.parse(readFileSync(0, "utf8") || "{}").cwd ?? cwd;
  } catch {}
  const dir = memoryDir(mainCheckout(cwd));
  const index = join(dir, "MEMORY.md");
  if (!existsSync(index)) return;
  process.stdout.write(
    `Persistent project memory, shared with Claude Code, in ${dir.replace(/\\/g, "/")}. ` +
      "Each line below links one file there; read that file before acting on its topic. " +
      "It records what was true when written: verify a named file, flag or command before relying on it.\n\n" +
      readFileSync(index, "utf8"),
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
