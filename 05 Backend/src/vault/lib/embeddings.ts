/**
 * Hybrid semantic search — Ollama local embeddings + TF-IDF fallback
 * Keeps existing TF-IDF cosine but augments with embedding cosine when available.
 * Incremental index stored at 04 Atlas & Meta/Logs/semantic-index.json
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { termFrequency, cosineSimilarityTF } from "./nlp.js";
import { CONFIG } from "./config.js";

export interface EmbeddingEntry {
  stem: string;
  path: string;
  tf: Record<string, number>;
  embedding?: number[]; // if Ollama available
  updated: string;
  hash: string;
}

const INDEX_REL = "04 Atlas & Meta/Logs/semantic-index.json";

function getVaultRoot(): string {
  const cwd = process.cwd();
  const base = cwd.split("/").pop() || "";
  const isBackend = base === "backend" || base === "05 Backend";
  if (isBackend) return cwd.slice(0, -base.length).replace(/\/$/, "") || ".";
  return cwd;
}

export function loadIndex(): Record<string, EmbeddingEntry> {
  const vaultRoot = getVaultRoot();
  const full = join(vaultRoot, INDEX_REL);
  if (!existsSync(full)) return {};
  try { return JSON.parse(readFileSync(full, "utf-8")); } catch { return {}; }
}

export function saveIndex(idx: Record<string, EmbeddingEntry>) {
  const vaultRoot = getVaultRoot();
  const full = join(vaultRoot, INDEX_REL);
  mkdirSync(join(vaultRoot, "04 Atlas & Meta/Logs"), { recursive: true });
  writeFileSync(full, JSON.stringify(idx, null, 2), "utf-8");
}

function hashContent(s: string): string {
  let h = 0; for (let i=0;i<s.length;i++) { h = ((h<<5)-h)+s.charCodeAt(i); h|=0; }
  return String(h);
}

export async function embedTextOllama(text: string): Promise<number[] | null> {
  const base = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const model = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
  try {
    const res = await fetch(`${base}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: text.slice(0, 8000) }),
    });
    if (!res.ok) return null;
    const j: any = await res.json();
    const emb = j.embeddings?.[0] || j.embedding;
    return Array.isArray(emb) ? emb : null;
  } catch { return null; }
}

export function cosineEmbedding(a: number[], b: number[]): number {
  let dot=0, ma=0, mb=0;
  for (let i=0;i<Math.min(a.length,b.length);i++) { dot+=a[i]*b[i]; ma+=a[i]*a[i]; mb+=b[i]*b[i]; }
  if (ma===0||mb===0) return 0;
  return dot / (Math.sqrt(ma)*Math.sqrt(mb));
}

export async function buildHybridIndex(notes: { stem: string; path: string; content: string }[], opts: { force?: boolean } = {}): Promise<{ indexed: number; reused: number; embedded: number }> {
  const idx = loadIndex();
  let indexed=0, reused=0, embedded=0;
  for (const n of notes) {
    const h = hashContent(n.content.slice(0, 4000));
    const existing = idx[n.stem];
    if (!opts.force && existing && existing.hash === h) { reused++; continue; }
    const clean = n.content.replace(/<!-- AGENT_INSIGHT:.*?-->[\s\S]*?Recommended link integration\.\n?/g, "").replace(/> 🤖 \*\*AGENT INSIGHT:\*\*.*\n?/g, "");
    const tfMap = termFrequency(clean);
    const tfObj: Record<string,number> = {};
    for (const [k,v] of tfMap) tfObj[k]=v;
    let emb: number[] | null = null;
    // Try Ollama if available (timeout 800ms to keep nightly fast)
    if (process.env.OLLAMA_ENABLED === "1" || existsSync("/usr/local/bin/ollama")) {
      try {
        const p = embedTextOllama(clean.slice(0, 2000));
        const t = setTimeout(()=>{}, 1000);
        emb = await Promise.race([p, new Promise<null>((res)=> setTimeout(()=> res(null), 800))]);
        clearTimeout(t);
        if (emb) embedded++;
      } catch {}
    }
    idx[n.stem] = { stem: n.stem, path: n.path, tf: tfObj, embedding: emb || undefined, updated: new Date().toISOString().slice(0,10), hash: h };
    indexed++;
  }
  saveIndex(idx);
  return { indexed, reused, embedded };
}

export function hybridScore(query: string, entry: EmbeddingEntry, queryEmb?: number[] | null): number {
  const qTf = termFrequency(query);
  const eTf = new Map(Object.entries(entry.tf));
  const tfScore = cosineSimilarityTF(qTf, eTf);
  if (queryEmb && entry.embedding) {
    const embScore = cosineEmbedding(queryEmb, entry.embedding);
    return 0.6 * embScore + 0.4 * tfScore; // weight embedding higher when available
  }
  return tfScore;
}

export function coverageReport(): { total: number; withEmbedding: number; pct: string } {
  const idx = loadIndex();
  const total = Object.keys(idx).length;
  const withEmbedding = Object.values(idx).filter((e)=> !!e.embedding).length;
  const pct = total? (withEmbedding/total*100).toFixed(1)+"%": "0%";
  return { total, withEmbedding, pct };
}
