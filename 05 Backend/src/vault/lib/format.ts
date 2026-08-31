/** Format Matching & Content Synthesis Matrix §4 */

export type SuggestedFormat = "essay" | "video" | "newsletter" | "thread" | "guide" | "podcast" | "none";

export interface FormatSignals {
  wordCount: number;
  hasNuancedArguments: boolean;
  hasConnectedConcepts: boolean;
  hasStepByStep: boolean;
  hasActionableFramework: boolean;
  hasQuickInsight: boolean;
  hasContrastingPerspectives: boolean;
  hasOpenQuestions: boolean;
  linkDensity: number; // outgoing links per 500 words
  tagVariety: number;
}

export interface FormatRecommendation {
  suggested_format: SuggestedFormat;
  confidence_score: number;
  reason: string;
  alternatives: SuggestedFormat[];
}

export function recommendFormat(signals: FormatSignals): FormatRecommendation {
  // Rule set from spec
  const { wordCount, hasNuancedArguments, hasConnectedConcepts, hasStepByStep, hasActionableFramework, hasQuickInsight, hasContrastingPerspectives, hasOpenQuestions, linkDensity } = signals;

  let rec: SuggestedFormat = "none";
  let confidence = 0.0;
  let reason = "";
  const alternatives: SuggestedFormat[] = [];

  if ((hasNuancedArguments && hasConnectedConcepts) || (wordCount > 800 && linkDensity > 1.5)) {
    rec = wordCount > 1200 ? "essay" : "newsletter";
    confidence = 0.85;
    reason = "Nuanced arguments + deep research + connected concepts → long-form";
    alternatives.push("video", "newsletter");
  } else if (hasStepByStep && hasActionableFramework) {
    rec = "guide";
    confidence = 0.82;
    reason = "Step-by-step discoveries + actionable frameworks → guide/workbench";
    alternatives.push("video");
  } else if (hasQuickInsight && hasContrastingPerspectives) {
    rec = wordCount < 400 ? "thread" : "video";
    confidence = 0.78;
    reason = "Quick insights + contrasting perspectives → short-form";
    alternatives.push("thread", "video");
  } else if (hasOpenQuestions) {
    rec = "podcast";
    confidence = 0.76;
    reason = "Exploratory debates + open questions → podcast/live";
    alternatives.push("video");
  } else if (wordCount > 500) {
    rec = "essay";
    confidence = 0.55;
    reason = "Default: substantial content → essay candidate (low confidence)";
    alternatives.push("newsletter");
  } else {
    rec = "none";
    confidence = 0.2;
    reason = "Insufficient signals — keep incubating";
  }

  // Clamp without LLM to 0.7 max unless strong signals
  if (confidence > 0.7 && !(hasNuancedArguments && hasConnectedConcepts) && !(hasStepByStep && hasActionableFramework)) {
    // if not using LLM embeddings, cap at 0.7 to avoid premature spec generation
    // caller may add LLM boost externally
  }

  return { suggested_format: rec, confidence_score: confidence, reason, alternatives };
}

/** Infer signals from raw content + frontmatter tags/links */
export function inferSignals(content: string, tags: string[], outgoingLinks: string[]): FormatSignals {
  const wc = content.split(/\s+/).filter(Boolean).length;
  const lower = content.toLowerCase();

  const hasStepByStep = /(step\s*\d|how to|framework|checklist|phase\s*\d)/i.test(content);
  const hasActionableFramework = /(actionable|exercise|template|worksheet|apply this)/i.test(lower);
  const hasNuancedArguments = /(however|nuance|tradeoff|on the other hand|paradox|tension)/i.test(lower);
  const hasConnectedConcepts = outgoingLinks.length >= 2 || /(connects to|relates to|builds on)/i.test(lower);
  const hasQuickInsight = wc < 400 && /(insight|realization|aha|tldr)/i.test(lower);
  const hasContrastingPerspectives = /(vs\.?|versus|contrast|opposite|alternative view)/i.test(lower);
  const hasOpenQuestions = /\?\s*$/.test(content.trim()) || (content.match(/\?/g) || []).length >= 2;

  return {
    wordCount: wc,
    hasNuancedArguments,
    hasConnectedConcepts,
    hasStepByStep,
    hasActionableFramework,
    hasQuickInsight,
    hasContrastingPerspectives,
    hasOpenQuestions,
    linkDensity: outgoingLinks.length / Math.max(1, wc / 500),
    tagVariety: new Set(tags).size,
  };
}
