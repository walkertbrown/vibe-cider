// The margin calculator's custom size: KDP's limits, and the same geometry
// rules as the standard trims.
import { test } from "node:test";
import assert from "node:assert/strict";
import { customTrim, pageGeometry, PT, TRIMS } from "../src/pdf/kdp.js";

test("customTrim takes KDP's range and refuses outside it", () => {
  assert.deepEqual(customTrim(4, 6), { label: '4" × 6"', w: 4, h: 6 });
  assert.ok(customTrim(8.5, 11.69));
  assert.equal(customTrim(3.99, 9), null);
  assert.equal(customTrim(8.51, 9), null);
  assert.equal(customTrim(6, 5.99), null);
  assert.equal(customTrim(6, 11.7), null);
  assert.equal(customTrim(NaN, 9), null);
});

test("a custom trim the size of a standard one gives the same geometry", () => {
  for (const bleed of [false, true]) {
    const a = pageGeometry({ trim: "6x9", bleed, pageCount: 200 });
    const b = pageGeometry({ trim: customTrim(TRIMS["6x9"].w, TRIMS["6x9"].h), bleed, pageCount: 200 });
    assert.equal(b.width, a.width);
    assert.equal(b.height, a.height);
    assert.deepEqual(b.margin, a.margin);
  }
});

test("bleed adds 0.125 in to the width and 0.25 in to the height of a custom trim", () => {
  const g = pageGeometry({ trim: customTrim(7, 10), bleed: true, pageCount: 120 });
  assert.equal(g.width / PT, 7.125);
  assert.equal(g.height / PT, 10.25);
});

// KDP's cover calculator, queried 2026-10-16 at 200 pages of cream paper
// (spine 0.5"): the full cover for four custom trims.
test("custom-trim covers match KDP's cover calculator", async () => {
  const { coverGeometry } = await import("../src/pdf/cover-geometry.js");
  for (const [w, h, cw, ch] of [[7, 10, 14.75, 10.25], [5.25, 7.75, 11.25, 8], [8.5, 11.69, 17.75, 11.94], [4, 6, 8.75, 6.25]]) {
    const g = coverGeometry({ trim: customTrim(w, h), pageCount: 200, paper: "cream" });
    assert.equal(Math.round((g.width / PT) * 1000) / 1000, cw, `${w}x${h} width`);
    assert.equal(Math.round((g.height / PT) * 1000) / 1000, ch, `${w}x${h} height`);
  }
});
