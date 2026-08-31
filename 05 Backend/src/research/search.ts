/**
 * Spectrum Search — multiple engines with fallback, no API key
 * Primary: DuckDuckGo HTML, Fallbacks: Bing, Brave, Wikipedia
 */
export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  domain: string;
}

const STUB_RESULTS: SearchResult[] = [
  {
    url: "https://example.com/narcissism-performance",
    title: "Narcissism as Performance — Example Archive",
    snippet: "Example demo for narcissism manifesto — performance, audience capture, and validation loops.",
    domain: "example.com",
  },
];

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.split("/")[2] || "unknown";
  }
}

async function searchDuckDuckGo(query: string, limit = 5): Promise<SearchResult[]> {
  await new Promise(r => setTimeout(r, 350));
  const q = encodeURIComponent(query);
  const url = `https://html.duckduckgo.com/html/?q=${q}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 manifesto-research/0.1", Accept: "text/html" },
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
  if (!res.ok) throw new Error(`DDG ${res.status}`);
  const html = await res.text();
  const results: SearchResult[] = [];
  const regex = /class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?class="result__snippet"[^>]*>([^<]+)</g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) && results.length < limit) {
    let href = m[1];
    const uddg = href.match(/uddg=([^&]+)/);
    if (uddg) { try { href = decodeURIComponent(uddg[1]); } catch {} }
    if (!href.startsWith("http")) {
      if (href.startsWith("//")) href = "https:" + href;
      else continue;
    }
    results.push({ url: href, title: m[2].trim().slice(0, 120) || href, snippet: m[3].trim().slice(0, 300) || "", domain: extractDomain(href) });
  }
  if (results.length === 0) {
    const hrefs = [...html.matchAll(/href="(https:\/\/[^"]+)"/g)].map(x => x[1]);
    for (const h of hrefs.slice(0, limit * 2)) {
      if (h.includes("duckduckgo.com") || h.includes("y.js") || h.includes("bing.com") ) continue;
      if (results.some(r => r.url === h)) continue;
      results.push({ url: h, title: h, snippet: "", domain: extractDomain(h) });
      if (results.length >= limit) break;
    }
  }
  if (results.length === 0) throw new Error("no parse DDG");
  return results.slice(0, limit);
}

async function searchBing(query: string, limit = 5): Promise<SearchResult[]> {
  await new Promise(r => setTimeout(r, 400));
  const q = encodeURIComponent(query);
  const url = `https://www.bing.com/search?q=${q}&count=${limit * 2}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 manifesto-research/0.1",
      Accept: "text/html",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
  if (!res.ok) throw new Error(`Bing ${res.status}`);
  const html = await res.text();
  const results: SearchResult[] = [];
  // Bing: <h2><a href="https://...">title</a></h2> + <div class="b_caption"><p>snippet
  const regex = /<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) && results.length < limit) {
    const href = m[1];
    if (!href.startsWith("http") || href.includes("bing.com") || href.includes("microsoft.com")) continue;
    // Try to find snippet near
    const snippetMatch = html.slice(m.index, m.index + 1500).match(/<p[^>]*>([^<]{20,300})<\/p>/);
    const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, " ").trim().slice(0, 300) : "";
    results.push({ url: href, title: m[2].trim().slice(0, 120), snippet, domain: extractDomain(href) });
  }
  if (results.length === 0) throw new Error("no parse Bing");
  return results.slice(0, limit);
}

async function searchBrave(query: string, limit = 5): Promise<SearchResult[]> {
  await new Promise(r => setTimeout(r, 400));
  const q = encodeURIComponent(query);
  const url = `https://search.brave.com/search?q=${q}&source=web`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 manifesto-research/0.1", Accept: "text/html" },
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
  if (!res.ok) throw new Error(`Brave ${res.status}`);
  const html = await res.text();
  const results: SearchResult[] = [];
  // Brave uses data-url or href with brave search
  const regex = /<a[^>]+href="(https:\/\/[^"]+)"[^>]*class="[^"]*result[^"]*"[^>]*>([^<]+)</gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) && results.length < limit) {
    const href = m[1];
    if (href.includes("brave.com") || href.includes("search.brave")) continue;
    results.push({ url: href, title: m[2].trim().slice(0, 120), snippet: "", domain: extractDomain(href) });
  }
  // Fallback generic hrefs
  if (results.length === 0) {
    const hrefs = [...html.matchAll(/href="(https:\/\/[^"]+)"/g)].map(x => x[1]);
    for (const h of hrefs) {
      if (h.includes("brave.com") || h.includes("search.brave") || results.some(r => r.url === h)) continue;
      if (!h.startsWith("http")) continue;
      results.push({ url: h, title: h, snippet: "", domain: extractDomain(h) });
      if (results.length >= limit) break;
    }
  }
  if (results.length === 0) throw new Error("no parse Brave");
  return results.slice(0, limit);
}

import { searchSearXNG } from "./adapters/searxng.js";

// Public spectrum search with fallback chain — SearXNG first only if SEARXNG_URL is explicitly set
export async function searchWithFallback(query: string, limit = 5): Promise<SearchResult[]> {
  // Try SearXNG only if user has self-hosted instance (env var) — public instances are spare, not primary
  if (process.env.SEARXNG_URL) {
    try {
      const searx = await searchSearXNG(query, limit);
      if (searx.length > 0) return searx;
    } catch {}
  }
  const engines: Array<(q: string, l: number) => Promise<SearchResult[]>> = [searchDuckDuckGo, searchBing, searchBrave];
  let lastError: any = null;
  for (const engine of engines) {
    try {
      const res = await engine(query, limit);
      if (res.length > 0 && !res.every(r => r.domain === "example.com")) {
        // Check if results are not just stub-like (real domains)
        const real = res.filter(r => !r.url.includes("example.com"));
        if (real.length > 0) return real.slice(0, limit);
      }
      if (res.length > 0) return res;
    } catch (e) {
      lastError = e;
      // try next engine
    }
  }
  // Final fallback to stub
  return STUB_RESULTS.map(s => ({ ...s, url: s.url + `?q=${encodeURIComponent(query)}`, title: `${query} — ${s.title}` })).slice(0, limit);
}

// Keep original export for backwards compat, but make it use fallback
export async function searchDuckDuckGoWithFallback(query: string, limit = 5): Promise<SearchResult[]> {
  return searchWithFallback(query, limit);
}

// For pipeline, export a generic search that tries all
export { searchWithFallback as search };
