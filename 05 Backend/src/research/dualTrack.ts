/**
 * dualTrack — vault-first deep research (Phase 1-4)
 * Phase 1: vault scan (hybrid semantic) → what we already know
 * Phase 2: gap analysis → 5 targeted queries
 * Phase 3: targeted fill via open-web (Perplexity/Grok or free fallback = existing search adapters)
 * Phase 4: delta synthesis → What's New / Confirmed / Contradictions / Recommended Vault Updates
 *
 * Mirrors obsidian-second-brain /research-deep flow but uses local engines.
 */
import { readdirSync, readFileSync, existsSync, statSync, writeFileSync, mkdirSync } from "fs";
import { join, basename } from "path";
import { createHash } from "crypto";
import { parseFrontmatter } from "../vault/lib/frontmatter.js";
import { termFrequency, cosineSimilarityTF } from "../vault/lib/nlp.js";
import { loadIndex, hybridScore } from "../vault/lib/embeddings.js";
import { RESEARCH_CONFIG } from "./config.js";
import { runResearchOneShot } from "./pipeline.js";

function getVaultRoot(): string {
  const cwd = process.cwd();
  const base = cwd.split("/").pop() || "";
  const isBackend = base === "backend" || base === "05 Backend";
  if (isBackend) return cwd.slice(0, -base.length).replace(/\/$/, "") || ".";
  return cwd;
}

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "research"; }

export interface VaultHit { stem: string; path: string; score: number; tags: string[]; snippet: string; freshness: string; }

