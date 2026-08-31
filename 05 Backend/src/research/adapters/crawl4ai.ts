/**
 * Crawl4AI-like clean Markdown extractor — agent-centric
 * Converts raw HTML to LLM-friendly Markdown, stripping JS clutter, ads, nav
 * Inspired by Crawl4AI's heuristic + LLM-friendly output
 */

export function htmlToCleanMarkdown(html: string, url: string): string {
  if (!html || html.length < 100) return html;

  let clean = html;

  // Remove scripts, styles, nav, header, footer, ads, comments
  clean = clean.replace(/<script[\s\S]*?<\/script>/gi, "");
  clean = clean.replace(/<style[\s\S]*?<\/style>/gi, "");
  clean = clean.replace(/<!--[\s\S]*?-->/g, "");
  clean = clean.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  clean = clean.replace(/<header[\s\S]*?<\/header>/gi, "");
  clean = clean.replace(/<footer[\s\S]*?<\/footer>/gi, "");
  // Remove common ad/nav classes
  clean = clean.replace(/<div[^>]*class="[^"]*(?:ad|advert|nav|menu|sidebar|cookie|popup)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");

  // Convert headings to Markdown
  clean = clean.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "# $1\n\n");
  clean = clean.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "## $1\n\n");
  clean = clean.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "### $1\n\n");
  clean = clean.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "#### $1\n\n");

  // Convert links: <a href="url">text</a> → [text](url)
  clean = clean.replace(/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, (m, href, text) => {
    try {
      const abs = new URL(href, url).toString();
      return `[${text.trim()}](` + abs + `)`;
    } catch { return text; }
  });

  // Convert images: <img src="..." alt="..."> → ![alt](src)
  clean = clean.replace(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi, (m, src, alt) => {
    try { const abs = new URL(src, url).toString(); return `![${alt || "image"}](${abs})`; } catch { return ""; }
  });
  clean = clean.replace(/<img[^>]+src="([^"]+)"[^>]*>/gi, (m, src) => {
    try { const abs = new URL(src, url).toString(); return `![](${abs})`; } catch { return ""; }
  });

  // Convert paragraphs and breaks
  clean = clean.replace(/<p[^>]*>/gi, "\n\n");
  clean = clean.replace(/<\/p>/gi, "\n\n");
  clean = clean.replace(/<br\s*\/?>/gi, "\n");
  clean = clean.replace(/<li[^>]*>/gi, "\n- ");
  clean = clean.replace(/<\/li>/gi, "");
  clean = clean.replace(/<ul[^>]*>/gi, "\n");
  clean = clean.replace(/<\/ul>/gi, "\n");
  clean = clean.replace(/<ol[^>]*>/gi, "\n");
  clean = clean.replace(/<\/ol>/gi, "\n");
  clean = clean.replace(/<blockquote[^>]*>/gi, "\n> ");
  clean = clean.replace(/<\/blockquote>/gi, "\n");

  // Strip remaining tags
  clean = clean.replace(/<[^>]+>/g, " ");

  // Decode entities
  clean = clean.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'");

  // Clean whitespace
  clean = clean.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").replace(/\n +/g, "\n").trim();

  // Truncate
  if (clean.length > 12000) clean = clean.slice(0, 12000) + "\n\n...[truncated]";

  return clean;
}

// Heuristic extraction for structured JSON (like Crawl4AI's JSON schema mode)
export function extractStructuredJson(html: string, url: string): Record<string, any> | null {
  try {
    // Try to find JSON-LD
    const jsonLdMatch = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      const data = JSON.parse(jsonLdMatch[1]);
      return { jsonLd: data, source: url };
    }
  } catch {}
  return null;
}

// Main Crawl4AI-like fetch + clean
export async function crawlToMarkdown(url: string, rawHtml: string): Promise<string> {
  const markdown = htmlToCleanMarkdown(rawHtml, url);
  // If markdown is too short, fallback to raw
  if (markdown.length < 200) return rawHtml.slice(0, 8000);
  return markdown;
}
