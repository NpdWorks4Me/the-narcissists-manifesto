/**
 * Engine B — Substance & Pattern Synthesis
 * - Semantic link discovery
 * - Atomic concept extraction
 * - Format matching → content spec generation
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync, appendFileSync } from "fs";
import { join, basename } from "path";
import matter from "gray-matter";
import { parseFrontmatter, todayISO, generateId } from "./lib/frontmatter.js";
import { analyzeText, termFrequency, cosineSimilarityTF, jaccardTags } from "./lib/nlp.js";
import { extractWikiLinks } from "./lib/links.js";
import { CONFIG } from "./lib/config.js";
import { inferSignals, recommendFormat } from "./lib/format.js";
import { appendTrackingRow } from "./lib/tracking.js";
import { autoTag } from "./lib/tagging.js";

const _cwd = process.cwd();
const vaultRoot = (() => { const base = _cwd.split("/").pop() || ""; const isBackend = base === "backend" || base === "05 Backend"; return isBackend ? _cwd.slice(0, -base.length).replace(/\/$/, "") || "." : _cwd; })();
const args = process.argv.slice(2);
const dryRun = !args.includes("--apply");

function collectMd(dirRel: string) {
  const full = join(vaultRoot, dirRel);
  if (!existsSync(full)) return [];
  const out: { path: string; rel: string; content: string; stem: string; body: string; data: any }[] = [];
  function walk(dir: string, relBase: string) {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith(".")) continue;
      const p = join(dir, entry);
      const rel = join(relBase, entry);
      const stat = statSync(p);
      if (stat.isDirectory()) walk(p, rel);
      else if (entry.endsWith(".md")) {
        const raw = readFileSync(p, "utf-8");
        const parsed = parseFrontmatter(raw, rel);
        const body = parsed.content;
        out.push({ path: p, rel, content: raw, stem: basename(entry, ".md"), body, data: parsed.data });
      }
    }
  }
  walk(full, dirRel);
  return out;
}

function insightMarker(sourceStem: string): string {
  return `<!-- AGENT_INSIGHT:${sourceStem} -->`;
}

async function semanticDiscovery() {
  console.log(`\n🧠 Semantic Link Discovery (dryRun=${dryRun})`);
  const hyper = collectMd(CONFIG.FOLDERS.hyperfixations);
  const atomic = collectMd(CONFIG.FOLDERS.atomic);
  const pool = [...hyper, ...atomic].filter((n) => n.data.type === "hyperfixation" || n.data.type === "atomic-concept");
  if (pool.length < 2) {
    console.log("  Need ≥2 notes to compare — skipping.");
    return 0;
  }

  let injected = 0;
  const logPath = join(vaultRoot, CONFIG.FOLDERS.logs, "agent-insights.log");

  // Precompute TF — strip agent insights to avoid pollution
  const cleanBody = (b: string) => b.replace(/<!-- AGENT_INSIGHT:.*?-->[\s\S]*?Recommended link integration\.\n?/g, "").replace(/> 🤖 \*\*AGENT INSIGHT:\*\*.*\n?/g, "");
  const tfs = new Map<string, Map<string, number>>();
  const tagsMap = new Map<string, string[]>();
  for (const n of pool) {
    tfs.set(n.stem, termFrequency(cleanBody(n.body)));
    tagsMap.set(n.stem, n.data.tags || []);
  }

  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const a = pool[i], b = pool[j];
      const tfA = tfs.get(a.stem)!, tfB = tfs.get(b.stem)!;
      const cosine = cosineSimilarityTF(tfA, tfB);
      const jaccard = jaccardTags(tagsMap.get(a.stem) || [], tagsMap.get(b.stem) || []);
      // Combined score: 0.7*cosine + 0.3*jaccard + boost if share outgoing links
      const sharedLinks = extractWikiLinks(a.content).filter((l) => extractWikiLinks(b.content).includes(l)).length;
      const linkBoost = sharedLinks > 0 ? 0.1 : 0;
      const score = 0.7 * cosine + 0.3 * jaccard + linkBoost;

      const threshold = CONFIG.OPENAI_API_KEY ? CONFIG.SIM_THRESHOLD_LLM : CONFIG.SIM_THRESHOLD_KEYWORD;
      if (score >= threshold) {
        // Check if already annotated
        const markerA = insightMarker(b.stem);
        const markerB = insightMarker(a.stem);
        const alreadyA = a.content.includes(markerA);
        const alreadyB = b.content.includes(markerB);

        const sharedTheme = analyzeText(cleanBody(a.body) + " " + cleanBody(b.body)).topPhrases[0] || "shared thematic overlap";
        const insightA = `\n\n${markerA}\n> 🤖 **AGENT INSIGHT:** Highly linked to [[${b.stem}]] (Shared Theme: ${sharedTheme}, Score: ${score.toFixed(2)}). Recommended link integration.\n`;
        const insightB = `\n\n${markerB}\n> 🤖 **AGENT INSIGHT:** Highly linked to [[${a.stem}]] (Shared Theme: ${sharedTheme}, Score: ${score.toFixed(2)}). Recommended link integration.\n`;

        console.log(`  • ${a.stem} ↔ ${b.stem} score=${score.toFixed(2)} (cos=${cosine.toFixed(2)}, jac=${jaccard.toFixed(2)}) theme=${sharedTheme}`);

        if (!dryRun) {
          if (!alreadyA) {
            // Auto-tag the insight with shared theme
            try {
              const parsedA = matter(readFileSync(a.path, "utf-8"));
              const insightTags = autoTag({ idea: sharedTheme, baseTags: parsedA.data.tags || [], extraTags: ["insight", "semantic-link", b.stem] });
              const mergedA = [...new Set([...(parsedA.data.tags || []), ...insightTags])].slice(0, 15);
              parsedA.data.tags = mergedA;
              parsedA.data.updated = todayISO();
              const newContentA = matter.stringify(parsedA.content.trimEnd() + insightA + `\n\n${insightTags.map((t) => `#${t}`).join(" ")}\n`, parsedA.data);
              writeFileSync(a.path, newContentA, "utf-8");
              a.content = newContentA;
            } catch {
              writeFileSync(a.path, a.content.trimEnd() + insightA, "utf-8");
              a.content += insightA;
            }
            injected++;
          }
          if (!alreadyB) {
            try {
              const parsedB = matter(readFileSync(b.path, "utf-8"));
              const insightTagsB = autoTag({ idea: sharedTheme, baseTags: parsedB.data.tags || [], extraTags: ["insight", "semantic-link", a.stem] });
              const mergedB = [...new Set([...(parsedB.data.tags || []), ...insightTagsB])].slice(0, 15);
              parsedB.data.tags = mergedB;
              parsedB.data.updated = todayISO();
              const newContentB = matter.stringify(parsedB.content.trimEnd() + insightB + `\n\n${insightTagsB.map((t) => `#${t}`).join(" ")}\n`, parsedB.data);
              writeFileSync(b.path, newContentB, "utf-8");
              b.content = newContentB;
            } catch {
              writeFileSync(b.path, b.content.trimEnd() + insightB, "utf-8");
              b.content += insightB;
            }
            injected++;
          }
          appendFileSync(logPath, `[${new Date().toISOString()}] insight ${a.stem} ↔ ${b.stem} score=${score.toFixed(2)} theme=${sharedTheme}\n`);
        } else {
          console.log(`    (dry-run) would inject insights`);
        }
      }
    }
  }
  console.log(`  Injected ${injected} insights.`);
  return injected;
}

async function atomicExtraction() {
  console.log("\n⚛️  Atomic Concept Extraction");
  const hyper = collectMd(CONFIG.FOLDERS.hyperfixations).filter((n) => n.data.type === "hyperfixation");
  // Strip agent insight blocks before analysis to avoid spurious concepts
  const cleanBody = (b: string) => b.replace(/<!-- AGENT_INSIGHT:.*?-->[\s\S]*?Recommended link integration\.\n?/g, "").replace(/> 🤖 \*\*AGENT INSIGHT:\*\*.*\n?/g, "");
  let created = 0;

  // Group by top phrase
  const phraseGroups = new Map<string, typeof hyper>();
  for (const h of hyper) {
    const analysis = analyzeText(cleanBody(h.body));
    let phrase = analysis.topPhrases[0];
    if (!phrase) continue;
    // Filter generic/agent artifacts
    if (/agent insight|related atomic/.test(phrase.toLowerCase())) continue;
    if (phrase.length < 4) continue;
    // Only consider dense notes
    const dense = analysis.wordCount > 600 || (analysis.topPhrases.length > 0 && (cleanBody(h.body).match(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")) || []).length >= 3);
    if (!dense && hyper.length < 3) continue;
    if (!phraseGroups.has(phrase)) phraseGroups.set(phrase, []);
    phraseGroups.get(phrase)!.push(h);
  }

  for (const [phrase, group] of phraseGroups) {
    if (group.length >= CONFIG.CLUSTER_MIN_LINKS || (group.length >= 1 && group[0].body.split(/\s+/).length > 800)) {
      const slug = phrase.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
      const title = phrase.replace(/\b\w/g, (c) => c.toUpperCase());
      const targetRel = join(CONFIG.FOLDERS.atomic, `${title}.md`);
      const targetFull = join(vaultRoot, targetRel);
      if (existsSync(targetFull)) {
        console.log(`  • Atomic "${title}" already exists — skipping`);
        continue;
      }
      const sourceLinks = group.map((g) => `[[${g.stem}]]`).join(", ");
      const atomicTags = autoTag({ idea: title, baseTags: group[0].data.tags || [], extraTags: ["atomic", "engine-b", "synthesized", phrase] });
      const conceptContent = `---
id: "${generateId()}"
title: "${title}"
type: "atomic-concept"
status: "synthesized"
created: "${todayISO()}"
updated: "${todayISO()}"
tags: [${atomicTags.map((t) => `"${t}"`).join(", ")}]
aliases: []
resume_point:
  last_explored: ""
  current_thought: ""
  next_step: ""
content_potential:
  suggested_format: "none"
  confidence_score: 0.0
---

# ${title}

> One idea per note. Evergreen, reusable building block.

## Definition

> Extracted from ${group.length} hyperfixation(s): ${sourceLinks}. Refine in your own voice.

${group[0].body.slice(0, 400).replace(/\n/g, " ").trim()}...

## Nuance

> Boundaries and what this is *not*.

## Connections

- Source hyperfixations: ${sourceLinks}
- Related atomic concepts: [[]]

## Examples

- Example: ${phrase} in context of ${group[0].stem}

## Agent Provenance

> Auto-generated by Engine B on ${todayISO()} from cluster size ${group.length}. Review and refine.

---

${atomicTags.map((t) => `#${t}`).join(" ")}
`;

      console.log(`  • Drafting atomic concept "${title}" from ${group.length} sources: ${group.map((g) => g.stem).join(", ")}`);
      if (!dryRun) {
        writeFileSync(targetFull, conceptContent, "utf-8");
        // Also update source notes to link to atomic + auto-tag
        for (const src of group) {
          const linkLine = `\n> Related atomic: [[${title}]]\n`;
          if (!src.content.includes(`[[${title}]]`)) {
            try {
              const parsedSrc = matter(readFileSync(src.path, "utf-8"));
              const srcTags = autoTag({ idea: title, baseTags: parsedSrc.data.tags || [], extraTags: ["atomic-link", slugify(title)] });
              const mergedSrcTags = [...new Set([...(parsedSrc.data.tags || []), ...srcTags])].slice(0, 15);
              parsedSrc.data.tags = mergedSrcTags;
              parsedSrc.data.updated = todayISO();
              const newSrcContent = matter.stringify(parsedSrc.content.trimEnd() + linkLine + `\n\n${srcTags.map((t) => `#${t}`).join(" ")}\n`, parsedSrc.data);
              writeFileSync(src.path, newSrcContent, "utf-8");
            } catch {
              writeFileSync(src.path, src.content.trimEnd() + linkLine, "utf-8");
            }
          }
        }
        created++;
      } else {
        console.log(`    (dry-run) would create ${targetRel}`);
      }
    }
  }
  console.log(`  Created ${created} atomic concepts.`);
  return created;
}

async function formatMatching() {
  console.log("\n🎬 Format Matching & Content Spec Generation");
  const hyper = collectMd(CONFIG.FOLDERS.hyperfixations);
  const atomic = collectMd(CONFIG.FOLDERS.atomic);
  const pool = [...hyper, ...atomic];
  let specs = 0;

  for (const note of pool) {
    const tags: string[] = note.data.tags || [];
    const links = extractWikiLinks(note.content);
    const signals = inferSignals(note.body, tags, links);
    const rec = recommendFormat(signals);

    // Only act if confidence > threshold and currently low
    const currentConf = note.data.content_potential?.confidence_score || 0;
    if (rec.confidence_score > CONFIG.CONFIDENCE_THRESHOLD && rec.confidence_score > currentConf) {
      console.log(`  • ${note.stem}: ${rec.suggested_format} conf=${rec.confidence_score.toFixed(2)} — ${rec.reason}`);
      // Update frontmatter with auto-tags for format
      const formatTags = autoTag({ idea: note.data.title || note.stem, baseTags: tags, extraTags: [rec.suggested_format, "engine-b", "format-match"] });
      const mergedTags = [...new Set([...tags, ...formatTags])].slice(0, 12);
      const newData = { ...note.data, tags: mergedTags, content_potential: { suggested_format: rec.suggested_format, confidence_score: rec.confidence_score }, updated: todayISO() } as any;
      const body = note.body; // preserve content without frontmatter already parsed; need to reconstruct
      // Use gray-matter to re-stringify: read raw, get content
      const raw = readFileSync(note.path, "utf-8");
      const parsed = matter(raw);
      // Append inline tags to body if not present
      let newContent = parsed.content;
      const inlineFormatTags = mergedTags.map((t) => `#${t}`).join(" ");
      if (!newContent.includes(inlineFormatTags.slice(0, 20))) {
        newContent = newContent.trimEnd() + `\n\n---\n\n${inlineFormatTags}\n`;
      }
      const newRaw = matter.stringify(newContent, newData);

      if (!dryRun) {
        writeFileSync(note.path, newRaw, "utf-8");
        // Generate spec in 03 Content Lab
        const specTitle = `SPEC — ${note.data.title || note.stem}`;
        const specRel = join(CONFIG.FOLDERS.contentLab, `${specTitle}.md`);
        const specFull = join(vaultRoot, specRel);
        if (!existsSync(specFull)) {
          const specTags = autoTag({ idea: specTitle, baseTags: tags, extraTags: [rec.suggested_format, "spec", "engine-b", note.data.title || note.stem] });
          const specContent = `---
id: "${generateId()}"
title: "${specTitle}"
type: "content-project"
status: "drafting"
created: "${todayISO()}"
updated: "${todayISO()}"
tags: [${specTags.map((t) => `"${t}"`).join(", ")}]
aliases: []
resume_point:
  last_explored: ""
  current_thought: ""
  next_step: "Draft hook and thesis"
content_potential:
  suggested_format: "${rec.suggested_format}"
  confidence_score: ${rec.confidence_score}
---

# ${specTitle}

> Auto-generated from [[${note.stem}]] — confidence ${rec.confidence_score.toFixed(2)} (${rec.reason}). Alternatives: ${rec.alternatives.join(", ")}

## Hook

> Open with tension about ${note.data.title || note.stem}

## Thesis

> Single claim this piece will prove.

## Outline

1. **Section 1 — Context**
   - [ ] Synthesize ${note.stem} core idea
2. **Section 2 — Framework**
   - [ ] Actionable takeaways
3. **Section 3 — CTA**
   - [ ] Next step for reader

## Source Cluster

- Hyperfixations: [[${note.stem}]]
- Atomic concepts: [[]]

## Format

- Suggested: ${rec.suggested_format}
- Confidence: ${rec.confidence_score.toFixed(2)}
- Reason: ${rec.reason}

## Next Steps

- [ ] Draft hook and thesis 📅 ${todayISO()}
- [ ] Open outline and write section 1

---

${specTags.map((t) => `#${t}`).join(" ")}
`;
          writeFileSync(specFull, specContent, "utf-8");
          console.log(`    → spec created ${specRel}`);
          specs++;
        }
      } else {
        console.log(`    (dry-run) would update frontmatter and create SPEC — ${note.stem}`);
      }
    } else if (rec.suggested_format !== "none") {
      console.log(`  • ${note.stem}: suggest ${rec.suggested_format} conf=${rec.confidence_score.toFixed(2)} (below threshold or not improved over ${currentConf.toFixed(2)})`);
    }
  }
  console.log(`  Generated ${specs} specs.`);
  return specs;
}

async function main() {
  console.log(`🔮 Engine B — Substance Synthesis ${dryRun ? "(dry-run)" : "(apply)"}`);
  const injected = await semanticDiscovery();
  const atomics = await atomicExtraction();
  const specs = await formatMatching();

  try {
    appendTrackingRow(vaultRoot, {
      date: todayISO(),
      note_id: "engine-b",
      title: "Engine B synthesis",
      type: "system",
      status: "active",
      wip_count: 0,
      orphan_count: 0,
      broken_links: 0,
      confidence: specs > 0 ? 0.9 : 0.2,
      event: `synthesis insights=${injected} atomics=${atomics} specs=${specs}`,
    });
  } catch {}

  console.log("\n✅ Engine B complete." + (dryRun ? " (dry-run — use --apply to mutate)" : ""));
}

main().catch((e) => {
  console.error("Engine B failed:", e);
  process.exit(1);
});