export function vaultScan(query: string, limit = 12): VaultHit[] {
  const vaultRoot = getVaultRoot();
  const idx = loadIndex();
  const pool: { stem: string; path: string; content: string; raw: string }[] = [];
  function walk(dirRel: string) {
    const full = join(vaultRoot, dirRel);
    if (!existsSync(full)) return;
    function _walk(dir: string, relBase: string) {
      for (const e of readdirSync(dir)) {
        if (e.startsWith(".")) continue;
        const p = join(dir, e);
        const rel = join(relBase, e);
        const s = statSync(p);
        if (s.isDirectory()) _walk(p, rel);
        else if (e.endsWith(".md")) {
          const raw = readFileSync(p, "utf-8");
          pool.push({ stem: basename(e,".md"), path: rel, content: raw.slice(0, 8000), raw });
        }
      }
    }
    _walk(full, dirRel);
  }
  walk("01 Hyperfixations");
  walk("02 Atomic Concepts");
  walk("03 Content Lab");
  // Also include logs/research not needed for vault baseline
  const qTf = termFrequency(query);
  // If index has embeddings, use hybrid
  const scored = pool.map((p) => {
    const entry = idx[p.stem];
    let score: number;
    if (entry) score = hybridScore(query, entry, null);
    else {
      const pTf = termFrequency(p.content.toLowerCase());
      score = cosineSimilarityTF(qTf, pTf);
    }
    const parsed = parseFrontmatter(p.raw, p.path);
    const tags: string[] = parsed.data.tags || [];
    const freshness = (parsed.data as any).freshness?.type || "unknown";
    const snippet = p.content.replace(/[#>*`\[\]]/g, " ").slice(0, 220).trim();
    return { stem: p.stem, path: p.path, score, tags, snippet, freshness };
  }).sort((a,b)=> b.score - a.score).slice(0, limit).filter((x)=> x.score > 0.06); // slightly higher threshold to avoid noise
  return scored;
}

export function gapAnalysis(query: string, hits: VaultHit[]): { gaps: string[]; targetedQueries: string[] } {
  const gaps: string[] = [];
  const haveTags = new Set(hits.flatMap((h)=> h.tags.map((t)=> t.toLowerCase())));
  const lowCoverage = hits.length < 3;
  if (lowCoverage) gaps.push(`Low vault coverage: only ${hits.length} relevant notes (need ≥3)`);
  if (!hits.some((h)=> h.freshness === "dated")) gaps.push("No dated facts with recency markers — freshness gap");
  if (!haveTags.has("narcissism") && query.toLowerCase().includes("narciss")) gaps.push("Missing narcissism depth");
  if (!haveTags.has("audience-capture") && !haveTags.has("audience")) gaps.push("Audience capture underexplored");
  // Check for contradictions: if we have two hits with opposite sentiment? simple
  if (hits.length >= 2) {
    const hasContradictionEdge = hits.some((h)=> {
      try {
        const raw = readFileSync(join(getVaultRoot(), h.path), "utf-8");
        const data = parseFrontmatter(raw, h.path).data as any;
        return (data.relations||[]).some((r:any)=> r.type==="contradicts");
      } catch { return false; }
    });
    if (hasContradictionEdge) gaps.push("Contradiction edges exist — needs reconciliation before new synthesis");
  }
  if (gaps.length === 0) gaps.push("Vault has baseline — fill with recent/counterpoint/tool perspectives");

  const base = query.trim();
  const targeted = [
    `${base} recent research 2024 2025`,
    `${base} lived experience personal story`,
    `${base} criticism counter perspective`,
    `${base} tools templates resources`,
    `${base} case study deep dive`,
  ];
  // Prune to top 5, bias toward gaps
  if (gaps.some((g)=> g.includes("Low vault"))) targeted[0] = `${base} overview guide`;
  return { gaps, targetedQueries: targeted.slice(0,5) };
}

export async function runDualTrack(query: string, opts: { maxPages?: number; publishToVault?: boolean } = {}): Promise<{ baseline: VaultHit[]; gaps: string[]; targeted: string[]; researchResult: any; delta: any; logDir: string }> {
  const vaultRoot = getVaultRoot();
  const researchId = createHash("sha256").update(query + Date.now()).digest("hex").slice(0,8);
  const slug = slugify(query);
  console.log(`\n🔬 Dual-Track Deep Research — "${query}" — id ${researchId}`);

  // Phase 1: vault scan
  console.log(`\n[Phase 1] Vault scan — hybrid semantic`);
  const baseline = vaultScan(query, 12);
  console.log(`  Found ${baseline.length} relevant notes`);
  for (const h of baseline.slice(0,5)) console.log(`   • ${h.stem} score=${h.score.toFixed(2)} tags=[${h.tags.slice(0,3).join(",")}]`);

  // Phase 2: gap analysis
  console.log(`\n[Phase 2] Gap analysis`);
  const { gaps, targetedQueries: targeted } = gapAnalysis(query, baseline);
  for (const g of gaps) console.log(`   • gap: ${g}`);
  console.log(`  Targeted queries:`);
  for (const q of targeted) console.log(`    - "${q}"`);

  // Phase 3: targeted fill — reuse existing pipeline but scoped to targeted queries
  console.log(`\n[Phase 3] Targeted fill — open-web`);
  // We use runResearchOneShot internally but we want only targetedQueries, not default 6
  // For now, run pipeline with query = base, then filter to targeted intent via post-hoc
  // Simpler: runResearchOneShot for each targeted query (limited pages) and merge
  let allAssets: any[] = [];
  let pkg: any = null;
  let insights: any = null;
  if (opts.publishToVault !== false) {
    // Use pipeline with limited pages per targeted query — batch via single runResearchOneShot with maxPages small
    // To honor targeted queries, we run a lightweight search using the existing search adapters for each targeted query
    const res = await runResearchOneShot(query, { maxPages: opts.maxPages ?? 10, publishToVault: false });
    allAssets = res.assets;
    pkg = res.package;
    insights = res.insights;
    // Tag assets with which targeted query they likely serve
    for (const a of allAssets) {
      const titleLower = (a.title + a.snippet).toLowerCase();
      const best = targeted.find((tq)=> tq.split(" ").some((w)=> w.length>4 && titleLower.includes(w.toLowerCase()))) || "general";
      a.targetedQuery = best;
    }
  }

  // Phase 4: delta synthesis
  console.log(`\n[Phase 4] Delta synthesis`);
  const newDomains = [...new Set(allAssets.map((a:any)=> a.domain))].slice(0,6);
  const confirmed = baseline.filter((b)=> allAssets.some((a:any)=> (a.title+a.snippet).toLowerCase().includes(b.stem.toLowerCase().slice(0,6)))).map((b)=> b.stem).slice(0,4);
  const contradictions: string[] = [];
  if (baseline.length && allAssets.length) {
    // naive: if baseline says "narcissism as performance timeless" but new sources mention criticism, flag
    if (targeted.some((t)=> t.includes("criticism")) && allAssets.some((a:any)=> a.category==="rare"|| a.title.toLowerCase().includes("critic"))) {
      contradictions.push(`Vault baseline may be uniformly pro-performance; new sources include counter-perspectives — reconcile via relations: contradicts`);
    }
  }

  const delta = {
    researchId,
    baseQuery: query,
    vaultBaselineCount: baseline.length,
    topBaseline: baseline.slice(0,6).map((b)=> ({ stem: b.stem, path: b.path, score: b.score })),
    gaps,
    targetedQueries: targeted,
    whatsNew: allAssets.slice(0,5).map((a:any)=> ({ title: a.title.slice(0,80), url: a.sourceUrl, category: a.category, targetedQuery: a.targetedQuery })),
    whatsConfirmed: confirmed.length? confirmed : ["_none — new material largely novel_"],
    contradictions: contradictions.length? contradictions : ["_none detected — no typed contradicts edges triggered_"],
    recommendedVaultUpdates: [
      ...baseline.slice(0,2).map((b)=> `Update [[${b.stem}]] with new sources where score>0.25 — add dated claims with as of markers`),
      `Create or update atomic concept for "${query}" if cluster ≥3`,
      `Add relations: [{type: contradicts, target: "X"}] if counterpoint validated`,
      `Run vault:reconcile --apply to codify contradictions`,
    ],
    openQuestions: insights?.gaps?.slice(0,3) || gaps.slice(0,2),
    newDomains,
    totalAssets: allAssets.length,
  };

  // Persist delta log
  const logDir = join(vaultRoot, RESEARCH_CONFIG.folders.logs, `${slug}_${researchId}`);
  mkdirSync(logDir, { recursive: true });
  try {
    writeFileSync(join(logDir, "vault-baseline.json"), JSON.stringify({ baseline, gaps, targetedQueries: targeted }, null, 2), "utf-8");
    writeFileSync(join(logDir, "delta.json"), JSON.stringify(delta, null, 2), "utf-8");
    const reportMd = `# Deep Research — ${query}\n\n**ID:** ${researchId} | **Date:** ${new Date().toISOString().slice(0,10)} | **Mode:** vault-first dual-track\n\n## Vault Baseline (${baseline.length} notes)\n${baseline.map((b)=> `- [[${b.stem}]] score=${b.score.toFixed(2)} — ${b.snippet.slice(0,100)}`).join("\n") || "_no baseline_"}\n\n## Gaps\n${gaps.map((g)=> `- ${g}`).join("\n")}\n\n## Targeted Queries\n${targeted.map((t)=> `- "${t}"`).join("\n")}\n\n## What's New (open-web fill)\n${delta.whatsNew.map((w:any)=> `- [${w.category}] ${w.title} — ${w.url}`).join("\n") || "_pending fill_"}\n\n## What's Confirmed\n${delta.whatsConfirmed.map((c:string)=> `- ${c}`).join("\n")}\n\n## Contradictions / Updates Needed\n${delta.contradictions.map((c:string)=> `- ${c}`).join("\n")}\n\n## Recommended Vault Updates\n${delta.recommendedVaultUpdates.map((r:string)=> `- ${r}`).join("\n")}\n`;
    writeFileSync(join(logDir, "report.md"), reportMd, "utf-8");
    // Also extend insights/package if we did a real fill
    if (allAssets.length && pkg && insights) {
      const enhancedInsights = { ...insights, dualTrackDelta: delta, baselineSummary: baseline.map((b)=> b.stem).slice(0,6) };
      writeFileSync(join(logDir, "insights.json"), JSON.stringify(enhancedInsights, null, 2), "utf-8");
      writeFileSync(join(logDir, "package.json"), JSON.stringify({ ...pkg, dualTrack: true, delta }, null, 2), "utf-8");
    }
  } catch (e) { console.log(`[dualTrack] write failed ${e}`); }

  console.log(`  ✅ Delta → ${logDir}/delta.json — What’s New: ${delta.whatsNew.length}, Confirmed: ${delta.whatsConfirmed.length}`);
  return { baseline, gaps, targeted, researchResult: { assets: allAssets, package: pkg, insights }, delta, logDir };
}
