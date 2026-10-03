// Shape pages: six pages after the line pages and before A, every shape
// from the baseline to the headline, every stroke with its arrow, every mark
// inside KDP's margins, and with lines, numbers and words the book still stops
// under the spine-text floor.
import { test } from "node:test";
import assert from "node:assert/strict";
import { TRIMS, marginsForPage } from "../src/pdf/kdp.js";
import { planBook, GUIDES, wordsMax } from "../src/pdf/plan.js";
import { LINE_PAGES, SHAPES, SHAPE_PAGES } from "../src/glyphs/lines.js";
import { strokeArrows } from "../src/pdf/arrows.js";
import { SPINE_TEXT_MIN_PAGES } from "../src/pdf/cover-geometry.js";
import { pageInk } from "../src/pdf/ink.js";

const first = (p) => p.rows[0].letters.map((l) => l.ch);

test("shape pages come after the line pages, then A", () => {
  const alone = planBook({ shapes: true }).pages;
  assert.equal(alone.length, 32);
  assert.deepEqual(alone.slice(0, 6).map(first), SHAPE_PAGES);
  assert.deepEqual(first(alone[6]), ["A", "a"]);
  const both = planBook({ lines: true, shapes: true }).pages;
  assert.deepEqual(both.slice(0, 10).map(first), [...LINE_PAGES, ...SHAPE_PAGES]);
  assert.deepEqual(first(both[10]), ["A", "a"]);
  assert.equal(planBook({}).pages.length, 26, "off by default");
});

test("every shape reaches the baseline and the headline and no further", () => {
  for (const [k, g] of Object.entries(SHAPES)) {
    const ys = [];
    for (const stroke of g.strokes) for (const s of stroke) {
      if (s.type === "line") ys.push(s.y0, s.y1);
      else for (let t = 0; t <= 360; t++) {
        const a = s.from + ((s.to - s.from) * t) / 360;
        ys.push(s.cy + s.ry * Math.sin((a * Math.PI) / 180));
      }
    }
    assert.ok(Math.abs(Math.min(...ys)) < 0.01, `${k} bottom ${Math.min(...ys)}`);
    assert.ok(Math.abs(Math.max(...ys) - 2) < 0.01, `${k} top ${Math.max(...ys)}`);
  }
});

test("every shape gets an arrow on every segment", () => {
  for (const [k, g] of Object.entries(SHAPES)) {
    const skipped = [];
    strokeArrows(g, skipped);
    assert.deepEqual(skipped, [], k);
  }
});

test("lines, shapes, numbers and the most words stay under the spine-text floor", () => {
  const many = Array(99).fill("go").join(",");
  assert.equal(wordsMax(true, true, false, true), 32);
  assert.equal(planBook({ lines: true, shapes: true, numbers: true, words: many }).pages.length, 78);
  assert.ok(78 < SPINE_TEXT_MIN_PAGES);
});

test("every mark on a shape page is inside KDP's margins", () => {
  for (const trim of Object.keys(TRIMS)) for (const guideIn of Object.values(GUIDES)) for (const bleed of [false, true]) {
    const { geom, pages } = planBook({ trim, guideIn, bleed, shapes: true });
    for (const [i, page] of pages.slice(0, 6).entries()) {
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
