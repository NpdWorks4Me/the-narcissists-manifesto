/**
 * Autonomous single-shot: scrape explicit URLs from "websites to scrape for data, resources, worksheets and ideas.md"
 * Fetches each URL (PMC, PDFs, archive.org), scores, synthesizes terms/concepts, writes vault hyperfixation + research log.
 *
 * Usage:
 *   npm run research:scrape-websites -- --file "websites to scrape for data, resources, worksheets and ideas.md" [--dry-run] [--publish]
 *   npx tsx src/research/scrapeWebsites.ts --dry-run
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync, statSync } from "fs";
import { join, basename, extname } from "path";
import { createHash } from "crypto";
import dotenv from "dotenv";
import { RESEARCH_CONFIG } from "./config.js";
import { Fetcher } from "./fetcher.js";
import { scoreAsset, relevanceFor, rightsClassification } from "./scoring.js";
import { writeHyperfixation, writeResearchLog } from "./vaultWriter.js";
import { appendTrackingRow } from "../vault/lib/tracking.js";
import { CONFIG } from "../vault/lib/config.js";

// Load .env from vault root
try {
  const _cwd = process.cwd();
  const _isBackend = _cwd.endsWith("05 Backend") || _cwd.endsWith("backend");
  const _vaultRoot = _isBackend ? _cwd.slice(0, -(_cwd.split("/").pop() || "").length).replace(/\/$/, "") || "." : _cwd;
  const _envPath = join(_vaultRoot, ".env");
  if (existsSync(_envPath)) dotenv.config({ path: _envPath });
  else dotenv.config();
} catch {}

function getVaultRoot(): string {
  const cwd = process.cwd();
  const base = cwd.split("/").pop() || "";
  const isBackend = base === "backend" || base === "05 Backend";
  if (isBackend) return cwd.slice(0, -base.length).replace(/\/$/, "") || ".";
  return cwd;
}
function slugify(s: string){ return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50)||"research"; }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function domainFromUrl(url:string){ try{ return new URL(url).hostname.replace(/^www\./,""); }catch{ return "unknown"; } }
function isPdfUrl(url:string){ return /\.pdf(\?|$)/i.test(url) || url.includes(".pdf"); }
function isArchiveUrl(url:string){ return url.includes("archive.org"); }

async function downloadAsset(url:string, destDir:string, assetId:string){
  try{
    const controller = new AbortController();
    const t = setTimeout(()=>controller.abort(), 12000);
    const res = await fetch(url, { headers:{ "User-Agent":"manifesto-research/0.1" }, signal:controller.signal });
    clearTimeout(t);
    if(!res.ok) return { localPath:null, contentType:res.headers.get("content-type"), bytes:null };
    const buf = Buffer.from(await res.arrayBuffer());
    if(buf.length < 100 || buf.length > 25_000_000) return { localPath:null, contentType:res.headers.get("content-type"), bytes:buf.length };
    let ext = extname(new URL(url).pathname) || ".pdf";
    if(!ext || ext.length>6) ext = ".pdf";
    const safe = `${assetId}_${basename(new URL(url).pathname).slice(0,20).replace(/[^a-zA-Z0-9._-]/g,"_")||"file"}${ext}`;
    const destPath = join(destDir, safe);
    mkdirSync(destDir,{recursive:true});
    writeFileSync(destPath, buf);
    return { localPath:destPath, contentType:res.headers.get("content-type"), bytes:buf.length };
  }catch(e:any){ return { localPath:null, contentType:null, bytes:null, error:e?.message }; }
}

function extractTerms(content:string, url:string): string[] {
  const terms: string[] = [];
  // curated workbook terms first — these are the viable concepts the user wants
  const curated = ["behavioural activation","behavioral activation","TF-CBT","DBT skills","distress tolerance","emotion regulation","life story plan","anxiety","depression","workbook","worksheet","cognitive behavioural","CBT","mindfulness","interpersonal effectiveness","anxiety reduction","depression reduction","B Beck Depression","hopelessness","self-monitoring","activity scheduling","opposite action","PLEASE skills","TIPP","radical acceptance"];
  for(const cu of curated) if(content.toLowerCase().includes(cu.toLowerCase()) && !terms.includes(cu)) terms.push(cu);
  // headings from markdown
  const headings = [...content.matchAll(/^#+\s*(.+)$/gm)].map(m=>m[1].trim()).slice(0,20);
  for(const h of headings){
    if(h.length>4 && h.length<80 && h.split(" ").length<=6) terms.push(h);
  }
  // capitalized phrases 2-4 words, but filter out author-like noise (require content word)
  const caps = [...content.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g)].map(m=>m[1].trim()).slice(0,40);
  for(const c of caps){
    if(terms.includes(c) || c.split(" ").length>4) continue;
    // filter out pure author names unless they contain concept word
    if(/^[A-Z][a-z]+ [A-Z]/.test(c) && !/(Skills|Activation|Disorder|Therapy|Worksheet|Workbook)/i.test(c)) continue;
    if(c.length>6) terms.push(c);
  }
  return [...new Set(terms)].slice(0,25);
}

export async function runScrapeWebsites(opts: { file?: string; dryRun?: boolean; maxPdfs?: number } = {}){
  const vaultRoot = getVaultRoot();
  const fileRel = opts.file || "websites to scrape for data, resources, worksheets and ideas.md";
  const fileFull = join(vaultRoot, fileRel);
  if(!existsSync(fileFull)) throw new Error(`Scrape file not found: ${fileFull}`);
  const rawFile = readFileSync(fileFull, "utf-8");
  const urls = [...new Set([...rawFile.matchAll(/https?:\/\/[^\s"']+/g)].map(m=>m[0].trim()))].filter(u=>u.length>10);
  console.log(`\n🔍 Scrape-Websites — found ${urls.length} URLs in ${fileRel}`);
  urls.forEach((u,i)=> console.log(`  ${i+1}. ${u}`));
  if(urls.length===0) throw new Error("No URLs found");

  const idea = "worksheets resources behavioural activation DBT TF-CBT wellbeing";
  const slug = slugify("websites-scrape-worksheets");
  const researchId = createHash("sha256").update(rawFile + Date.now().toString()).digest("hex").slice(0,8);
  const logDir = join(vaultRoot, RESEARCH_CONFIG.folders.logs, `${slug}_${researchId}`);
  mkdirSync(logDir,{recursive:true});
  const assetsDir = join(logDir, "assets");
  mkdirSync(assetsDir,{recursive:true});

  if(opts.dryRun){
    console.log("\n[dry-run] Would fetch each URL via Fetcher, score, and write:");
    console.log(`  logDir: ${logDir}`);
    console.log(`  hyperfixation: 01 Hyperfixations/${slug}.md`);
    console.log(`  assetsDir: ${assetsDir}`);
    // bucket preview
    const buckets = { pdf: urls.filter(isPdfUrl).length, archive: urls.filter(isArchiveUrl).length, page: urls.filter(u=>!isPdfUrl(u) && !isArchiveUrl(u)).length };
    console.log(`  buckets: pdf=${buckets.pdf} archive=${buckets.archive} page=${buckets.page}`);
    return { urls, researchId, logDir, dryRun:true } as any;
  }

  const fetcher = new Fetcher(vaultRoot);
  const start = Date.now();
  const hardDeadline = start + 10*60*1000;
  const allAssets: any[] = [];
  const failed: any[] = [];

  // Parallel fetch with limit 3
  const concurrency = 3;
  for(let i=0; i<urls.length; i+=concurrency){
    if(Date.now() >= hardDeadline - 500) break;
    const batch = urls.slice(i, i+concurrency);
    const results = await Promise.allSettled(batch.map(async (url)=>{
      const assetId = createHash("sha256").update(url).digest("hex").slice(0,8);
      const domain = domainFromUrl(url);
      let category: string = isPdfUrl(url) ? "tool" : isArchiveUrl(url) ? "rare" : "page";
      // PMC is high-value rare? No, treat as page but will boost via rarity if text contains archival terms
      let content = "";
      let title = url;
      let status = 0;
      let snippet = "";
      let localPath: string|null = null;
      let bytes: number|null = null;

      try{
        // For PDFs, also attempt binary download for local archive
        if(isPdfUrl(url) && allAssets.length < RESEARCH_CONFIG.budgets.maxDownloads){
          const dl = await downloadAsset(url, assetsDir, assetId);
          localPath = dl.localPath;
          bytes = dl.bytes;
        }
        const res = await fetcher.fetch(url);
        content = res.content || "";
        status = res.status || 200;
        title = content.split("\n")[0]?.slice(0,120) || url;
        if(title.length<5) title = `${domain} — ${basename(url).slice(0,40)}`;
        snippet = content.slice(0,300).replace(/\s+/g," ").trim();
        if(!content || content.length < 120) throw new Error(`content too short (${content.length}) — status ${status}`);
      }catch(e:any){
        console.log(`[fetch:FAIL] ${url.slice(0,50)} — ${e.message}`);
        failed.push({ url, domain, error: e.message, assetId });
        return null;
      }

      const relevance = relevanceFor(idea, title, content);
      const rights = rightsClassification(null);
      // Credibility
      let cred = 0.5;
      if(domain.includes("nih.gov") || domain.includes("ncbi")) cred = 0.85;
      else if(domain.includes("edu")) cred = 0.8;
      else if(domain.includes("archive.org")) cred = 0.75;
      else if(domain.includes("betweensessions") || domain.includes("dbsalliance") || domain.includes("flinders")) cred = 0.7;
      else if(domain.includes("sciencedirect")) cred = 0.75;
      const tech = content.length >= 120 ? 0.7 : 0.3;
      const score = scoreAsset(relevance, cred, rights.conf, tech, { textForRarity: content, category });

      const asset = {
        assetId, sourceUrl: url, title, snippet, domain, relevanceScore: relevance, score,
        contentPreview: content.slice(0,2000), evidence: [url], rightsClassification: rights.cls, rightsConfidence: rights.conf,
        category, contentLength: content.length, status, localPath, bytes
      };
      console.log(`[fetch:OK] ${domain} (${category}) score ${score.toFixed(2)} rel ${relevance.toFixed(2)} len ${content.length} — ${title.slice(0,50)}`);
      return asset;
    }));

    for(const r of results){
      if(r.status==="fulfilled" && r.value) allAssets.push(r.value);
      else if(r.status==="rejected") console.log(`[batch] rejected: ${r.reason}`);
    }
  }

  // Keep all successfully fetched assets for explicit URL scrape (user requested each URL)
  // Sort by score, but do not filter out low-relevance — each URL was explicitly requested
  const finalAssets = [...allAssets].sort((a,b)=> b.score - a.score);
  // Log filtered count for info but keep all
  const filtered = allAssets.filter(a=> a.relevanceScore >= RESEARCH_CONFIG.thresholds.relevance || a.score >= RESEARCH_CONFIG.thresholds.usabilityScoreThreshold);
  console.log(`[verification] ${filtered.length}/${allAssets.length} passed thresholds — keeping all ${finalAssets.length} for explicit scrape`);

  // Synthesis: extract terms/concepts
  const allContent = finalAssets.map(a=> a.contentPreview).join("\n\n");
  const terms = extractTerms(allContent, "");
  const claims = terms.slice(0,12).map((t,i)=>{
    const src = finalAssets[i % finalAssets.length];
    return { claim: t, source: src.sourceUrl, assetId: src.assetId, category: src.category };
  });
  // Add workbook-specific claims
  const workbookNames = finalAssets.filter(a=> a.category==="tool").map(a=> a.title);
  for(const w of workbookNames.slice(0,3)){
    claims.push({ claim: `Worksheet/Workbook: ${w}`, source: finalAssets.find(a=>a.title===w)?.sourceUrl || "", assetId: finalAssets.find(a=>a.title===w)?.assetId || "", category:"tool" });
  }

  const byCategory: any = {};
  for(const a of finalAssets) byCategory[a.category] = (byCategory[a.category]||0)+1;

  const insights = {
    summary: `Scraped ${urls.length} URLs → ${finalAssets.length} viable assets (${failed.length} failed). Extracted ${terms.length} terms/concepts.`,
    claims,
    terms,
    byCategory,
    patterns: [...new Set(finalAssets.map(a=>a.domain))],
    gaps: failed.map(f=> `${f.url} — ${f.error}`),
    next_queries: ["behavioural activation worksheet", "DBT distress tolerance handout", "TF-CBT workbook youth"],
    failed
  };

  const oneShotQueries = urls; // for provenance, store URLs as queries
  const pkg = { all_assets: finalAssets, total_urls: urls.length, failed, research_duration_ms: Date.now()-start, generated_at: todayISO() };

  // Write vault hyperfixation
  const hyperPath = writeHyperfixation(vaultRoot, "websites-scrape worksheets resources", finalAssets, insights, oneShotQueries);
  console.log(`\n✅ Hyperfixation written: ${hyperPath}`);

  // Write research log
  const logPath = writeResearchLog(vaultRoot, researchId, "websites-scrape-worksheets", pkg, insights, oneShotQueries);
  console.log(`✅ Research log: ${logPath}`);
  // Also write raw failed + terms log
  writeFileSync(join(logDir, "terms.json"), JSON.stringify({ terms, claims }, null, 2));
  // Download manifest
  writeFileSync(join(logDir, "assets_manifest.json"), JSON.stringify(finalAssets.map(a=>({assetId:a.assetId, sourceUrl:a.sourceUrl, score:a.score, category:a.category, localPath:a.localPath})), null, 2));

  // Tracking
  try{
    const wip = (()=>{ try{ const files = require("fs").readdirSync(join(vaultRoot, CONFIG.FOLDERS.hyperfixations)); return files.filter((f:string)=> f.endsWith(".md")).length; }catch{ return 2; }})();
    appendTrackingRow(vaultRoot, {
      date: todayISO(),
      note_id: researchId,
      title: "websites-scrape worksheets resources",
      type: "hyperfixation",
      status: "active",
      wip_count: wip,
      orphan_count: 0,
      broken_links: 0,
      confidence: Math.min(0.85, 0.5 + finalAssets.length*0.05),
      event: `websites-scrape ${researchId} urls=${urls.length} assets=${finalAssets.length} failed=${failed.length}`
    });
  }catch{}

  console.log(`\n📦 Done — ${finalAssets.length} assets, ${terms.length} terms, ${failed.length} failed, hyperfixation ${hyperPath}`);
  console.log(`   LogDir: ${logDir}`);
  return { researchId, logDir, hyperPath, assets: finalAssets, insights, failed };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("scrapeWebsites.ts")){
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const fileArg = args.find(a=> a.startsWith("--file="))?.split("=")[1] || args.find((a,i)=> a==="--file" && args[i+1]) as any;
  const file = fileArg || undefined;
  runScrapeWebsites({ file, dryRun }).then(r=>{
    console.log("\n✅ Scrape complete");
    if(dryRun) console.log(JSON.stringify(r,null,2));
    process.exit(0);
  }).catch(e=>{
    console.error("❌ Scrape failed:", e);
    process.exit(1);
  });
}
