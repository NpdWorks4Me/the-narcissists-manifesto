/**
 * Verification — high-quality usable material filter
 */
import { RESEARCH_CONFIG } from "./config.js";

export interface Verification {
  usable: boolean;
  needsReview: boolean;
  reject: boolean;
  score: number; // usabilityScore 0-1
  reasons: string[];
}

export function verifyAsset(asset: any, idea: string): Verification {
  const cfg = RESEARCH_CONFIG.thresholds;
  const reasons: string[] = [];
  let usabilityScore = asset.score || 0;

  // Relevance
  if ((asset.relevanceScore || 0) < cfg.relevance) {
    reasons.push(`low relevance ${asset.relevanceScore?.toFixed(2)} < ${cfg.relevance}`);
  } else reasons.push(`relevance ${asset.relevanceScore?.toFixed(2)}`);

  // Word count / coverage
  const wc = asset.wordCount || asset.contentPreview?.split(/\s+/).length || 0;
  if (asset.category === "transcript") {
    if ((asset.coverage || 0) < cfg.minTranscriptCoverage) reasons.push(`low transcript coverage ${asset.coverage?.toFixed(2)}`);
    else reasons.push(`transcript coverage ${asset.coverage?.toFixed(2)}`);
    if (wc < 80) reasons.push(`short transcript ${wc} words`);
  } else {
    if (wc < cfg.minWordCount) reasons.push(`short ${wc} words < ${cfg.minWordCount}`);
    else reasons.push(`wordCount ${wc}`);
  }

  // Technical quality
  if ((asset.technicalQuality || asset.score || 0) < cfg.minTechnicalQuality && asset.category === "page") {
    reasons.push(`low technical ${asset.score?.toFixed(2)}`);
  }

  // Spam
  if (asset.isSpam) {
    reasons.push("spam_flag");
    usabilityScore -= 0.3;
  }

  // Rarity boost already in score, but add small usability bump for rare/media
  if (asset.category === "rare" || asset.category === "archive") usabilityScore += 0.04;
  if (asset.category === "transcript" && wc > 500) usabilityScore += 0.05;
  if (asset.category === "story" && (asset.authenticity || 0) > 0.4) usabilityScore += 0.06;

  usabilityScore = Math.max(0, Math.min(1, usabilityScore));

  const needsReview = asset.rightsClassification === "REFERENCE_ONLY" && usabilityScore < 0.7;
  const usable = !asset.isSpam && usabilityScore >= cfg.usabilityScoreThreshold && wc >= 80;
  const reject = !usable && !needsReview;

  if (usable) reasons.push(`usable ${usabilityScore.toFixed(2)} >= ${cfg.usabilityScoreThreshold}`);
  else if (needsReview) reasons.push(`needsReview ${usabilityScore.toFixed(2)}`);
  else reasons.push(`reject ${usabilityScore.toFixed(2)}`);

  return { usable, needsReview, reject, score: usabilityScore, reasons };
}

export function verifyAll(assets: any[], idea: string) {
  const results = assets.map(a => ({ asset: a, verification: verifyAsset(a, idea) }));
  const usable = results.filter(r => r.verification.usable);
  const needsReview = results.filter(r => r.verification.needsReview);
  const reject = results.filter(r => r.verification.reject);
  return { results, usable, needsReview, reject, summary: { total: assets.length, usable: usable.length, needsReview: needsReview.length, reject: reject.length } };
}
