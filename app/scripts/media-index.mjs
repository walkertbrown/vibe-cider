// One URL for the docent: public/media/index.json lists every raw clip on both
// apps (Puzzle Press and Trace Press), read from the .json beside each .mp4.
// Run after adding a clip, then deploy Puzzle Press.
//
//   node app/scripts/media-index.mjs
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const root = new URL("../../", import.meta.url).pathname;
const clips = [];
for (const [dir, host] of [["app", "puzzlepress"], ["tracepress", "tracepress"]]) {
  for (const f of readdirSync(`${root}${dir}/public/media`).filter((f) => f.endsWith(".json") && f !== "index.json").sort()) {
    const j = JSON.parse(readFileSync(`${root}${dir}/public/media/${f}`, "utf8"));
    const base = `https://${host}.bananafest-destiny.com/media/${j.slug}`;
    clips.push({ product: j.product, slug: j.slug, shot: j.shot, ...(j.post_by && { post_by: j.post_by }), mp4: `${base}.mp4`, json: `${base}.json` });
  }
}
// Seasonal clips carry post_by (the holiday) and go first, soonest first; a
// Halloween clip found on 11-01 is wasted, an evergreen one keeps.
clips.sort((a, b) => (a.post_by ?? "9999").localeCompare(b.post_by ?? "9999"));
writeFileSync(`${root}app/public/media/index.json`, JSON.stringify({
  keeper: "vibe-cider",
  note: "Every raw clip for the house channels. The json beside each mp4 holds its claim and backing. Clips with post_by are seasonal and listed first: they are stale after that date. The rest are evergreen.",
  clips,
}, null, 2) + "\n");
console.log(`${clips.length} clips`);
