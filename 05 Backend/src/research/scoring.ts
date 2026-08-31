/**
 * Scoring — weighted sum + rarity/media/tool boosts for spectrum
 */
import { RESEARCH_CONFIG } from "./config.js";

export interface Asset {
  assetId: string;
  sourceUrl: string;
  title: string;
  snippet: string;
  domain: string;
  relevanceScore: number;
  score: number;
  evidence: string[];
  contentPreview: string;
  rightsClassification: string;
  rightsConfidence: number;
  category?: "page" | "media" | "tool" | "archive" | "feed" | "rare";
  rarityScore?: number;
}

export function rightsClassification(licenseUrl?: string | null): { cls: string; conf: number; reason: string } {
  if (licenseUrl && licenseUrl.startsWith("http")) return { cls: "CLEARLY_REUSABLE", conf: 0.95, reason: `license_url: ${licenseUrl}` };
  return { cls: "REFERENCE_ONLY", conf: 0.2, reason: "no license evidence" };
}

export function rarityBoost(text: string): number {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const t of RESEARCH_CONFIG.rarityTerms) if (lower.includes(t)) hits++;
  if (hits >= 2) return 0.2;
  if (hits === 1) return 0.1;
  return 0;
}

export function scoreAsset(
  relevance: number,
  sourceCredibility: number,
  rightsConf: number,
  technicalQuality: number,
  opts: { textForRarity?: string; category?: string; weights?: any } = {}
): number {
  const w = opts.weights || RESEARCH_CONFIG.weights;
  const base =
    (w.relevance ?? 0.35) * relevance +
    (w.sourceCredibility ?? 0.2) * sourceCredibility +
    (w.rightsConfidence ?? 0.15) * rightsConf +
    (w.technicalQuality ?? 0.1) * technicalQuality;
  const rarity = rarityBoost(opts.textForRarity || "");
  // Category bonuses: rare/forgotten and media/tools get slight boost for high-value
  let catBoost = 0;
  if (opts.category === "rare" || opts.category === "archive") catBoost = 0.08;
  if (opts.category === "media" && rarity > 0) catBoost = 0.05;
  if (opts.category === "tool") catBoost = 0.04;
  const withBoost = base + (w.rarity ?? 0.2) * rarity + catBoost;
  return Math.min(1, withBoost);
}

export function relevanceFor(query: string, title: string, content: string): number {
  const qTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2).slice(0, 5);
  const lower = (title + " " + content).toLowerCase();
  let hits = 0;
  for (const t of qTerms) if (lower.includes(t)) hits++;
  let rel = 0.3 + hits * 0.15;
  if (qTerms.some((t) => title.toLowerCase().includes(t))) rel += 0.2;
  return Math.min(1, rel);
}
