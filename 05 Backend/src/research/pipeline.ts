/**
 * Manifesto Research Pipeline — SPECTRUM for any idea, writes directly to vault
 * Covers: pages, archive/rare, feeds, media assets, tools/programs, plus generic
 */
import { createHash } from "crypto";
import { RESEARCH_CONFIG } from "./config.js";
import { searchWithFallback as searchSpectrum } from "./search.js";
import { Fetcher } from "./fetcher.js";
import { scoreAsset, rightsClassification, relevanceFor } from "./scoring.js";
import { writeHyperfixation, writeResearchLog } from "./vaultWriter.js";
import { checkWayback } from "./adapters/archive.js";
import { discoverFeeds, fetchFeed } from "./adapters/feed.js";
import { harvestMedia } from "./adapters/media.js";
import { discoverTools } from "./adapters/toolDiscovery.js";
import { searchFreesound, freesoundToAsset } from "./adapters/freesound.js";
import { searchPexels, pexelsToAsset } from "./adapters/pexels.js";
import dotenv from "dotenv";
import { existsSync } from "fs";
import { join } from "path";
// Load .env from vault root so FREESOUND_API_TOKEN / PEXELS_API_KEY are available
try {
  const _cwd = process.cwd();
  const _vaultRoot = _cwd.endsWith("05 Backend") ? _cwd.slice(0, -"05 Backend".length).replace(/\/$/, "") || "." : _cwd;
  const _envPath = join(_vaultRoot, ".env");
  if (existsSync(_envPath)) dotenv.config({ path: _envPath });
  else dotenv.config();
} catch {}
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, extname, basename } from "path";

function getVaultRoot(): string {
  const cwd = process.cwd();
  return (() => { const base = cwd.split("/").pop() || ""; const isBackend = base === "backend" || base === "05 Backend"; return isBackend ? cwd.slice(0, -base.length).replace(/\/$/, "") || "." : cwd; })();
}

async function downloadAsset(url: string, destDir: string, assetId: string): Promise<{ localPath: string | null; contentType: string | null; bytes: number | null; needsRender: boolean }> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { headers: { "User-Agent": "manifesto-research/0.1 (+download)" }, signal: controller.signal });
    clearTimeout(t);
    const contentType = res.headers.get("content-type") || "";
    const isHtml = contentType.includes("text/html");
    const isImageExpected = /\.(jpe?g|png|gif|webp|svg)(\?|$)/i.test(url) || url.includes("image");
    // HTML-as-image guard: if we expected image but got HTML, flag for render
    if (isImageExpected && isHtml) {
      return { localPath: null, contentType, bytes: null, needsRender: true };
    }
    if (!res.ok) return { localPath: null, contentType, bytes: null, needsRender: false };
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100 || buf.length > 15_000_000) return { localPath: null, contentType, bytes: buf.length, needsRender: false };
    // Determine extension
    let ext = extname(new URL(url).pathname) || "";
    if (!ext || ext.length > 6) {
      if (contentType.includes("image/jpeg")) ext = ".jpg";
      else if (contentType.includes("image/png")) ext = ".png";
      else if (contentType.includes("image/webp")) ext = ".webp";
      else if (contentType.includes("audio")) ext = ".mp3";
      else if (contentType.includes("video")) ext = ".mp4";
      else if (contentType.includes("text/html")) ext = ".html";
      else ext = ".bin";
    }
    const safeExt = ext.split("?")[0].slice(0, 6);
    const fileName = `${assetId}_${basename(new URL(url).pathname).slice(0, 20).replace(/[^a-zA-Z0-9._-]/g, "_") || "file"}${safeExt}`;
    const destPath = join(destDir, fileName);
    // ensure dir
    mkdirSync(destDir, { recursive: true });
    writeFileSync(destPath, buf);
    return { localPath: destPath, contentType, bytes: buf.length, needsRender: false };
  } catch (e: any) {
    console.log(`[download] error ${url.slice(0,40)}: ${e?.message || e}`);
    return { localPath: null, contentType: null, bytes: null, needsRender: false };
  }
}

