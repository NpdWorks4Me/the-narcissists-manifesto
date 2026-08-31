/**
 * ToolDiscovery — find tools/programs for any idea
 * Uses DuckDuckGo + GitHub search heuristic
 */
import { searchWithFallback as searchSpectrum } from "../search.js";

export interface ToolCandidate {
  name: string;
  url: string;
  description: string;
  source: string;
  score: number;
}

export async function discoverTools(idea: string, limit = 6): Promise<ToolCandidate[]> {
  const queries = [
    `${idea} tools software`,
    `${idea} github open source`,
    `${idea} template resources download`,
  ];
  const results: ToolCandidate[] = [];
  const seen = new Set<string>();
  for (const q of queries) {
    if (results.length >= limit) break;
    const hits = await searchSpectrum(q, 3);
    for (const h of hits) {
      if (seen.has(h.url)) continue;
      seen.add(h.url);
      // Heuristic: tools often have github, producthunt, alternative.to, or /tools
      const isToolLike =
        h.url.includes("github.com") ||
        h.url.includes("producthunt.com") ||
        h.url.includes("alternativeto.net") ||
        h.domain.includes("github") ||
        /tool|software|program|app|template|resource|download|open source/i.test(h.title + " " + h.snippet);
      if (!isToolLike && results.length > 2) continue; // keep at least 2 generic
      const score = isToolLike ? 0.75 : 0.5;
      results.push({
        name: h.title.slice(0, 80) || h.url,
        url: h.url,
        description: h.snippet.slice(0, 200) || "",
        source: h.domain,
        score,
      });
      if (results.length >= limit) break;
    }
  }
  return results.slice(0, limit);
}
