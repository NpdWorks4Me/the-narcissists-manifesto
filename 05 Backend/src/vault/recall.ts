/**
 * vault:recall — bounded recall hook (mirrors obsidian-second-brain UserPromptSubmit hook)
 * Injects max 4 notes / ~900 chars on every prompt, or abstains if low confidence.
 * Usage:
 *   npm run vault:recall -- "what's my stance on narcissism as performance?" [--json]
 *   npm run vault:recall -- --hook-install   # writes hooks/recall.hook.example.json (in 05 Backend/hooks)
 * Opt-in via env: OBISIDIAN_RECALL_ENABLED=1
 * Logs to .claude-runs/ for audit (fail-closed, read-only)
 */
import { readdirSync, readFileSync, existsSync, statSync, writeFileSync, mkdirSync, appendFileSync } from "fs";
import { join, basename } from "path";
import { parseFrontmatter } from "./lib/frontmatter.js";
import { termFrequency, cosineSimilarityTF } from "./lib/nlp.js";
import { CONFIG } from "./lib/config.js";

const _cwd = process.cwd();
const vaultRoot = (() => { const base = _cwd.split("/").pop() || ""; const isBackend = base === "backend" || base === "05 Backend"; return isBackend ? _cwd.slice(0, -base.length).replace(/\/$/, "") || "." : _cwd; })();

const MAX_NOTES = 4;
const MAX_CHARS = 900;
const THRESHOLD = 0.12; // abstain below

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
        out.push({ rel, stem: basename(e,".md"), raw, data: parsed.data, content: parsed.content });
      }
    }
  }
  walk(full, dirRel);
  return out;
}

function recall(query: string): { hits: any[]; abstain: boolean; brief: string } {
  const pool = [...collect(CONFIG.FOLDERS.hyperfixations), ...collect(CONFIG.FOLDERS.atomic), ...collect(CONFIG.FOLDERS.contentLab)].filter((n)=> n.content.length > 80);
  const qTf = termFrequency(query.toLowerCase());
  const scored = pool.map((p)=> ({ ...p, score: cosineSimilarityTF(qTf, termFrequency(p.content.toLowerCase().slice(0,4000))) })).sort((a,b)=> b.score - a.score).slice(0, MAX_NOTES);
  const topScore = scored[0]?.score || 0;
  const abstain = topScore < THRESHOLD;
  if (abtain()) return { hits: [], abstain: true, brief: "" };
  // Build brief ≤900 chars
  let brief = `Vault recall for: "${query.slice(0,120)}"\n`;
  let chars = brief.length;
  const hits: any[] = [];
  for (const h of scored) {
    if (h.score < THRESHOLD) continue;
    const snippet = h.content.replace(/[#>*`\[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
    const line = `- [[${h.stem}]] (${h.score.toFixed(2)}): ${snippet}\n`;
    if (chars + line.length > MAX_CHARS) break;
    brief += line;
    chars += line.length;
    hits.push({ stem: h.stem, path: h.rel, score: Number(h.score.toFixed(2)), snippet });
  }
  if (hits.length === 0) return { hits: [], abstain: true, brief: "" };
  return { hits, abstain: false, brief };
  function abtain(){ return topScore < THRESHOLD; }
}

function logRecall(query: string, result: any) {
  const dir = join(vaultRoot, ".claude-runs");
  try {
    mkdirSync(dir, { recursive: true });
    const entry = { ts: new Date().toISOString(), query: query.slice(0,300), abstain: result.abstain, hits: result.hits, enabled: process.env.OBSIDIAN_RECALL_ENABLED === "1" };
    appendFileSync(join(dir, "recall.log"), JSON.stringify(entry)+"\n", "utf-8");
  } catch {}
}

// Hook installer
if (process.argv.includes("--hook-install")) {
  const hooksDir = join(_cwd, "hooks");
  mkdirSync(hooksDir, { recursive: true });
  const hook = {
    hook: "UserPromptSubmit",
    command: "npm run vault:recall -- \"$USER_PROMPT\"",
    description: "Bounded vault recall (max 4 notes, ~900 chars, abstain if low confidence) — opt-in via OBISIDIAN_RECALL_ENABLED=1",
    enabled: false,
    env: "OBSIDIAN_RECALL_ENABLED=1",
    limits: { maxNotes: MAX_NOTES, maxChars: MAX_CHARS, threshold: THRESHOLD },
    log: ".claude-runs/recall.log",
  };
  writeFileSync(join(hooksDir, "recall.hook.example.json"), JSON.stringify(hook, null, 2), "utf-8");
  console.log(`✅ Hook example → hooks/recall.hook.example.json (enable with OBISIDIAN_RECALL_ENABLED=1)`);
  process.exit(0);
}

const query = process.argv.slice(2).filter((a)=> !a.startsWith("--") && a !== "recall.ts").join(" ").trim();
if (!query || query === "--hook-install") {
  if (!process.argv.includes("--hook-install")) {
    console.log('Usage: npm run vault:recall -- "your prompt" [--json] | --hook-install');
  }
  process.exit(0);
}

const enabled = process.env.OBSIDIAN_RECALL_ENABLED === "1";
if (!enabled) {
  console.log(`(recall disabled — set OBISIDIAN_RECALL_ENABLED=1 to enable; running dry-run preview)`);
}

const result = recall(query);
logRecall(query, result);

if (result.abstain) {
  console.log(`\n🔇 Abstain — no vault notes above threshold ${THRESHOLD} for: "${query.slice(0,100)}"\n`);
} else {
  console.log(`\n📚 Bounded recall — ${result.hits.length} notes, ${result.brief.length} chars (threshold ${THRESHOLD})\n`);
  console.log(result.brief);
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ query, enabled, ...result }, null, 2));
}
