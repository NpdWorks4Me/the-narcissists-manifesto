/**
 * Media harvest — extract images, audio, video from raw html
 */
export interface MediaAsset {
  url: string;
  type: "image" | "audio" | "video";
  alt: string;
  sourceUrl: string;
}

export function harvestMedia(rawHtml: string, sourceUrl: string): MediaAsset[] {
  const assets: MediaAsset[] = [];
  if (!rawHtml || rawHtml.length < 200) return assets;

  // Images: <img src>, exclude data: and tiny trackers
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRegex.exec(rawHtml)) && assets.length < 15) {
    let src = m[1].trim();
    if (src.startsWith("data:")) continue;
    if (src.length < 10) continue;
    try {
      src = new URL(src, sourceUrl).toString();
    } catch {
      continue;
    }
    if (!src.startsWith("http")) continue;
    if (src.includes("1x1") || src.includes("pixel")) continue;
    const altMatch = m[0].match(/alt=["']([^"']*)["']/i);
    const alt = altMatch ? altMatch[1].slice(0, 100) : "";
    assets.push({ url: src, type: "image", alt, sourceUrl });
  }

  // Audio: <audio src> or <source src> inside audio, plus .mp3/.wav/.ogg links
  const audioRegex = /<audio[^>]+src=["']([^"']+)["']|<source[^>]+src=["']([^"']+\.(?:mp3|wav|ogg|m4a))["']/gi;
  while ((m = audioRegex.exec(rawHtml)) && assets.length < 15) {
    let src = (m[1] || m[2] || "").trim();
    if (!src) continue;
    try {
      src = new URL(src, sourceUrl).toString();
    } catch {
      continue;
    }
    assets.push({ url: src, type: "audio", alt: "", sourceUrl });
  }
  // Also find direct mp3 links in href
  const mp3Href = [...rawHtml.matchAll(/href=["']([^"']+\.(?:mp3|wav|ogg|m4a))["']/gi)].map((x) => x[1]);
  for (const h of mp3Href.slice(0, 3)) {
    try {
      const abs = new URL(h, sourceUrl).toString();
      if (!assets.some((a) => a.url === abs)) assets.push({ url: abs, type: "audio", alt: "", sourceUrl });
    } catch {}
    if (assets.length >= 15) break;
  }

  // Video: <video src>, youtube embeds, .mp4
  const videoRegex = /<video[^>]+src=["']([^"']+)["']|<iframe[^>]+src=["']([^"']+(?:youtube|vimeo)[^"']*)["']/gi;
  while ((m = videoRegex.exec(rawHtml)) && assets.length < 15) {
    let src = (m[1] || m[2] || "").trim();
    if (!src) continue;
    try {
      src = new URL(src, sourceUrl).toString();
    } catch {
      // for youtube embeds, keep as is if http
      if (!src.startsWith("http")) continue;
    }
    assets.push({ url: src, type: "video", alt: "", sourceUrl });
  }

  return assets.slice(0, 15);
}

export function isHighValueMedia(asset: MediaAsset, query: string): boolean {
  const q = query.toLowerCase();
  const alt = asset.alt.toLowerCase();
  // Boost if alt or URL contains rare/media terms or query terms
  const rarity = ["archival", "vintage", "rare", "forgotten", "abandoned", "lost", "analog", "old", "retro"];
  return rarity.some((t) => alt.includes(t) || asset.url.toLowerCase().includes(t)) || q.split(/\s+/).some((t) => alt.includes(t));
}
