/**
 * Message Board adapter — confessional / story harvesting
 * Targets: rawconfessions, peony, reddit (via SearXNG/DDG site: queries)
 */
import { searchWithFallback as searchSpectrum } from "../search.js";
import { Fetcher } from "../fetcher.js";

export interface BoardAsset {
  assetId: string;
  sourceUrl: string;
  title: string;
  snippet: string;
  domain: string;
  wordCount: number;
  authenticity: number; // 0-1
  isSpam: boolean;
}

/**
 * Fetch a Reddit thread's actual post + top comments via the .json API.
 * The HTML shell is JS-rendered (empty page), so we use the JSON endpoint
 * which returns the real story text server-side.
 */
async function fetchRedditThread(url: string, timeoutMs = 9000): Promise<string> {
  const jsonUrl = url.replace(/\/?(\?.*)?$/, ".json") + (url.includes("?") ? "" : "");
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(jsonUrl, {
      headers: { "User-Agent": "manifesto-research/0.1 (research harvesting)" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`reddit json ${res.status}`);
    const data = await res.json();
    const parts: string[] = [];
    const walk = (node: any, depth: number) => {
      if (!node || depth > 3) return;
      if (Array.isArray(node)) { node.forEach((n) => walk(n, depth)); return; }
      const post = node.data?.children?.[0]?.data;
      if (post && depth === 0) {
        if (post.title) parts.push(`TITLE: ${post.title}`);
        if (post.selftext) parts.push(post.selftext);
        if (post.author) parts.push(`— u/${post.author}`);
      }
      // comments
      const comments = node.data?.children?.slice(1) || [];
      for (const c of comments) {
        const d = c?.data;
        if (!d || !d.body) continue;
        parts.push(`> ${d.body.slice(0, 1200)}${d.body.length > 1200 ? "…" : ""}`);
        if (parts.length > 8) break;
      }
      if (node.data?.children) walk(node.data.children, depth + 1);
    };
    walk(data, 0);
    const text = parts.join("\n\n").slice(0, 9000);
    return text || "";
  } catch {
    return "";
  } finally {
    clearTimeout(t);
  }
}

function authenticityScore(text: string): number {
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const firstPerson = (lower.match(/\b(i|me|my|mine|myself|we|our|us)\b/g) || []).length;
  const density = firstPerson / Math.max(1, words.length);
  const hasTemporal = /\b(yesterday|today|years?|months?|weeks?|when i was|my childhood|my mother|my father)\b/i.test(text) ? 0.2 : 0;
  const hasEmotion = /\b(lonely|longing|shame|fear|abandon|narcissist|manipulation|gaslight|limerence|obsess|fixat)\b/i.test(text) ? 0.15 : 0;
  const lengthBonus = words.length >= 150 && words.length <= 800 ? 0.2 : 0;
  return Math.min(1, density * 2 + hasTemporal + hasEmotion + lengthBonus);
}

function isSpam(text: string): boolean {
  if (text.split(/\s+/).length < 80) return true;
  if ((text.match(/https?:\/\//g) || []).length > 3) return true;
  if (/^(buy|click|discount|free money)/i.test(text)) return true;
  return false;
}

export async function harvestMessageBoards(idea: string, maxAssets = 12, fetcher?: Fetcher): Promise<any[]> {
  // Topic-matched board queries: reddit communities where this kind of lived
  // experience lives (limerence, favorite person, BPD, codependency, attachment),
  // plus generic confessional sources. Ordered by topical fit.
  const topicSlug = idea.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const boardQueries = [
    `${topicSlug} site:reddit.com/r/limerence`,
    `${topicSlug} site:reddit.com/r/BPDlovedones OR site:reddit.com/r/Codependency`,
    `${topicSlug} site:reddit.com/r/attachment_theory OR site:reddit.com/r/BPD`,
    `${topicSlug} site:reddit.com/r/TwinFlames OR site:reddit.com/r/ExNoContact`,
    `${topicSlug} site:rawconfessions.com OR site:peonymagazine.com`,
    `${topicSlug} "favorite person" personal story reddit`,
    `${topicSlug} confessional story raw "I feel"`,
  ];
  const assets: any[] = [];
  const seen = new Set<string>();
  const localFetcher = fetcher || new (await import("../fetcher.js").then(m => m.Fetcher))(process.cwd().includes("05 Backend") ? process.cwd().split("/").slice(0,-2).join("/") || "." : process.cwd());

  for (const q of boardQueries) {
    if (assets.length >= maxAssets) break;
    const results = await searchSpectrum(q, 5);
    for (const r of results) {
      if (seen.has(r.url) || assets.length >= maxAssets) continue;
      seen.add(r.url);
      const isBoardDomain = /rawconfessions|peony|reddit|quora|confess|forum|blogspot|medium|substack/i.test(r.domain + r.url);
      if (!isBoardDomain && assets.length > 4) continue;
      // Reddit: fetch real post + comments via .json (HTML shell is JS-rendered empty)
      let text = "";
      if (r.domain.includes("reddit")) {
        text = await fetchRedditThread(r.url);
        // Reddit blocks server-side access (403); fall back to search snippet
        // which still carries the thread title + first lines of the story.
        if (!text || text.length < 200) {
          text = `TITLE: ${r.title}\n\n${r.snippet || ""}`;
        }
      }
      if (!text || text.length < 200) {
        const fr = await localFetcher.fetch(r.url);
        if (!fr.content || fr.content.length < 200) continue;
        text = fr.content.slice(0, 6000);
      }
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const spam = isSpam(text);
      const auth = authenticityScore(text);
      if (spam && auth < 0.3) continue;
      // Relevance: how many idea terms appear in title + text
      const ideaTerms = idea.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((w: string) => w.length > 3);
      const haystack = (r.title + " " + text).toLowerCase();
      const hitTerms = ideaTerms.filter((t: string) => haystack.includes(t)).length;
      const rel = Math.min(1, 0.3 + (hitTerms / Math.max(1, ideaTerms.length)) * 0.5 + (auth > 0.4 ? 0.15 : 0));
      assets.push({
        assetId: `board_${r.url.slice(-12).replace(/[^a-z0-9]/gi, "")}`,
        sourceUrl: r.url,
        title: r.title || `Board story — ${idea.slice(0,30)}`,
        snippet: text.slice(0, 300),
        domain: r.domain,
        score: rel,
        relevanceScore: rel,
        evidence: [`authenticity ${auth.toFixed(2)}`, `wordCount ${wordCount}`, spam ? "spam_flag" : "clean"],
        contentPreview: text.slice(0, 800),
        storyText: text, // full story text for local save (Reddit .json etc.)
        rightsClassification: "REFERENCE_ONLY",
        rightsConfidence: 0.25,
        category: "story",
        wordCount,
        authenticity: auth,
        isSpam: spam,
      });
      await new Promise(r => setTimeout(r, 250));
    }
  }
  return assets.slice(0, maxAssets);
}
