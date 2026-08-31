/**
 * vault:check — validates frontmatter, links, WIP, plugin presence
 */
import { readdirSync, readFileSync, existsSync, statSync } from "fs";
import { join, basename } from "path";
import { parseFrontmatter } from "./lib/frontmatter.js";
import { buildGraph, findOrphans, findBrokenLinks } from "./lib/links.js";
import { CONFIG } from "./lib/config.js";

const _cwd = process.cwd();
const vaultRoot = (() => { const base = _cwd.split("/").pop() || ""; const isBackend = base === "backend" || base === "05 Backend"; return isBackend ? _cwd.slice(0, -base.length).replace(/\/$/, "") || "." : _cwd; })();

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

// Frontmatter validation — skip templater templates (contain <% %> placeholders) and logs (research output, not vault notes)
for (const n of allNotes) {
  if (n.stem === ".gitkeep") continue;
  if (n.rel.includes("04 Atlas & Meta/Templates/")) continue;
  if (n.rel.includes("04 Atlas & Meta/Logs/")) continue;
  if (n.content.includes("<%")) continue; // templater placeholder
  const errs = parseFrontmatter(n.content, n.rel).errors;
  if (errs.length > 0) errors.push(...errs);
}

// Link hygiene — exclude Logs (research output) and templates from graph
const filteredForGraph = allNotes.filter((n) => !n.rel.includes("04 Atlas & Meta/Logs/") && !n.rel.includes("04 Atlas & Meta/Templates/"));
const graphNotes = filteredForGraph.map((n) => ({ path: n.rel, stem: n.stem, content: n.content }));
const graph = buildGraph(graphNotes);
const excludeStems = new Set(["_INBOX_README", "🏠 Command Center", "📈 Knowledge Graph Intelligence", "SETUP", "T_Hyperfixation", "T_Atomic_Concept", "T_Content_Spec", "README", "scripts-readme", "SYSTEM_STATUS_REPORT", "report"]);
const orphans = findOrphans(graph, excludeStems);
const broken = findBrokenLinks(graph);

if (orphans.length > 0) warnings.push(`Orphans: ${orphans.map((o) => o.stem).join(", ")}`);
if (broken.length > 0) warnings.push(`Broken links: ${broken.map((b) => `${b.source} → ${b.target}`).join(", ")}`);

// WIP — skip templates and logs, same as above
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

console.log("\n🔍 Vault Health Check");
console.log("=".repeat(60));
console.log(`Notes scanned: ${allNotes.length}`);
console.log(`Active WIP: ${activeCount}/${CONFIG.WIP_LIMIT}`);
console.log(`Orphans: ${orphans.length} | Broken links: ${broken.length}`);
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

process.exit(errors.length > 0 ? 1 : 0);
