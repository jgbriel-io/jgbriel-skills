import { posix } from "node:path";

const TYPES = ["index", "product", "architecture", "engineering", "decision", "spec", "plan", "handoff", "research", "legal"];
const STATUS = ["draft", "current", "superseded", "archived"];
const DECISION_STATUS = ["proposed", "accepted", "rejected", "superseded"];
const DECISIONS = "docs/decisions/";
const DECISION_INDEX = "docs/decisions/README.md";

export const text = (buf) => (buf === null ? null : buf.toString("utf8").replace(/\r\n/g, "\n"));
export const finding = (path, line, check, message) => ({ path, line, check, message });

function scalar(raw) {
  const v = raw.trim();
  if (v === "") return null;
  if (v.startsWith("[") && v.endsWith("]")) return v.slice(1, -1).split(",").map(scalar).filter((x) => x !== null);
  if (/^(".*"|'.*')$/.test(v)) return v.slice(1, -1);
  return v;
}

export function parseFrontmatter(src) {
  const lines = src.split("\n");
  if (lines[0] !== "---") return null;
  const close = lines.indexOf("---", 1);
  if (close === -1) return { data: {}, lines: {}, end: 0, errors: [{ line: 1, message: "frontmatter is never closed with ---" }] };
  const data = {};
  const at = {};
  const errors = [];
  let listKey = null;
  for (let i = 1; i < close; i++) {
    const raw = lines[i];
    if (!raw.trim() || raw.trimStart().startsWith("#")) continue;
    const item = raw.match(/^\s*-\s+(.*)$/);
    if (item && listKey) {
      data[listKey] ??= [];
      data[listKey].push(scalar(item[1]));
      continue;
    }
    const kv = raw.match(/^([A-Za-z_][\w-]*):(?:\s(.*))?$/);
    if (!kv) {
      errors.push({ line: i + 1, message: `unsupported frontmatter line: ${raw.trim()}` });
      listKey = null;
      continue;
    }
    const [, key, rest = ""] = kv;
    data[key] = scalar(rest);
    at[key] = i + 1;
    listKey = data[key] === null ? key : null;
  }
  return { data, lines: at, end: close, errors };
}

const isDoc = (p) => p.startsWith("docs/") && p.endsWith(".md") && !p.startsWith("docs/archive/");

export function checkFrontmatter({ changed }, read) {
  const out = [];
  for (const path of changed.filter(isDoc)) {
    const src = text(read(path));
    if (src === null) continue;
    const fm = parseFrontmatter(src);
    if (!fm) {
      out.push(finding(path, 1, "frontmatter", "missing frontmatter (type, status)"));
      continue;
    }
    for (const e of fm.errors) out.push(finding(path, e.line, "frontmatter", e.message));
    const { type, status, number, date, superseded_by } = fm.data;
    const line = (key) => fm.lines[key] ?? 1;
    if (!TYPES.includes(type)) out.push(finding(path, line("type"), "frontmatter", `type ${type ?? "missing"}: expected one of ${TYPES.join(", ")}`));
    const decision = type === "decision";
    const allowed = decision ? DECISION_STATUS : STATUS;
    if (!allowed.includes(status)) out.push(finding(path, line("status"), "frontmatter", `status ${status ?? "missing"}: expected one of ${allowed.join(", ")}`));
    if (!decision) continue;
    const fileNumber = posix.basename(path).match(/^(\d{4})-/)?.[1];
    if (!fileNumber || Number(number) !== Number(fileNumber)) out.push(finding(path, line("number"), "frontmatter", `number ${number ?? "missing"} does not match the file name`));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) out.push(finding(path, line("date"), "frontmatter", "date must be YYYY-MM-DD"));
    if (status === "superseded" && !/^\d+$/.test(superseded_by ?? "")) out.push(finding(path, line("superseded_by"), "frontmatter", "a superseded decision needs superseded_by: <number>"));
    if (status !== "superseded" && superseded_by != null) out.push(finding(path, line("superseded_by"), "frontmatter", "superseded_by is set but status is not superseded"));
  }
  return out;
}

export function proseLines(src) {
  const out = [];
  let fence = null;
  src.split("\n").forEach((line, i) => {
    const f = line.match(/^\s*(`{3,}|~{3,})/);
    if (f) {
      if (!fence) fence = f[1][0];
      else if (f[1][0] === fence) fence = null;
      return;
    }
    if (!fence) out.push({ line: i + 1, text: line.replace(/(`+).*?\1/g, "") });
  });
  return out;
}

export function extractLinks(src) {
  const links = [];
  const wikilinks = [];
  for (const { line, text: clean } of proseLines(src)) {
    for (const m of clean.matchAll(/\[\[[^\]]+\]\]/g)) wikilinks.push({ raw: m[0], line });
    for (const m of clean.matchAll(/\]\(\s*(?:<([^>]+)>|([^)\s]+))(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g)) {
      links.push({ target: m[1] ?? m[2], line });
    }
  }
  return { links, wikilinks };
}

