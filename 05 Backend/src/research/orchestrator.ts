/**
 * 10-Minute Autonomous High-Value Harvest Orchestrator (3-min minimum)
 * - Parallel: YouTube transcripts + Web Spectrum + Message Boards
 * - Hard timer: never exceeds 10 min, never exits before 3 min, partial results always saved
 * - Verification: usability filter, local download check
 */
import { createHash } from "crypto";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import dotenv from "dotenv";
import { RESEARCH_CONFIG } from "./config.js";
import { runResearchOneShot, generateOneShotQueries } from "./pipeline.js";
import { harvestYouTubePlaylists } from "./adapters/youtube-dlp.js";
import { harvestMessageBoards } from "./adapters/messageBoard.js";
import { verifyAll } from "./verification.js";
import { writeHyperfixation } from "./vaultWriter.js";

// Load .env from vault root (same as pipeline) so YOUTUBE_API_KEY etc. are available
try {
  const _cwd = process.cwd();
  const _isBackend = _cwd.endsWith("05 Backend") || _cwd.endsWith("backend");
  const _vaultRoot = _isBackend
    ? _cwd.slice(0, -(_cwd.split("/").pop() || "").length).replace(/\/$/, "") || "."
    : _cwd;
  const _envPath = join(_vaultRoot, ".env");
  if (existsSync(_envPath)) dotenv.config({ path: _envPath });
  else dotenv.config();
} catch {}

function getVaultRoot(): string {
  const cwd = process.cwd();
  const base = cwd.split("/").pop() || "";
  const isBackend = base === "backend" || base === "05 Backend";
  if (isBackend) {
    const sliced = cwd.slice(0, -base.length).replace(/\/$/, "");
    return sliced || ".";
  }
  return cwd;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "research";
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let t: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, rej) => {
    t = setTimeout(() => rej(new Error(`${label} timeout after ${ms}ms`)), ms);
    // Don't keep process alive just for this timer if main work finishes early
    (t as any)?.unref?.();
  });
  return Promise.race([p, timeout]).finally(() => {
    if (t) clearTimeout(t);
  }) as Promise<T>;
}

const PLAYLIST_FILE = "Personality Disorders of interest by sam vaknin.md";

// Personality-disorder related terms that gate the Vaknin playlist harvest.
// The playlist is Sam Vaknin content — only auto-harvest when the idea is
// actually about personality disorders / narcissism, never for unrelated topics.
const PD_TOPIC_TERMS = ["personality disorder", "narcissis", "cluster b", "borderline", "psychopath", "vaknin", "npd", "bpd", "antisocial", "malignant", "grandios"];

