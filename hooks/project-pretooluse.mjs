#!/usr/bin/env node
/**
 * Runs a repository's own Claude Code PreToolUse hooks, the ones declared in
 * `<repo>/.claude/settings.json`, from Codex. Codex never reads that file, so
 * without this a project gate such as a merge check only binds Claude.
 *
 * Only the Bash tool is bridged: it is the one tool both agents name alike.
 * Each hook gets the payload on stdin, `CLAUDE_PROJECT_DIR` set to the repo
 * root, and runs under bash. A hook that exits 2 or answers
 * `permissionDecision: "deny"` blocks the call with exit 2 and its reason.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const GIT_BASH = "C:/Program Files/Git/bin/bash.exe";

export function matches(matcher, tool) {
  if (!matcher || matcher === "*") return true;
  return new RegExp(`^(?:${matcher})$`).test(tool);
}

export function denial(status, stdout, stderr) {
  if (status === 2) return stderr.trim() || "blocked by a project hook";
  try {
    const out = JSON.parse(stdout).hookSpecificOutput;
    if (out?.permissionDecision === "deny") return out.permissionDecisionReason || "blocked by a project hook";
  } catch {}
  return null;
}

function repoRoot(cwd) {
  const git = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8" });
  return git.status === 0 ? git.stdout.trim() : cwd;
}

function main() {
  const raw = readFileSync(0, "utf8");
  const payload = JSON.parse(raw || "{}");
  if (payload.tool_name !== "Bash") return;
  const root = repoRoot(payload.cwd ?? process.cwd());
  const path = join(root, ".claude", "settings.json");
  if (!existsSync(path)) return;
  const bash = process.platform === "win32" && existsSync(GIT_BASH) ? GIT_BASH : "bash";
  const env = { ...process.env, CLAUDE_PROJECT_DIR: root };
  for (const entry of JSON.parse(readFileSync(path, "utf8")).hooks?.PreToolUse ?? []) {
    if (!matches(entry.matcher, payload.tool_name)) continue;
    for (const hook of entry.hooks ?? []) {
      if (hook.type !== "command") continue;
      const run = spawnSync(bash, ["-c", hook.command], { cwd: root, env, input: raw, encoding: "utf8" });
      const reason = denial(run.status, run.stdout ?? "", run.stderr ?? "");
      if (reason) {
        process.stderr.write(`[project hook] ${reason}\n`);
        process.exit(2);
      }
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
