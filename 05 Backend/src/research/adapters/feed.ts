/**
 * FeedProvider — discover RSS/Atom feeds and parse entries
 */
export interface FeedEntry {
  url: string;
  title: string;
  snippet: string;
}

export function discoverFeeds(html: string, baseUrl: string): string[] {
  const feeds: string[] = [];
  // <link type="application/rss+xml" href="...">
  const regex = /<link[^>]+type=["']application\/(?:rss|atom)\+xml["'][^>]*href=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html))) {
    let href = m[1];
    try {
      href = new URL(href, baseUrl).toString();
    } catch {}
    if (href.startsWith("http")) feeds.push(href);
    if (feeds.length >= 3) break;
  }
  // Also look for /feed, /rss in links
  const generic = [...html.matchAll(/href=["']([^"']*\/(?:feed|rss)[^"']*)["']/gi)].map((x) => x[1]);
  for (const g of generic) {
    try {
      const abs = new URL(g, baseUrl).toString();
      if (!feeds.includes(abs) && abs.startsWith("http")) feeds.push(abs);
    } catch {}
    if (feeds.length >= 3) break;
  }
  return feeds.slice(0, 3);
}

export async function fetchFeed(feedUrl: string): Promise<FeedEntry[]> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(feedUrl, { headers: { "User-Agent": "manifesto-research/0.1" }, signal: controller.signal });
    clearTimeout(t);
    if (!res.ok) return [];
    const text = await res.text();
    const entries: FeedEntry[] = [];
    // Very light RSS parsing: <item><link>url</link><title>title</title><description>desc</description>
    const itemRegex = /<item[\s\S]*?>([\s\S]*?)<\/item>/gi;
    let im: RegExpExecArray | null;
    while ((im = itemRegex.exec(text)) && entries.length < 5) {
      const block = im[1];
      const link = block.match(/<link[^>]*>([^<]+)<\/link>/i)?.[1]?.trim() || block.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1] || "";
      const title = block.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || "";
      const desc = block.match(/<description[^>]*>([^<]+)<\/description>/i)?.[1]?.trim() || block.match(/<content:encoded[^>]*>([^<]+)<\/content:encoded>/i)?.[1]?.trim() || "";
      if (link && link.startsWith("http")) {
        entries.push({ url: link, title: title.slice(0, 120) || link, snippet: desc.slice(0, 300) });
      }
    }
    return entries;
  } catch {
    return [];
  }
}
