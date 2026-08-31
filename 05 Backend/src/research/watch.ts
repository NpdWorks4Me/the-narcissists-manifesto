/**
 * Watch briefs — drop a .md file into 00 Inbox or research briefs folder and auto-research
 */
import { watch } from "chokidar";
import { join, basename } from "path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { createHash } from "crypto";
import { runResearchOneShot } from "./pipeline.js";

function getVaultRoot(): string {
  const cwd = process.cwd();
  return (() => { const base = cwd.split("/").pop() || ""; const isBackend = base === "backend" || base === "05 Backend"; return isBackend ? cwd.slice(0, -base.length).replace(/\/$/, "") || "." : cwd; })();
}

const vaultRoot = getVaultRoot();
const watchDir = join(vaultRoot, "00 Inbox"); // watch inbox for brief-like files
const briefsDir = join(vaultRoot, "04 Atlas & Meta/Logs/research/briefs");
if (!existsSync(briefsDir)) mkdirSync(briefsDir, { recursive: true });

console.log(`👁️ Research watcher — watching ${watchDir} (+ ${briefsDir})`);
console.log(`Drop a file like "my-idea.md" with first line = idea, or run: npm run research -- "idea"`);

async function handleBrief(filePath: string) {
  try {
    const text = readFileSync(filePath, "utf-8");
    const base = text.split("\n").find((l) => l.trim().length > 10)?.trim() || basename(filePath, ".md").replace(/[-_]/g, " ");
    if (base.length < 5) return;
    // Avoid re-processing hyperfixation notes that already have frontmatter
    if (text.includes("type: hyperfixation") || text.includes("ONE-SHOT")) return;
    console.log(`\n📥 New brief detected: ${filePath} → "${base.slice(0, 60)}"`);
    const res = await runResearchOneShot(base, { maxPages: 8 });
    console.log(`✅ Research done → ${res.hyperfixationPath}`);
    // Write done marker
    const donePath = join(briefsDir, `${createHash("sha256").update(base).digest("hex").slice(0, 8)}.json`);
    writeFileSync(donePath, JSON.stringify({ base, researchId: res.researchId, hyperfixation: res.hyperfixationPath, at: new Date().toISOString() }, null, 2));
  } catch (e) {
    console.error("watch error", e);
  }
}

const watcher = watch([join(watchDir, "*.md"), join(briefsDir, "*.md")], {
  ignoreInitial: true,
  awaitWriteFinish: { stabilityThreshold: 1000 },
});

watcher.on("add", handleBrief);

console.log("Press Ctrl+C to stop. Also use: npm run research -- \"your idea\"");
