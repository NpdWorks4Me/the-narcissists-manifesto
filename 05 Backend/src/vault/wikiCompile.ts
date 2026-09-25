/**
 * Wiki Compiler — takes new terms/concepts that made it to 02 masters and compiles them to wiki-narc-proof/wiki
 *
 * Reads: 02 Atomic Concepts/_Master — Key Terms.md  and  _Master — Key Concepts.md
 * Writes: wiki-narc-proof/wiki/concepts/<slug>.md for each term not yet in wiki + updates wiki/index.md
 * Also refreshes masters' "Vault-Wide Keyword Index" section from current vault state
 *
 * Usage:
 *   npm run wiki:compile          # compile masters → wiki
 *   npm run wiki:compile -- --dry-run
 *   Triggered nightly after synthesize in vaultd.ts (22:00)
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "fs";
import { join, basename } from "path";
import matter from "gray-matter";

const _cwd = process.cwd();
const vaultRoot = (() => { const base = _cwd.split("/").pop() || ""; const isBackend = base === "backend" || base === "05 Backend"; return isBackend ? _cwd.slice(0, -base.length).replace(/\/$/, "") || "." : _cwd; })();
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const today = new Date().toISOString().slice(0,10);

function slugify(s: string){ return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60) || "term"; }
function collectVaultTerms(): Set<string> {
  const terms = new Set<string>();
  const scan = (dirRel: string) => {
    const full = join(vaultRoot, dirRel);
    if(!existsSync(full)) return;
    const walk = (dir: string) => {
      for(const e of readdirSync(dir)){
        if(e.startsWith(".")) continue;
        const p = join(dir, e);
        const s = statSync(p);
        if(s.isDirectory()) walk(p);
        else if(e.endsWith(".md")){
          try{
            const raw = readFileSync(p,"utf-8");
            const m = raw.match(/title:\s*"([^"]+)"/);
            if(m) terms.add(m[1].trim());
            // Also headings for masters
            const heads = [...raw.matchAll(/^##\s+(.+)$/gm)].map(x=> x[1].trim().replace(/\(.*\)/,"").trim());
            for(const h of heads) if(h.length>4 && h.length<60 && !h.toLowerCase().includes("vault-wide") && !h.toLowerCase().includes("classification")) terms.add(h);
          }catch{}
        }
      }
    };
    walk(full);
  };
  scan("02 Atomic Concepts");
  scan("01 Hyperfixations");
  scan("04 Atlas & Meta/Systems/Behavioral Loops");
  // wiki concepts themselves
  scan("wiki-narc-proof/wiki/concepts");
  return terms;
}

function extractMasterTerms(masterPath: string): { title: string, definition: string, source: string }[] {
  const raw = readFileSync(join(vaultRoot, masterPath), "utf-8");
  const terms: { title:string, definition:string, source:string }[] = [];
  // Split by ## headings
  const sections = raw.split(/^##\s+/m);
  for(const sec of sections.slice(1)){
    const lines = sec.split("\n");
    const title = lines[0].trim().replace(/\(.*\)/,"").trim();
    if(title.toLowerCase().includes("vault-wide") || title.toLowerCase().includes("classification") || title.toLowerCase().includes("how to use")) continue;
    if(title.length<4 || title.length>80) continue;
    // Definition is next paragraph after **Definition:**
    const defMatch = sec.match(/\*\*Definition:\*\*\s*(.+?)(?:\n\n|\n\*\*Source)/s);
    const def = defMatch ? defMatch[1].trim().slice(0,400) : sec.slice(0,400).replace(/\n/g," ").trim();
    const srcMatch = sec.match(/\*\*Source:\*\*\s*(.+)/);
    const src = srcMatch ? srcMatch[1].trim().slice(0,120) : "vault";
    terms.push({ title, definition: def, source: src });
  }
  return terms;
}

function ensureWikiIndex(terms: {slug:string,title:string}[]){
  const indexPath = join(vaultRoot, "wiki-narc-proof/wiki/index.md");
  if(!existsSync(indexPath)) return;
  let raw = readFileSync(indexPath,"utf-8");
  // Count existing entries
  const existing = new Set([...raw.matchAll(/\[\[([^\]]+)\|/g)].map(m=> m[1].trim()));
  const newTerms = terms.filter(t=> !existing.has(t.slug));
  if(newTerms.length===0) {
    console.log(`  Wiki index: ${existing.size} entries, no new terms to add`);
    return;
  }
  console.log(`  Wiki index: adding ${newTerms.length} new terms`);
  const additions = newTerms.map(t=> `- **[[${t.slug}|${t.title}]]** — ${t.title} — auto-compiled from 02 masters ${today}.`).join("\n");
  if(dryRun){
    console.log(`  [dry-run] would append to index:\n${additions}`);
    return;
  }
  // Append before last line or at end
  raw = raw.trimEnd() + "\n\n" + additions + "\n";
  writeFileSync(indexPath, raw, "utf-8");
  console.log(`  Updated wiki/index.md with ${newTerms.length} entries`);
}

async function main(){
  console.log(`\n📚 Wiki Compile — masters → wiki ${dryRun ? "(dry-run)" : ""}`);
  console.log(`   Vault: ${vaultRoot}`);

  // 1. Refresh masters' vault-wide index (so masters always contain all keywords)
  const allTerms = collectVaultTerms();
  console.log(`  Vault terms collected: ${allTerms.size}`);

  // Update masters' Vault-Wide section if exists
  const masters = ["02 Atomic Concepts/_Master — Key Terms.md", "02 Atomic Concepts/_Master — Key Concepts.md"];
  for(const rel of masters){
    const full = join(vaultRoot, rel);
    if(!existsSync(full)) { console.log(`  Missing master ${rel}`); continue; }
    let raw = readFileSync(full,"utf-8");
    if(raw.includes("Vault-Wide Keyword Index")){
      const sorted = [...allTerms].sort().slice(0,120);
      const section = sorted.map(t=> `- **${t}**`).join("\n");
      const newSection = `## Vault-Wide Keyword Index (auto-compiled — all terms in vault)\n\n> This section is auto-generated by \`wiki:compile\` — do not edit manually. It lists every term/concept currently in \`02\`, \`01\`, \`04\`, and \`wiki\`. New entries added to \`01\` that are promoted to \`02\` will appear here on next compile.\n\n${section}\n\n*... truncated to 120 for display — full list in \`wiki:compile\` log.*\n`;
      // Replace existing section (from ## Vault-Wide ... until next ## )
      raw = raw.replace(/## Vault-Wide Keyword Index[\s\S]*?\n\*... truncated.*?\n/, newSection);
      if(!dryRun) writeFileSync(full, raw, "utf-8");
      console.log(`  Refreshed ${rel} vault-wide index (${sorted.length})`);
    }
  }

  // 2. Extract terms from masters and compile to wiki
  const keyTerms = existsSync(join(vaultRoot,masters[0])) ? extractMasterTerms(masters[0]) : [];
  const keyConcepts = existsSync(join(vaultRoot,masters[1])) ? extractMasterTerms(masters[1]) : [];
  const allMasterTerms = [...keyTerms, ...keyConcepts];
  console.log(`  Masters: ${keyTerms.length} key terms + ${keyConcepts.length} key concepts = ${allMasterTerms.length} total`);

  const wikiConceptsDir = join(vaultRoot, "wiki-narc-proof/wiki/concepts");
  mkdirSync(wikiConceptsDir,{recursive:true});
  const existingWiki = new Set(readdirSync(wikiConceptsDir).map(f=> basename(f,".md")));

  let created=0;
  const indexTerms: {slug:string,title:string}[] = [];
  for(const t of allMasterTerms){
    const slug = slugify(t.title);
    indexTerms.push({slug, title: t.title});
    if(existingWiki.has(slug)) continue;
    const wikiPath = join(wikiConceptsDir, `${slug}.md`);
    const body = `# ${t.title}

> Auto-compiled from \`02 Atomic Concepts/_Master\` ${today} — source: ${t.source}

## Definition

${t.definition}

## Source

${t.source} — as of ${today}, vault

## See also

- [[${slug}]] — concept page
- Master glossary: \`02 Atomic Concepts/_Master — Key Terms.md\`

---
*Compiled by \`wiki:compile\` ${today} — do not edit manually; edit the master and re-compile.*\n`;
    if(dryRun){
      console.log(`  [dry-run] would create wiki/${slug}.md — ${t.title}`);
    } else {
      writeFileSync(wikiPath, body, "utf-8");
      console.log(`  + wiki/${slug}.md — ${t.title}`);
      created++;
    }
  }
  console.log(`  Wiki: ${created} new files (dryRun=${dryRun})`);

  // 3. Update wiki index
  ensureWikiIndex(indexTerms);

  // 4. Log
  const logDir = join(vaultRoot, "04 Atlas & Meta/Logs");
  const logPath = join(logDir, "wiki-compile.log");
  const line = `[${new Date().toISOString()}] wiki:compile ${dryRun?"dry-run":"apply"} terms=${allMasterTerms.length} created=${created} vaultTerms=${allTerms.size}\n`;
  if(!dryRun) {
    try{ const { appendFileSync } = await import("fs"); appendFileSync(logPath, line); }catch{}
  }
  console.log(line.trim());
  console.log(`\n✅ Wiki compile ${dryRun?"(dry-run)":""} done — trigger via: npm run wiki:compile or nightly 22:00`);
}

main().catch(e=>{ console.error(e); process.exit(1); });
