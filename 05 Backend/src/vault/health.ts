/**
 * vault:check — validates frontmatter, links, WIP, plugin presence + OKM freshness, typed edges, secret detection
 * Supports --freshness to show only freshness section
 */
import { readdirSync, readFileSync, existsSync, statSync } from "fs";
import { join, basename } from "path";
import { parseFrontmatter } from "./lib/frontmatter.js";
import { buildGraph, findOrphans, findBrokenLinks } from "./lib/links.js";
import { CONFIG } from "./lib/config.js";
import { lintFreshness } from "./lib/freshness.js";

const _cwd = process.cwd();
const vaultRoot = (() => { const base = _cwd.split("/").pop() || ""; const isBackend = base === "backend" || base === "05 Backend"; return isBackend ? _cwd.slice(0, -base.length).replace(/\/$/, "") || "." : _cwd; })();
const freshnessOnly = process.argv.includes("--freshness");

function collectNotes(dirRel: string): { path: string; rel: string; content: string; stem: string }[] {
  const full = join(vaultRoot, dirRel);
  if (!existsSync(full)) return [];
  const out: any[] = [];
  function walk(dir: string, relBase: string) {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith(".")) continue;
      const p = join(dir, entry);
      const rel = join(relBase, entry);
      const stat = statSync(p);
      if (stat.isDirectory()) walk(p, rel);
      else if (entry.endsWith(".md")) {
        const content = readFileSync(p, "utf-8");
        out.push({ path: p, rel, content, stem: basename(entry, ".md") });
      }
    }
  }
  walk(full, dirRel);
  return out;
}

let errors: string[] = [];
let warnings: string[] = [];

const folders = ["00 Inbox", "01 Hyperfixations", "02 Atomic Concepts", "03 Content Lab", "04 Atlas & Meta"];
const allNotes = folders.flatMap(collectNotes);

// Frontmatter validation — skip templates and logs
for (const n of allNotes) {
  if (n.stem === ".gitkeep") continue;
  if (n.rel.includes("04 Atlas & Meta/Templates/")) continue;
  if (n.rel.includes("04 Atlas & Meta/Logs/")) continue;
  if (n.content.includes("<%")) continue;
  const parsed = parseFrontmatter(n.content, n.rel);
  if (parsed.errors.length > 0) errors.push(...parsed.errors);
  // Freshness lint
  const fViol = lintFreshness(parsed.content, parsed.data, n.rel);
  for (const v of fViol) {
    if (v.level === "error") errors.push(`Freshness ${v.code} — ${v.file}: ${v.message}`);
    else warnings.push(`Freshness ${v.code} — ${v.file}: ${v.message}`);
  }
  // Typed edge lint: contradiction cycles detection later
}

// Link hygiene — exclude Logs and templates
const filteredForGraph = allNotes.filter((n) => !n.rel.includes("04 Atlas & Meta/Logs/") && !n.rel.includes("04 Atlas & Meta/Templates/"));
const graphNotes = filteredForGraph.map((n) => ({ path: n.rel, stem: n.stem, content: n.content }));
const graph = buildGraph(graphNotes);
const excludeStems = new Set(["_INBOX_README", "🏠 Command Center", "📈 Knowledge Graph Intelligence", "SETUP", "T_Hyperfixation", "T_Atomic_Concept", "T_Content_Spec", "README", "scripts-readme", "SYSTEM_STATUS_REPORT", "report", "index", "SOUL", "CRITICAL_FACTS", "critical-facts", "soul-manifesto", "vault-index"]);
const orphans = findOrphans(graph, excludeStems);
const broken = findBrokenLinks(graph);

if (orphans.length > 0) warnings.push(`Orphans: ${orphans.map((o) => o.stem).join(", ")}`);
if (broken.length > 0) warnings.push(`Broken links: ${broken.map((b) => `${b.source} → ${b.target}`).join(", ")}`);

// Contradiction cycle detection on typed edges
let contradictionEdges: { source: string; target: string }[] = [];
for (const n of allNotes) {
  if (n.rel.includes("04 Atlas & Meta/Templates/") || n.rel.includes("04 Atlas & Meta/Logs/")) continue;
  if (n.content.includes("<%")) continue;
  const parsed = parseFrontmatter(n.content, n.rel);
  const rels: any[] = (parsed.data as any).relations || [];
  for (const r of rels) if (r.type === "contradicts") contradictionEdges.push({ source: n.stem, target: r.target });
}
// Simple cycle: A contradicts B and B contradicts A
const contradictionCycles = contradictionEdges.filter((e)=> contradictionEdges.some((o)=> o.source===e.target && o.target===e.source));
if (contradictionCycles.length > 0) warnings.push(`Contradiction cycles: ${contradictionCycles.map((c)=> `${c.source} ↔ ${c.target}`).join(", ")}`);

