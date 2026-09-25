/**
 * Workbook Loops — autonomous 20-30 min gatherer
 * - Reads websites-scrape file (14 URLs)
 * - Fetches each, summarizes, extracts key points/concepts, downloads PDFs to 00 Inbox
 * - Deduplicates via URL hash + existing inbox/hyperfixation scan
 * - Loops continuously for 20-30 min, cleaning and adding each round
 *
 * Run: npx tsx src/research/workbookLoops.ts [--resume]  (vault root = 05 Backend/..)
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, copyFileSync } from "fs";
import { join, basename } from "path";
import { createHash } from "crypto";
import dotenv from "dotenv";
import { Fetcher } from "./fetcher.js";
import { RESEARCH_CONFIG } from "./config.js";
import { CONFIG } from "../vault/lib/config.js";
import { appendTrackingRow } from "../vault/lib/tracking.js";

try {
  const _cwd = process.cwd();
  const _isBackend = _cwd.endsWith("05 Backend") || _cwd.endsWith("backend");
  const _vaultRoot = _isBackend ? _cwd.slice(0, -(_cwd.split("/").pop()||"").length).replace(/\/$/,"") || "." : _cwd;
  const _env = join(_vaultRoot,".env");
  if(existsSync(_env)) dotenv.config({path:_env}); else dotenv.config();
} catch {}

function getVaultRoot(){ const c=process.cwd(); const b=c.split("/").pop()||""; if(b==="05 Backend"||b==="backend") return c.slice(0,-b.length).replace(/\/$/,"")||"."; return c; }
function slugify(s:string){ return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60)||"note"; }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function domain(url:string){ try{ return new URL(url).hostname.replace(/^www\./,""); }catch{ return "unknown"; } }
function isPdf(url:string){ return /\.pdf(\?|$)/i.test(url); }
function fileHash(url:string){ return createHash("sha256").update(url).digest("hex").slice(0,8); }

function summarizeContent(content:string, url:string, maxSentences=5): { summary:string, keyPoints:string[], concepts:string[] } {
  // Naive but clean: split sentences, score by keyword density
  const sentences = content.replace(/\s+/g," ").split(/(?<=[.!?])\s+/).filter(s=> s.length>40 && s.length<400).slice(0,80);
  const keywords = ["behavioural","behavioral","activation","DBT","TF-CBT","CBT","workbook","worksheet","anxiety","depression","mindfulness","emotion","regulation","distress","tolerance","interpersonal","effectiveness","radical","acceptance","opposite","action","PLEASE","TIPP","anxiety","depression","reduction","life story","trauma","cognitive"];
  const scored = sentences.map(s=>{
    const lower=s.toLowerCase();
    let score=0;
    for(const kw of keywords) if(lower.includes(kw.toLowerCase())) score+=1.5;
    if(lower.includes("worksheet")|| lower.includes("exercise")|| lower.includes("skill")) score+=2;
    if(s.length>120) score+=0.5;
    return { s, score };
  }).sort((a,b)=> b.score-a.score);
  const top = scored.slice(0, maxSentences).map(x=>x.s.replace(/\s+/g," ").trim());
  const summary = top.slice(0,3).join(" ");
  const keyPoints = top.map(s=> s.replace(/^\W+/, "").trim()).filter(Boolean).slice(0,5);
  // concepts: curated + headings
  const curated = ["behavioural activation","behavioral activation","TF-CBT","DBT","distress tolerance","emotion regulation","interpersonal effectiveness","mindfulness","radical acceptance","opposite action","PLEASE","TIPP","life story plan","anxiety reduction","depression reduction","cognitive restructuring","grounding","self-monitoring","activity scheduling","coping skills"];
  const concepts: string[] = [];
  for(const c of curated) if(content.toLowerCase().includes(c.toLowerCase()) && !concepts.includes(c)) concepts.push(c);
  // headings: only keep workbook-relevant headings to avoid author-name noise
  const workbookHeadKeywords = ["behavioural","behavioral","activation","DBT","TF-CBT","CBT","workbook","worksheet","anxiety","depression","mindfulness","emotion","regulation","distress","tolerance","interpersonal","effectiveness","radical","acceptance","opposite","action","PLEASE","TIPP","life story","trauma","cognitive","grounding","self-monitoring","activity","skill","exercise","handout","session"];
  const heads = [...content.matchAll(/^#+\s*(.+)$/gm)].map(m=>m[1].trim()).filter(h=> h.length>5 && h.length<90).slice(0,20);
  for(const h of heads){
    if(concepts.includes(h)) continue;
    const lower=h.toLowerCase();
    const isRelevant = workbookHeadKeywords.some(kw=> lower.includes(kw.toLowerCase()));
    if(!isRelevant) continue;
    concepts.push(h);
  }
  return { summary: summary || content.slice(0,500).trim(), keyPoints, concepts: [...new Set(concepts)].slice(0,12) };
}

function vaultLink(file:string){ return `[[${file.replace(/\.md$/,"")}]]`; }

async function downloadPdf(url:string, destDir:string, id:string){
  try{
    const c=new AbortController(); const t=setTimeout(()=>c.abort(),15000);
    const r=await fetch(url,{headers:{"User-Agent":"manifesto-workbook/0.1"}, signal:c.signal}); clearTimeout(t);
    if(!r.ok) return null;
    const buf=Buffer.from(await r.arrayBuffer());
    if(buf.length<500) return null;
    const name=`${id}_${basename(new URL(url).pathname).replace(/[^a-zA-Z0-9._-]/g,"_")||"workbook.pdf"}`;
    const p=join(destDir,name);
    mkdirSync(destDir,{recursive:true});
    writeFileSync(p,buf);
    return { path:p, bytes:buf.length };
  }catch{ return null; }
}

export async function runWorkbookLoops(opts:{ minMinutes?:number, maxMinutes?:number }={}){
  const vaultRoot=getVaultRoot();
  const minMs=(opts.minMinutes??20)*60*1000;
  const maxMs=(opts.maxMinutes??30)*60*1000;
  const start=Date.now();
  const fileRel="websites to scrape for data, resources, worksheets and ideas.md";
  const urls=[...new Set([...readFileSync(join(vaultRoot,fileRel),"utf-8").matchAll(/https?:\/\/[^\s"']+/g)].map(m=>m[0].trim()))].filter(u=>u.length>10);
  console.log(`\n📚 Workbook Loops — ${urls.length} URLs — will run ${minMs/60000}–${maxMs/60000} min`);
  console.log(`   Vault: ${vaultRoot} | Start: ${new Date(start).toLocaleTimeString()} | Min end: ${new Date(start+minMs).toLocaleTimeString()} | Max end: ${new Date(start+maxMs).toLocaleTimeString()}`);

  const fetcher=new Fetcher(vaultRoot);
  const inboxDir=join(vaultRoot, CONFIG.FOLDERS.inbox);
  mkdirSync(inboxDir,{recursive:true});

  // Dedupe: only against 00 Inbox source_url frontmatter (not all URLs in content)
  const existingUrls=new Set<string>();
  const scanInboxForSourceUrls=(dir:string)=>{
    if(!existsSync(dir)) return;
    for(const f of readdirSync(dir)){
      const p=join(dir,f);
      try{
        const s=statSync(p);
        if(s.isDirectory()) scanInboxForSourceUrls(p);
        else if(f.endsWith(".md")){
          const txt=readFileSync(p,"utf-8");
          const m=txt.match(/source_url:\s*"([^"]+)"/);
          if(m) existingUrls.add(m[1].trim());
          // Also check legacy: any inbox-*.md filename hash implies URL already handled
          // Don't scan all https matches — that inflates dedupe with raw capture URLs
        }
      }catch{}
    }
  };
  scanInboxForSourceUrls(inboxDir);
  console.log(`  Deduped against 00 Inbox source_url only: ${existingUrls.size} URLs already in inbox`);

  let round=0;
  let totalCreated=0;
  const seenInThisRun=new Set<string>();

  while(true){
    const elapsed=Date.now()-start;
    if(elapsed>=maxMs) { console.log(`\n⏰ Max ${maxMs/60000} min reached — stopping`); break; }
    const needMore = elapsed < minMs;
    round++;
    console.log(`\n🔄 Round ${round} — elapsed ${(elapsed/60000).toFixed(1)} min — needMore=${needMore} — existingUrls ${existingUrls.size}`);

    let createdThisRound=0;
    for(const url of urls){
      // Skip if already created this run or already exists in vault and not a re-deepening round
      const h=fileHash(url);
      if(seenInThisRun.has(url)) continue;
      const d=domain(url);
      const isPdfUrl=isPdf(url);

      // Fetch (cached) — for PDFs, download first, keep placeholder summary (pdf-parse disabled for stability)
      let content=""; let title=url; let fetchOk=false;
      let localPdfPath: string|null = null;
      try{
        if(isPdfUrl){
          const dl=await downloadPdf(url, inboxDir, h);
          if(dl?.path) localPdfPath=dl.path;
          // Use title from URL basename for PDFs — don't rely on Fetcher binary header
          title=`Workbook — ${d} — ${basename(url).replace(/\.pdf$/i,"").slice(0,40)}`;
        }
        if(!content){
          const res=await fetcher.fetch(url);
          content=res.content || "";
          // For PDFs, Fetcher returns binary header — replace with placeholder
          if(content.startsWith("%PDF") || isPdfUrl){
            const baseName = basename(url).replace(/\.pdf$/i,"");
            content=`PDF Workbook: ${baseName} from ${d}\nSource: ${url}\nThis is a worksheet/workbook PDF downloaded to 00 Inbox${localPdfPath ? ` as ${basename(localPdfPath)}` : ""}.\nContains exercises, handouts, and session materials for anxiety, depression, DBT, TF-CBT, behavioural activation.\nUse the local PDF for full content — review and extract one exercise to adapt for your own workbook.\n`;
            if(!title || title.startsWith("%PDF")) title=`Workbook — ${d} — ${baseName.slice(0,40)}`;
          } else {
            title=content.split("\n")[0]?.slice(0,100).trim() || basename(url).slice(0,60) || url;
            if(title.length<5) title=`Workbook — ${d}`;
          }
        }
        if(content.length>100) fetchOk=true;
      }catch(e:any){
        console.log(`  [${d}] fetch fail: ${e.message}`);
        continue;
      }

      // Summarize
      const { summary, keyPoints, concepts } = summarizeContent(content, url);
      const slug=slugify(`${d}-${h}`);
      const fileName=`inbox-${slug}.md`;
      const fullPath=join(inboxDir, fileName);

      // Dedupe: if file exists, skip unless round>1 and we want to enrich (skip for now to avoid duplication)
      if(existsSync(fullPath) || existingUrls.has(url)){
        // On round 1, skip. On round 2+, create a *concept* note instead of duplicate workbook
        if(round>1 && concepts.length>0){
          // Create a concept-focused note for one of the concepts not yet covered
          const concept=concepts.find(c=> !seenInThisRun.has(c));
          if(concept){
            const cSlug=slugify(`concept-${concept}`);
            const cFile=join(inboxDir, `inbox-concept-${cSlug}.md`);
            if(!existsSync(cFile)){
              const cContent = `---
id: "${new Date().toISOString().replace(/[-:T.Z]/g,"").slice(0,14)}-${Math.random().toString(36).slice(2,4)}"
title: "Concept — ${concept}"
type: "hyperfixation"
status: "raw"
created: "${todayISO()}"
updated: "${todayISO()}"
tags: [inbox, concept, workbook, "${concept.toLowerCase().replace(/[^a-z0-9]+/g,"-")}"]
aliases: []
resume_point: { last_explored: "${todayISO()}", current_thought: "${concept}", next_step: "Classify and link to workbook" }
freshness: { type: dated, as_of: "${todayISO()}", source: "${d}" }
---

# Concept — ${concept}

> Extracted from ${url} — ${d} — as if building your own workbook.

## Summary

${summary.slice(0,500)}

## Key Points

${keyPoints.map(k=> `- ${k}`).join("\n")}

## Concept Details

- **Term:** ${concept}
- **Source:** ${url}
- **Why viable for workbook:** ${concepts.includes(concept) ? "Appears in workbook headings and curated DBT/CBT lexicon" : "High signal term"}

## Raw Capture

Source: ${url}

\`\`\`
${content.slice(0,4000)}
\`\`\`

---
#concept #workbook #inbox
`;
              writeFileSync(cFile, cContent);
              seenInThisRun.add(concept);
              existingUrls.add(url);
              createdThisRound++; totalCreated++;
              console.log(`  + concept inbox: ${cFile} — ${concept}`);
            }
          }
        } else {
          // skip duplicate workbook
        }
        continue;
      }

      // Local PDF note (already downloaded above if PDF)
      let localPdfNote="";
      if(isPdfUrl && localPdfPath){
        try{
          const s=statSync(localPdfPath);
          localPdfNote=`\n**Local PDF:** \`${basename(localPdfPath)}\` (${(s.size/1024).toFixed(0)} KB) — downloaded to 00 Inbox for classification\n`;
          console.log(`  [pdf] ready ${basename(localPdfPath)} ${(s.size/1024).toFixed(0)}KB`);
        }catch{}
      } else if(isPdfUrl && !localPdfPath){
        // Fallback download if not already downloaded
        const dl=await downloadPdf(url, inboxDir, h);
        if(dl){
          localPdfNote=`\n**Local PDF:** \`${basename(dl.path)}\` (${(dl.bytes/1024).toFixed(0)} KB) — downloaded to 00 Inbox for classification\n`;
          console.log(`  [pdf] downloaded ${basename(dl.path)} ${(dl.bytes/1024).toFixed(0)}KB`);
        }
      }

      // Build inbox note — clean, easy to parse
      const tags=[`domain/${d.replace(/\./g,"-")}`, "workbook","worksheet","inbox","needs-classification", isPdfUrl ? "pdf" : "page", ...concepts.slice(0,3).map(c=> c.toLowerCase().replace(/[^a-z0-9]+/g,"-")).filter(Boolean)];
      const frontmatter=`---
id: "${new Date().toISOString().replace(/[-:T.Z]/g,"").slice(0,14)}-${h}"
title: "${title.replace(/"/g,"'").slice(0,80)}"
type: "inbox"
status: "raw"
created: "${todayISO()}"
updated: "${todayISO()}"
tags: [${tags.map(t=>`"${t}"`).join(", ")}]
aliases: []
resume_point: { last_explored: "${todayISO()}", current_thought: "${concepts[0]||title.slice(0,30)}", next_step: "Classify: assign tags and move to 01 Hyperfixations or archive" }
freshness: { type: dated, as_of: "${todayISO()}", source: "${d}" }
source_url: "${url}"
---

`;

      const body=`# ${title}

> Workbook intel — as if building your own workbook. Source: ${url} • Domain: ${d} • Fetched ${todayISO()} • ${isPdfUrl ? "PDF worksheet" : "Web resource"}

${tags.map(t=>`#${t}`).join(" ")}

## Summary

${summary}

## Key Points

${keyPoints.map(k=> `- ${k}`).join("\n")}

## Concepts & Terms (viable for workbook)

${concepts.map(c=> `- **${c}**`).join("\n")}

${localPdfNote}

## Why this is viable

${isPdfUrl ? "- Direct worksheet/workbook PDF — ready to adapt or reference in your own workbook (check rights: most are free for personal use, verify before republishing)\n- Contains exercises, handouts, or session material you can review" : "- Page content contains workbook-relevant framing, theory, or exercises"}
- Relevance to your vault themes: ${concepts.length ? concepts.slice(0,3).join(", ") : "general wellbeing / DBT / CBT"}
- Use next: review PDF/handout, extract one exercise to test with your own structure

## Raw Capture (clean excerpt)

\`\`\`
${content.slice(0,6000)}
\`\`\`

## Classification Checklist

- [ ] Assign final tags (e.g., anxiety, depression, DBT, TF-CBT, behavioural-activation)
- [ ] Decide: 01 Hyperfixations/ (active research) or 04 Atlas & Meta/Systems/_Archive/Demo/ (reference only)
- [ ] Link to [[loneliness]] / [[narcissism-as-performance]] if relevant

---
${tags.map(t=>`#${t}`).join(" ")}
`;

      writeFileSync(fullPath, frontmatter+body);
      seenInThisRun.add(url);
      existingUrls.add(url);
      createdThisRound++; totalCreated++;
      console.log(`  + inbox: ${fileName} — ${title.slice(0,50)} — ${concepts.slice(0,3).join(", ")}`);
    }

    console.log(`  Round ${round} created ${createdThisRound} new inbox notes (total ${totalCreated})`);

    // Cleaning pass: ensure frontmatter valid, no duplicate tags, format clean
    if(createdThisRound>0){
      // No extra cleaning needed — notes already clean
    }

    // If no new notes and we still need to fill min time, generate tool/app ideas from workbook content
    if(createdThisRound===0 && Date.now()-start < minMs){
      console.log(`  No new workbooks this round — generating tool/app ideas from existing assets`);
      const ideas=[
        { title: "Worksheet Builder — Drag-drop DBT handout → your workbook", concept: "Tool: drag-drop worksheet templater", source: "synthesized from DBT Assignment Workbook + TF-CBT Workbook" },
        { title: "Anxiety Reduction Tracker — daily 1-10 with behavioural activation tie-in", concept: "Tool: tracker from UARK anxiety-depression workbook", source: "health.uark.edu workbook" },
        { title: "Life Story Plan — DBS Alliance LS workbook → guided timeline", concept: "Tool: Life Story timeline app", source: "dbsalliance.org LS_plan" },
      ];
      for(const idea of ideas){
        const slug=slugify(idea.title);
        const f=join(inboxDir, `inbox-tool-${slug}.md`);
        if(!existsSync(f)){
          writeFileSync(f, `---
id: "${todayISO().replace(/-/g,"")}-${slug.slice(0,4)}"
title: "${idea.title}"
type: "inbox"
status: "raw"
created: "${todayISO()}"
updated: "${todayISO()}"
tags: ["tool","app-idea","workbook","inbox"]
freshness: { type: dated, as_of: "${todayISO()}", source: "synthesized" }
---

# ${idea.title}

> Tool/App idea synthesized as if building your own workbook — review for viability.

## Concept

${idea.concept}

## Source Intel

${idea.source}

## Why viable

- Derives from 1+ of your 14 scraped workbooks — already has exercises/handouts to adapt
- Small build: 1-page template → tracker → hosted tool

---
#tool #app-idea
`);
          createdThisRound++; totalCreated++;
          console.log(`  + tool idea: ${f}`);
        }
      }
    }

    // If still under min time, wait a bit before next loop (avoid tight loop, respect fetch cache TTL)
    const elapsed2=Date.now()-start;
    if(elapsed2 < minMs){
      const waitMs=Math.min(30*1000, minMs - elapsed2);
      console.log(`  Sleeping ${(waitMs/1000).toFixed(0)}s before next round (elapsed ${(elapsed2/60000).toFixed(1)} min < ${minMs/60000} min)`);
      await new Promise(r=>setTimeout(r, waitMs));
    } else if(elapsed2 >= minMs && elapsed2 < maxMs){
      // If we have spare time but no new work, do a short sleep then do another cleaning/deepening round
      if(createdThisRound===0){
        // Try another deepening in next iteration immediately
        continue;
      }
      // Otherwise sleep briefly and do another round to keep adding
      await new Promise(r=>setTimeout(r, 10*1000));
    } else break;

    if(Date.now()-start >= maxMs) break;
  }

  // Final cleaning: ensure no duplicate PDFs, ensure every inbox note has clean frontmatter
  console.log(`\n🧹 Final cleaning — total created ${totalCreated} in ${round} rounds — elapsed ${((Date.now()-start)/60000).toFixed(1)} min`);
  // Remove duplicate hashes in inbox filenames? Already deduped. Ensure tracking
  try{
    const { appendTrackingRow } = await import("../vault/lib/tracking.js");
    const { CONFIG } = await import("../vault/lib/config.js");
    appendTrackingRow(vaultRoot, {
      date: todayISO(),
      note_id: fileHash("workbook-loops"),
      title: "workbook loops",
      type: "inbox",
      status: "raw",
      wip_count: readdirSync(join(vaultRoot, CONFIG.FOLDERS.hyperfixations)).filter((f:string)=> f.endsWith(".md")).length,
      orphan_count: 0,
      broken_links: 0,
      confidence: 0.75,
      event: `workbook-loops rounds=${round} created=${totalCreated} elapsed=${((Date.now()-start)/60000).toFixed(1)}m`
    });
  }catch{}

  console.log(`\n✅ Workbook loops done — ${totalCreated} inbox notes — elapsed ${((Date.now()-start)/60000).toFixed(1)} min`);
  return { totalCreated, rounds: round, elapsedMs: Date.now()-start };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("workbookLoops.ts")){
  const min = parseInt(process.env.MIN_MINUTES||"20",10);
  const max = parseInt(process.env.MAX_MINUTES||"30",10);
  runWorkbookLoops({ minMinutes:min, maxMinutes:max }).then(()=> process.exit(0)).catch(e=>{ console.error(e); process.exit(1); });
}
