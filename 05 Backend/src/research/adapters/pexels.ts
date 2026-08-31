/**
 * Pexels — high-quality stock photos/videos, CC-friendly
 * API: https://www.pexels.com/api/ — requires PEXELS_API_KEY
 * If no key, returns empty
 */
import dotenv from "dotenv";
import { join } from "path";
import { existsSync } from "fs";
try {
  const vaultRoot = process.cwd().endsWith("05 Backend") ? join(process.cwd(), "..") : process.cwd();
  const envPath = join(vaultRoot, ".env");
  if (existsSync(envPath)) dotenv.config({ path: envPath });
  else dotenv.config();
} catch {}

export interface PexelsResult {
  id: number;
  url: string;
  photographer: string;
  src: string; // direct image url
  alt: string;
}

export async function searchPexels(query: string, limit = 3): Promise<PexelsResult[]> {
  const apiKey = (process.env.PEXELS_API_KEY || "").trim();
  if (!apiKey) return [];
  const q = encodeURIComponent(query);
  const url = `https://api.pexels.com/v1/search?query=${q}&per_page=${limit}&page=1`;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(url, {
      headers: { Authorization: apiKey },
      signal: controller.signal,
    }).finally(() => clearTimeout(t));
    if (!res.ok) return [];
    const data: any = await res.json();
    const results: PexelsResult[] = [];
    for (const p of (data.photos || []).slice(0, limit)) {
      results.push({
        id: p.id,
        url: p.url || `https://www.pexels.com/photo/${p.id}/`,
        photographer: p.photographer || "unknown",
        src: p.src?.large || p.src?.original || p.url,
        alt: p.alt || query,
      });
    }
    return results;
  } catch {
    return [];
  }
}

export function pexelsToAsset(r: PexelsResult, query: string): any {
  return {
    assetId: `pex_${r.id}`,
    sourceUrl: r.src,
    title: `[IMAGE] ${r.alt.slice(0, 60)} — Pexels (${r.photographer})`,
    snippet: `Pexels stock photo — ${r.alt.slice(0, 100)}`,
    domain: "pexels.com",
    score: 0.66,
    relevanceScore: 0.7,
    evidence: [`pexels CC`, `query: ${query}`],
    contentPreview: r.url,
    rightsClassification: "CLEARLY_REUSABLE",
    rightsConfidence: 0.85,
    category: "media",
    type: "image",
    photographer: r.photographer,
  };
}
