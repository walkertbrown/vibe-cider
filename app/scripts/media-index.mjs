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
    clips.push({ product: j.product, slug: j.slug, shot: j.shot, mp4: `${base}.mp4`, json: `${base}.json` });
  }
}
writeFileSync(`${root}app/public/media/index.json`, JSON.stringify({
  keeper: "vibe-cider",
  note: "Every raw clip for the house channels. The json beside each mp4 holds its claim and backing.",
  clips,
}, null, 2) + "\n");
console.log(`${clips.length} clips`);
