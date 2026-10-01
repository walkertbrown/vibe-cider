// Letters in one case: a book of capitals alone or lowercase alone is still
// 26 pages, A to Z, each with its one letter, inside KDP's margins.
import { test } from "node:test";
import assert from "node:assert/strict";
import { TRIMS, marginsForPage } from "../src/pdf/kdp.js";
import { planBook, GUIDES } from "../src/pdf/plan.js";
import { pageInk } from "../src/pdf/ink.js";

const chars = (p) => [...new Set(p.rows.flatMap((r) => r.letters.map((l) => l.ch)))];

test("each case gives 26 pages, one letter each", () => {
  const abc = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
  assert.deepEqual(planBook({ cases: "upper" }).pages.map(chars), abc.map((U) => [U]));
  assert.deepEqual(planBook({ cases: "lower" }).pages.map(chars), abc.map((U) => [U.toLowerCase()]));
  assert.deepEqual(planBook({ cases: "both" }).pages.map(chars), abc.map((U) => [U, U.toLowerCase()]));
  assert.deepEqual(planBook({ cases: "nonsense" }).pages.map(chars), planBook({}).pages.map(chars), "unknown → both");
});

test("lines, numbers and words still come in the same order", () => {
  const { pages } = planBook({ cases: "lower", lines: true, numbers: true, words: "the,and" });
  assert.equal(pages.length, 4 + 26 + 10 + 2);
  assert.deepEqual(chars(pages[4]), ["a"]);
  assert.deepEqual(chars(pages[30]), ["0"]);
  assert.equal(pages.at(-1).word, "and");
});

test("every mark on a one-case page is inside KDP's margins", () => {
  for (const cases of ["upper", "lower"]) for (const trim of Object.keys(TRIMS)) for (const guideIn of Object.values(GUIDES)) for (const bleed of [false, true]) {
    const { geom, pages } = planBook({ trim, guideIn, bleed, cases });
    for (const [i, page] of pages.entries()) {
      const n = i + 1, m = marginsForPage(geom, n), where = `${cases} ${trim} ${guideIn}" bleed=${bleed} p${n}`;
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