export function generateOneShotQueries(base: string): string[] {
  const b = base.trim().slice(0, 200) || "research";
  return RESEARCH_CONFIG.oneShotQueries(b);
}

export interface PipelineResult {
  researchId: string;
  idea: string;
  oneShotQueries: string[];
  assets: any[];
  insights: any;
  hyperfixationPath: string;
  logDir: string;
  package: any;
}

export async function runResearchOneShot(
  idea: string,
  opts: { maxPages?: number; publishToVault?: boolean } = {}
): Promise<PipelineResult> {
  const vaultRoot = getVaultRoot();
  const maxPages = opts.maxPages ?? RESEARCH_CONFIG.budgets.maxPages;
  const oneShotQueries = generateOneShotQueries(idea);
  const researchId = createHash("sha256").update(idea + Date.now().toString()).digest("hex").slice(0, 8);
  const fetcher = new Fetcher(vaultRoot);

  const allAssets: any[] = [];
  const domains = new Set<string>();
  let pagesFetched = 0;
  let archiveQueries = 0;
  const seenUrls = new Set<string>();
  const seenMedia = new Set<string>();
  const seenTools = new Set<string>();

  // For feed queue
  const queuedFeeds: string[] = [];

  for (const q of oneShotQueries) {
    if (allAssets.length >= RESEARCH_CONFIG.budgets.maxAssets) break;
    console.log(`[search] Query: "${q.slice(0,60)}"`);
    const isRareQuery = q.includes("rare") || q.includes("forgotten") || q.includes("archive");
    const isToolQuery = q.includes("tools") || q.includes("programs");
    const isMediaQuery = q.includes("media") || q.includes("images");

    const results = await searchSpectrum(q, 3);
    console.log(`[search] → ${results.length} results: ${results.map(r=>r.domain).join(", ")}`);
    for (const r of results) {
      if (pagesFetched >= maxPages) break;
      if (seenUrls.has(r.url)) continue;
      seenUrls.add(r.url);
      const fr = await fetcher.fetch(r.url);
      pagesFetched++;
      domains.add(r.domain);

      // Archive check for rare/forgotten or dead pages
      let archiveInfo: any = null;
      const isDead = fr.status !== 200 || !fr.content || fr.content.length < 200 || !!fr.error;
      if ((isDead || isRareQuery) && archiveQueries < RESEARCH_CONFIG.budgets.maxArchiveQueries) {
        archiveQueries++;
        const arch = await checkWayback(r.url);
        if (arch) {
          archiveInfo = arch;
          // Treat archive as high-value rare asset
          const archId = createHash("sha256").update(arch.archiveUrl).digest("hex").slice(0, 12);
          if (!seenUrls.has(arch.archiveUrl) && !allAssets.some((a) => a.assetId === archId)) {
            allAssets.push({
              assetId: archId,
              sourceUrl: arch.archiveUrl,
              title: `[ARCHIVE] ${r.title}`,
              snippet: `Archived snapshot ${arch.timestamp} of ${r.url}`,
              domain: "web.archive.org",
              score: 0.62,
              relevanceScore: 0.7,
              evidence: [`wayback ${arch.timestamp}`],
              contentPreview: `Archived version of ${r.url}`,
              rightsClassification: "REFERENCE_ONLY",
              rightsConfidence: 0.3,
              category: "archive",
              rarityScore: 0.8,
            });
            seenUrls.add(arch.archiveUrl);
          }
        }
      }

      if (!fr.content || fr.content.length < 200) continue;

      // Feed discovery
      if (fr.raw && fr.raw.length > 500) {
        const feeds = discoverFeeds(fr.raw, r.url);
        for (const f of feeds) if (!queuedFeeds.includes(f)) queuedFeeds.push(f);
      }

      // Media harvest — spectrum
      if (fr.raw && fr.raw.length > 300) {
        const mediaAssets = harvestMedia(fr.raw, r.url);
        for (const m of mediaAssets.slice(0, 3)) {
          if (seenMedia.has(m.url) || allAssets.length >= RESEARCH_CONFIG.budgets.maxAssets) continue;
          if (m.url.length < 10) continue;
          seenMedia.add(m.url);
          const mediaId = createHash("sha256").update(m.url).digest("hex").slice(0, 12);
          if (allAssets.some((a) => a.assetId === mediaId)) continue;
          const isRareMedia = /archival|vintage|rare|forgotten|abandoned/i.test(m.alt + m.url);
          allAssets.push({
            assetId: mediaId,
            sourceUrl: m.url,
            title: m.alt ? `[MEDIA:${m.type}] ${m.alt}` : `[MEDIA:${m.type}] ${m.url.split("/").pop()?.slice(0, 40)}`,
            snippet: `Media from ${r.domain} — ${m.alt.slice(0, 100)}`,
            domain: (() => { try { return new URL(m.url).hostname; } catch { return r.domain; } })(),
            score: isRareMedia ? 0.68 : 0.55,
            relevanceScore: isRareMedia ? 0.8 : 0.5,
            evidence: [isRareMedia ? "rare media harvest" : "media harvest", `from ${r.url}`],
            contentPreview: m.url,
            rightsClassification: "REFERENCE_ONLY",
            rightsConfidence: 0.25,
            category: "media",
            type: m.type,
          });
          if (allAssets.filter((a) => a.category === "media").length >= RESEARCH_CONFIG.budgets.maxMedia) break;
        }
      }

      // Main page asset — with rarity boost for rare queries
      const relevance = relevanceFor(q, r.title, fr.content);
      const rights = rightsClassification(null);
      const technical = fr.content.length > 1000 ? 0.6 : 0.4;
      const isRare = isRareQuery || RESEARCH_CONFIG.rarityTerms.some((t) => (r.title + fr.content).toLowerCase().includes(t));
      const category = isRare ? "rare" : isToolQuery ? "tool" : isMediaQuery ? "media" : "page";
      const score = scoreAsset(relevance, 0.55, rights.conf, technical, {
        textForRarity: r.title + " " + fr.content.slice(0, 1000),
        category,
      });
      const assetId = createHash("sha256").update(r.url).digest("hex").slice(0, 12);
      if (allAssets.some((a) => a.assetId === assetId)) continue;

      // Tool-like detection within page assets
      const isToolPage = RESEARCH_CONFIG.toolTerms.some((t) => (r.title + r.snippet + fr.content).toLowerCase().includes(t));
      const finalCategory = isToolPage && !isRare ? "tool" : category;

      allAssets.push({
        assetId,
        sourceUrl: r.url,
        title: r.title,
        snippet: r.snippet || fr.content.slice(0, 300),
        domain: r.domain,
        score,
        relevanceScore: relevance,
        evidence: [rights.reason, isRare ? "rare term boost" : "", archiveInfo ? `archive ${archiveInfo.timestamp}` : ""].filter(Boolean),
        contentPreview: fr.content.slice(0, 800),
        rightsClassification: rights.cls,
        rightsConfidence: rights.conf,
        category: finalCategory,
        archiveUrl: archiveInfo?.archiveUrl || null,
      });
    }
  }

  // Feed processing — second pass, high-value rare/forgotten often in feeds
  for (const feedUrl of queuedFeeds.slice(0, 3)) {
    if (allAssets.length >= RESEARCH_CONFIG.budgets.maxAssets) break;
    const entries = await fetchFeed(feedUrl);
    for (const e of entries.slice(0, 2)) {
      if (seenUrls.has(e.url)) continue;
      seenUrls.add(e.url);
      const feedId = createHash("sha256").update(e.url).digest("hex").slice(0, 12);
      if (allAssets.some((a) => a.assetId === feedId)) continue;
      allAssets.push({
        assetId: feedId,
        sourceUrl: e.url,
        title: `[FEED] ${e.title}`,
        snippet: e.snippet.slice(0, 300),
        domain: (() => { try { return new URL(e.url).hostname; } catch { return feedUrl; } })(),
        score: 0.58,
        relevanceScore: 0.6,
        evidence: [`from feed ${feedUrl}`],
        contentPreview: e.snippet.slice(0, 800),
        rightsClassification: "REFERENCE_ONLY",
        rightsConfidence: 0.3,
        category: "feed",
      });
    }
  }

  // Tool discovery — dedicated spectrum for tools/programs
  try {
    const tools = await discoverTools(idea, RESEARCH_CONFIG.budgets.maxTools);
    for (const t of tools) {
      if (seenTools.has(t.url) || allAssets.some((a) => a.sourceUrl === t.url)) continue;
      seenTools.add(t.url);
      const toolId = createHash("sha256").update(t.url).digest("hex").slice(0, 12);
      allAssets.push({
        assetId: toolId,
        sourceUrl: t.url,
        title: `[TOOL] ${t.name}`,
        snippet: t.description.slice(0, 300),
        domain: t.source,
        score: t.score,
        relevanceScore: 0.7,
        evidence: ["tool discovery", `score ${t.score}`],
        contentPreview: t.description.slice(0, 800),
        rightsClassification: "REFERENCE_ONLY",
        rightsConfidence: 0.3,
        category: "tool",
      });
    }
  } catch {}

  // Freesound — high-value audio for media spectrum (when FREESOUND_API_TOKEN/KEY set, per user request)
  const hasMediaQuery = oneShotQueries.some((q) => q.includes("media") || q.includes("audio"));
  const hasFreesoundKey = !!(process.env.FREESOUND_API_KEY || process.env.FREESOUND_API_TOKEN || process.env.FS_CLIENT_ID);
  if (hasMediaQuery || idea.toLowerCase().includes("audio") || idea.toLowerCase().includes("sound") || hasFreesoundKey) {
    try {
      const freesounds = await searchFreesound(idea, 3);
      for (const fs of freesounds) {
        const asset = freesoundToAsset(fs, idea);
        if (seenUrls.has(asset.sourceUrl) || allAssets.some((a) => a.sourceUrl === asset.sourceUrl)) continue;
        seenUrls.add(asset.sourceUrl);
        allAssets.push(asset);
      }
      if (freesounds.length > 0) console.log(`[freesound] +${freesounds.length} audio assets`);
      else if (hasFreesoundKey) console.log(`[freesound] 0 results for "${idea}" — try broader term`);
      else console.log(`[freesound] No FREESOUND_API_TOKEN set — skipping audio (set in .env to enable)`);
    } catch (e) { console.log(`[freesound] error ${e}`); }
  }

  // Pexels — high-quality stock photos for media spectrum (when PEXELS_API_KEY set)
  const hasPexelsKey = !!process.env.PEXELS_API_KEY;
  if (hasMediaQuery || hasPexelsKey) {
    try {
      const pexels = await searchPexels(idea, 3);
      for (const px of pexels) {
        const asset = pexelsToAsset(px, idea);
        if (seenUrls.has(asset.sourceUrl) || allAssets.some((a) => a.sourceUrl === asset.sourceUrl)) continue;
        seenUrls.add(asset.sourceUrl);
        allAssets.push(asset);
      }
      if (pexels.length > 0) console.log(`[pexels] +${pexels.length} image assets`);
      else if (hasPexelsKey) console.log(`[pexels] 0 results for "${idea}"`);
    } catch (e) { console.log(`[pexels] error ${e}`); }
  }

  // === STANDARD: Download assets locally (media, archives, pages) ===
  // Create log dir early for downloads
  const slugEarly = idea.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
  const logDirEarly = join(vaultRoot, RESEARCH_CONFIG.folders.logs, `${slugEarly}_${researchId}`);
  mkdirSync(logDirEarly, { recursive: true });
  const assetsDir = join(logDirEarly, "assets");
  mkdirSync(join(assetsDir, "media"), { recursive: true });
  mkdirSync(join(assetsDir, "archives"), { recursive: true });
  mkdirSync(join(assetsDir, "pages"), { recursive: true });

  // Download in parallel, limited concurrency
  console.log(`[download] Queue ${allAssets.filter(a => a.category === "media" || a.category === "archive" || a.category === "rare" || a.sourceUrl.includes("archive.org")).length} candidates, downloading 15 max`);
  const downloadQueue = allAssets.filter(a => (a.category === "media" || a.category === "archive" || a.category === "rare" || a.sourceUrl.includes("archive.org")) && !a.sourceUrl.includes("example.com")).slice(0, 15);
  console.log(`[download] Starting ${downloadQueue.length} downloads to ${assetsDir}`);
  for (const asset of downloadQueue) {
    const isArchive = asset.category === "archive" || asset.archiveUrl;
    const urlToFetch = isArchive && asset.archiveUrl ? asset.archiveUrl : asset.sourceUrl;
    const subDir = asset.category === "media" ? join(assetsDir, "media") : asset.category === "archive" ? join(assetsDir, "archives") : join(assetsDir, "pages");
    console.log(`[download] fetching ${urlToFetch.slice(0,60)} -> ${subDir}`);
    const dl = await downloadAsset(urlToFetch, subDir, asset.assetId);
    console.log(`[download] result ${asset.assetId} local:${dl.localPath} ct:${dl.contentType} bytes:${dl.bytes} needsRender:${dl.needsRender}`);
    asset.localPath = dl.localPath ? dl.localPath.replace(vaultRoot + "/", "") : null;
    asset.contentType = dl.contentType;
    asset.bytes = dl.bytes;
    asset.needsRender = dl.needsRender;
    if (dl.needsRender) {
      asset.evidence = [...(asset.evidence||[]), "needs_render: HTML-as-image, use Playwright screenshot"];
    } else if (dl.localPath) {
      asset.evidence = [...(asset.evidence||[]), `downloaded ${dl.bytes} bytes to ${asset.localPath}`];
    }
  }

  // Sort by score + category weight (rare/media/tools boosted)
  allAssets.sort((a, b) => {
    const catWeight = (c: string) => (c === "rare" ? 0.05 : c === "archive" ? 0.04 : c === "media" ? 0.03 : c === "tool" ? 0.02 : 0);
    return b.score + catWeight(b.category) - (a.score + catWeight(a.category));
  });

  // Insights — spectrum-aware 7 fields + breakdowns
  const qTerms = idea.toLowerCase().split(/\s+/).filter((w) => w.length > 3).slice(0, 4);
  const claims = allAssets.slice(0, 12).flatMap((a) => {
    const sents = a.contentPreview.split(/[.!?]\s+/).slice(0, 3);
    return sents
      .filter((s: string) => qTerms.some((t) => s.toLowerCase().includes(t)) && s.trim().length > 30)
      .map((s: string) => ({ claim: s.trim().slice(0, 220), source: a.sourceUrl, assetId: a.assetId, category: a.category }));
  }).slice(0, 6);

  const patterns = [...new Set(allAssets.slice(0, 12).map((a) => a.domain))].slice(0, 6);
  const counterpoints = allAssets.filter((a) => a.category === "rare" || a.score < 0.6).slice(0, 3).map((a) => ({ title: a.title.slice(0, 80), source: a.sourceUrl, reason: a.category || "reference", category: a.category }));
  const gaps: string[] = [];
  if (allAssets.filter((a) => a.category === "media").length === 0) gaps.push("No media assets harvested — try idea with visual component or increase maxMedia");
  if (allAssets.filter((a) => a.category === "tool").length === 0) gaps.push("No tools/programs found — try adding 'tools' to idea or check tool discovery");
  if (allAssets.filter((a) => a.category === "rare" || a.category === "archive").length === 0) gaps.push("No rare/forgotten archival hits — try history/rare query or Wayback");
  if (allAssets.length < 8) gaps.push("Low total assets — broader idea or increase maxPages");
  if (patterns.length < 3) gaps.push("Limited domain diversity — expanding queries");

  const byCategory = {
    rare: allAssets.filter((a) => a.category === "rare" || a.category === "archive").length,
    media: allAssets.filter((a) => a.category === "media").length,
    tools: allAssets.filter((a) => a.category === "tool").length,
    feeds: allAssets.filter((a) => a.category === "feed").length,
    pages: allAssets.filter((a) => a.category === "page").length,
  };

  const nextQueries = [
    `${idea} case study deep dive`,
    `${idea} forgotten rare archive`,
    `${idea} tools comparison 2024 2025`,
    `${idea} media collection`,
  ];

  const insights = {
    researchId,
    baseQuery: idea,
    oneShotQueries,
    generatedAt: new Date().toISOString(),
    summary: `SPECTRUM for '${idea}' → ${allAssets.length} assets across ${domains.size} domains (rare:${byCategory.rare} media:${byCategory.media} tools:${byCategory.tools} feeds:${byCategory.feeds} pages:${byCategory.pages}) Top ${allAssets[0]?.score.toFixed(2) ?? "none"} archiveQueries:${archiveQueries}`,
    claims: claims.length ? claims : [{ claim: `No direct claim sentences for "${idea}" — top asset: ${allAssets[0]?.title || "none"}`, source: allAssets[0]?.sourceUrl || "", assetId: allAssets[0]?.assetId || "", category: "page" }],
    patterns,
    counterpoints,
    gaps,
    nextQueries,
    byCategory,
    topAssets: allAssets.slice(0, 6).map((a) => ({ title: a.title.slice(0, 80), url: a.sourceUrl, score: a.score, rights: a.rightsClassification, category: a.category, localPath: (a as any).localPath || null })),
    mediaAssets: allAssets.filter((a) => a.category === "media").slice(0, 5).map((a) => ({ url: a.sourceUrl, title: a.title, type: a.type || "image" })),
    toolAssets: allAssets.filter((a) => a.category === "tool").slice(0, 5).map((a) => ({ url: a.sourceUrl, title: a.title })),
    rareAssets: allAssets.filter((a) => a.category === "rare" || a.category === "archive").slice(0, 5).map((a) => ({ url: a.sourceUrl, title: a.title, archiveUrl: a.archiveUrl })),
  };

  const pkg = {
    researchId,
    query: `ONE-SHOT SPECTRUM: ${oneShotQueries.join(" | ")}`,
    idea,
    slug: idea.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50),
    createdAt: new Date().toISOString(),
    budgets: RESEARCH_CONFIG.budgets,
    counts: {
      sourcesSearched: seenUrls.size,
      pagesFetched,
      domains: domains.size,
      archiveQueries,
      totalAssets: allAssets.length,
      uniqueAssets: allAssets.length,
      byCategory,
      media: byCategory.media,
      tools: byCategory.tools,
      rare: byCategory.rare,
    },
    ranked: allAssets.filter((a) => a.rightsClassification === "CLEARLY_REUSABLE"),
    referenceCandidates: allAssets.filter((a) => a.rightsClassification !== "CLEARLY_REUSABLE"),
    all_assets: allAssets,
    one_shot_queries: oneShotQueries,
  };

  let hyperfixationPath = "";
  let logDir = "";
  if (opts.publishToVault !== false) {
    hyperfixationPath = writeHyperfixation(vaultRoot, idea, allAssets as any, insights, oneShotQueries);
    logDir = writeResearchLog(vaultRoot, researchId, idea, pkg, insights, oneShotQueries);
  }

  return { researchId, idea, oneShotQueries, assets: allAssets, insights, hyperfixationPath, logDir, package: pkg };
}
