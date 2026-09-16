#!/usr/bin/env node
// PreToolUse hook for Bash. Blocks catastrophic commands the permissions
// allowlist might let slip through (e.g. `bash -c 'rm -rf /'`).
// Reads JSON from stdin: { tool_name, tool_input: { command } }.
// Exit code 2 + stderr message -> Claude Code blocks the tool call.

import { readFileSync } from "node:fs";

let raw = "";
try {
  raw = readFileSync(0, "utf8");
} catch {
  process.exit(0);
}

let payload;
try {
  payload = JSON.parse(raw || "{}");
} catch {
  process.exit(0);
}

if (payload.tool_name !== "Bash") process.exit(0);

const cmd = String(payload?.tool_input?.command ?? "");
if (!cmd) process.exit(0);

const norm = cmd.replace(/\s+/g, " ").trim();

const DENY_PATTERNS = [
  // Filesystem catastrophic
  /\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\s+\//i,
  /\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\s+~/i,
  /\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\s+\$HOME/i,
  /\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\s+\*/,
  /\bsudo\b/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  /\bshred\b/i,
  /\bformat\s+[a-z]:/i,
  /\bdiskpart\b/i,
  /\b:\(\)\s*\{\s*:\|:&\s*\}\s*;:/,
  /\bcurl\s+[^|]*\|\s*(sh|bash|zsh)\b/i,
  /\bwget\s+[^|]*\|\s*(sh|bash|zsh)\b/i,
  /\bRemove-Item\s+-Recurse\s+-Force\s+[Cc]:\\?$/,
  />\s*\/dev\/sd[a-z]/i,

  // Git destructive
  /\bgit\s+push\s+(-f|--force|--force-with-lease)/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+clean\s+-[a-z]*f/i,
  /\bgit\s+branch\s+-D\b/i,
  /\bgit\s+checkout\s+\.\s*$/i,
  /\bgit\s+restore\s+\.\s*$/i,
];

for (const re of DENY_PATTERNS) {
  if (re.test(norm)) {
    process.stderr.write(
      `[guard-dangerous-bash] BLOCKED: matched ${re}\nCommand: ${norm}\n`
    );
    process.exit(2);
  }
}

process.exit(0);
