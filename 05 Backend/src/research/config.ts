/**
 * Research config for manifesto vault — SPECTRUM for any idea
 * Covers: media assets, tools/programs, old/forgotten/rare, plus generic
 */
export const RESEARCH_CONFIG = {
  budgets: {
    maxPages: 24, // per one-shot (8 queries * 3 pages avg)
    maxDomains: 30,
    maxAssets: 80,
    maxDownloads: 40,
    maxArchiveQueries: 12,
    maxTools: 10,
    maxMedia: 15,
    maxRuntimeSeconds: 180,
  },
  thresholds: {
    relevance: 0.52,
    thematicBoost: 0,
    cacheTtlSeconds: 86400,
  },
  weights: {
    relevance: 0.35,
    sourceCredibility: 0.2,
    rightsConfidence: 0.15,
    technicalQuality: 0.1,
    rarity: 0.2, // new: bonus for rare/forgotten sources
  },
  folders: {
    logs: "04 Atlas & Meta/Logs/research",
    hyperfixations: "01 Hyperfixations",
    atomic: "02 Atomic Concepts",
    inbox: "00 Inbox",
    cache: "04 Atlas & Meta/Logs/research/.cache",
  },
  // SPECTRUM one-shot queries — 8 forms covering high-value data points
  oneShotQueries: (base: string) => [
    base, // core
    `${base} lived experience personal story raw confessional`, // lived
    `${base} history archive rare forgotten vintage obscure abandoned`, // rare/old school — high value forgotten ideas
    `${base} tools programs software templates resources open source`, // tools
    `${base} media assets images audio video archive`, // media
    `${base} theory concept framework model rare idea`, // conceptual rare
    `${base} criticism counter perspective deconstruction`, // counter
    `${base} step by step guide framework how to system`, // guide
  ],
  // Rare/forgotten signal terms for scoring boost
  rarityTerms: [
    "archival", "archive", "vintage", "forgotten", "obscure", "rare", "abandoned",
    "lost", "obsolete", "analog", "old school", "retro", "liminal", "analog horror",
    "pre-internet", "early web", "folk", "esoteric", "occult", "underground",
    "zine", "samizdat", "out of print", "defunct", "discontinued",
  ],
  mediaTerms: ["image", "photo", "video", "audio", "archive", "media", "gallery", "collection"],
  toolTerms: ["tool", "program", "software", "app", "template", "resource", "open source", "github", "download"],
} as const;
