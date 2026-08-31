/**
 * ArchiveProvider — Wayback Machine for old/forgotten/rare ideas
 */
export interface ArchiveInfo {
  archiveUrl: string;
  timestamp: string;
  available: boolean;
}

export async function checkWayback(url: string): Promise<ArchiveInfo | null> {
  try {
    const api = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(api, { signal: controller.signal, headers: { "User-Agent": "manifesto-research/0.1" } });
    clearTimeout(t);
    if (!res.ok) return null;
    const data: any = await res.json();
    const snap = data?.archived_snapshots?.closest;
    if (snap && snap.available && snap.url) {
      return { archiveUrl: snap.url, timestamp: snap.timestamp || "", available: true };
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchArchiveSnapshot(url: string): Promise<string | null> {
  const info = await checkWayback(url);
  if (!info) return null;
  try {
    const res = await fetch(info.archiveUrl, { headers: { "User-Agent": "manifesto-research/0.1" } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
