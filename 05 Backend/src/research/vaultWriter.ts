/**
 * Writes research results directly into manifesto vault folders
 * 01 Hyperfixations, 02 Atomic Concepts, 04 Atlas & Meta/Logs
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join, basename } from "path";
import matter from "gray-matter";
import { autoTag, mergeTags } from "../vault/lib/tagging.js";
import { enrichWithVaultLinks } from "../vault/lib/autoLinker.js";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "research";
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function genId(): string {
  return new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14) + "-" + Math.random().toString(36).slice(2, 6);
}

export interface VaultAsset {
  assetId: string;
  sourceUrl: string;
  title: string;
  snippet: string;
  domain: string;
  score: number;
  relevanceScore: number;
}

export function writeHyperfixation(
  vaultRoot: string,
  idea: string,
  assets: VaultAsset[],
  insights: any,
  oneShotQueries: string[]
): string {
  const slug = slugify(idea);
  const fileName = `${slug}.md`;
  const relPath = join("01 Hyperfixations", fileName);
  const fullPath = join(vaultRoot, relPath);

  if (existsSync(fullPath)) {
    // Don't overwrite — append update and merge auto-tags
    const existingRaw = readFileSync(fullPath, "utf-8");
    const parsed = matter(existingRaw);
    const existingTags: string[] = parsed.data.tags || [];
    const newTags = autoTag({ idea, assets: assets as any, insights, baseTags: existingTags, extraTags: ["update"] });
    const mergedTags = mergeTags(existingTags, newTags);
    // Update frontmatter updated + tags, preserve other fields
    parsed.data.tags = mergedTags;
    parsed.data.updated = todayISO();
    if (parsed.data.resume_point) {
      parsed.data.resume_point.last_explored = todayISO();
      parsed.data.resume_point.current_thought = insights.claims?.[0]?.claim?.slice(0, 100) || parsed.data.resume_point.current_thought;
    }
    const update = `\n\n## Research Update — ${todayISO()}\n\nSPECTRUM for "${idea}" → ${assets.length} assets (rare:${insights.byCategory?.rare || 0} media:${insights.byCategory?.media || 0} tools:${insights.byCategory?.tools || 0}) | Tags: ${newTags.map((t) => `#${t}`).join(" ")}\n\n${insights.claims?.slice(0, 3).map((c: any) => `- ${c.claim} — [${c.assetId}](${c.source})`).join("\n") || ""}\n`;
    const newContent = matter.stringify(parsed.content.trimEnd() + update, parsed.data);
    writeFileSync(fullPath, newContent, "utf-8");
    return relPath;
  }

  const generatedTags = autoTag({ idea, assets: assets as any, insights, extraTags: ["spectrum", "research"] });

  const frontmatter: any = {
    id: genId(),
    title: idea,
    type: "hyperfixation",
    status: "active",
    created: todayISO(),
    updated: todayISO(),
    tags: generatedTags,
    aliases: [],
    resume_point: {
      last_explored: todayISO(),
      current_thought: insights.claims?.[0]?.claim?.slice(0, 100) || "",
      next_step: insights.next_queries?.[0] || `Explore ${idea} — review top assets`,
    },
    content_potential: {
      suggested_format: assets.length > 5 ? "essay" : "thread",
      confidence_score: Math.min(0.85, 0.5 + assets.length * 0.05),
    },
  };

  const byCat = insights.byCategory || {};
  // Auto-link vault topics in the body (from prospect's vault auto-linker)
  const vaultEnriched = (() => {
    try {
      const rawForLinking = assets.map((a) => a.title + " " + a.snippet).join(" ").slice(0, 5000);
      const { relatedTopics } = enrichWithVaultLinks(vaultRoot, rawForLinking + " " + idea);
      if (relatedTopics.length > 0) {
        // Add related topics as extra tags
        const linkTags = relatedTopics.slice(0, 5).map((t) => `vault/${t.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`);
        generatedTags.push(...linkTags);
      }
      return relatedTopics;
    } catch { return []; }
  })();

  const mediaAssets = (assets as any[]).filter((a) => a.category === "media").slice(0, 3);
  const toolAssets = (assets as any[]).filter((a) => a.category === "tool").slice(0, 3);
  const rareAssets = (assets as any[]).filter((a) => a.category === "rare" || a.category === "archive").slice(0, 3);
  const transcriptAssets = (assets as any[]).filter((a) => a.category === "transcript").slice(0, 3);
  const storyAssets = (assets as any[]).filter((a) => a.category === "story").slice(0, 3);

  const topAssetsMd = assets
    .slice(0, 5)
    .map((a: any, i) => `${i + 1}. [${a.title}](${a.sourceUrl}) — score ${a.score.toFixed(2)} — ${a.domain} ${a.category ? `(${a.category})` : ""}\n   - ${a.snippet.slice(0, 120)}`)
    .join("\n");

  const mediaMd = mediaAssets.length
    ? mediaAssets.map((a: any) => `- [${a.title}](${a.sourceUrl}) — ${a.type || "image"} — ${a.domain}`).join("\n")
    : "_No media harvested — try visual variant_";
  const toolMd = toolAssets.length
    ? toolAssets.map((a: any) => `- [${a.title}](${a.sourceUrl}) — ${a.domain} — score ${a.score.toFixed(2)}`).join("\n")
    : "_No tools found — try adding 'tools' to idea_";
  const rareMd = rareAssets.length
    ? rareAssets.map((a: any) => `- [${a.title}](${a.sourceUrl}) ${a.archiveUrl ? `→ [Archive](${a.archiveUrl})` : ""} — ${a.domain}`).join("\n")
    : "_No rare/archival hits_";
  const transcriptMd = transcriptAssets.length
    ? transcriptAssets.map((a: any) => `- [${a.title}](${a.sourceUrl}) — ${a.wordCount || "?"} words, coverage ${a.coverage?.toFixed(2) || "?"} — [[${a.sourceUrl}]]`).join("\n")
    : "_No transcripts harvested — add YouTube playlists to Personality Disorders file_";
  const storyMd = storyAssets.length
    ? storyAssets.map((a: any) => `- [${a.title}](${a.sourceUrl}) — ${a.wordCount || "?"} words, authenticity ${a.authenticity?.toFixed(2) || "?"} — ${a.domain}`).join("\n")
    : "_No board stories harvested_";

  const inlineTags = generatedTags.map((t) => `#${t}`).join(" ");
  const body = `# ${idea}

> SPECTRUM research for "${idea}" — ${oneShotQueries.length} queries, ${assets.length} assets (rare:${byCat.rare || 0} media:${byCat.media || 0} tools:${byCat.tools || 0} pages:${byCat.pages || 0})

${inlineTags}

## Research Question

> What is "${idea}" and why does it matter for The Narcissist's Manifesto? What patterns, contradictions, and actionable frames emerge?

## Raw Capture — High-Value Spectrum

> Auto-collected ${todayISO()} via manifesto research engine — SPECTRUM (8 queries: ${oneShotQueries.join(" | ")})

### Core Pages

${assets
  .filter((a: any) => !a.category || a.category === "page" || a.category === "rare")
  .slice(0, 5)
  .map((a: any) => `#### ${a.title}\n- **URL:** ${a.sourceUrl} ${a.archiveUrl ? `→ Archive: ${a.archiveUrl}` : ""}\n- **Score:** ${a.score.toFixed(2)} / relevance ${a.relevanceScore.toFixed(2)} ${a.category ? `(${a.category})` : ""}\n- **Preview:** ${a.snippet.slice(0, 300)}\n- **Evidence:** ${a.sourceUrl}\n`)
  .join("\n")}

### Media Assets (images/audio/video)

${mediaMd}

### Tools & Programs

${toolMd}

### Rare / Forgotten / Archival

${rareMd}

### YouTube Transcripts

${transcriptMd}

### Message Board Stories

${storyMd}

## Synthesis — Spectrum Insights

### Claims (from insights.json)

${insights.claims?.map((c: any) => `- ${c.claim} — *${c.source}* ${c.category ? `(${c.category})` : ""}`).join("\n") || "_No claims extracted_"}

### Patterns

Domains: ${insights.patterns?.join(", ") || "—"} | By category: rare ${byCat.rare || 0}, media ${byCat.media || 0}, tools ${byCat.tools || 0}

### Gaps

${insights.gaps?.map((g: string) => `- ${g}`).join("\n") || "- none"}

### Next Queries

${insights.next_queries?.map((q: string) => `- ${q}`).join("\n") || ""}

## Connections

- Related: ${assets.slice(0, 3).map((a) => `[[${a.domain}]]`).join(", ")}

## Top Assets (SPECTRUM ranked)

${topAssetsMd}

## Resume Point

| Field | Value |
|---|---|
| last_explored | ${todayISO()} |
| current_thought | ${frontmatter.resume_point.current_thought.slice(0, 80)} |
| next_step | ${frontmatter.resume_point.next_step} |

## Agent Insights

> Generated by manifesto research engine ${todayISO()} — review and refine in your own voice.

---

${inlineTags}
`;

  const fileContent = matter.stringify(body, frontmatter);
  mkdirSync(join(vaultRoot, "01 Hyperfixations"), { recursive: true });
  writeFileSync(fullPath, fileContent, "utf-8");
  return relPath;
}

export function writeResearchLog(
  vaultRoot: string,
  researchId: string,
  idea: string,
  pkg: any,
  insights: any,
  oneShotQueries: string[]
): string {
  const logDir = join(vaultRoot, "04 Atlas & Meta/Logs/research", `${slugify(idea)}_${researchId}`);
  mkdirSync(logDir, { recursive: true });
  const logTags = autoTag({ idea, assets: pkg.all_assets || [], insights, extraTags: ["log", "research-log"] });
  const taggedPkg = { ...pkg, one_shot_queries: oneShotQueries, auto_tags: logTags };
  const taggedInsights = { ...insights, auto_tags: logTags };
  writeFileSync(join(logDir, "package.json"), JSON.stringify(taggedPkg, null, 2));
  writeFileSync(join(logDir, "insights.json"), JSON.stringify(taggedInsights, null, 2));
  const inline = logTags.map((t) => `#${t}`).join(" ");
  const report = `---
id: "${researchId}"
title: "Research Log — ${idea}"
type: "moc"
status: "active"
created: "${todayISO()}"
updated: "${todayISO()}"
tags: [${logTags.map((t) => `"${t}"`).join(", ")}]
---

# Research Log — ${idea}

${inline}

**ID:** ${researchId} | **Date:** ${todayISO()} | **Tags:** ${inline}

**Queries:** ${oneShotQueries.join(" | ")}

**Summary:** ${insights.summary}

## Claims
${insights.claims?.map((c: any) => `- ${c.claim} — ${c.source}`).join("\n")}

## Top Assets
${(pkg.all_assets || []).slice(0, 5).map((a: any) => `- ${a.title} — ${a.sourceUrl} (${a.score?.toFixed(2)}) [${a.category || "page"}]`).join("\n")}

## Assets by Category
- Rare: ${insights.byCategory?.rare || 0} | Media: ${insights.byCategory?.media || 0} | Tools: ${insights.byCategory?.tools || 0}

---

${inline}
`;
  writeFileSync(join(logDir, "report.md"), report);
  return logDir;
}
