#!/usr/bin/env node
// Token-consumption audit over ~/.claude/projects/**/*.jsonl transcripts.
// Prints only derived summaries — never dump raw transcript content.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const root = path.join(os.homedir(), '.claude', 'projects');

const MARATHON_HOURS = 4;      // session flagged as marathon past this span
const MARATHON_TURNS = 500;    // or past this many assistant turns
const SKILL_LOOP_TURNS = 100;  // skill flagged as turn-dense past this many turns...
const SKILL_LOOP_HOURS = 6;    // ...within a session shorter than this span (catches "impeccable"-style loops that a marathon-only check would miss)

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.jsonl')) files.push(p);
  }
})(root);

function isoWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
const fmtM = n => (n / 1e6).toFixed(2) + 'M';

const byWeek = new Map();
const byProject = new Map();
const bySession = new Map();   // sid -> {tokens, turns, project, first, last, skills:Map<skill,turns>}
const bySkillTotal = new Map(); // skill -> {tokens, turns, sessions:Set}

for (const f of files) {
  const project = path.basename(path.dirname(f));
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    if (o.type !== 'assistant' || !o.message?.usage) continue;
    const u = o.message.usage;
    const tot = (u.input_tokens || 0) + (u.output_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
    if (!tot) continue;
    const sid = o.sessionId || 'unknown';
    const ts = o.timestamp ? new Date(o.timestamp) : null;
    const sk = o.attributionSkill || o.attributionPlugin || null;

    if (ts) byWeek.set(isoWeek(ts), (byWeek.get(isoWeek(ts)) || 0) + tot);
    byProject.set(project, (byProject.get(project) || 0) + tot);

    if (!bySession.has(sid)) bySession.set(sid, { tokens: 0, turns: 0, project, first: ts, last: ts, skills: new Map() });
    const s = bySession.get(sid);
    s.tokens += tot; s.turns++;
    if (ts) { if (!s.first || ts < s.first) s.first = ts; if (!s.last || ts > s.last) s.last = ts; }
    if (sk) s.skills.set(sk, (s.skills.get(sk) || 0) + 1);

    if (sk) {
      if (!bySkillTotal.has(sk)) bySkillTotal.set(sk, { tokens: 0, turns: 0, sessions: new Set() });
      const bs = bySkillTotal.get(sk);
      bs.tokens += tot; bs.turns++; bs.sessions.add(sid);
    }
  }
}

console.log(`=== Token Audit — ${files.length} transcript files ===\n`);

console.log('--- Weekly totals (last 8) ---');
[...byWeek.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-8)
  .forEach(([w, t]) => console.log(`${w}: ${fmtM(t)}`));

console.log('\n--- Top 10 projects ---');
[...byProject.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  .forEach(([p, t]) => console.log(`${fmtM(t).padStart(8)}  ${p}`));

console.log('\n--- MARATHON SESSIONS (span > ' + MARATHON_HOURS + 'h or turns > ' + MARATHON_TURNS + ') ---');
const marathons = [...bySession.entries()]
  .map(([sid, s]) => ({ sid, ...s, hours: s.first && s.last ? (s.last - s.first) / 3600000 : 0 }))
  .filter(s => s.hours > MARATHON_HOURS || s.turns > MARATHON_TURNS)
  .sort((a, b) => b.tokens - a.tokens);
if (!marathons.length) console.log('  none found');
marathons.slice(0, 10).forEach(s => {
  const date = s.last ? s.last.toISOString().slice(0, 10) : '?';
  console.log(`  ${fmtM(s.tokens).padStart(8)}  ${date}  ${s.project}  ${s.hours.toFixed(1)}h  ${s.turns} turns  [${s.sid.slice(0, 8)}]`);
});

console.log(`\n--- TURN-DENSE SKILLS (>${SKILL_LOOP_TURNS} turns for one skill inside a session under ${SKILL_LOOP_HOURS}h) ---`);
console.log('  (catches loop-style skill cost independent of marathon-session length — the "impeccable" pattern)');
const denseSkillHits = [];
for (const [sid, s] of bySession.entries()) {
  const hours = s.first && s.last ? (s.last - s.first) / 3600000 : 0;
  if (hours >= SKILL_LOOP_HOURS) continue;
  for (const [sk, turns] of s.skills.entries()) {
    if (turns > SKILL_LOOP_TURNS) denseSkillHits.push({ sid, sk, turns, hours, project: s.project, tokens: s.tokens });
  }
}
if (!denseSkillHits.length) console.log('  none found — clean');
denseSkillHits.sort((a, b) => b.turns - a.turns).forEach(h => {
  console.log(`  ${h.sk}: ${h.turns} turns in ${h.hours.toFixed(1)}h  (session ${h.project}, ~${fmtM(h.tokens)} total)  [${h.sid.slice(0, 8)}]`);
});

console.log('\n--- Top 15 skills/plugins by total tokens (with avg/turn) ---');
[...bySkillTotal.entries()]
  .map(([sk, s]) => ({ sk, ...s, avgPerTurn: s.tokens / s.turns }))
  .sort((a, b) => b.tokens - a.tokens).slice(0, 15)
  .forEach(r => console.log(`${fmtM(r.tokens).padStart(8)}  turns=${String(r.turns).padStart(5)}  sessions=${String(r.sessions.size).padStart(3)}  avg/turn=${(r.avgPerTurn / 1000).toFixed(0)}k  ${r.sk}`));
