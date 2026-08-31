/**
 * Freesound.org — field recordings, ambient soundscapes, Foley
 * API: https://freesound.org/docs/api/ — query by text + filter by license
 * Requires FREESOUND_API_KEY env (get from https://freesound.org/apiv2/apply/)
 * If no key, returns empty and logs hint
 */
export interface FreesoundResult {
  id: number;
  name: string;
  url: string;
  previewUrl: string;
  license: string;
  duration: number;
  username: string;
}

import dotenv from "dotenv";
import { join } from "path";
import { existsSync } from "fs";
// Load .env from vault root (parent of 05 Backend) if not already loaded
try {
  const vaultRoot = process.cwd().endsWith("05 Backend") ? join(process.cwd(), "..") : process.cwd();
  const envPath = join(vaultRoot, ".env");
  if (existsSync(envPath)) dotenv.config({ path: envPath });
  else dotenv.config();
} catch {}

export async function searchFreesound(query: string, limit = 3): Promise<FreesoundResult[]> {
  const apiKey = (process.env.FREESOUND_API_KEY || process.env.FREESOUND_API_TOKEN || process.env.FS_CLIENT_ID || "").trim();
  if (!apiKey) {
    // No API key — return empty, pipeline will skip
    // We still log for user to know
    // console.log("[freesound] No FREESOUND_API_KEY set — skipping. Get one at https://freesound.org/apiv2/apply/");
    return [];
  }

  // Focus on CC0 / CC BY for manifesto (permissive)
  const q = encodeURIComponent(query);
  const url = `https://freesound.org/apiv2/search/text/?query=${q}&filter=license:"Creative Commons 0"+OR+license:"Attribution"&fields=id,name,url,previews,license,username,duration&page_size=${limit}&sort=score`;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(url, {
      headers: { Authorization: `Token ${apiKey}` },
      signal: controller.signal,
    }).finally(() => clearTimeout(t));
    if (!res.ok) {
      // Freesound returns 401 if key invalid, 429 if rate limited
      // console.log(`[freesound] ${res.status} for "${query}"`);
      return [];
    }
    const data: any = await res.json();
    const results: FreesoundResult[] = [];
    for (const r of (data.results || []).slice(0, limit)) {
      const preview = r.previews?.["preview-hq-mp3"] || r.previews?.["preview-lq-mp3"] || "";
      results.push({
        id: r.id,
        name: r.name || `Freesound ${r.id}`,
        url: r.url || `https://freesound.org/people/${r.username}/sounds/${r.id}/`,
        previewUrl: preview,
        license: r.license || "CC0",
        duration: r.duration || 0,
        username: r.username || "unknown",
      });
    }
    return results;
  } catch {
    return [];
  }
}

// For pipeline: convert to Asset-like
export function freesoundToAsset(r: FreesoundResult, query: string): any {
  return {
    assetId: `fs_${r.id}`,
    sourceUrl: r.previewUrl || r.url,
    title: `[AUDIO] ${r.name} — Freesound (${r.username})`,
    snippet: `Freesound ${r.license} — ${r.duration.toFixed(1)}s — ${r.name}`,
    domain: "freesound.org",
    score: 0.68,
    relevanceScore: 0.75,
    evidence: [`freesound ${r.license}`, `query: ${query}`],
    contentPreview: r.url,
    rightsClassification: r.license.includes("0") ? "CLEARLY_REUSABLE" : "LIKELY_REUSABLE",
    rightsConfidence: r.license.includes("0") ? 0.9 : 0.7,
    category: "media",
    type: "audio",
    license: r.license,
  };
}
