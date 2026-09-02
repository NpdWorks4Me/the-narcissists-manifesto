/**
 * vault:challenge — vault argues against your idea using your own history
 * Mirrors /obsidian-challenge: searches vault for past failures, reversed decisions, contradicts
 * Usage: npm run vault:challenge -- "rewrite API in Rust" [--json]
 */
import { readdirSync, readFileSync, existsSync, statSync } from "fs";
import { join, basename } from "path";
import { parseFrontmatter } from "./lib/frontmatter.js";
import { termFrequency, cosineSimilarityTF } from "./lib/nlp.js";
import { CONFIG } from "./lib/config.js";

const _cwd = process.cwd();
const vaultRoot = (() => { const base = _cwd.split("/").pop() || ""; const isBackend = base === "backend" || base === "05 Backend"; return isBackend ? _cwd.slice(0, -base.length).replace(/\/$/, "") || "." : _cwd; })();
const idea = process.argv.slice(2).filter((a)=> !a.startsWith("--")).join(" ").trim();
const jsonOut = process.argv.includes("--json");

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
        out.push({ path: p, rel, raw, stem: basename(e,".md"), data: parseFrontmatter(raw, rel).data, content: parseFrontmatter(raw, rel).content });
      }
    }
  }
  walk(full, dirRel);
  return out;
}

function main() {
  if (!idea) {
    console.log('Usage: npm run vault:challenge -- "your idea" [--json]\nExample: npm run vault:challenge -- "narcissism as purely performative"');
    process.exit(1);
  }
  console.log(`\n🥊 Challenge — vault argues against: "${idea}"\n`);
  const hyper = collect(CONFIG.FOLDERS.hyperfixations);
  const atomic = collect(CONFIG.FOLDERS.atomic);
  const logs = collect("04 Atlas & Meta/Logs").filter((n)=> n.rel.endsWith("report.md"));
  const pool = [...hyper, ...atomic, ...logs];

  const qTf = termFrequency(idea.toLowerCase());
  const scored = pool.map((p)=> {
    const tf = termFrequency(p.content.toLowerCase().slice(0, 4000));
    const sim = cosineSimilarityTF(qTf, tf);
    // Boost if contains challenge signals
    let boost = 0;
    if (/\b(failed|reversed|contradicts|against|criticism|risk|problem)\b/i.test(p.content)) boost += 0.08;
    if ((p.data as any).relations?.some((r:any)=> r.type==="contradicts")) boost += 0.1;
    return { ...p, score: sim + boost };
  }).sort((a,b)=> b.score - a.score).slice(0, 6);

  const challenges: any[] = [];
  for (const hit of scored) {
    if (hit.score < 0.08) continue;
    // Extract a tension line
    const lines = hit.content.split("\n").filter((l)=> l.trim().length > 40).slice(0, 5);
    const tension = lines.find((l)=> /\b(not|no |never|failed|risk|contradict)\b/i.test(l)) || lines[0] || "";
    challenges.push({
      stem: hit.stem,
      path: hit.rel,
      score: Number(hit.score.toFixed(2)),
      tension: tension.trim().slice(0, 220),
      verdict: hit.score > 0.25 ? "strong counterpoint" : "weak tension",
    });
  }

  if (challenges.length === 0) {
    console.log("  No strong counterpoints — vault is silent or aligned.");
    console.log("  Try broadening the idea or seeding a contradiction with `relations: [{type: contradicts}]`.");
    if (jsonOut) console.log(JSON.stringify({ idea, challenges: [] }, null, 2));
    return;
  }

  console.log(`  Found ${challenges.length} counterpoints from your own notes:\n`);
  for (let i=0;i<challenges.length;i++) {
    const c = challenges[i];
    console.log(`  ${i+1}. [[${c.stem}]] score=${c.score} (${c.verdict}) — ${c.path}`);
    console.log(`     "${c.tension}"`);
    console.log(`     → Your vault says: revisit [[${c.stem}]] before committing.\n`);
  }

  const synthesis = `Your notes lean ${challenges.length>=2? "mixed" : "tentatively"} — ${challenges[0].stem} pushes back hardest. Still want to proceed? If yes, log decision to [[${challenges[0].stem}]] with as of marker and add relations: contradicts to codify the tension.`;
  console.log(`  🧠 Synthesis: ${synthesis}`);

  if (jsonOut) console.log(JSON.stringify({ idea, challenges, synthesis }, null, 2));
}

main();
