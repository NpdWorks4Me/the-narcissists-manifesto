/**
 * Weekly Knowledge Graph Intelligence report generator
 * Overwrites 04 Atlas & Meta/Dashboards/📈 Knowledge Graph Intelligence.md body sections
 * but preserves frontmatter.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "fs";
import { join, basename } from "path";
import matter from "gray-matter";
import { parseFrontmatter, todayISO } from "./lib/frontmatter.js";
import { buildGraph } from "./lib/links.js";
import { CONFIG } from "./lib/config.js";

const _cwd = process.cwd();
const vaultRoot = (() => { const base = _cwd.split("/").pop() || ""; const isBackend = base === "backend" || base === "05 Backend"; return isBackend ? _cwd.slice(0, -base.length).replace(/\/$/, "") || "." : _cwd; })();
const reportPath = join(vaultRoot, CONFIG.FOLDERS.dashboards, "📈 Knowledge Graph Intelligence.md");

function collectNotes(dirRel: string) {
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
      else if (entry.endsWith(".md")) out.push({ path: p, rel, content: readFileSync(p, "utf-8"), stem: basename(entry, ".md") });
    }
  }
  walk(full, dirRel);
  return out;
}

const hyper = collectNotes(CONFIG.FOLDERS.hyperfixations);
const atomic = collectNotes(CONFIG.FOLDERS.atomic);
const content = collectNotes(CONFIG.FOLDERS.contentLab);
const pool = [...hyper, ...atomic];

const graph = buildGraph(pool.map((n) => ({ path: n.rel, content: n.content, stem: n.stem })));

// Emerging clusters: simple connected components on graph edges (undirected)
function connectedComponents(): string[][] {
  const visited = new Set<string>();
  const comps: string[][] = [];
  for (const [stem] of graph) {
    if (visited.has(stem)) continue;
    const stack = [stem];
    const comp: string[] = [];
    while (stack.length) {
      const cur = stack.pop()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      comp.push(cur);
      const node = graph.get(cur);
      if (!node) continue;
      for (const nb of [...node.outgoing, ...node.incoming]) {
        if (!visited.has(nb) && graph.has(nb)) stack.push(nb);
      }
    }
    if (comp.length >= 2) comps.push(comp);
  }
  return comps.sort((a, b) => b.length - a.length);
}

const clusters = connectedComponents();
const readyIdeas = [...hyper, ...atomic, ...content].filter((n) => {
  const { data } = parseFrontmatter(n.content, n.rel);
  return (data.content_potential?.confidence_score || 0) > CONFIG.CONFIDENCE_THRESHOLD;
});
const gaps = hyper.filter((n) => {
  const node = graph.get(n.stem);
  const links = node ? node.outgoing.length + node.incoming.length : 0;
  return links < 2;
}).slice(0, 10);

const clusterLines = clusters.length === 0 ? "_No clusters yet. Create 3+ linked notes sharing a theme._" : clusters.slice(0, 5).map((c, i) => `${i + 1}. **Cluster ${i + 1} (${c.length} notes):** ${c.map((s) => `[[${s}]]`).join(" · ")}`).join("\n");
const ideasLines = readyIdeas.length === 0 ? "_No high-confidence ideas yet (need confidence >0.75). Keep hyperfixating._" : readyIdeas.map((n) => `- [[${n.stem}]] — ${(parseFrontmatter(n.content, n.rel).data.content_potential?.suggested_format || "unknown")} (conf ${(parseFrontmatter(n.content, n.rel).data.content_potential?.confidence_score || 0).toFixed(2)})`).join("\n");
const gapsLines = gaps.length === 0 ? "_No gaps — graph is well connected._" : gaps.map((n) => `- [[${n.stem}]] — ${n.rel} (low links, updated ${(parseFrontmatter(n.content, n.rel).data.updated)})`).join("\n");

const today = todayISO();
const nextSunday = new Date();
nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()) % 7);

let existingFrontmatter: any = {
  id: "knowledge-graph-intelligence",
  title: "📈 Knowledge Graph Intelligence",
  type: "moc",
  status: "active",
  created: "2026-08-31",
  updated: today,
  tags: ["dashboard", "intelligence", "weekly"],
  aliases: ["KGI"],
  resume_point: { last_explored: today, current_thought: "report refreshed", next_step: "Run vault:report next Sunday" },
  content_potential: { suggested_format: "none", confidence_score: 0 },
};

if (existsSync(reportPath)) {
  try {
    const raw = readFileSync(reportPath, "utf-8");
    const parsed = matter(raw);
    existingFrontmatter = { ...existingFrontmatter, ...parsed.data, updated: today };
  } catch {}
}

const newBody = `# 📈 Knowledge Graph Intelligence

> *Weekly synthesis by Engine B — emerging clusters, ready-to-build ideas, knowledge gaps. Generated ${today} (next: ${nextSunday.toISOString().slice(0, 10)}). Run \`npm run vault:report\` manually anytime.*

**Last run:** \`${today}\`
**Clusters found:** ${clusters.length} | **Ready ideas:** ${readyIdeas.length} | **Gaps:** ${gaps.length}

---

## 🧠 Emerging Conceptual Clusters

${clusterLines}

\`\`\`dataview
TABLE length(file.outlinks) as Outgoing, length(file.inlinks) as Incoming, tags as Tags
FROM "01 Hyperfixations" OR "02 Atomic Concepts"
WHERE length(file.inlinks) > 0 OR length(file.outlinks) > 0
SORT length(file.inlinks) DESC
LIMIT 15
\`\`\`

---

## 💡 Ready-to-Build Content Ideas

${ideasLines}

\`\`\`dataview
TABLE content_potential.suggested_format as Format, content_potential.confidence_score as Confidence
FROM "01 Hyperfixations" OR "02 Atomic Concepts" OR "03 Content Lab"
WHERE content_potential.confidence_score > 0.75
SORT content_potential.confidence_score DESC
\`\`\`

---

## 🕳️ Knowledge Gaps

${gapsLines}

\`\`\`dataview
TABLE length(file.outlinks) as Links, updated as Updated, tags as Tags
FROM "01 Hyperfixations"
WHERE status = "active" AND length(file.outlinks) < 2
SORT updated ASC
LIMIT 10
\`\`\`

---

## 📊 Tracker — Weekly Velocity

\`\`\`tracker
searchType: frontmatter
searchTarget: updated
folder: 01 Hyperfixations
startDate: ${new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().slice(0, 10)}
endDate: ${nextSunday.toISOString().slice(0, 10)}
bar:
  title: Weekly Note Creation
  yAxisLabel: Notes
\`\`\`

---

## 🤖 Recent Agent Insights

\`\`\`dataview
LIST
FROM "01 Hyperfixations" OR "02 Atomic Concepts"
WHERE contains(file.text, "AGENT INSIGHT")
SORT updated DESC
LIMIT 10
\`\`\`

---

*Method: cosine (TF-IDF+Jaccard) threshold ${CONFIG.SIM_THRESHOLD_KEYWORD}, LLM ${CONFIG.SIM_THRESHOLD_LLM} if key present. Clusters = connected components. Logs: \`04 Atlas & Meta/Logs/\`.*
`;

const newRaw = matter.stringify(newBody, existingFrontmatter);
writeFileSync(reportPath, newRaw, "utf-8");
console.log(`✅ Report written to ${reportPath}`);
console.log(`  Clusters: ${clusters.length}, Ready ideas: ${readyIdeas.length}, Gaps: ${gaps.length}`);
