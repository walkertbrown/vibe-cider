// Every /px/ beacon a page fires has a file behind it.
//
// A beacon with no file still lands in the zone log, so the funnel counted it,
// but as a 404. who.mjs marks an address with many 404s as a scanner, and a
// reader who pressed through added one more. Trace Press "keyword" (copying
// a listing keyword) answered 404 until 2026-10-22. The names are read
// from the pages and the source, not typed out here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";

const root = new URL("../", import.meta.url);
const walk = (dir) => readdirSync(new URL(dir, root), { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(`${dir}${e.name}/`) : /\.(html|js)$/.test(e.name) ? [`${dir}${e.name}`] : []);
const files = [...walk("public/").filter((f) => !f.startsWith("public/js/")), ...walk("src/")];

test("every beacon name has a /px/ file", () => {
  const names = new Set();
  for (const f of files) {
    const s = readFileSync(new URL(f, root), "utf8");
    for (const m of s.matchAll(/\bpx\(\s*["']([a-z0-9]+)["']/g)) names.add(m[1]);
    for (const m of s.matchAll(/["']\/px\/([a-z0-9]+)\.gif/g)) names.add(m[1]);
    for (const m of s.matchAll(/data-px="([a-z0-9]+)"/g)) names.add(m[1]);
  }
  assert.ok(names.has("ran"), "found the beacons at all");
  const missing = [...names].filter((n) => !existsSync(new URL(`public/px/${n}.gif`, root)));
  assert.deepEqual(missing, []);
});
