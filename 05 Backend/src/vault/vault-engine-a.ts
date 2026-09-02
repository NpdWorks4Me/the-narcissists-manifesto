/**
 * Engine A — Meta-Tracking & System Maintenance
 * - Inbox triage & auto-parsing
 * - Resume point nudges
 * - Stale / orphan / broken hygiene
 * - WIP enforcement
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync, renameSync, mkdirSync, appendFileSync, unlinkSync } from "fs";
import { join, basename } from "path";
import matter from "gray-matter";
import { parseFrontmatter, todayISO, generateId } from "./lib/frontmatter.js";
import { analyzeText } from "./lib/nlp.js";
import { buildGraph, findOrphans, findBrokenLinks } from "./lib/links.js";
import { CONFIG } from "./lib/config.js";
import { appendTrackingRow } from "./lib/tracking.js";
import { autoTag } from "./lib/tagging.js";

const _cwd = process.cwd();
const vaultRoot = (() => { const base = _cwd.split("/").pop() || ""; const isBackend = base === "backend" || base === "05 Backend"; return isBackend ? _cwd.slice(0, -base.length).replace(/\/$/, "") || "." : _cwd; })();
const args = process.argv.slice(2);
const dryRun = !args.includes("--apply");
const once = args.includes("--once");

function collectMd(dirRel: string) {
  const full = join(vaultRoot, dirRel);
  if (!existsSync(full)) return [];
  const out: { path: string; rel: string; content: string; stem: string; mtime: Date }[] = [];
  function walk(dir: string, relBase: string) {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith(".")) continue;
      const p = join(dir, entry);
      const rel = join(relBase, entry);
      const stat = statSync(p);
      if (stat.isDirectory()) walk(p, rel);
      else if (entry.endsWith(".md")) out.push({ path: p, rel, content: readFileSync(p, "utf-8"), stem: basename(entry, ".md"), mtime: stat.mtime });
    }
  }
  walk(full, dirRel);
  return out;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "untitled";
}

async function triageInbox() {
  console.log(`\n📥 Triage — 00 Inbox (dryRun=${dryRun})`);
  const notes = collectMd(CONFIG.FOLDERS.inbox);
  const actionable = notes.filter((n) => {
    if (n.stem === "_INBOX_README") return false;
    const { errors, data } = parseFrontmatter(n.content, n.rel);
    // needs triage if raw, missing type, or YAML errors
    return errors.length > 0 || !data.type || data.status === "raw" || data.type === "inbox";
  });

  if (actionable.length === 0) console.log("  No inbox items needing triage.");
  const logPath = join(vaultRoot, CONFIG.FOLDERS.logs, "triage.log");

  for (const n of actionable) {
    const analysis = analyzeText(n.content);
    const title = n.stem === "Untitled" || n.stem === "untitled" ? analysis.topPhrases[0] || n.stem : n.stem;
    const id = generateId();
    const today = todayISO();

    // Decide routing: single-topic if topics 1-2 and top phrase frequency >2
    const singleTopic = analysis.topPhrases.length > 0 && analysis.topPhrases[0] && (analysis.topics.length <= 2 || analysis.wordCount < 600);

    const autoTags = autoTag({
      idea: title,
      baseTags: analysis.tags,
      extraTags: singleTopic ? ["triage", "inbox-to-hyperfixation", "engine-a"] : ["triage", "inbox", "engine-a"],
    });
    const mergedTags = [...new Set([...analysis.tags.slice(0, 5).map((t) => t.toLowerCase()), ...autoTags])].slice(0, 12);
    const frontmatter: any = {
      id,
      title: title.replace(/-/g, " "),
      type: singleTopic ? "hyperfixation" : "inbox",
      status: singleTopic ? "active" : "raw",
      created: today,
      updated: today,
      tags: mergedTags,
      aliases: [],
      resume_point: { last_explored: today, current_thought: analysis.topPhrases[0] || "", next_step: "Clarify research question and link sources" },
      content_potential: { suggested_format: "none", confidence_score: 0.0 },
    };

    const originalContent = n.content;
    // Ensure we preserve raw capture
    let bodyContent = "";
    try {
      const parsed = matter(originalContent);
      bodyContent = parsed.content.trim();
    } catch {
      bodyContent = originalContent.trim();
    }
    if (!bodyContent.includes("## Raw Capture")) {
      bodyContent = `## Raw Capture\n\n${bodyContent}\n`;
    }
    // Append inline auto-tags for Obsidian tag pane
    const inlineTags = mergedTags.map((t) => `#${t}`).join(" ");
    if (!bodyContent.includes(inlineTags)) {
      bodyContent = bodyContent.trimEnd() + `\n\n---\n\n${inlineTags}\n`;
    }

    const newRaw = matter.stringify(bodyContent, frontmatter);
    const suggestedTarget = singleTopic ? join(CONFIG.FOLDERS.hyperfixations, `${slugify(title)}.md`) : null;

    console.log(`  • ${n.rel}: topics=[${analysis.topics.slice(0, 2).join(", ")}] tags=[${frontmatter.tags.join(", ")}] → ${suggestedTarget || "keep in inbox"}`);

    appendFileSync(logPath, `[${new Date().toISOString()}] triage ${n.rel} -> ${suggestedTarget || "inbox"} tags=${frontmatter.tags.join(",")} topics=${analysis.topics.join("|")}\n`);

    if (!dryRun) {
      if (suggestedTarget) {
        const targetFull = join(vaultRoot, suggestedTarget);
        if (!existsSync(targetFull)) {
          // Ensure directory
          mkdirSync(join(vaultRoot, CONFIG.FOLDERS.hyperfixations), { recursive: true });
          writeFileSync(targetFull, newRaw, "utf-8");
          // Delete inbox copy after successful routing — keep inbox clean
          try { unlinkSync(n.path); } catch {}
          console.log(`    → created ${suggestedTarget} (inbox copy removed)`);
        } else {
          // Target already exists (re-triage): delete inbox copy so it doesn't linger as a duplicate WIP slot
          try { unlinkSync(n.path); } catch {}
          console.log(`    → target exists, inbox copy removed (avoid WIP duplicate)`);
        }
      } else {
        writeFileSync(n.path, newRaw, "utf-8");
        console.log(`    → updated frontmatter in place`);
      }
    } else {
      console.log(`    (dry-run) would write: ${suggestedTarget || n.rel}`);
    }
  }
}

function checkResumeNudges(allNotes: ReturnType<typeof collectMd>) {
  console.log("\n⏰ Resume nudges (>7d)");
  const nudges: any[] = [];
  for (const n of allNotes) {
    const { data } = parseFrontmatter(n.content, n.rel);
    if (data.status !== "active" || data.type !== "hyperfixation") continue;
    const updated = new Date(data.updated);
    const days = (Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24);
    if (days > CONFIG.RESUME_NUDGE_DAYS) {
      const msg = `${n.rel} resting ${Math.floor(days)}d — last next_step: "${data.resume_point?.next_step || "—"}"`;
      console.log(`  • ${msg}`);
      nudges.push({ file: n.rel, days: Math.floor(days), next_step: data.resume_point?.next_step });
    }
  }
  if (nudges.length > 0) {
    const outPath = join(vaultRoot, CONFIG.FOLDERS.logs, "resume-nudges.json");
    writeFileSync(outPath, JSON.stringify({ generated: new Date().toISOString(), threshold_days: CONFIG.RESUME_NUDGE_DAYS, nudges }, null, 2));
  }
  return nudges;
}

function checkHygieneAndWip(allNotes: ReturnType<typeof collectMd>) {
  console.log("\n🧹 Hygiene & WIP");
  // Exclude Logs (research assets are reference corpus, not graph nodes) — see health.ts for parity
  const graphNotes = allNotes
    .filter((n) => !n.rel.includes("04 Atlas & Meta/Logs/") && !n.rel.includes("04 Atlas & Meta/Templates/"))
    .map((n) => ({ path: n.rel, content: n.content, stem: n.stem }));
  const graph = buildGraph(graphNotes);
  const exclude = new Set(["_INBOX_README", "🏠 Command Center", "📈 Knowledge Graph Intelligence", "SETUP", "T_Hyperfixation", "T_Atomic_Concept", "T_Content_Spec"]);
  const orphans = findOrphans(graph, exclude);
  const broken = findBrokenLinks(graph);

  // Stale — exclude Logs (research logs aren't stale-eligible)
  const stale: typeof allNotes = [];
  for (const n of allNotes) {
    if (n.rel.includes("04 Atlas & Meta/Logs/")) continue;
    const { data } = parseFrontmatter(n.content, n.rel);
    if ((data.type === "hyperfixation" || data.type === "content-project") && data.status !== "archived" && data.status !== "parked") {
      const updated = new Date(data.updated);
      const days = (Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24);
      if (days > CONFIG.STALE_PROJECT_DAYS) stale.push(n);
    }
  }

  console.log(`  Orphans: ${orphans.length}, Broken: ${broken.length}, Stale >${CONFIG.STALE_PROJECT_DAYS}d: ${stale.length}`);

  // WIP — exclude Logs (not project-eligible)
  const active = allNotes.filter((n) => {
    if (n.rel.includes("04 Atlas & Meta/Logs/")) return false;
    if (n.rel.includes("04 Atlas & Meta/Templates/")) return false;
    if (n.content.includes("<%")) return false; // Templater placeholders → templates
    const { data } = parseFrontmatter(n.content, n.rel);
    return data.status === "active" && (data.type === "hyperfixation" || data.type === "content-project");
  });
  const wipCount = active.length;
  console.log(`  WIP active: ${wipCount}/${CONFIG.WIP_LIMIT} ${wipCount > CONFIG.WIP_LIMIT ? "⚠️ EXCEEDED" : "✅"}`);

  const hygienePath = join(vaultRoot, CONFIG.FOLDERS.logs, "hygiene.json");
  writeFileSync(hygienePath, JSON.stringify({ last_run: new Date().toISOString(), wip_count: wipCount, wip_limit: CONFIG.WIP_LIMIT, orphans: orphans.map((o) => o.stem), broken_links: broken, stale: stale.map((s) => s.rel) }, null, 2));

  // Also append tracking row for today
  try {
    const topNote = allNotes[0];
    const { data } = topNote ? parseFrontmatter(topNote.content, topNote.rel) : { data: { id: "system", title: "system", type: "moc", status: "active" } as any };
    appendTrackingRow(vaultRoot, {
      date: todayISO(),
      note_id: "engine-a",
      title: "Engine A hygiene",
      type: "system",
      status: "active",
      wip_count: wipCount,
      orphan_count: orphans.length,
      broken_links: broken.length,
      confidence: 0,
      event: "hygiene_scan",
    });
  } catch {}

  if (wipCount > CONFIG.WIP_LIMIT && !dryRun) {
    const alertPath = join(vaultRoot, CONFIG.FOLDERS.logs, "wip-alert.md");
    const candidates = active.sort((a, b) => new Date(parseFrontmatter(a.content, a.rel).data.updated).getTime() - new Date(parseFrontmatter(b.content, b.rel).data.updated).getTime()).slice(0, 3);
    const alertContent = `# WIP Alert — ${new Date().toISOString().slice(0, 10)}\n\n> [!WARNING] WIP ${wipCount}/${CONFIG.WIP_LIMIT} exceeded. Consider parking:\n\n${candidates.map((c) => `- [[${c.stem}]] — updated ${parseFrontmatter(c.content, c.rel).data.updated} — next_step: "${parseFrontmatter(c.content, c.rel).data.resume_point?.next_step || "—"}"`).join("\n")}\n\n*This project has been resting. Resume from last point, park, or extract key insights?* — choose one.\n`;
    writeFileSync(alertPath, alertContent, "utf-8");
    console.log(`  → WIP alert written to Logs/wip-alert.md`);
  }

  return { orphans, broken, stale, wipCount };
}

async function main() {
  console.log(`🔧 Engine A — Meta-Tracking ${dryRun ? "(dry-run)" : "(apply)"}`);
  const allFolders = ["00 Inbox", "01 Hyperfixations", "02 Atomic Concepts", "03 Content Lab", "04 Atlas & Meta"];
  const allNotes = allFolders.flatMap(collectMd);

  await triageInbox();
  checkResumeNudges(allNotes);
  checkHygieneAndWip(allNotes);

  console.log("\n✅ Engine A complete." + (dryRun ? " (dry-run — no files moved; use --apply)" : ""));
}

main().catch((e) => {
  console.error("Engine A failed:", e);
  process.exit(1);
});