// Dangling typed-edge targets
const stemsSet = new Set(graphNotes.map((n)=> n.stem));
for (const e of contradictionEdges) {
  if (!stemsSet.has(e.target)) warnings.push(`Dangling typed edge: ${e.source} --contradicts--> ${e.target} (target not found)`);
}

// Secret detection (naive)
const secretRe = /(api[_-]?key|secret|token)\s*[:=]\s*['"]?[a-zA-Z0-9_\-]{16,}['"]?/i;
for (const n of allNotes) {
  if (n.rel.includes("04 Atlas & Meta/Logs/")) continue;
  if (secretRe.test(n.content)) warnings.push(`Potential secret in ${n.rel} — scrub API keys/tokens`);
}

// WIP
const activeCount = allNotes.filter((n) => {
  if (n.rel.includes("04 Atlas & Meta/Templates/") || n.rel.includes("04 Atlas & Meta/Logs/") || n.content.includes("<%")) return false;
  const { data } = parseFrontmatter(n.content, n.rel);
  return data.status === "active" && (data.type === "hyperfixation" || data.type === "content-project");
}).length;
if (activeCount > CONFIG.WIP_LIMIT) warnings.push(`WIP ${activeCount}/${CONFIG.WIP_LIMIT} exceeded`);

// Plugin presence
const pluginsDir = join(vaultRoot, ".obsidian", "plugins");
const required = ["dataview", "templater-obsidian"];
for (const p of required) {
  if (!existsSync(join(pluginsDir, p))) warnings.push(`Plugin missing: ${p} — dashboards will use fallback`);
}
const recommended = ["obsidian-tasks", "obsidian-tracker", "obsidian-linter", "obsidian-git"];
for (const p of recommended) {
  if (!existsSync(join(pluginsDir, p))) warnings.push(`Recommended plugin not installed: ${p}`);
}

// Taxonomy audit (opt-in via _meta/taxonomy.md)
const taxonomyPath = join(vaultRoot, "_meta", "taxonomy.md");
if (existsSync(taxonomyPath)) {
  try {
    const taxRaw = readFileSync(taxonomyPath, "utf-8");
    const allowed = new Set([...taxRaw.matchAll(/#?([a-z0-9_\-/]+)/gi)].map((m)=> m[1].toLowerCase()));
    for (const n of allNotes) {
      if (n.rel.includes("04 Atlas & Meta/Templates/") || n.rel.includes("04 Atlas & Meta/Logs/")) continue;
      const { data } = parseFrontmatter(n.content, n.rel);
      const tags: string[] = (data as any).tags || [];
      for (const t of tags) if (!allowed.has(t.toLowerCase())) warnings.push(`Tag taxonomy: ${n.rel} has tag "${t}" not in _meta/taxonomy.md`);
    }
  } catch {}
}

if (freshnessOnly) {
  console.log("\n🧬 Freshness Audit (OKM)");
  console.log("=".repeat(60));
  const freshErrs = errors.filter((e)=> e.includes("Freshness"));
  const freshWarns = warnings.filter((w)=> w.includes("Freshness"));
  console.log(`Freshness errors: ${freshErrs.length} | warnings: ${freshWarns.length}`);
  if (freshErrs.length) { console.log("\n❌ Freshness errors:"); freshErrs.forEach((e)=> console.log("  - "+e)); }
  if (freshWarns.length) { console.log("\n⚠️  Freshness warnings:"); freshWarns.forEach((w)=> console.log("  - "+w)); }
  if (freshErrs.length===0 && freshWarns.length===0) console.log("\n✅ Freshness clean — all notes timeless|dated|pointer compliant");
  console.log("\nPolicy: references/freshness-policy.md");
  process.exit(freshErrs.length>0?1:0);
}

console.log("\n🔍 Vault Health Check");
console.log("=".repeat(60));
console.log(`Notes scanned: ${allNotes.length}`);
console.log(`Active WIP: ${activeCount}/${CONFIG.WIP_LIMIT}`);
console.log(`Orphans: ${orphans.length} | Broken links: ${broken.length}`);
console.log(`Typed contradicts edges: ${contradictionEdges.length} | cycles: ${contradictionCycles.length}`);
console.log(`Frontmatter errors: ${errors.length} | Warnings: ${warnings.length}`);
if (errors.length > 0) {
  console.log("\n❌ Errors:");
  errors.forEach((e) => console.log("  - " + e));
}
if (warnings.length > 0) {
  console.log("\n⚠️  Warnings:");
  warnings.forEach((w) => console.log("  - " + w));
}
if (errors.length === 0 && warnings.length === 0) console.log("\n✅ Vault is healthy");
else if (errors.length === 0) console.log("\n✅ No errors (warnings are non-blocking)");
else console.log(`\n💡 Fix freshness with: npm run vault:freshness`);

process.exit(errors.length > 0 ? 1 : 0);