export function resolveLink(from, target) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#") || target.startsWith("//")) return null;
  let t = target.split("#")[0].split("?")[0];
  if (!t) return null;
  try {
    t = decodeURIComponent(t);
  } catch {}
  const p = t.startsWith("/") ? posix.normalize(t.slice(1)) : posix.normalize(posix.join(posix.dirname(from), t));
  return p.replace(/\/+$/, "") || ".";
}

function exists(tracked) {
  const dirs = new Set(["."]);
  for (const p of tracked) {
    const parts = p.split("/");
    for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join("/"));
  }
  return (p) => tracked.has(p) || dirs.has(p);
}

const isLinkable = (p) => isDoc(p) || p === "README.md" || p === "AGENTS.md";

export function checkLinks({ changed, removed }, tracked, read) {
  const out = [];
  const found = exists(tracked);
  const scanned = new Set(changed.filter(isLinkable));
  for (const path of scanned) {
    const src = text(read(path));
    if (src === null) continue;
    const { links, wikilinks } = extractLinks(src);
    for (const w of wikilinks) out.push(finding(path, w.line, "links", `${w.raw} is a wikilink; use a relative Markdown link`));
    for (const { target, line } of links) {
      const p = resolveLink(path, target);
      if (p === null) continue;
      if (p.startsWith("../") || p === "..") out.push(finding(path, line, "links", `${target} leaves the repository`));
      else if (!found(p)) out.push(finding(path, line, "links", `${target} does not resolve to a tracked file (case-sensitive)`));
    }
  }
  if (!removed.length) return out;
  const gone = (p) => removed.some((r) => p === r || p.startsWith(`${r}/`));
  for (const path of [...tracked].filter(isLinkable)) {
    if (scanned.has(path)) continue;
    const src = text(read(path));
    if (src === null) continue;
    for (const { target, line } of extractLinks(src).links) {
      const p = resolveLink(path, target);
      if (p !== null && gone(p) && !found(p)) out.push(finding(path, line, "links", `${target} points at a file this change removes`));
    }
  }
  return out;
}

export function checkDecisions({ changed, removed }, tracked, read) {
  if (![...changed, ...removed].some((p) => p.startsWith(DECISIONS))) return [];
  const out = [];
  const files = [];
  for (const p of tracked) {
    if (!p.startsWith(DECISIONS) || p === DECISION_INDEX || !p.endsWith(".md")) continue;
    const name = p.slice(DECISIONS.length);
    const m = name.match(/^(\d{4})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/);
    if (!m) out.push(finding(p, 1, "decisions", "decision files are named NNNN-slug.md, lowercase kebab-case"));
    else files.push({ path: p, name, n: Number(m[1]) });
  }
  if (!files.length) return out;
  const byNumber = new Map();
  for (const f of files) {
    if (byNumber.has(f.n)) out.push(finding(f.path, 1, "decisions", `number ${f.n} is also used by ${byNumber.get(f.n).name}`));
    else byNumber.set(f.n, f);
  }
  const max = Math.max(...byNumber.keys());
  for (let n = 1; n <= max; n++) {
    if (!byNumber.has(n)) out.push(finding(DECISION_INDEX, 1, "decisions", `decision ${String(n).padStart(4, "0")} is missing: numbers run contiguously from 0001`));
  }
  const index = text(read(DECISION_INDEX));
  if (index === null) return [...out, finding(DECISION_INDEX, 1, "decisions", "the decisions index is missing")];
  const rowFor = new Map();
  index.split("\n").forEach((line, i) => {
    if (!/^\|\s*\d+\s*\|/.test(line)) return;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    const target = extractLinks(line).links[0]?.target;
    const at = (message) => out.push(finding(DECISION_INDEX, i + 1, "decisions", message));
    if (!target) return at("row has no link to its decision file");
    const f = files.find((x) => x.path === resolveLink(DECISION_INDEX, target));
    if (!f) return at(`row links to ${target}, which is not a decision file`);
    if (rowFor.has(f.path)) return at(`second row for ${f.name}`);
    rowFor.set(f.path, true);
    if (Number(cells[0]) !== f.n) at(`row number ${cells[0]} does not match ${f.name}`);
    const status = parseFrontmatter(text(read(f.path)) ?? "")?.data.status;
    const rowStatus = cells[cells.length - 1];
    if (status && rowStatus !== status) at(`row status ${rowStatus} differs from ${f.name}, which is ${status}`);
  });
  for (const f of files) if (!rowFor.has(f.path)) out.push(finding(f.path, 1, "decisions", `no row in ${DECISION_INDEX}`));
  return out;
}
