/**
 * vault:eval — retrieval evaluation (recall@k + MRR) — mirrors obsidian-second-brain /obsidian-retrieval-eval
 * Usage: npx tsx 05 Backend/src/vault/eval.ts [--k 5]
 * Generates synthetic NL questions from existing notes and measures TF-IDF+hybrid recall
 */
import { readdirSync, readFileSync, existsSync, statSync, writeFileSync } from "fs";
import { join, basename } from "path";
import { parseFrontmatter } from "./lib/frontmatter.js";
import { CONFIG } from "./lib/config.js";
import { loadIndex, hybridScore } from "./lib/embeddings.js";
import { termFrequency, cosineSimilarityTF } from "./lib/nlp.js";

const _cwd = process.cwd();
const vaultRoot = (() => { const base = _cwd.split("/").pop() || ""; const isBackend = base === "backend" || base === "05 Backend"; return isBackend ? _cwd.slice(0, -base.length).replace(/\/$/, "") || "." : _cwd; })();
const args = process.argv.slice(2);
const kIdx = args.indexOf("--k");
const K = kIdx !== -1 ? parseInt(args[kIdx+1],10) || 5 : 5;

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
        out.push({ path: p, rel, raw, stem: basename(e,".md"), data: parsed.data, content: parsed.content });
      }
    }
  }
  walk(full, dirRel);
  return out;
}

function syntheticQuestion(note: any): string | null {
  const title = note.data.title || note.stem;
  if (note.data.type === "atomic-concept") return `What is ${title}?`;
  if (note.data.type === "hyperfixation") return `Tell me about ${title}`;
  return null;
}

async function main() {
  console.log(`📊 Retrieval Eval — recall@${K} + MRR ${K} (TF-IDF + hybrid)`);
  const hyper = collect(CONFIG.FOLDERS.hyperfixations);
  const atomic = collect(CONFIG.FOLDERS.atomic);
  const pool = [...hyper, ...atomic].filter((n)=> n.content.length > 200);
  if (pool.length === 0) { console.log("  No notes — skip"); return; }
  const idx = loadIndex();

  // Build questions where we know the answer stem = note itself
  const queries = pool.map((n)=> ({ q: syntheticQuestion(n), answer: n.stem, note:n })).filter((x)=> x.q);
  console.log(`  Queries: ${queries.length} from ${pool.length} notes`);

  let recallAtK=0, mrrSum=0, ranked: any[] = [];

  for (const { q, answer } of queries) {
    const qTrim = q!;
    // Score all notes vs query
    const scored = pool.map((p)=> {
      const entry = idx[p.stem];
      let score: number;
      if (entry) score = hybridScore(qTrim, entry, null);
      else {
        const qTf = termFrequency(qTrim);
        const pTf = termFrequency(p.content.slice(0,4000));
        score = cosineSimilarityTF(qTf, pTf);
      }
      return { stem: p.stem, score };
    }).sort((a,b)=> b.score - a.score);

    const rank = scored.findIndex((s)=> s.stem === answer) + 1; // 1-indexed
    const hit = rank >=1 && rank <= K;
    if (hit) recallAtK++;
    const mrr = rank >=1 ? 1/rank : 0;
    mrrSum += mrr;
    ranked.push({ q: qTrim, answer, rank, hit, top: scored.slice(0,3).map((s)=> `${s.stem}(${s.score.toFixed(2)})`).join(", ") });
  }

  const recall = queries.length? recallAtK/queries.length : 0;
  const mrr = queries.length? mrrSum/queries.length : 0;
  console.log(`\n  recall@${K}: ${(recall*100).toFixed(1)}% (${recallAtK}/${queries.length})`);
  console.log(`  MRR: ${mrr.toFixed(3)}`);
  if (ranked.length) {
    console.log(`\n  Sample (worst first):`);
    for (const r of ranked.sort((a,b)=> b.rank - a.rank).slice(0,5)) {
      console.log(`   • Q="${r.q}" → answer=${r.answer} rank=${r.rank} hit=${r.hit} top=[${r.top}]`);
    }
  }

  const failures = ranked.filter((r)=> !r.hit).slice(0,10);
  if (failures.length) {
    console.log(`\n  Failures (recall@${K} misses):`);
    for (const f of failures) console.log(`   - "${f.q}" expected ${f.answer} got rank ${f.rank}`);
    console.log(`\n  Fixes:`);
    if (recall < 0.6) console.log(`   • Add "For future agent" preamble to missed notes (embedding uses it)`);
    if (mrr < 0.5) console.log(`   • Run vault:reindex --apply to refresh semantic-index; ensure Ollama nomic-embed-text if available`);
    console.log(`   • Increase TF-IDF weighting: ensure titles match query phrasing`);
  }

  // Write log
  try {
    const outPath = join(vaultRoot, CONFIG.FOLDERS.logs, `retrieval-eval-${new Date().toISOString().slice(0,10)}.json`);
    writeFileSync(outPath, JSON.stringify({ k: K, recallAtK: recall, mrr, queries: ranked }, null, 2), "utf-8");
    console.log(`\n  📝 Log → ${outPath}`);
  } catch {}
}

main().catch((e)=> { console.error("eval failed", e); process.exit(1); });
