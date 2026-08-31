#!/usr/bin/env tsx
/**
 * Manifesto Research CLI — search any idea from this workspace
 * Usage:
 *   npm run research -- "your idea"
 *   npm run research -- "your idea" --max-pages 8 --no-publish
 */
import { runResearchOneShot } from "./pipeline.js";

const args = process.argv.slice(2);
const maxPagesIdx = args.indexOf("--max-pages");
const maxPages = maxPagesIdx !== -1 ? parseInt(args[maxPagesIdx + 1], 10) : undefined;
const noPublish = args.includes("--no-publish");
const idea = args.filter((a) => !a.startsWith("--") && a !== String(maxPages)).join(" ").trim() || args[0];

if (!idea || idea.startsWith("--")) {
  console.log(`Manifesto Research — search any idea

Usage:
  npm run research -- "your idea about X"
  npm run research -- "narcissism and algorithmic performance" --max-pages 6
  npm run research -- "remote work loneliness" --no-publish

Outputs:
  01 Hyperfixations/<idea>.md  (hyperfixation note)
  04 Atlas & Meta/Logs/research/<slug>_<id>/{package.json,insights.json,report.md}
  insights.json has 7 consistent fields: summary, claims, patterns, counterpoints, gaps, nextQueries, topAssets
`);
  process.exit(0);
}

console.log(`🔍 Manifesto Research — idea: "${idea}" (maxPages ${maxPages ?? 12})`);
const start = Date.now();
runResearchOneShot(idea, { maxPages, publishToVault: !noPublish })
  .then((res) => {
    console.log(`\n✅ Done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
    console.log(`  Hyperfixation: ${res.hyperfixationPath || "(not published)"}`);
    console.log(`  Log dir: ${res.logDir || "(not published)"}`);
    console.log(`  Assets: ${res.assets.length} across ${res.package.counts.domains} domains`);
    console.log(`  Queries:`);
    res.oneShotQueries.forEach((q, i) => console.log(`    ${i + 1}. ${q}`));
    console.log(`\n  Insights:`);
    console.log(`    Summary: ${res.insights.summary}`);
    console.log(`    Claims: ${res.insights.claims.slice(0, 2).map((c: any) => c.claim.slice(0, 80)).join(" | ")}`);
    console.log(`\n  Next: open 01 Hyperfixations/${idea.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)} or check 04 Atlas & Meta/Logs/research/`);
  })
  .catch((e) => {
    console.error("Research failed:", e);
    process.exit(1);
  });
