/**
 * synthesize — cross-source synthesis (Phase 3 of nightly)
 * Finds unnamed patterns across hyperfixations and writes synthesis pages to 02 Atomic Concepts / 01 Hyperfixations synthesis
 * Wrapper over engine-b semantic with additional synthesis doc generation
 * Usage: npx tsx 05 Backend/src/vault/synthesize.ts [--dry-run] [--apply]
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync, appendFileSync } from "fs";
import { join, basename } from "path";
import matter from "gray-matter";
import { parseFrontmatter, todayISO, generateId } from "./lib/frontmatter.js";
import { analyzeText } from "./lib/nlp.js";
import { buildGraph } from "./lib/links.js";
import { CONFIG } from "./lib/config.js";

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
        const parsed = parseFrontmatter(raw, rel);
        out.push({ path: p, rel, raw, stem: basename(e, ".md"), data: parsed.data, content: parsed.content });
      }
    }
  }
  walk(full, dirRel);
  return out;
}

async function main() {
  console.log(`🔮 Synthesize — pattern synthesis ${dryRun ? "(dry-run)" : "(apply)"}`);
  const hyper = collect(CONFIG.FOLDERS.hyperfixations).filter((n) => n.data.type === "hyperfixation");
  const atomic = collect(CONFIG.FOLDERS.atomic);
  const pool = [...hyper, ...atomic];
  if (pool.length < 2) { console.log("  Need ≥2 notes — skipping"); return; }

  const graph = buildGraph(pool.map((n) => ({ path: n.rel, content: n.raw, stem: n.stem })));
  // Find components that are linked but lack a synthesis note
  const visited = new Set<string>();
  const components: string[][] = [];
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
      for (const nb of [...node.outgoing, ...node.incoming]) if (!visited.has(nb) && graph.has(nb)) stack.push(nb);
    }
    if (comp.length >= 3) components.push(comp);
  }

  console.log(`  Components ≥3: ${components.length}`);
  let created = 0;
  for (const comp of components.slice(0, 3)) {
    // Infer shared theme from top phrases
    const texts = comp.map((s) => pool.find((p) => p.stem === s)?.content || "").join(" ").replace(/<!-- AGENT_INSIGHT:.*?-->[\s\S]*?Recommended link integration\.\n?/g, "").replace(/> 🤖 \*\*AGENT INSIGHT:\*\*.*\n?/g, "");
    const analysis = analyzeText(texts);
    let theme = analysis.topPhrases[0] || comp[0];
    // Filter agent artifacts
    if (/agent insight/i.test(theme)) theme = analysis.topPhrases.find((p)=> !/agent insight/i.test(p)) || comp[0];
    if (!theme || theme.length < 3) theme = comp[0];
    const title = theme.replace(/\b\w/g, (c: string) => c.toUpperCase()).slice(0, 50) || `Synthesis — ${comp.slice(0,2).join(" + ")}`;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
    const targetRel = join(CONFIG.FOLDERS.atomic, `${title}.md`);
    const targetFull = join(vaultRoot, targetRel);
    if (existsSync(targetFull)) {
      console.log(`  • Synthesis "${title}" already exists — skip`);
      continue;
    }
    const sourceLinks = comp.map((s) => `[[${s}]]`).join(" · ");
    const content = `---
id: "${generateId()}"
title: "${title}"
type: "atomic-concept"
status: "synthesized"
created: "${todayISO()}"
updated: "${todayISO()}"
tags: ["synthesis", "auto/synthesize", "nightly"]
aliases: []
resume_point: { last_explored: "${todayISO()}", current_thought: "synthesized from ${comp.length} notes", next_step: "Refine definition" }
content_potential: { suggested_format: "none", confidence_score: 0.0 }
freshness: { type: timeless, as_of: "${todayISO()}", source: "vault" }
relations: [${comp.map((s) => `{type: "elaborates", target: "${s}"}`).join(", ")}]
---

# ${title}

## For future agent

> **Summary:** Synthesis of ${comp.length} linked notes sharing theme "${theme}" as of ${todayISO()}. Sources: ${sourceLinks}. This note distills the unnamed pattern Engine B detected; refine Definition in your voice.

> Unnamed pattern across ${comp.length} notes: ${sourceLinks}

## Definition

> Pattern "${theme}" emerges from ${comp.join(", ")} — synthesis as of ${todayISO()}. Elaborate in 2-3 sentences.

Synthesis detected from component [${comp.join(", ")}] with shared theme "${theme}" (top phrases: ${analysis.topPhrases.slice(0,3).join(", ")}).

## Evidence

${comp.map((s) => `- [[${s}]]`).join("\n")}

## Nuance

> Boundaries and what this synthesis is *not*.

## Connections

- Sources: ${sourceLinks}
- Typed edges: elaborates → each source

## Agent Provenance

> Auto-synthesized by Phase 3 on ${todayISO()} from component size ${comp.length}. Review and refine.
`;
    console.log(`  • Drafting synthesis "${title}" from ${comp.join(", ")}`);
    if (!dryRun) {
      writeFileSync(targetFull, content, "utf-8");
      created++;
    } else {
      console.log(`    (dry-run) would create ${targetRel}`);
    }
  }

  // Also delegate to engine-b for atomic extraction fallback
  if (created === 0) console.log("  No new synthesis needed — graph stable");
  else console.log(`  Created ${created} synthesis notes`);

  const logPath = join(vaultRoot, CONFIG.FOLDERS.logs, "agent-insights.log");
  try { if (!dryRun) appendFileSync(logPath, `[${new Date().toISOString()}] synthesize: components=${components.length} created=${created}\n`); } catch {}
}

main().catch((e) => { console.error("synthesize failed", e); process.exit(1); });
