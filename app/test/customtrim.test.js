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
