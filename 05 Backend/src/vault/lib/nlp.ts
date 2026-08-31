import nlp from "compromise";

/** Lightweight topic/entity extraction — no LLM required */

export interface TriageResult {
  topics: string[];
  tags: string[];
  entities: string[];
  wordCount: number;
  topPhrases: string[];
}

export function analyzeText(content: string): TriageResult {
  const doc = nlp(content);
  const topics = doc.topics().out("array") as string[];
  const people = doc.people().out("array") as string[];
  const places = doc.places().out("array") as string[];
  const orgs = doc.organizations().out("array") as string[];
  const nouns = doc.nouns().out("array") as string[];

  // Extract hashtags already in text
  const hashTags = [...content.matchAll(/(^|\s)#([a-zA-Z0-9_\-/]+)/g)].map((m) => m[2].toLowerCase());

  const entities = [...new Set([...people, ...places, ...orgs])].slice(0, 10);

  // Top noun phrases as proxy for central theme density
  const freq = new Map<string, number>();
  for (const n of nouns) {
    const key = n.toLowerCase().trim();
    if (key.length < 3) continue;
    freq.set(key, (freq.get(key) || 0) + 1);
  }
  const topPhrases = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);

  const wordCount = content.split(/\s+/).filter(Boolean).length;

  // Derive tags: hashtags + lowercased topics + top phrases slugified
  const tagSet = new Set<string>();
  hashTags.forEach((t) => tagSet.add(t));
  topics.slice(0, 5).forEach((t) => tagSet.add(slugifyTag(t)));
  topPhrases.slice(0, 3).forEach((p) => tagSet.add(slugifyTag(p)));

  return {
    topics: topics.slice(0, 10),
    tags: [...tagSet].slice(0, 8),
    entities: entities.slice(0, 8),
    wordCount,
    topPhrases,
  };
}

function slugifyTag(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

/** Simple TF map for keyword-based similarity fallback */
export function termFrequency(text: string): Map<string, number> {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  // normalize
  const max = Math.max(1, ...tf.values());
  for (const [k, v] of tf) tf.set(k, v / max);
  return tf;
}

export function cosineSimilarityTF(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const [k, va] of a) {
    magA += va * va;
    const vb = b.get(k) || 0;
    dot += va * vb;
  }
  for (const [, vb] of b) magB += vb * vb;
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function jaccardTags(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const sa = new Set(a.map((x) => x.toLowerCase()));
  const sb = new Set(b.map((x) => x.toLowerCase()));
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;
  return inter / (sa.size + sb.size - inter || 1);
}
