/**
 * Vault Auto-Linker — scans vault for note titles + aliases, auto-wraps matching terms in [[wikilinks]]
 * Based on Linkding prospect's vault indexing logic, adapted for manifesto vault
 */
import { readdirSync, readFileSync, existsSync, statSync } from "fs";
import { join, basename } from "path";

export interface TopicMap {
  [lowerTerm: string]: string; // lower term -> canonical Note Title
}

export function indexVaultTopics(vaultRoot: string, opts: { inboxDir?: string } = {}): TopicMap {
  const topicMap: TopicMap = {};
  const inboxDir = opts.inboxDir || join(vaultRoot, "00 Inbox");

  function walk(dir: string) {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        // Skip hidden folders (.obsidian, .git) and inbox bookmarks
        if (entry.startsWith(".")) continue;
        if (full === inboxDir || full.startsWith(inboxDir + "/")) continue;
        walk(full);
      } else if (entry.endsWith(".md")) {
        const noteTitle = basename(entry, ".md");
        // Skip daily note titles YYYY-MM-DD and generic
        if (/^\d{4}-\d{2}-\d{2}$/.test(noteTitle)) continue;
        if (noteTitle.startsWith("_")) continue;

        const lowerTitle = noteTitle.toLowerCase();
        topicMap[lowerTitle] = noteTitle;

        // Parse frontmatter for aliases
        try {
          const content = readFileSync(full, "utf-8").slice(0, 4096);
          if (content.startsWith("---")) {
            const match = content.match(/^---([\s\S]*?)---/);
            if (match) {
              const yamlBlock = match[1];
              // aliases: [alias1, alias2] or aliases: \n  - alias1
              const aliasArrayMatch = yamlBlock.match(/aliases:\s*\[(.*?)\]/);
              if (aliasArrayMatch) {
                const aliases = aliasArrayMatch[1].split(",").map((a) => a.trim().replace(/^["']|["']$/g, ""));
                for (const a of aliases) if (a) topicMap[a.toLowerCase()] = noteTitle;
              }
              // Also handle bulleted aliases
              const aliasBulletMatches = [...yamlBlock.matchAll(/-\s*["']?([^"'\n]+)["']?/g)];
              // Only if aliases section exists, but we already handled array, skip for now
            }
            // Also index tags as topics? No, keep to titles/aliases
          }
        } catch {}
      }
    }
  }

  const vaultMdRoot = vaultRoot;
  if (existsSync(vaultMdRoot)) walk(vaultMdRoot);
  return topicMap;
}

export function autoLinkText(text: string, topicMap: TopicMap): { linkedText: string; matchedTopics: string[] } {
  if (!text || Object.keys(topicMap).length === 0) return { linkedText: text, matchedTopics: [] };

  const sortedTerms = Object.keys(topicMap).sort((a, b) => b.length - a.length);
  const matchedTopics = new Set<string>();
  let linkedText = text;

  for (const term of sortedTerms) {
    if (term.length <= 2) continue;
    const canonical = topicMap[term];
    // Regex with word boundaries, not inside existing [[...]] or Markdown links
    const pattern = new RegExp(`(?<!\\[\\[)\\b(${escapeRegExp(term)})\\b(?!\\]\\])`, "gi");
    if (pattern.test(linkedText)) {
      // Reset lastIndex for global
      pattern.lastIndex = 0;
      linkedText = linkedText.replace(pattern, (match) => {
        matchedTopics.add(canonical);
        if (match.toLowerCase() === canonical.toLowerCase()) return `[[${canonical}]]`;
        return `[[${canonical}|${match}]]`;
      });
    }
  }

  return { linkedText, matchedTopics: [...matchedTopics].sort() };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// For research vaultWriter: auto-link raw capture and synthesis against vault topics
export function enrichWithVaultLinks(vaultRoot: string, markdownBody: string): { enriched: string; relatedTopics: string[] } {
  const topicMap = indexVaultTopics(vaultRoot);
  const { linkedText, matchedTopics } = autoLinkText(markdownBody, topicMap);
  return { enriched: linkedText, relatedTopics: matchedTopics };
}
