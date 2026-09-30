// Numbers 0–9: ten pages after Z, before any words; inside KDP's margins; and
// with words as well, the book still stops under the spine-text floor.
import { test } from "node:test";
import assert from "node:assert/strict";
import { TRIMS, marginsForPage } from "../src/pdf/kdp.js";
import { planBook, GUIDES, wordsMax } from "../src/pdf/plan.js";
import { SPINE_TEXT_MIN_PAGES } from "../src/pdf/cover-geometry.js";
import { pageInk } from "../src/pdf/ink.js";

test("numbers add a page per digit after Z, then the words", () => {
  const { pages } = planBook({ numbers: true, words: "cat, 10" });
  assert.equal(pages.length, 38);
  assert.deepEqual(pages.slice(26, 36).map((p) => p.rows[0].letters.map((l) => l.ch).join("")), [..."0123456789"]);
  assert.deepEqual(pages.slice(36).map((p) => p.word), ["cat", "10"]);
  assert.equal(planBook({ words: "cat" }).pages.length, 27, "off by default");
});

test("numbers and the most words stay under the spine-text floor", () => {
  const many = Array(99).fill("go").join(",");
  assert.equal(wordsMax(true), 42);
  assert.equal(planBook({ numbers: true, words: many }).pages.length, 78);
  assert.ok(78 < SPINE_TEXT_MIN_PAGES);
});

test("every mark on a digit page is inside KDP's margins", () => {
  for (const trim of Object.keys(TRIMS)) for (const guideIn of Object.values(GUIDES)) {
    const { geom, pages } = planBook({ trim, guideIn, numbers: true });
    for (const [i, page] of pages.slice(26).entries()) {
      const n = 27 + i, m = marginsForPage(geom, n), where = `${trim} ${guideIn}" p${n}`;
      for (const s of pageInk(page)) {
        const pts = s.kind === "line" ? [[s.x1, s.y1], [s.x2, s.y2]] : s.kind === "tri" ? s.pts : s.kind === "text" ? [] : [[s.x, s.y]];
        const r = s.r ?? 0;
        for (const [x, y] of pts) {
          assert.ok(x - r >= m.left - 0.01 && x + r <= geom.width - m.right + 0.01, `${where} x=${x}`);
          assert.ok(y - r >= m.bottom - 0.01 && y + r <= geom.height - m.top + 0.01, `${where} y=${y}`);
        }
      }
    }
  }
});
