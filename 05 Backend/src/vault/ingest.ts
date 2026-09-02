/**
 * vault:ingest — multimedia ingest (mirrors /obsidian-ingest)
 * Drop a URL, PDF, audio, screenshot → rewrites 5-15 vault pages
 * Handles: URLs (fetch), PDFs (text extract), audio (Whisper local), images (OCR placeholder), YouTube --visual (yt-dlp+ffmpeg frames)
 * Usage:
 *   npm run vault:ingest -- https://youtube.com/watch?v=xxx [--visual] [--max-frames 24]
 *   npm run vault:ingest -- ./path/to/meeting.m4a
 *   npm run vault:ingest -- ./path/to/whiteboard.png
 *   npm run vault:ingest -- ./path/to/paper.pdf
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync, statSync, readdirSync } from "fs";
import { join, basename, extname } from "path";
import { execSync, spawnSync } from "child_process";
import matter from "gray-matter";
import { parseFrontmatter, todayISO, generateId } from "./lib/frontmatter.js";
import { CONFIG } from "./lib/config.js";
import { termFrequency } from "./lib/nlp.js";

const _cwd = process.cwd();
const vaultRoot = (() => { const base = _cwd.split("/").pop() || ""; const isBackend = base === "backend" || base === "05 Backend"; return isBackend ? _cwd.slice(0, -base.length).replace(/\/$/, "") || "." : _cwd; })();
const args = process.argv.slice(2);
const input = args.filter((a)=> !a.startsWith("--") && !a.includes("ingest.ts"))[0];
const visual = args.includes("--visual");
const maxFramesIdx = args.indexOf("--max-frames");
const maxFrames = maxFramesIdx !== -1 ? parseInt(args[maxFramesIdx+1],10) || 24 : 24;

function ensureDir(p: string){ mkdirSync(p, { recursive:true }); }

async function ingestUrl(url: string): Promise<{ title: string; content: string; type: string }> {
  console.log(`  Fetching URL: ${url.slice(0,80)}`);
  // Try youtube transcript first if youtube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    try {
      const ytMod = await import("../research/adapters/youtube.ts");
      const idMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_\-]{11})/);
      if (idMatch) {
        const fetched = await (ytMod as any).fetchTranscript?.(idMatch[1]);
        if (fetched) return { title: fetched.title || `YouTube ${idMatch[1]}`, content: fetched.transcript || fetched.text || "", type: "transcript" };
      }
    } catch {}
  }
  try {
    const res = await fetch(url, { headers: { "User-Agent": "manifesto-ingest/0.1" } });
    const text = await res.text();
    // Strip HTML to text
    const stripped = text.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 15000);
    const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().slice(0,120) : url.slice(0,80);
    return { title, content: stripped, type: "page" };
  } catch (e:any) {
    return { title: url, content: `Fetch failed: ${e.message}`, type: "page" };
  }
}

function ingestPdf(path: string): { title: string; content: string } {
  // Lightweight: try to shell out to `pdftotext` if available, else raw read
  try {
    if (existsSync("/usr/bin/pdftotext") || existsSync("/opt/homebrew/bin/pdftotext")) {
      const out = execSync(`pdftotext -layout "${path}" -`, { encoding: "utf-8", maxBuffer: 10_000_000 });
      return { title: basename(path, extname(path)), content: out.slice(0,15000) };
    }
  } catch {}
  // Fallback: read as utf8 (may be binary)
  const raw = readFileSync(path, "utf-8").slice(0,5000);
  return { title: basename(path, extname(path)), content: raw };
}

function ingestAudio(path: string): { title: string; content: string; transcript?: string } {
  console.log(`  Audio ingest: ${path} — attempting local Whisper`);
  const base = basename(path, extname(path));
  // Try local whisper (openai-whisper) if installed
  try {
    const hasWhisper = (()=> { try { execSync("which whisper", { stdio:"ignore" }); return true; } catch { return false; } })();
    if (hasWhisper) {
      const tmpOut = join(vaultRoot, "04 Atlas & Meta/Logs", `whisper-${Date.now()}.txt`);
      // whisper <input> --model tiny --output_format txt --output_dir <logs>
      const outDir = join(vaultRoot, "04 Atlas & Meta/Logs");
      ensureDir(outDir);
      const res = spawnSync("whisper", [path, "--model", "tiny", "--output_format", "txt", "--output_dir", outDir], { encoding:"utf-8", timeout: 2*60*1000 });
      // whisper names output <basename>.txt
      const expected = join(outDir, base + ".txt");
      if (existsSync(expected)) {
        const txt = readFileSync(expected, "utf-8").slice(0,15000);
        return { title: base, content: txt, transcript: txt };
      }
    }
  } catch (e:any) { console.log(`  whisper failed: ${e.message}`); }
  return { title: base, content: `Audio file ${path} — transcript pending (install openai-whisper: pip install openai-whisper && whisper "${path}")`, transcript: undefined };
}

function ingestImage(path: string): { title: string; content: string } {
  console.log(`  Image ingest: ${path} — OCR placeholder (Claude vision reads on ingest if available)`);
  // If tesseract available, try
  try {
    if (existsSync("/usr/bin/tesseract") || existsSync("/opt/homebrew/bin/tesseract")) {
      const tmpTxt = join(vaultRoot, "04 Atlas & Meta/Logs", `ocr-${Date.now()}`);
      execSync(`tesseract "${path}" "${tmpTxt}"`, { stdio:"ignore" });
      if (existsSync(tmpTxt+".txt")) {
        const txt = readFileSync(tmpTxt+".txt", "utf-8").slice(0,8000);
        return { title: basename(path, extname(path)), content: `OCR from ${path}:\n${txt}` };
      }
    }
  } catch {}
  return { title: basename(path, extname(path)), content: `Image ${path} — visual content (run with Claude vision or install tesseract for OCR). Path preserved for manual review.` };
}

async function ingestYoutubeVisual(url: string): Promise<{ frames: number; notes: string }> {
  if (!visual) return { frames: 0, notes: "" };
  console.log(`  --visual: extracting frames via yt-dlp+ffmpeg (max ${maxFrames})`);
  const hasYtDlp = (()=> { try { execSync("which yt-dlp", { stdio:"ignore" }); return true; } catch { return false; } })();
  const hasFfmpeg = (()=> { try { execSync("which ffmpeg", { stdio:"ignore" }); return true; } catch { return false; } })();
  if (!hasYtDlp || !hasFfmpeg) {
    console.log(`  ⚠ yt-dlp or ffmpeg not found — skipping visual ingest. Install: brew install yt-dlp ffmpeg`);
    return { frames: 0, notes: "Visual ingest skipped — missing yt-dlp/ffmpeg" };
  }
  try {
    const tmpDir = join(vaultRoot, "04 Atlas & Meta/Logs", `ytvisual-${Date.now()}`);
    ensureDir(tmpDir);
    // Download <=720p
    execSync(`yt-dlp -f "bestvideo[height<=720]+bestaudio/best[height<=720]" --merge-output-format mp4 -o "${tmpDir}/video.%(ext)s" "${url}"`, { stdio:"ignore", timeout: 3*60*1000 });
    const vids = readdirSync(tmpDir).filter((f)=> f.startsWith("video."));
    if (vids.length===0) return { frames:0, notes:"yt-dlp download failed" };
    const videoPath = join(tmpDir, vids[0]);
    // ffmpeg scene detection
    const framesDir = join(tmpDir, "frames");
    ensureDir(framesDir);
    execSync(`ffmpeg -i "${videoPath}" -vf "select='gt(scene,0.4)',scale=640:-2" -vsync vfr "${framesDir}/frame-%03d.jpg" -loglevel error`, { timeout: 2*60*1000 });
    const frames = readdirSync(framesDir).filter((f)=> f.endsWith(".jpg")).slice(0, maxFrames);
    console.log(`  ✅ Extracted ${frames.length} frames → ${framesDir}`);
    return { frames: frames.length, notes: `Visual: ${frames.length} scene-change frames extracted to ${framesDir.replace(vaultRoot+"/","")}. Claude vision can read these for on-screen text/diagrams.` };
  } catch (e:any) {
    console.log(`  visual ingest failed: ${e.message}`);
    return { frames:0, notes:`Visual failed: ${e.message}` };
  }
}

function distributeToVault(title: string, content: string, sourceLabel: string, extra: { visualNotes?: string; rawPath?: string }) {
  const rawDir = join(vaultRoot, "raw");
  ensureDir(rawDir);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0,40) || "ingest";
  const rawPath = join(rawDir, `${slug}-${Date.now()}.md`);
  const rawContent = `# Raw — ${title}\n\nSource: ${sourceLabel}\nDate: ${todayISO()}\n\n---\n\n${content.slice(0,15000)}\n\n${extra.visualNotes? `\n## Visual Notes\n${extra.visualNotes}\n` : ""}`;
  writeFileSync(rawPath, rawContent, "utf-8");
  console.log(`  📦 Raw preserved → ${rawPath.replace(vaultRoot+"/","")}`);

  // Heuristic: find 3 most related hyperfixations to rewrite
  const hyperDir = join(vaultRoot, CONFIG.FOLDERS.hyperfixations);
  const atomicDir = join(vaultRoot, CONFIG.FOLDERS.atomic);
  const allNotes: { stem:string; path:string; content:string }[] = [];
  for (const dir of [hyperDir, atomicDir]) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".md")) continue;
      const p = join(dir, f);
      const raw = readFileSync(p, "utf-8");
      allNotes.push({ stem: basename(f,".md"), path: p, content: raw.slice(0,4000) });
    }
  }
  // Score via TF-IDF overlap of new content vs existing
  const newTf = termFrequency(content.slice(0,4000).toLowerCase());
  const scored = allNotes.map((n)=> {
    const tf = termFrequency(n.content.toLowerCase());
    let dot=0, ma=0, mb=0;
    for (const [k,v] of newTf) { ma+=v*v; const bv = tf.get(k)||0; dot+=v*bv; }
    for (const [,v] of tf) mb+=v*v;
    const cos = (ma&&mb)? dot/(Math.sqrt(ma)*Math.sqrt(mb)) : 0;
    return { ...n, score: cos };
  }).sort((a,b)=> b.score - a.score).slice(0, 5);

  console.log(`  🔗 Top related notes for rewrite:`);
  for (const s of scored.slice(0,3)) console.log(`   • ${s.stem} score=${s.score.toFixed(2)}`);

  // Inject insight into top 2 if score > 0.12
  let rewritten = 0;
  for (const hit of scored.slice(0,2)) {
    if (hit.score < 0.08) continue;
    const raw = readFileSync(hit.path, "utf-8");
    const parsed = matter(raw);
    const marker = `<!-- INGEST:${slug} -->`;
    if (raw.includes(marker)) continue;
    const insight = `\n\n${marker}\n> 🔄 **INGEST from ${title}** as of ${todayISO()} — ${sourceLabel.slice(0,80)}\n> ${content.slice(0,300).replace(/\n/g," ")}...\n> Source: ${sourceLabel}\n`;
    const newRaw = matter.stringify(parsed.content.trimEnd() + insight, { ...parsed.data, updated: todayISO() });
    writeFileSync(hit.path, newRaw, "utf-8");
    console.log(`  ✏️ Rewrote [[${hit.stem}]]`);
    rewritten++;
  }
  // Also create a synthesis stub if no high overlap
  if (rewritten===0 && scored[0]?.score < 0.12) {
    const atomicPath = join(atomicDir, `${title}.md`.replace(/[^a-zA-Z0-9 \-_]/g,"").slice(0,60));
    if (!existsSync(atomicPath)) {
      const atomicContent = `---
id: "${generateId()}"
title: "${title}"
type: "atomic-concept"
status: "synthesized"
created: "${todayISO()}"
updated: "${todayISO()}"
tags: ["ingest", "auto/ingest"]
aliases: []
resume_point: { last_explored: "${todayISO()}", current_thought: "ingested from ${sourceLabel.slice(0,40)}", next_step: "Refine definition" }
content_potential: { suggested_format: "none", confidence_score: 0.0 }
freshness: { type: dated, as_of: "${todayISO()}", source: "${sourceLabel.slice(0,80).replace(/"/g,"'")}" }
relations: []
---

# ${title}

## For future agent

> **Summary:** Ingested concept "${title}" from ${sourceLabel} as of ${todayISO()}. Source preserved at \`${rawPath.replace(vaultRoot+"/","")}\`. Rewrite-eligible for future ingests.

## Definition

> Ingested from ${sourceLabel} as of ${todayISO()}. Distill 2 sentences.

${content.slice(0,600).replace(/\n/g," ")}

## Provenance

> Ingested ${todayISO()} via vault:ingest from ${sourceLabel}
`;
      writeFileSync(atomicPath, atomicContent, "utf-8");
      console.log(`  ✨ Created atomic stub → ${atomicPath.replace(vaultRoot+"/","")}`);
      rewritten++;
    }
  }

  // Append to daily log
  try {
    const logPath = join(vaultRoot, CONFIG.FOLDERS.logs, "ingest.log");
    appendFileSync(logPath, `[${new Date().toISOString()}] ingest "${title}" src=${sourceLabel} rewrote=${rewritten} raw=${rawPath.replace(vaultRoot+"/","")}\n`);
  } catch {}

  console.log(`\n✅ Ingest complete — 1 source touched ${rewritten} notes (raw preserved immutably)`);
  console.log(`   Next: reconcile contradictions with vault:reconcile, or synthesize with vault:synthesize`);
}

async function main() {
  if (!input) {
    console.log(`Usage:\n  npm run vault:ingest -- <url|path> [--visual] [--max-frames 24]\n\nExamples:\n  npm run vault:ingest -- https://youtube.com/watch?v=xxx --visual\n  npm run vault:ingest -- ./meeting.m4a\n  npm run vault:ingest -- ./whiteboard.png\n  npm run vault:ingest -- ./paper.pdf\n\nSetup for full pipeline:\n  pip install openai-whisper  # audio → transcript (local)\n  brew install yt-dlp ffmpeg tesseract  # video + OCR\n`);
    process.exit(1);
  }

  console.log(`\n📥 Ingest — ${input}${visual? " --visual":""} (maxFrames ${maxFrames})`);

  // Determine type
  const isUrl = input.startsWith("http://") || input.startsWith("https://");
  if (isUrl) {
    const { title, content } = await ingestUrl(input);
    const visualRes = input.includes("youtube") ? await ingestYoutubeVisual(input) : { frames:0, notes:"" };
    distributeToVault(title, content, input, { visualNotes: visualRes.notes });
    return;
  }

  const fullPath = input.startsWith("/") ? input : join(vaultRoot, input);
  if (!existsSync(fullPath)) {
    console.error(`  ❌ File not found: ${fullPath}`);
    process.exit(1);
  }
  const ext = extname(fullPath).toLowerCase();
  if ([".m4a",".mp3",".wav",".ogg",".flac",".aiff"].includes(ext)) {
    const { title, content } = ingestAudio(fullPath);
    distributeToVault(title, content, fullPath, {});
  } else if ([".png",".jpg",".jpeg",".webp",".gif",".heic"].includes(ext)) {
    const { title, content } = ingestImage(fullPath);
    distributeToVault(title, content, fullPath, {});
  } else if (ext === ".pdf") {
    const { title, content } = ingestPdf(fullPath);
    distributeToVault(title, content, fullPath, {});
  } else if (ext === ".md" || ext === ".txt") {
    const raw = readFileSync(fullPath, "utf-8").slice(0,15000);
    const title = basename(fullPath, ext);
    distributeToVault(title, raw, fullPath, {});
  } else {
    console.log(`  Unknown ext ${ext} — treating as text`);
    const raw = readFileSync(fullPath, "utf-8").slice(0,15000);
    distributeToVault(basename(fullPath, ext), raw, fullPath, {});
  }
}

main().catch((e)=> { console.error("ingest failed", e); process.exit(1); });
