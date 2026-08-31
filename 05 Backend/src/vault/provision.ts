/**
 * Provision — idempotent folder/file scaffolding + initial logs
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

const _cwd = process.cwd();
const vaultRoot = (() => { const base = _cwd.split("/").pop() || ""; const isBackend = base === "backend" || base === "05 Backend"; return isBackend ? _cwd.slice(0, -base.length).replace(/\/$/, "") || "." : _cwd; })();

function ensureDir(rel: string) {
  const full = join(vaultRoot, rel);
  if (!existsSync(full)) {
    mkdirSync(full, { recursive: true });
    console.log(`✓ created ${rel}/`);
  } else {
    console.log(`— exists ${rel}/`);
  }
}

function ensureFile(rel: string, content: string) {
  const full = join(vaultRoot, rel);
  if (!existsSync(full)) {
    writeFileSync(full, content, "utf-8");
    console.log(`✓ created ${rel}`);
  } else {
    console.log(`— exists ${rel}`);
  }
}

const folders = [
  "00 Inbox",
  "01 Hyperfixations",
  "02 Atomic Concepts",
  "03 Content Lab",
  "04 Atlas & Meta/Templates",
  "04 Atlas & Meta/Dashboards",
  "04 Atlas & Meta/Scripts", // code lives in backend/src/vault — keep placeholder for spec
  "04 Atlas & Meta/Logs",
  "05 Backend/src/vault/lib",
  "05 Backend/scripts",
  "05 Backend/__tests__/fixtures",
];

for (const f of folders) ensureDir(f);

// Initial tracking.csv
const trackingCsv = join(vaultRoot, "04 Atlas & Meta/Logs/tracking.csv");
if (!existsSync(trackingCsv)) {
  writeFileSync(trackingCsv, "date,note_id,title,type,status,wip_count,orphan_count,broken_links,confidence,event\n", "utf-8");
  console.log("✓ created Logs/tracking.csv");
}

// Hygiene & insights placeholders
ensureFile(
  "04 Atlas & Meta/Logs/hygiene.json",
  JSON.stringify({ last_run: new Date().toISOString(), orphans: [], broken_links: [], stale: [] }, null, 2)
);
ensureFile("04 Atlas & Meta/Logs/agent-insights.log", `# Agent Insights Log — ${new Date().toISOString()}\n`);
ensureFile("04 Atlas & Meta/Logs/triage.log", `# Triage Log — ${new Date().toISOString()}\n`);

// Gitkeep for empty folders (optional)
for (const f of ["01 Hyperfixations", "02 Atomic Concepts", "03 Content Lab"]) {
  const keep = join(vaultRoot, f, ".gitkeep");
  if (!existsSync(keep)) writeFileSync(keep, "", "utf-8");
}

console.log("\n✅ Provision complete. Run npm run vault:check to validate.");
console.log(JSON.stringify({ status: "provisioned", folders, vaultRoot }, null, 2));
