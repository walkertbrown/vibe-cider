// Pre-writing line pages: four pages before A, inside KDP's margins, every
// stroke with its arrow, and with numbers and words the book still stops
// under the spine-text floor.
import { test } from "node:test";
import assert from "node:assert/strict";
import { TRIMS, marginsForPage } from "../src/pdf/kdp.js";
import { planBook, GUIDES, wordsMax } from "../src/pdf/plan.js";
import { LINES, LINE_PAGES } from "../src/glyphs/lines.js";
import { strokeArrows } from "../src/pdf/arrows.js";
import { SPINE_TEXT_MIN_PAGES } from "../src/pdf/cover-geometry.js";
import { pageInk } from "../src/pdf/ink.js";

test("line pages come first, then A", () => {
  const { pages } = planBook({ lines: true });
  assert.equal(pages.length, 30);
  assert.deepEqual(pages.slice(0, 4).map((p) => p.rows[0].letters.map((l) => l.ch)), LINE_PAGES);
  assert.deepEqual(pages[4].rows[0].letters.map((l) => l.ch), ["A", "a"]);
  assert.equal(planBook({}).pages.length, 26, "off by default");
});

test("every shape gets an arrow on every segment", () => {
  for (const [k, g] of Object.entries(LINES)) {
    const skipped = [];
    strokeArrows(g, skipped);
    assert.deepEqual(skipped, [], k);
  }
});

test("lines, numbers and the most words stay under the spine-text floor", () => {
  const many = Array(99).fill("go").join(",");
  assert.equal(wordsMax(true, true), 38);
  assert.equal(planBook({ lines: true, numbers: true, words: many }).pages.length, 78);
  assert.ok(78 < SPINE_TEXT_MIN_PAGES);
});

test("every mark on a line page is inside KDP's margins", () => {
  for (const trim of Object.keys(TRIMS)) for (const guideIn of Object.values(GUIDES)) for (const bleed of [false, true]) {
    const { geom, pages } = planBook({ trim, guideIn, bleed, lines: true });
    for (const [i, page] of pages.slice(0, 4).entries()) {
      const n = i + 1, m = marginsForPage(geom, n), where = `${trim} ${guideIn}" bleed=${bleed} p${n}`;
      assert.ok(page.rows.some((r) => r.kind === "trace" && r.letters.length), `${where} has a trace row`);
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
