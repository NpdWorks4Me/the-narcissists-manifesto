/**
 * research-deep — vault-first deep research CLI
 * Usage: npm run research:deep -- "narcissism as performance" --max-pages 12 [--no-publish]
 */
import { runDualTrack } from "./dualTrack.js";
import { writeHyperfixation } from "./vaultWriter.js";

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  return idx !== -1 ? process.argv[idx+1] : undefined;
}

const idea = process.argv.slice(2).filter((a)=> !a.startsWith("--") && a !== "researchDeep.ts").join(" ").trim() || "narcissism as performance";
const maxPages = getArg("--max-pages") ? parseInt(getArg("--max-pages")!,10) : 10;
const noPublish = process.argv.includes("--no-publish");

const { baseline, delta, researchResult } = await runDualTrack(idea, { maxPages, publishToVault: !noPublish });

if (!noPublish && researchResult.assets?.length) {
  // Optionally write hyperfixation with delta-aware insights
  try {
    const { writeHyperfixation: wh } = await import("./vaultWriter.js");
    const hyperPath = wh(
      (()=>{ const c=process.cwd(); const b=c.split("/").pop()||""; return b==="05 Backend"||b==="backend"? c.slice(0,-b.length).replace(/\/$/,"")||".": c; })(),
      idea,
      researchResult.assets as any,
      { ...researchResult.insights, dualTrackDelta: delta } as any,
      delta.targetedQueries as any
    );
    console.log(`\n✅ Hyperfixation → ${hyperPath}`);
  } catch (e) { console.log(`hyperfixation write skipped: ${e}`); }
}

console.log(`\nDone. Baseline ${baseline.length} notes, delta ${delta.whatsNew.length} new, log ${delta.researchId}`);
