import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

export function git(root, args, { buffer = false } = {}) {
  const out = execFileSync("git", ["-C", root, ...args], { maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  return buffer ? out : out.toString("utf8");
}

export function repoRoot(cwd = process.cwd()) {
  return execFileSync("git", ["-C", cwd, "rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
}

function zlist(out) {
  return out.split("\0").filter(Boolean);
}

export function listFiles(root, { untracked = false } = {}) {
  const args = ["ls-files", "-z", "--cached"];
  if (untracked) args.push("--others", "--exclude-standard");
  return [...new Set(zlist(git(root, args)))];
}

function verified(root, ref) {
  try {
    return git(root, ["rev-parse", "--verify", "-q", `${ref}^{commit}`]).trim();
  } catch {
    return null;
  }
}

export function resolveBase(root, ref) {
  return verified(root, ref) ?? verified(root, "HEAD^") ?? EMPTY_TREE;
}

function parseNameStatus(out) {
  const parts = zlist(out);
  const changed = [];
  const removed = [];
  for (let i = 0; i < parts.length; ) {
    const status = parts[i++];
    if (status.startsWith("R") || status.startsWith("C")) {
      const from = parts[i++];
      const to = parts[i++];
      if (status.startsWith("R")) removed.push(from);
      changed.push(to);
    } else if (status.startsWith("D")) {
      removed.push(parts[i++]);
    } else {
      changed.push(parts[i++]);
    }
  }
  return { changed, removed };
}

export function changes(root, scope) {
  if (scope.kind === "all") return { changed: listFiles(root), removed: [] };
  if (scope.kind === "staged") return parseNameStatus(git(root, ["diff", "--cached", "--name-status", "-z", "-M"]));
  return parseNameStatus(git(root, ["diff", "--name-status", "-z", "-M", scope.base, "HEAD"]));
}

export function reader(root, staged) {
  return (path) => {
    try {
      return staged ? git(root, ["show", `:${path}`], { buffer: true }) : readFileSync(join(root, path));
    } catch {
      return null;
    }
  };
}
