/**
 * Central configuration — single source of truth for thresholds.
 * Override via .env or environment variables.
 */

function envInt(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}
function envFloat(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

export const CONFIG = {
  // WIP limits
  WIP_LIMIT: envInt("WIP_LIMIT", 5),

  // Staleness
  STALE_DASHBOARD_DAYS: envInt("STALE_DASHBOARD_DAYS", 14),
  STALE_PROJECT_DAYS: envInt("STALE_PROJECT_DAYS", 21),
  RESUME_NUDGE_DAYS: envInt("RESUME_NUDGE_DAYS", 7),

  // Substance engine
  CONFIDENCE_THRESHOLD: envFloat("CONFIDENCE_THRESHOLD", 0.75),
  CLUSTER_MIN_LINKS: envInt("CLUSTER_MIN_LINKS", 3),
  SIM_THRESHOLD_LLM: envFloat("SIM_THRESHOLD_LLM", 0.78),
  SIM_THRESHOLD_KEYWORD: envFloat("SIM_THRESHOLD_KEYWORD", 0.30),

  // Tracking
  TRACKING_CSV_ROTATE_ROWS: envInt("TRACKING_CSV_ROTATE_ROWS", 10_000),

  // Paths (relative to vault root)
  FOLDERS: {
    inbox: "00 Inbox",
    hyperfixations: "01 Hyperfixations",
    atomic: "02 Atomic Concepts",
    contentLab: "03 Content Lab",
    atlas: "04 Atlas & Meta",
    templates: "04 Atlas & Meta/Templates",
    dashboards: "04 Atlas & Meta/Dashboards",
    logs: "04 Atlas & Meta/Logs",
    scripts: "04 Atlas & Meta/Scripts",
  },

  // LLM
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
  OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
} as const;
