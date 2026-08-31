/**
 * Fetcher with file cache (TTL 86400) and trafilatura-like text extraction fallback
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import { htmlToCleanMarkdown } from "./adapters/crawl4ai.js";

export interface FetchResult {
  url: string;
  status: number;
  content: string; // extracted text
  raw: string; // raw html
  error?: string;
  headers: Record<string, string>;
  cached: boolean;
}

function cachePath(cacheDir: string, url: string): string {
  const h = createHash("sha256").update(url).digest("hex").slice(0, 16);
  return join(cacheDir, `${h}.html`);
}

export class Fetcher {
  constructor(
    private vaultRoot: string,
    private cacheDir: string = "04 Atlas & Meta/Logs/research/.cache",
    private ttlSeconds: number = 86400
  ) {}

  async fetch(url: string): Promise<FetchResult> {
    const fullCacheDir = join(this.vaultRoot, this.cacheDir);
    if (!existsSync(fullCacheDir)) mkdirSync(fullCacheDir, { recursive: true });
    const cp = cachePath(fullCacheDir, url);
    // Cache hit
    if (existsSync(cp)) {
      try {
        const age = Date.now() - statSync(cp).mtimeMs;
        if (age < this.ttlSeconds * 1000) {
          const cached = readFileSync(cp, "utf-8");
          return {
            url,
            status: 200,
            content: cached,
            raw: cached,
            headers: { "X-Cache": "HIT", "X-Cache-Age": String(Math.floor(age / 1000)) },
            cached: true,
          };
        }
      } catch {}
    }

    // Demo stub for example.com
    if (url.includes("example.com")) {
      const demo = `# Demo for ${url}\nNarcissism as performance and audience capture. Validation loops, mirroring, and the fragmented self. Early web archival references.\nLicense: CC BY 4.0\n`;
      return { url, status: 200, content: demo, raw: demo, headers: { "X-Demo": "true" }, cached: false };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 manifesto-research/0.1" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const raw = await res.text();
      let content = raw;
      // Crawl4AI-like clean Markdown (agent-centric, strips clutter)
      try {
        content = htmlToCleanMarkdown(raw, url);
        // If clean markdown is too short, fallback to simple strip
        if (!content || content.length < 200) {
          content = raw
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 8000);
        }
        if (!content || content.length < 200) content = raw.slice(0, 8000);
      } catch {
        content = raw
          .replace(/<script[\s\S]*?<\/script>/gi, " ")
          .replace(/<style[\s\S]*?<\/style>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 8000);
        if (!content || content.length < 200) content = raw.slice(0, 8000);
      }

      // Cache write
      try {
        writeFileSync(cp, content.slice(0, 500000), "utf-8");
      } catch {}

      const headers: Record<string, string> = {};
      res.headers.forEach((v, k) => (headers[k] = v));

      return {
        url,
        status: res.status,
        content,
        raw,
        headers,
        cached: false,
        error: res.ok ? undefined : `HTTP ${res.status}`,
      };
    } catch (e: any) {
      return {
        url,
        status: 0,
        content: "",
        raw: "",
        headers: {},
        cached: false,
        error: String(e?.message || e),
      };
    }
  }
}
