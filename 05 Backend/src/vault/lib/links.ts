/** WikiLink + orphan/broken detection */

const WIKILINK_RE = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g;

export function extractWikiLinks(content: string): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = WIKILINK_RE.exec(content))) {
    const target = m[1].trim();
    if (target) out.push(target);
  }
  return out;
}

export function extractTags(content: string): string[] {
  const re = /(^|\s)#([a-zA-Z0-9_\-/]+)/g;
  const tags: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) tags.push(m[2]);
  return [...new Set(tags)];
}

export interface NoteGraph {
  path: string;
  stem: string; // filename without extension
  outgoing: string[];
  incoming: string[];
}

/** Build graph from list of {path, content}. stem = basename without .md */
export function buildGraph(notes: { path: string; content: string; stem: string }[]): Map<string, NoteGraph> {
  const map = new Map<string, NoteGraph>();
  for (const n of notes) {
    map.set(n.stem, { path: n.path, stem: n.stem, outgoing: extractWikiLinks(n.content), incoming: [] });
  }
  for (const [, node] of map) {
    for (const target of node.outgoing) {
      const t = map.get(target);
      if (t) t.incoming.push(node.stem);
    }
  }
  return map;
}

export function findOrphans(graph: Map<string, NoteGraph>, excludeStems: Set<string>): NoteGraph[] {
  return [...graph.values()].filter((n) => !excludeStems.has(n.stem) && n.incoming.length === 0 && n.outgoing.length === 0);
}

export function findBrokenLinks(graph: Map<string, NoteGraph>): { source: string; target: string }[] {
  const broken: { source: string; target: string }[] = [];
  for (const [, node] of graph) {
    for (const t of node.outgoing) {
      if (!graph.has(t)) broken.push({ source: node.stem, target: t });
    }
  }
  return broken;
}
