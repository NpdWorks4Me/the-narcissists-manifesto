/**
 * heal — orphan healing via auto-linker (Phase 4 of nightly)
 * Finds orphans and injects suggested wiki links using shared terms
 * Usage: npx tsx 05 Backend/src/vault/heal.ts [--dry-run] [--apply]
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync, appendFileSync } from "fs";
import { join, basename } from "path";
import matter from "gray-matter";
import { parseFrontmatter, todayISO } from "./lib/frontmatter.js";
import { CONFIG } from "./lib/config.js";
import { buildGraph, findOrphans } from "./lib/links.js";
import { indexVaultTopics, autoLinkText } from "./lib/autoLinker.js";

const _cwd = process.cwd();
const vaultRoot = (() => { const base = _cwd.split("/").pop() || ""; const isBackend = base === "backend" || base === "05 Backend"; return isBackend ? _cwd.slice(0, -base.length).replace(/\/$/, "") || "." : _cwd; })();
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run") || !args.includes("--apply");

function collect(dirRel: string) {
  const full = join(vaultRoot, dirRel);
  if (!existsSync(full)) return [];
  const out: any[] = [];
  function walk(dir: string, relBase: string) {
    for (const e of readdirSync(dir)) {
      if (e.startsWith(".")) continue;
      const p = join(dir, e);
      const rel = join(relBase, e);
      const s = statSync(p);
      if (s.isDirectory()) walk(p, rel);
      else if (e.endsWith(".md")) {
        const raw = readFileSync(p, "utf-8");
        out.push({ path: p, rel, raw, stem: basename(e, ".md") });
      }
    }
  }
  walk(full, dirRel);
  return out;
}

async function main() {
  console.log(`🩹 Heal — orphan auto-link ${dryRun ? "(dry-run)" : "(apply)"}`);
  const hyper = collect(CONFIG.FOLDERS.hyperfixations);
  const atomic = collect(CONFIG.FOLDERS.atomic);
  const pool = [...hyper, ...atomic];
  const graph = buildGraph(pool.map((n) => ({ path: n.rel, content: n.raw, stem: n.stem })));
  const exclude = new Set(["_INBOX_README", "T_Hyperfixation", "T_Atomic_Concept", "T_Content_Spec"]);
  const orphans = findOrphans(graph, exclude);
  console.log(`  Orphans: ${orphans.length}`);
  if (orphans.length === 0) { console.log("  ✅ No orphans"); return; }

  let healed = 0;
  const topicMap = indexVaultTopics(vaultRoot);
  for (const orphan of orphans.slice(0, 5)) {
    const raw = readFileSync(join(vaultRoot, orphan.path), "utf-8");
    const parsed = matter(raw);
    const { matchedTopics } = autoLinkText(parsed.content.slice(0, 4000), topicMap);
    const related = matchedTopics.filter((t) => t !== orphan.stem).slice(0, 3);
    if (related.length === 0) {
      console.log(`  • ${orphan.stem}: no suggestions`);
      continue;
    }
    console.log(`  • ${orphan.stem}: suggest ${related.map((t) => `[[${t}]]`).join(", ")}`);
    if (!dryRun) {
      const linkLine = `\n\n> 🩹 Auto-heal ${todayISO()}: Related → ${related.map((t) => `[[${t}]]`).join(" · ")}\n`;
      const newRaw = matter.stringify(parsed.content.trimEnd() + linkLine, { ...parsed.data, updated: todayISO() });
      writeFileSync(join(vaultRoot, orphan.path), newRaw, "utf-8");
      healed++;
    }
  }
  console.log(`  Healed ${healed} orphans${dryRun ? " (dry-run)" : ""}`);
  const logPath = join(vaultRoot, CONFIG.FOLDERS.logs, "agent-insights.log");
  try { if (!dryRun) appendFileSync(logPath, `[${new Date().toISOString()}] heal: orphans=${orphans.length} healed=${healed}\n`); } catch {}
}

main().catch((e) => { console.error("heal failed", e); process.exit(1); });
