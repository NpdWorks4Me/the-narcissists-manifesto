/**
 * reconcile — OKM contradiction resolver (Phase 2 of nightly)
 * Detects contradictions across hyperfixations/atomic concepts via:
 * - Direct phrase contradiction (not/without vs is/with)
 * - Typed relations: contradicts edges
 * - LLM-assisted if OPENAI_API_KEY set (future)
 * Usage: npx tsx 05 Backend/src/vault/reconcile.ts [--dry-run] [--apply]
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync, appendFileSync } from "fs";
import { join, basename } from "path";
import matter from "gray-matter";
import { parseFrontmatter, todayISO } from "./lib/frontmatter.js";
import { CONFIG } from "./lib/config.js";
import { extractWikiLinks } from "./lib/links.js";

const _cwd = process.cwd();
const vaultRoot = (() => { const base = _cwd.split("/").pop() || ""; const isBackend = base === "backend" || base === "05 Backend"; return isBackend ? _cwd.slice(0, -base.length).replace(/\/$/, "") || "." : _cwd; })();
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run") || !args.includes("--apply");

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
        out.push({ path: p, rel, raw, stem: basename(e, ".md"), data: parseFrontmatter(raw, rel).data, content: parseFrontmatter(raw, rel).content });
      }
    }
  }
  walk(full, dirRel);
  return out;
}

// Simple contradiction heuristics: same entity, opposite valence
const CONTRADICTION_PAIRS: [RegExp, RegExp][] = [
  [/\bnarcissism is .*performance\b/i, /\bnarcissism is not .*performance\b/i],
  [/\bvariable rewards (create|build) habit/i, /\bvariable rewards (destroy|harm) habit/i],
  [/\bmore variable.*more craving/i, /\bmore variable.*less craving/i],
];

function detectContradictions(notes: any[]): { a: string; b: string; reason: string }[] {
  const hits: { a: string; b: string; reason: string }[] = [];
  // Check typed relations: contradicts
  for (const n of notes) {
    const rels: any[] = n.data.relations || [];
    for (const r of rels) {
      if (r.type === "contradicts") {
        hits.push({ a: n.stem, b: r.target, reason: `typed edge ${n.stem} --contradicts--> ${r.target}${r.note ? `: ${r.note}` : ""}` });
      }
    }
  }
  // Check phrase pairs
  for (let i = 0; i < notes.length; i++) {
    for (let j = i + 1; j < notes.length; j++) {
      const a = notes[i], b = notes[j];
      const ca = a.content.toLowerCase(), cb = b.content.toLowerCase();
      for (const [reA, reB] of CONTRADICTION_PAIRS) {
        if ((reA.test(a.content) && reB.test(b.content)) || (reB.test(a.content) && reA.test(b.content))) {
          hits.push({ a: a.stem, b: b.stem, reason: `opposite framing detected between ${a.stem} and ${b.stem}` });
        }
      }
      // Shared term but opposite sentiment via simple negation count
      const shared = extractWikiLinks(a.raw).filter((x) => extractWikiLinks(b.raw).includes(x));
      if (shared.length > 0) {
        const negA = (a.content.match(/\b(not|no |never|without|against)\b/gi) || []).length;
        const negB = (b.content.match(/\b(not|no |never|without|against)\b/gi) || []).length;
        if (Math.abs(negA - negB) > 5 && a.content.length > 400 && b.content.length > 400) {
          // weak signal, keep as warning only if also share a wiki link
          // don't auto-flag — just log
        }
      }
    }
  }
  return hits;
}

async function main() {
  console.log(`⚖️  Reconcile — contradiction detection ${dryRun ? "(dry-run)" : "(apply)"}`);
  const hyper = collect(CONFIG.FOLDERS.hyperfixations);
  const atomic = collect(CONFIG.FOLDERS.atomic);
  const pool = [...hyper, ...atomic].filter((n) => n.data.type);
  console.log(`  Scanning ${pool.length} notes`);

  const contradictions = detectContradictions(pool);
  const logPath = join(vaultRoot, CONFIG.FOLDERS.logs, "reconcile.log");
  if (contradictions.length === 0) {
    console.log("  ✅ No contradictions found.");
    if (!dryRun) appendFileSync(logPath, `[${new Date().toISOString()}] reconcile: 0 contradictions\n`);
    return;
  }

  console.log(`  Found ${contradictions.length} potential contradictions:`);
  for (const c of contradictions) {
    console.log(`   • ${c.a} ↔ ${c.b}: ${c.reason}`);
  }

  if (!dryRun) {
    // Write reconciliation report
    const reportDir = join(vaultRoot, CONFIG.FOLDERS.logs);
    const reportPath = join(reportDir, `reconcile-${todayISO()}.md`);
    const body = `# Reconcile Report — ${todayISO()}\n\nFound ${contradictions.length} contradictions:\n\n${contradictions.map((c) => `- **${c.a} ↔ ${c.b}**: ${c.reason}`).join("\n")}\n\n> Auto-resolved: 0 (manual review). Add \`relations: [{type: contradicts, target: X}]\` to codify, or edit synthesis to reconcile.\n`;
    writeFileSync(reportPath, body, "utf-8");
    appendFileSync(logPath, `[${new Date().toISOString()}] reconcile: ${contradictions.length} contradictions → ${reportPath}\n`);
    console.log(`  📝 Report → ${reportPath}`);
  } else {
    console.log("  (dry-run) would write reconcile report");
  }
}

main().catch((e) => { console.error("reconcile failed", e); process.exit(1); });
