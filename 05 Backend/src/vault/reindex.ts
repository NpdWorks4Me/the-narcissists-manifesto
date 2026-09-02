/**
 * vault:reindex — incremental semantic index (Phase 5 of nightly)
 * Usage: npx tsx 05 Backend/src/vault/reindex.ts [--dry-run] [--apply] [--force]
 */
import { readdirSync, readFileSync, existsSync, statSync } from "fs";
import { join, basename } from "path";
import { CONFIG } from "./lib/config.js";
import { buildHybridIndex, coverageReport, loadIndex } from "./lib/embeddings.js";

const _cwd = process.cwd();
const vaultRoot = (() => { const base = _cwd.split("/").pop() || ""; const isBackend = base === "backend" || base === "05 Backend"; return isBackend ? _cwd.slice(0, -base.length).replace(/\/$/, "") || "." : _cwd; })();
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run") || !args.includes("--apply");
const force = args.includes("--force");

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
      else if (e.endsWith(".md")) out.push({ path: rel, stem: basename(e, ".md"), content: readFileSync(p, "utf-8") });
    }
  }
  walk(full, dirRel);
  return out;
}

async function main() {
  console.log(`🔎 Reindex — incremental semantic index ${dryRun ? "(dry-run)" : "(apply)"}${force ? " --force" : ""}`);
  const before = loadIndex();
  const beforeCount = Object.keys(before).length;
  const beforeCov = coverageReport();
  console.log(`  Before: ${beforeCount} entries, embedding coverage ${beforeCov.pct} (${beforeCov.withEmbedding}/${beforeCov.total})`);

  const hyper = collect(CONFIG.FOLDERS.hyperfixations);
  const atomic = collect(CONFIG.FOLDERS.atomic);
  const pool = [...hyper, ...atomic];
  console.log(`  Pool: ${pool.length} notes`);

  if (dryRun) {
    console.log(`  (dry-run) would index ${pool.length} notes → 04 Atlas & Meta/Logs/semantic-index.json`);
    return;
  }

  const res = await buildHybridIndex(pool, { force });
  const afterCov = coverageReport();
  console.log(`  ✅ Indexed: ${res.indexed} new, ${res.reused} reused, ${res.embedded} with Ollama embedding`);
  console.log(`  After: ${afterCov.total} entries, embedding coverage ${afterCov.pct}`);
}

main().catch((e)=> { console.error("reindex failed", e); process.exit(1); });
