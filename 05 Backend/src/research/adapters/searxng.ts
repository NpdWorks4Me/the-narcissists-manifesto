/**
 * SearXNG — privacy-respecting metasearch with clean JSON API
 * Aggregates Google, Bing, DuckDuckGo, Wikipedia, etc. in one call
 * Self-hostable: set SEARXNG_URL env or config, else tries public instances
 */
export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  domain: string;
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname; } catch { return url.split("/")[2] || "unknown"; }
}

// Public SearXNG instances (fallback if no self-hosted) — privacy respecting, no API key
const PUBLIC_INSTANCES = [
  "https://search.bus-hit.me",
  "https://searx.be",
  "https://baresearch.org",
];

function getSearxngUrl(): string | null {
  // Env var takes precedence, else try local, else public
  const env = (process.env.SEARXNG_URL || "").trim();
  if (env) return env.replace(/\/$/, "");
  // Check if local instance is likely running (we'll try, but don't fail if not)
  // For now, return null to trigger public instance fallback
  return null;
}

export async function searchSearXNG(query: string, limit = 5): Promise<SearchResult[]> {
  const baseUrl = getSearxngUrl();
  const candidates = baseUrl ? [baseUrl, ...PUBLIC_INSTANCES] : PUBLIC_INSTANCES;

  let lastError: any = null;
  for (const base of candidates.slice(0, 2)) { // try 2 instances max
    try {
      const url = `${base}/search?q=${encodeURIComponent(query)}&format=json&categories=general`;
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, {
        headers: { "User-Agent": "manifesto-research/0.1 (+SearXNG)", Accept: "application/json" },
        signal: controller.signal,
      }).finally(() => clearTimeout(t));
      if (!res.ok) throw new Error(`SearXNG ${res.status} at ${base}`);
      const data: any = await res.json();
      const results: SearchResult[] = [];
      const raw = data.results || data.results?.general || [];
      // SearXNG JSON format: { results: [{url, title, content, engine}] }
      for (const r of raw.slice(0, limit * 2)) {
        const href = r.url || r.parsed_url || "";
        if (!href.startsWith("http") || href.includes("searx")) continue;
        const title = (r.title || "").trim().slice(0, 120) || href;
        const snippet = (r.content || r.orig_content || "").trim().slice(0, 300) || "";
        results.push({ url: href, title, snippet, domain: extractDomain(href) });
        if (results.length >= limit) break;
      }
      if (results.length > 0) {
        // Small delay to be respectful
        await new Promise(r => setTimeout(r, 200));
        return results.slice(0, limit);
      }
      throw new Error("no results from SearXNG JSON");
    } catch (e) {
      lastError = e;
      // try next instance
    }
  }
  throw lastError || new Error("SearXNG all instances failed");
}

// HTML fallback for SearXNG (if JSON not available, try html)
export async function searchSearXNGHtml(query: string, limit = 5): Promise<SearchResult[]> {
  const baseUrl = getSearxngUrl() || PUBLIC_INSTANCES[0];
  const url = `${baseUrl}/search?q=${encodeURIComponent(query)}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 7000);
  const res = await fetch(url, {
    headers: { "User-Agent": "manifesto-research/0.1", Accept: "text/html" },
    signal: controller.signal,
  }).finally(() => clearTimeout(t));
  if (!res.ok) throw new Error(`SearXNG HTML ${res.status}`);
  const html = await res.text();
  const results: SearchResult[] = [];
  // SearXNG HTML: <h3><a href="https://...">title</a></h3><p class="result-content">snippet
  const regex = /<h3[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) && results.length < limit) {
    const href = m[1];
    if (!href.startsWith("http") || href.includes("searx")) continue;
    const title = m[2].trim().slice(0, 120);
    // Try to find snippet nearby
    const snippetMatch = html.slice(m.index, m.index + 1500).match(/<p[^>]*class="[^"]*content[^"]*"[^>]*>([^<]{20,300})<\/p>/i);
    const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, " ").trim().slice(0, 300) : "";
    results.push({ url: href, title, snippet, domain: extractDomain(href) });
  }
  if (results.length === 0) throw new Error("no parse SearXNG HTML");
  return results.slice(0, limit);
}
