/**
 * Automatic Tagging — for everything manifested from scripts
 * Centralized, deterministic, Obsidian-compatible
 */

function slugTag(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\/-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-")
    .slice(0, 40);
}

function domainToTag(domain: string): string {
  // e.g., www.verywellmind.com → domain/verywellmind
  // fierceembodiment.com → domain/fierceembodiment
  const base = domain.replace(/^www\./, "").split(".")[0];
  return `domain/${slugTag(base)}`;
}

export interface AutoTagInput {
  idea: string;
  assets?: Array<{ domain?: string; category?: string; sourceUrl?: string }>;
  insights?: { byCategory?: Record<string, number>; patterns?: string[] };
  baseTags?: string[]; // existing tags to preserve
  extraTags?: string[]; // additional context tags
}

export function autoTag(input: AutoTagInput): string[] {
  const tags = new Set<string>();

  // System tags — every manifested file gets these
  tags.add("auto/generated");
  tags.add("auto/research");
  tags.add("auto/spectrum");
  tags.add("manifesto");

  // Temporal
  const now = new Date();
  tags.add(`generated/${now.toISOString().slice(0, 10)}`); // 2026-08-31
  tags.add(`generated/${now.getFullYear()}`); // 2026

  // Idea tags — split, normalize, max 5
  if (input.idea) {
    const words = input.idea.toLowerCase().split(/\s+/).filter((w) => w.length > 3).slice(0, 5);
    for (const w of words) tags.add(slugTag(w));
    // Also add slugged full idea as alias-like tag (truncated)
    const ideaSlug = slugTag(input.idea.split(/\s+/).slice(0, 3).join("-"));
    if (ideaSlug.length > 3) tags.add(`idea/${ideaSlug}`);
  }

  // Category tags from insights.byCategory
  if (input.insights?.byCategory) {
    for (const [cat, count] of Object.entries(input.insights.byCategory)) {
      if (count > 0) tags.add(`category/${slugTag(cat)}`);
    }
  }
  // Also from assets categories
  if (input.assets) {
    const cats = new Set(input.assets.map((a) => a.category).filter(Boolean) as string[]);
    for (const c of cats) tags.add(`category/${slugTag(c)}`);
  }

  // Domain tags — top 3 domains
  if (input.assets && input.assets.length > 0) {
    const topDomains = [...new Set(input.assets.slice(0, 6).map((a) => a.domain).filter(Boolean) as string[])].slice(0, 3);
    for (const d of topDomains) tags.add(domainToTag(d));
  }
  if (input.insights?.patterns) {
    for (const p of input.insights.patterns.slice(0, 2)) {
      if (p.includes(".")) tags.add(domainToTag(p));
    }
  }

  // Preserve base tags (normalized)
  if (input.baseTags) {
    for (const t of input.baseTags) {
      const normalized = slugTag(t);
      if (normalized) tags.add(normalized);
    }
  }

  // Extra tags
  if (input.extraTags) {
    for (const t of input.extraTags) tags.add(slugTag(t));
  }

  // Clean and sort — deterministic
  const cleaned = [...tags]
    .map((t) => t.replace(/\/$/, "").replace(/^\/+/, ""))
    .filter((t) => t.length >= 2 && t.length <= 50)
    .filter((t) => !t.includes("--"));

  // Dedupe already via Set, sort for consistency
  return [...new Set(cleaned)].sort();
}

// For frontmatter tags field — ensure array of strings, no duplicates, sorted
export function mergeTags(existing: string[] = [], generated: string[] = []): string[] {
  const merged = new Set([...existing.map(slugTag).filter(Boolean), ...generated.map(slugTag).filter(Boolean)]);
  return [...merged].sort();
}
