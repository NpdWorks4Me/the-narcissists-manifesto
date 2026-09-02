/**
 * vault:emerge — surfaces unnamed patterns from last 30 days (mirrors /obsidian-emerge)
 * Scans 30-day window, counts phrase co-occurrence, reports patterns without a dedicated note
 * Usage: npm run vault:emerge [--json] [--days 30]
 */
import { readdirSync, readFileSync, existsSync, statSync } from "fs";
import { join, basename } from "path";
import { parseFrontmatter } from "./lib/frontmatter.js";
import { analyzeText } from "./lib/nlp.js";
import { CONFIG } from "./lib/config.js";

const _cwd = process.cwd();
const vaultRoot = (() => { const base = _cwd.split("/").pop() || ""; const isBackend = base === "backend" || base === "05 Backend"; return isBackend ? _cwd.slice(0, -base.length).replace(/\/$/, "") || "." : _cwd; })();
const args = process.argv.slice(2);
const jsonOut = args.includes("--json");
const daysIdx = args.indexOf("--days");
const windowDays = daysIdx !== -1 ? parseInt(args[daysIdx+1],10) || 30 : 30;

function collect(dirRel: string) {
  const full = join(vaultRoot, dirRel);
  if (!existsSync(full)) return [];
  const out: any[] = [];
  function walk(dir: string, relBase: string) {
    for (const e of readdirSync(dir)) {
      if (e.startsWith(".")) continue;
      const p = join(dir, e);
      const rel = join(relBase, e);
      const s = statSync(p);
      if (s.isDirectory()) walk(p, rel);
      else if (e.endsWith(".md")) {
        const raw = readFileSync(p, "utf-8");
        const parsed = parseFrontmatter(raw, rel);
        const updated = parsed.data.updated || "1970-01-01";
        out.push({ path: p, rel, raw, stem: basename(e,".md"), data: parsed.data, content: parsed.content, updated });
      }
    }
  }
  walk(full, dirRel);
  return out;
}

function main() {
  console.log(`\n🌱 Emerge — unnamed patterns (last ${windowDays} days)\n`);
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - windowDays);
  const cutoffISO = cutoff.toISOString().slice(0,10);
  const hyper = collect(CONFIG.FOLDERS.hyperfixations).filter((n)=> n.updated >= cutoffISO);
  const atomic = collect(CONFIG.FOLDERS.atomic).filter((n)=> n.updated >= cutoffISO);
  const pool = [...hyper, ...atomic];
  console.log(`  Pool: ${pool.length} notes updated since ${cutoffISO}`);

  if (pool.length < 2) {
    console.log("  Need ≥2 notes in window — create more or widen --days");
    if (jsonOut) console.log(JSON.stringify({ windowDays, patterns: [] }, null, 2));
    return;
  }

  // Count phrase frequency across notes
  const phraseToNotes = new Map<string, Set<string>>();
  for (const n of pool) {
    const analysis = analyzeText(n.content.slice(0, 4000));
    for (const phrase of analysis.topPhrases.slice(0, 3)) {
      const key = phrase.toLowerCase();
      if (key.length < 4 || /agent insight/.test(key)) continue;
      if (!phraseToNotes.has(key)) phraseToNotes.set(key, new Set());
      phraseToNotes.get(key)!.add(n.stem);
    }
  }

  // Also count hashtag/tag co-occurrence
  const tagToNotes = new Map<string, Set<string>>();
  for (const n of pool) {
    const tags: string[] = (n.data.tags || []).map((t:string)=> t.toLowerCase());
    for (const t of tags) {
      if (!tagToNotes.has(t)) tagToNotes.set(t, new Set());
      tagToNotes.get(t)!.add(n.stem);
    }
  }

  const patterns: any[] = [];
  for (const [phrase, stems] of phraseToNotes) {
    if (stems.size >= 2) {
      const noteList = [...stems].slice(0, 5);
      // Check if an atomic concept already exists for this phrase
      const slug = phrase.replace(/[^a-z0-9]+/g, "-").slice(0, 40);
      const exists = pool.some((p)=> p.stem.toLowerCase().replace(/[^a-z0-9]+/g, "-").includes(slug)) || existsSync(join(vaultRoot, CONFIG.FOLDERS.atomic, `${phrase}.md`)) || existsSync(join(vaultRoot, CONFIG.FOLDERS.atomic, `${phrase.replace(/\b\w/g,(c)=> c.toUpperCase())}.md`));
      if (!exists) {
        patterns.push({ phrase, stems: noteList, hits: stems.size, type: "phrase", action: `Create [[${phrase}]] atomic?` });
      }
    }
  }
  for (const [tag, stems] of tagToNotes) {
    if (stems.size >= 3 && !phraseToNotes.has(tag)) {
      const exists = existsSync(join(vaultRoot, CONFIG.FOLDERS.atomic, `${tag}.md`));
      if (!exists) patterns.push({ phrase: `#${tag}`, stems: [...stems].slice(0,5), hits: stems.size, type: "tag", action: `Tag #${tag} appears in ${stems.size} notes — codify as atomic?` });
    }
  }

  patterns.sort((a,b)=> b.hits - a.hits);

  if (patterns.length === 0) {
    console.log("  No unnamed patterns — vault is well-codified or window too narrow.");
    if (jsonOut) console.log(JSON.stringify({ windowDays, patterns: [] }, null, 2));
    return;
  }

  console.log(`  Found ${patterns.length} unnamed patterns:\n`);
  for (let i=0;i<Math.min(5, patterns.length);i++) {
    const p = patterns[i];
    console.log(`  ${i+1}. "${p.phrase}" in ${p.hits} notes: ${p.stems.map((s:string)=> `[[${s}]]`).join(" · ")}`);
    console.log(`     → ${p.action}\n`);
  }

  if (jsonOut) console.log(JSON.stringify({ windowDays, cutoffISO, patterns: patterns.slice(0,10) }, null, 2));
  else console.log(`  Next: run vault:synthesize --apply to promote top pattern to atomic, or npm run vault:emerge -- --json for machine view`);
}

main();
