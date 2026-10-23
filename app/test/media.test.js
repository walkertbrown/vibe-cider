// The docent sweeps public/media/index.json and posts what it finds. A seasonal
// clip past its post_by ("submit by 30 October" on 31 October) must not be in
// it, so a passed date stops the next deploy until scripts/media-index.mjs is
// re-run, which drops it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const index = JSON.parse(readFileSync(new URL("../public/media/index.json", import.meta.url), "utf8"));
const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });

test("no clip in the docent's index is past its post_by", () => {
  for (const c of index.clips) {
    if (c.post_by) assert.ok(c.post_by >= today, `${c.slug} was for ${c.post_by}; run node scripts/media-index.mjs`);
  }
});
