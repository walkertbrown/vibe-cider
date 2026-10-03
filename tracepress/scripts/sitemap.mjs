// Rewrite every <lastmod> in the sitemap from the file's actual git history.
// Puzzle Press's app/scripts/sitemap.mjs, for Trace Press.
//
// Why. On 2026-10-03 the sitemap's dates were typed by hand and 17 of the 28
// pages said they hadn't changed since 09-30 or 10-01, though every one had
// been edited on 10-02. `lastmod` is the one field that tells a crawler
// whether coming back is worth its time, and Google had fetched 2 of the 28
// pages in a week. Every date comes from `git log -1` on the file behind the
// URL, a real change date and never today's date stamped on everything.
//
// Usage: node scripts/sitemap.mjs [--check]     (npm run sitemap)
//   --check exits non-zero instead of writing; test/sitemap.test.js runs it.
// Commit the page change first, then run this, then commit the sitemap: the
// date comes from git, not from the working tree.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITEMAP = path.join(APP, "public", "sitemap.xml");
const CHECK = process.argv.includes("--check");

// The file whose history is this URL's history.
function sourceFor(pathname) {
  const rel = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
  for (const candidate of [rel, `${rel}.html`]) {
    const abs = path.join(APP, "public", candidate);
    if (existsSync(abs)) return abs;
  }
  return null;
}

const xml = readFileSync(SITEMAP, "utf8");
const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)];
if (!entries.length) {
  console.error("No <url> entries in sitemap.xml — refusing to rewrite it.");
  process.exit(1);
}

let out = xml;
const changed = [];
const unmapped = [];
for (const [block] of entries) {
  const loc = (block.match(/<loc>(.*?)<\/loc>/) || [])[1];
  const was = (block.match(/<lastmod>(.*?)<\/lastmod>/) || [])[1];
  const file = loc && sourceFor(new URL(loc).pathname);
  if (!file) { unmapped.push(loc); continue; }
  // Run from this folder with a path relative to it, so it gives the same
  // answer here and in the public trace-press repository, where this folder
  // is the root. A file with no commits yet returns empty and is left alone.
  // The commit's UTC date, as the build log keeps days.
  const now = execFileSync("git", ["-C", APP, "log", "-1", "--format=%cd", "--date=format-local:%Y-%m-%d", "--", path.relative(APP, file)], { encoding: "utf8", env: { ...process.env, TZ: "UTC" } }).trim();
  if (!now || now === was) continue;
  out = out.replace(block, block.replace(/<lastmod>.*?<\/lastmod>/, `<lastmod>${now}</lastmod>`));
  changed.push({ loc: new URL(loc).pathname, was, now });
}

if (unmapped.length) {
  // A <loc> with no file behind it is a 404 advertised to every search engine.
  console.error(`\n${unmapped.length} sitemap URL(s) have no file behind them:`);
  for (const u of unmapped) console.error(`  ${u}`);
  process.exit(1);
}

if (!changed.length) {
  console.log(`sitemap OK — all ${entries.length} lastmod dates match the file's last commit`);
  process.exit(0);
}

console.log(`${changed.length} of ${entries.length} lastmod dates don't match the file's last commit:\n`);
for (const c of changed) console.log(`  ${c.was} -> ${c.now}   ${c.loc}`);

if (CHECK) {
  console.log("\nStale. Run `npm run sitemap` and deploy, or the crawler is being told these pages have not moved.");
  process.exit(1);
}
writeFileSync(SITEMAP, out);
console.log(`\nwrote public/sitemap.xml — then deploy and \`npm run indexnow\`.`);