// Condense a long idea sentence into its core search terms (drop filler words)
// so queries hit search engines cleanly instead of full-sentence noise.
const FILLER = new Set(["and", "the", "of", "on", "to", "for", "with", "its", "it", "a", "an", "that", "this", "what", "how", "why", "does", "negative", "effects", "effect", "impact", "impacts", "person", "people", "subject", "fixation", "really", "very", "about", "from", "into", "over", "under"]);
function condenseIdea(idea: string): string {
  const words = idea.toLowerCase().replace(/['"]/g, "").split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !FILLER.has(w));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length >= 6) break;
  }
  return out.join(" ");
}

function topicMatchesPlaylist(idea: string): boolean {
  const lower = idea.toLowerCase();
  return PD_TOPIC_TERMS.some((t) => lower.includes(t));
}

function loadPlaylistUrls(vaultRoot: string): string[] {
  const p = join(vaultRoot, PLAYLIST_FILE);
  if (!existsSync(p)) return [];
  const text = readFileSync(p, "utf-8");
  const urls = [...text.matchAll(/https?:\/\/[^\s"']+/g)].map((m) => m[0].trim());
  return [...new Set(urls)].filter((u) => u.includes("youtube.com") || u.includes("youtu.be"));
}

export async function run25MinWorkflow(
  idea?: string,
  opts: { maxPages?: number; dryRun?: boolean; noYouTube?: boolean } = {}
) {
  const vaultRoot = getVaultRoot();
  const start = Date.now();
  const hardDeadline = start + 10 * 60 * 1000;
  const minDeadline = start + 3 * 60 * 1000;
  const ideaText = idea?.trim() || "personality disorders narcissism";
  const slug = slugify(ideaText);
  const researchId = createHash("sha256").update(ideaText + start).digest("hex").slice(0, 8);
  const logDir = join(vaultRoot, RESEARCH_CONFIG.folders.logs, `${slug}_${researchId}`);
  mkdirSync(logDir, { recursive: true });

  // Helper to check hard deadline
  const msRemaining = () => hardDeadline - Date.now();
  const timeUp = () => Date.now() >= hardDeadline - 500; // 500ms grace

  console.log(`\n⏱️  10-Minute Harvest (3-min min) — idea: "${ideaText}" — id: ${researchId}`);
  console.log(`   Vault: ${vaultRoot}`);
  console.log(`   Deadlines: setup 0.5min → branches 6min → verification 2min → packaging 1.5min (hard 10m / min 3m)`);
  console.log(`   Hard deadline: ${new Date(hardDeadline).toLocaleTimeString()} | Min deadline: ${new Date(minDeadline).toLocaleTimeString()}`);

  // Vaknin playlist only harvests for personality-disorder topics, unless --no-youtube
  const playlistUrls = opts.noYouTube ? [] : (topicMatchesPlaylist(ideaText) ? loadPlaylistUrls(vaultRoot) : []);
  console.log(`   Playlists found: ${playlistUrls.length} URLs from ${PLAYLIST_FILE} (topic-matched: ${topicMatchesPlaylist(ideaText)}${opts.noYouTube ? ", --no-youtube" : ""})`);

  // Phase 0: Setup (0-2 min) — already done, just log.
  // Use condensed core terms for search queries (full sentence is query noise);
  // the full ideaText still feeds the report/insights for provenance.
  const searchTopic = condenseIdea(ideaText) || ideaText;
  const oneShotQueries = generateOneShotQueries(searchTopic);
  console.log(`   Search topic (condensed): "${searchTopic}"`);
  console.log(`   One-shot queries: ${oneShotQueries.map((q) => `"${q.slice(0, 30)}"`).join(" | ")}`);

  if (timeUp()) {
    console.log("[orchestrator] Hard deadline already reached after setup, packaging partial (empty)");
  }

  // Phase 1: Parallel branches (0.5-6.5 min) with hard timeout
  const branchTimeout = 6 * 60 * 1000;
  const branchDeadline = Date.now() + branchTimeout;

  console.log("[orchestrator] Starting branches...");

  const webPromise = (async () => {
    console.log("[branch] Web Spectrum starting... at", new Date().toISOString());
    const webStart = Date.now();
    if (opts.dryRun) {
      console.log("[dry-run] Web Spectrum skipped (would run 8 queries)");
      return { assets: [], byCategory: {} };
    }
    const remaining = Math.min(branchDeadline - Date.now(), msRemaining() - 1000);
    if (remaining <= 0) return { assets: [], byCategory: {} };
    try {
      const res = await withTimeout(
        runResearchOneShot(searchTopic, { maxPages: opts.maxPages ?? 12, publishToVault: false }),
        Math.max(1000, remaining),
        "web spectrum"
      );
      console.log(
        `[branch] Web Spectrum done in ${((Date.now() - webStart) / 1000).toFixed(1)}s, ${res.assets.length} assets`
      );
      return { assets: res.assets, byCategory: (res.insights as any).byCategory, package: res.package, insights: res.insights };
    } catch (e) {
      console.log(`[branch] Web Spectrum skipped/failed: ${e}`);
      return { assets: [], byCategory: {} };
    }
  })();

  const youtubePromise = (async () => {
    console.log("[branch] YouTube starting...");
    if (opts.dryRun) {
      console.log(`[dry-run] YouTube would harvest ${playlistUrls.length} playlists`);
      return { assets: [] };
    }
    if (playlistUrls.length === 0) return { assets: [] };
    const remaining = Math.min(branchDeadline - Date.now(), msRemaining() - 1000);
    if (remaining <= 1000) return { assets: [] };
    try {
      console.log(`[youtube] Starting harvest for ${playlistUrls.length} playlists`);
      const assets = await withTimeout(
        harvestYouTubePlaylists(playlistUrls, ideaText, RESEARCH_CONFIG.budgets.maxPlaylistVideos),
        Math.max(1000, remaining),
        "youtube"
      );
      console.log(`[youtube] Harvested ${assets.length} transcript assets`);
      return { assets };
    } catch (e) {
      console.log(`[youtube] Skipped/failed: ${e}`);
      return { assets: [] };
    }
  })();

  const boardPromise = (async () => {
    console.log("[branch] Boards starting...");
    if (opts.dryRun) {
      console.log("[dry-run] Message boards skipped");
      return { assets: [] };
    }
    const remaining = Math.min(branchDeadline - Date.now(), msRemaining() - 1000);
    if (remaining <= 1000) return { assets: [] };
    try {
      const assets = await withTimeout(
        harvestMessageBoards(searchTopic, RESEARCH_CONFIG.budgets.maxBoardAssets),
        Math.max(1000, remaining),
        "boards"
      );
      console.log(`[board] Harvested ${assets.length} story assets`);
      return { assets };
    } catch (e) {
      console.log(`[board] Skipped/failed: ${e}`);
      return { assets: [] };
    }
  })();

  // Collect branches — each branch already bounded by msRemaining via withTimeout,
  // so total wait is naturally capped. No outer 10-min timer that leaks.
  const [webRes, ytRes, boardRes] = await Promise.allSettled([webPromise, youtubePromise, boardPromise]);

  const webAssets = webRes.status === "fulfilled" ? ((webRes.value as any).assets || []) : [];
  const ytAssets = ytRes.status === "fulfilled" ? ((ytRes.value as any).assets || []) : [];
  const boardAssets = boardRes.status === "fulfilled" ? ((boardRes.value as any).assets || []) : [];

  // Merge + dedupe
  const allAssets: any[] = [];
  const seen = new Set<string>();
  for (const a of [...webAssets, ...ytAssets, ...boardAssets]) {
    const key = a.sourceUrl || a.assetId;
    if (seen.has(key)) continue;
    seen.add(key);
    if (allAssets.some((x) => x.assetId === a.assetId)) continue;
    allAssets.push(a);
  }

  console.log(
    `\n[merge] Total ${allAssets.length} assets (web:${webAssets.length} yt:${ytAssets.length} board:${boardAssets.length}) across ${new Set(allAssets.map((a: any) => a.domain)).size} domains`
  );

  // Phase 2: Verification (6.5-8.5 min) — check hard deadline before heavy work
  if (timeUp()) {
    console.log("[orchestrator] Hard deadline reached before verification, proceeding to packaging with partial assets");
  }
  const verification = verifyAll(allAssets, ideaText);
  console.log(
    `[verification] usable:${verification.summary.usable} needsReview:${verification.summary.needsReview} reject:${verification.summary.reject}`
  );

  // Augment assets with verification
  for (const r of verification.results) {
    r.asset.verification = r.verification;
    r.asset.usable = r.verification.usable;
  }

  // Filter to usable + needsReview for vault (maximize choose-from, but mark quality)
  const vaultAssets = verification.results
    .filter((r) => r.verification.usable || r.verification.needsReview)
    .map((r) => r.asset);
  const byCategory: any = {};
  for (const a of vaultAssets) byCategory[a.category || "page"] = (byCategory[a.category || "page"] || 0) + 1;

  // Phase 3: Packaging (8.5-10 min) — always runs even if branches partially failed
  const insights = {
    researchId,
    baseQuery: ideaText,
    oneShotQueries,
    generatedAt: new Date().toISOString(),
    summary: `10-min SPECTRUM (3m min) for '${ideaText}' → ${vaultAssets.length} usable+review assets (web:${webAssets.length} yt:${ytAssets.length} board:${boardAssets.length}) across ${new Set(vaultAssets.map((a: any) => a.domain)).size} domains`,
    claims: vaultAssets
      .slice(0, 10)
      .flatMap((a: any) => {
        const raw = (a.contentPreview || a.transcript || a.snippet || "").replace(/<[^>]+>/g, " ");
        // Split into sentence-ish chunks, drop markup/punct noise
        const sents = raw
          .split(/[.!?]\s+|\n+/)
          .map((s: string) => s.replace(/[\[\]#*`|>\-–—]/g, " ").replace(/\s+/g, " ").trim())
          .filter((s: string) => s.length > 40 && /[a-zA-Z]{4,}/.test(s));
        const qTerms = ideaText
          .toLowerCase()
          .split(/\s+/)
          .filter((w: string) => w.length > 3)
          .slice(0, 3);
        return sents
          .filter(
            (s: string) =>
              (qTerms.some((t: string) => s.toLowerCase().includes(t)) || a.category === "story") && s.length < 400
          )
          .slice(0, 2)
          .map((s: string) => ({
            claim: s.slice(0, 300),
            source: a.sourceUrl,
            assetId: a.assetId,
            category: a.category,
          }));
      })
      .slice(0, 6),
    patterns: [...new Set(vaultAssets.slice(0, 10).map((a: any) => a.domain))].slice(0, 6),
    gaps: [] as string[],
    nextQueries: [`${ideaText} case study`, `${ideaText} rare archive`, `${ideaText} tools comparison`],
    byCategory,
    verificationSummary: verification.summary,
    topAssets: vaultAssets
      .slice(0, 6)
      .map((a: any) => ({
        title: a.title.slice(0, 80),
        url: a.sourceUrl,
        score: a.score,
        category: a.category,
        usable: a.verification?.usable,
      })),
  };
  if (byCategory.transcript) insights.summary += ` transcripts:${byCategory.transcript}`;
  if (byCategory.story) insights.summary += ` stories:${byCategory.story}`;

  const pkg: any = {
    researchId,
    query: `10MIN SPECTRUM (3m min): ${oneShotQueries.join(" | ")}`,
    idea: ideaText,
    slug,
    createdAt: new Date().toISOString(),
    budgets: RESEARCH_CONFIG.budgets,
    counts: {
      totalAssets: vaultAssets.length,
      byCategory,
      verification: verification.summary,
      youtube: ytAssets.length,
      board: boardAssets.length,
    },
    all_assets: vaultAssets,
    one_shot_queries: oneShotQueries,
    verification: verification.results.map((r) => ({ assetId: r.asset.assetId, verification: r.verification })),
  };

  // Local download check: save transcripts/stories directly, verify exists
  const assetsDir = join(logDir, "assets");
  mkdirSync(assetsDir, { recursive: true });
  mkdirSync(join(assetsDir, "transcripts"), { recursive: true });
  mkdirSync(join(assetsDir, "stories"), { recursive: true });

  // Save transcript assets locally and verify
  for (const a of vaultAssets.filter((x: any) => x.category === "transcript" && x.transcript)) {
    try {
      const dest = join(assetsDir, "transcripts", `${a.assetId}.txt`);
      if (!existsSync(dest)) writeFileSync(dest, (a.transcript as string).slice(0, 50000), "utf-8");
      // Verify local download
      if (existsSync(dest)) {
        a.localPath = dest.replace(vaultRoot + "/", "");
        a.bytes = (a.transcript as string).length;
        a.contentType = "text/plain";
        a.evidence = [...(a.evidence || []), `verified local transcript ${a.wordCount} words`];
      }
    } catch (e) {
      console.log(`[download] transcript save failed ${a.assetId}: ${e}`);
    }
  }
  for (const a of vaultAssets.filter((x: any) => x.category === "story" && x.contentPreview)) {
    try {
      const dest = join(assetsDir, "stories", `${a.assetId}.md`);
      if (!existsSync(dest)) writeFileSync(dest, (a.contentPreview as string).slice(0, 10000), "utf-8");
      if (existsSync(dest)) {
        a.localPath = a.localPath || dest.replace(vaultRoot + "/", "");
      }
    } catch {}
  }

  // Ensure logDir exists, write verification.json — always, even on partial
  try {
    writeFileSync(
      join(logDir, "verification.json"),
      JSON.stringify(
        {
          verification: verification.results.map((r) => ({
            assetId: r.asset.assetId,
            url: r.asset.sourceUrl,
            verification: r.verification,
            localPath: r.asset.localPath || null,
            verified: !!(r.asset.localPath && existsSync(join(vaultRoot, r.asset.localPath))),
          })),
          summary: verification.summary,
        },
        null,
        2
      )
    );
    writeFileSync(join(logDir, "package.json"), JSON.stringify(pkg, null, 2));
    writeFileSync(join(logDir, "insights.json"), JSON.stringify(insights, null, 2));
  } catch (e) {
    console.log(`[orchestrator] Failed to write verification/package/insights: ${e}`);
  }

  const reportMd = `# Research Log — ${ideaText} (10-min, 3-min min)

**ID:** ${researchId} | **Date:** ${todayISO()} | **Duration:** ${((Date.now() - start) / 1000).toFixed(0)}s

**Summary:** ${insights.summary}

**Verification:** usable ${verification.summary.usable} / needsReview ${verification.summary.needsReview} / reject ${verification.summary.reject}

## Top Usable Assets
${vaultAssets.slice(0, 8).map((a: any) => `- [${a.category || "page"}] ${a.title} — ${a.sourceUrl} — usable:${a.verification?.usable} score:${a.score?.toFixed(2)}`).join("\n") || "_none_"}

## Transcripts
${vaultAssets.filter((a: any) => a.category === "transcript").slice(0, 5).map((a: any) => `- ${a.title} — ${a.wordCount} words, coverage ${a.coverage?.toFixed(2)} — local: ${a.localPath || "not saved"}`).join("\n") || "_none_"}

## Stories
${vaultAssets.filter((a: any) => a.category === "story").slice(0, 5).map((a: any) => `- ${a.title} — ${a.wordCount} words, authenticity ${a.authenticity?.toFixed(2)} — local: ${a.localPath || "not saved"}`).join("\n") || "_none_"}

## Hard Deadline
hardDeadline: ${new Date(hardDeadline).toISOString()} — remaining at packaging: ${(msRemaining() / 1000).toFixed(1)}s
`;
  try {
    writeFileSync(join(logDir, "report.md"), reportMd);
  } catch (e) {
    console.log(`[orchestrator] Failed to write report.md: ${e}`);
  }

  // Vault write — hyperfixation (respects dryRun, checks hard deadline)
  let hyperfixationPath = "";
  if (!opts.dryRun) {
    if (timeUp()) {
      console.log("[orchestrator] Hard deadline reached, still attempting vault write (partial)");
    }
    try {
      hyperfixationPath = writeHyperfixation(vaultRoot, ideaText, vaultAssets as any, insights, oneShotQueries);
    } catch (e) {
      console.log(`[orchestrator] writeHyperfixation failed: ${e}`);
    }
  }

  // Enforce 3-min minimum — if we finished early, wait until minDeadline
  const elapsedMs = Date.now() - start;
  if (elapsedMs < 3 * 60 * 1000) {
    const waitMs = 3 * 60 * 1000 - elapsedMs;
    console.log(`[orchestrator] Finished in ${(elapsedMs / 1000).toFixed(1)}s — waiting ${(waitMs / 1000).toFixed(0)}s to meet 3-min minimum...`);
    await new Promise((r) => setTimeout(r, waitMs));
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(0);
  console.log(`\n✅ 10-min (3m min) complete in ${elapsed}s — hyperfixation: ${hyperfixationPath || "(dry-run)"} — log: ${logDir}`);
  console.log(
    `   Usable: ${verification.summary.usable}, NeedsReview: ${verification.summary.needsReview}, Reject: ${verification.summary.reject}`
  );
  if (Date.now() > hardDeadline) console.log(`   ⚠️  Exceeded hard deadline by ${((Date.now() - hardDeadline) / 1000).toFixed(1)}s but partial saved`);

  return { researchId, idea: ideaText, hyperfixationPath, logDir, verification, insights, pkg, elapsed };
}

// CLI — allow direct run: npx tsx src/research/orchestrator.ts "idea" --max-pages 12 --dry-run
// Also handles `npm run research:25min -- "idea"` where argv includes npm wrapper
// Only run when file is main entry, not when imported as module
const isDirectRun = process.argv.slice(1).some((a) => a.endsWith("orchestrator.ts"));
if (isDirectRun) {
  const rawArgs = process.argv.slice(2).filter((a) => !a.includes("orchestrator.ts"));
  // npm passes -- separator, filter it
  const filtered = rawArgs.filter((a) => a !== "--");
  const dryRun = filtered.includes("--dry-run");
  const noYouTube = filtered.includes("--no-youtube");
  const maxPagesIdx = filtered.indexOf("--max-pages");
  let maxPages: number | undefined;
  let ideaTokens: string[] = [];
  if (maxPagesIdx !== -1) {
    const v = filtered[maxPagesIdx + 1];
    maxPages = v ? parseInt(v, 10) : undefined;
    // idea is all non-flag tokens except the maxPages value itself
    ideaTokens = filtered.filter((a, idx) => {
      if (a.startsWith("--")) return false;
      if (idx === maxPagesIdx + 1) return false; // skip maxPages numeric value
      if (a === "--dry-run") return false;
      if (a === "--no-youtube") return false;
      return true;
    });
  } else {
    ideaTokens = filtered.filter((a) => !a.startsWith("--"));
  }
  const ideaArg = ideaTokens.join(" ").trim() || undefined;
  // eslint-disable-next-line no-console
  console.log(`[orchestrator] CLI invoked with idea: "${ideaArg ?? ""}" maxPages:${maxPages} dryRun:${dryRun} noYouTube:${noYouTube}`);
  run25MinWorkflow(ideaArg, { maxPages, dryRun, noYouTube }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
