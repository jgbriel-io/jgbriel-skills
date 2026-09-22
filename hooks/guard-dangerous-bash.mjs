#!/usr/bin/env node
// PreToolUse hook for Bash. Blocks catastrophic commands the permissions
// allowlist might let slip through (e.g. `bash -c 'rm -rf /'`).
// Reads JSON from stdin: { tool_name, tool_input: { command } }.
// Exit code 2 + stderr message -> Claude Code blocks the tool call.

import { readFileSync } from "node:fs";

const DENY_PATTERNS = [
  // Filesystem catastrophic
  /\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\s+~\s*(\/\s*)?$/i,
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
  // Case-sensitive: `-D` force-deletes, `-d` refuses to drop an unmerged
  // branch and is how a merged branch is cleaned up.
  /\bgit\s+branch\s+-D\b/,
  /\bgit\s+checkout\s+\.\s*$/i,
  /\bgit\s+restore\s+\.\s*$/i,
];

// `rm -rf` against an absolute path used to be blocked outright, which caught
// every ordinary deletion under a home directory. What must not be deleted is
// the root, a system directory, or a whole home: all of those are one or two
// segments deep. Anything deeper is a normal path and stays allowed.
const SHALLOW_RM =
  /\brm\s+(?:-[a-z]+\s+)*-[a-z]*(?:rf|fr)[a-z]*\s+(?:-[a-z]+\s+)*(\/[^\s;|&]*)/i;

/**
 * True when an absolute `rm -rf` target is the root or shallow enough to be a
 * system directory or a home: `/`, `/etc`, `/home/user`. Deeper is fine.
 */
export function isShallowAbsolutePath(target) {
  const segments = target.replace(/\/+$/, "").split("/").filter(Boolean);
  return segments.length <= 2;
}

/**
 * True when the last command on `line` is a shell, so the heredoc that follows
 * is a script rather than data: `bash <<EOF`, `cat f | sh -s <<EOF`,
 * `/bin/zsh <<EOF`, `LC_ALL=C bash <<EOF`.
 */
export function isShellCommand(line) {
  const segment = line.split(/\|\||&&|[|;&]|\$\(|\(/).pop();
  const word = segment
    .trim()
    .split(/\s+/)
    .find((w) => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(w));
  return /^(ba|z|k|da)?sh$/i.test((word ?? "").replace(/^.*\//, ""));
}

/**
 * Removes heredoc bodies that are data rather than code.
 *
 * The hook matches the command's text, so writing documentation THAT MENTIONS
 * `sudo` through `cat > file <<'EOF'` used to be refused as if it ran sudo.
 * A heredoc fed to a shell is still executed, so those bodies are kept and
 * scanned; every other body is payload for python, cat, jq or a file write.
 */
export function stripDataHeredocs(cmd) {
  const start = /<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1/g;
  let out = "";
  let last = 0;
  let m;
  while ((m = start.exec(cmd)) !== null) {
    const tag = m[2];
    const lineStart = cmd.lastIndexOf("\n", m.index) + 1;
    const line = cmd.slice(lineStart, m.index);
    // `bash <<EOF` / `sh -s <<EOF` run what follows: keep it under inspection.
    // Only the command RECEIVING the heredoc counts. Matching `sh` anywhere on
    // the line also matched a mention of one, so a PR body went unstripped
    // behind `gh pr create --title "fix: bash guard" --body-file - <<'EOF'`.
    if (isShellCommand(line)) continue;
    const bodyStart = cmd.indexOf("\n", start.lastIndex);
    if (bodyStart === -1) break;
    const end = new RegExp(`^\\s*${tag}\\s*$`, "m");
    const rest = cmd.slice(bodyStart + 1);
    const hit = end.exec(rest);
    const bodyEnd = hit ? bodyStart + 1 + hit.index + hit[0].length : cmd.length;
    out += cmd.slice(last, bodyStart + 1);
    last = bodyEnd;
    start.lastIndex = bodyEnd;
  }
  return out + cmd.slice(last);
}

/** The pattern that blocks this command, or null when it is allowed. */
export function dangerousPattern(command) {
  const norm = stripDataHeredocs(String(command)).replace(/\s+/g, " ").trim();
  if (!norm) return null;

  const shallow = SHALLOW_RM.exec(norm);
  if (shallow && isShallowAbsolutePath(shallow[1])) return SHALLOW_RM;

  return DENY_PATTERNS.find((re) => re.test(norm)) ?? null;
}

function main() {
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

  const hit = dangerousPattern(cmd);
  if (hit) {
    process.stderr.write(
      `[guard-dangerous-bash] BLOCKED: matched ${hit}\nCommand: ${cmd.replace(/\s+/g, " ").trim()}\n`
    );
    process.exit(2);
  }
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
