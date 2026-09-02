/**
 * OKM Freshness lint — enforces timeless|dated|pointer
 * Used by health.ts + vault:health freshness section
 */
import type { Frontmatter } from "./frontmatter.js";

export interface FreshnessViolation {
  file: string;
  level: "error" | "warning";
  code: string;
  message: string;
}

const AS_OF_RE = /as of \d{4}-\d{2}/i;
const TIME_BOUND_RE = /\b(currently|as of|latest|as of now|today)\b/i;
const KNOWN_RELATION_TYPES = new Set(["supports", "contradicts", "elaborates", "example_of", "derived_from"]);

export function lintFreshness(content: string, data: any, fileRel: string): FreshnessViolation[] {
  const v: FreshnessViolation[] = [];
  const fm = data as Frontmatter & { freshness?: any; relations?: any[] };

  // Only enforce on vault-typed notes
  const vaultTypes = new Set(["hyperfixation", "atomic-concept", "content-project", "moc"]);
  if (!vaultTypes.has(fm.type)) return v;

  // Grace period until 2026-10-01: missing freshness is warning, not error
  const graceUntil = new Date("2026-10-01T00:00:00Z");
  const now = new Date();
  const isGrace = now < graceUntil;

  if (!fm.freshness || !fm.freshness.type) {
    v.push({
      file: fileRel,
      level: isGrace ? "warning" : "error",
      code: "freshness/missing",
      message: `Missing freshness: add freshness: {type: timeless|dated|pointer, as_of: YYYY-MM-DD, source: ...} per references/freshness-policy.md`,
    });
    return v;
  }

  const type = fm.freshness.type;

  if (type === "dated") {
    if (!fm.freshness.as_of) {
      v.push({ file: fileRel, level: "error", code: "freshness/dated-as_of", message: `freshness.type=dated requires freshness.as_of (YYYY-MM-DD)` });
    }
    if (!AS_OF_RE.test(content)) {
      v.push({ file: fileRel, level: "warning", code: "freshness/dated-marker", message: `dated fact should include inline "as of YYYY-MM, source" marker in body` });
    }
  }

  if (type === "pointer") {
    if (!fm.freshness.source || fm.freshness.source === "vault") {
      v.push({ file: fileRel, level: "warning", code: "freshness/pointer-source", message: `pointer should have freshness.source pointing to where value lives (path or domain)` });
    }
  }

  if (type === "timeless" && TIME_BOUND_RE.test(content) && AS_OF_RE.test(content)) {
    v.push({ file: fileRel, level: "warning", code: "freshness/timeless-but-dated", message: `timeless note contains time-bound phrasing ("as of"/"currently") — consider dated` });
  }

  // Relations lint (typed edges)
  if (Array.isArray(fm.relations)) {
    for (const rel of fm.relations) {
      if (!KNOWN_RELATION_TYPES.has(rel.type)) {
        v.push({ file: fileRel, level: "error", code: "relations/unknown-type", message: `Unknown relation type "${rel.type}" — expected ${[...KNOWN_RELATION_TYPES].join("|")}` });
      }
      if (!rel.target || typeof rel.target !== "string" || rel.target.trim().length === 0) {
        v.push({ file: fileRel, level: "error", code: "relations/missing-target", message: `Relation missing target` });
      }
    }
  }

  return v;
}

export function formatViolations(vs: FreshnessViolation[]): string {
  if (vs.length === 0) return "No freshness violations.";
  return vs.map((x) => `${x.level === "error" ? "❌" : "⚠️"} [${x.code}] ${x.file}: ${x.message}`).join("\n");
}
