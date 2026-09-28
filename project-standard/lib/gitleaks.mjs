import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { arch, homedir, platform, tmpdir } from "node:os";
import { join } from "node:path";
import { finding } from "./docs.mjs";

export const VERSION = "8.30.1";
const SHA256 = {
  "darwin_arm64.tar.gz": "b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5",
  "darwin_x64.tar.gz": "dfe101a4db2255fc85120ac7f3d25e4342c3c20cf749f2c20a18081af1952709",
  "linux_arm64.tar.gz": "e4a487ee7ccd7d3a7f7ec08657610aa3606637dab924210b3aee62570fb4b080",
  "linux_x64.tar.gz": "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb",
  "windows_arm64.zip": "b95f5e4f5c425cedca7ee203d9afd29597e692c4924a12ed42f970537c72cc0f",
  "windows_x64.zip": "d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e",
};

export function assetFor(os = platform(), cpu = arch()) {
  const name = { win32: "windows", linux: "linux", darwin: "darwin" }[os];
  const target = `${name}_${cpu}.${os === "win32" ? "zip" : "tar.gz"}`;
  if (!name || !SHA256[target]) return null;
  const file = `gitleaks_${VERSION}_${target}`;
  return { file, sha256: SHA256[target], url: `https://github.com/gitleaks/gitleaks/releases/download/v${VERSION}/${file}` };
}

function cacheDir() {
  const base = platform() === "win32" ? (process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local")) : (process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache"));
  return join(base, "project-standard", "gitleaks", VERSION);
}

const tar = () => (platform() === "win32" ? join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe") : "tar");

export async function binary() {
  const dir = cacheDir();
  const bin = join(dir, platform() === "win32" ? "gitleaks.exe" : "gitleaks");
  if (existsSync(bin)) return bin;
  const asset = assetFor();
  if (!asset) throw new Error(`no pinned gitleaks ${VERSION} build for ${platform()}-${arch()}`);
  const res = await fetch(asset.url, { redirect: "follow" });
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status} for ${asset.url}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  const got = createHash("sha256").update(bytes).digest("hex");
  if (got !== asset.sha256) throw new Error(`checksum mismatch for ${asset.file}: expected ${asset.sha256}, got ${got}`);
  const work = mkdtempSync(join(tmpdir(), "gitleaks-"));
  try {
    const archive = join(work, asset.file);
    writeFileSync(archive, bytes);
    execFileSync(tar(), ["-xf", archive, "-C", work], { stdio: "pipe" });
    mkdirSync(dir, { recursive: true });
    copyFileSync(join(work, platform() === "win32" ? "gitleaks.exe" : "gitleaks"), `${bin}.partial`);
    chmodSync(`${bin}.partial`, 0o755);
    renameSync(`${bin}.partial`, bin);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
  return bin;
}

export async function checkGitleaks(root, scope) {
  let bin;
  try {
    bin = await binary();
  } catch (e) {
    return [finding(".", 1, "gitleaks", `scanner unavailable, so nothing was scanned: ${e.message}`)];
  }
  const work = mkdtempSync(join(tmpdir(), "gitleaks-report-"));
  const report = join(work, "report.json");
  const args = ["git", "--redact", "--no-banner", "--log-level", "error", "--exit-code", "1", "--report-format", "json", "--report-path", report];
  if (scope.kind === "staged") args.push("--pre-commit", "--staged");
  if (scope.kind === "base") args.push(`--log-opts=${scope.base}..HEAD`);
  args.push(root);
  try {
    const run = spawnSync(bin, args, { cwd: root, encoding: "utf8" });
    const leaks = existsSync(report) ? JSON.parse(readFileSync(report, "utf8") || "[]") : null;
    if (leaks === null || (run.status !== 0 && leaks.length === 0)) {
      return [finding(".", 1, "gitleaks", `gitleaks exited ${run.status}: ${(run.stderr || run.error?.message || "").trim()}`)];
    }
    return leaks.map((l) => finding(l.File, l.StartLine, "gitleaks", `${l.RuleID}: ${l.Description}${l.Commit ? ` (commit ${l.Commit.slice(0, 8)})` : ""}`));
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
