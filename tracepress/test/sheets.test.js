// The kindergarten sheets (sheets.js): CVC words and count and trace. Every
// word and number gets its row, nothing prints off the page, and a free page
// carries its footer line.
import { test } from "node:test";
import assert from "node:assert/strict";
import { planCvc, planCount, sheetInk, CVC, COUNT, SHEET_FOOTER } from "../src/pdf/sheets.js";
import { PICTURES } from "../src/pdf/pictures.js";

const plans = () => [["cvc", planCvc()], ["count", planCount()]];

test("every word and number has a row, five to a page", () => {
  assert.equal(CVC.length, 15);
  assert.ok(CVC.every((w) => PICTURES[w] && w.length === 3), "every CVC word has a picture and three letters");
  assert.equal(planCvc().pages.length, 3);
  assert.equal(planCount().pages.length, 2);
  assert.deepEqual(planCount().pages.flatMap((p) => p.rows.map((r) => r.letters.filter((l) => l.marks).map((l) => l.ch).join(""))), COUNT.map(String));
  for (const [kind, plan] of plans()) for (const p of plan.pages) for (const r of p.rows) assert.ok(r.letters.length > 0, `${kind}: an empty trace row`);
});

test("the ten frames hold the right number of dots", () => {
  const counts = planCount().pages.flatMap((p) => {
    const dots = p.shapes.filter((s) => s.kind === "dot");
    return p.rows.map((r) => dots.filter((d) => d.y > r.baseY - r.unit && d.y < r.baseY + 3 * r.unit).length);
  });
  assert.deepEqual(counts, COUNT);
});

test("all ink stays on the page, inside a home printer's margin", () => {
  for (const [kind, { geom, pages }] of plans()) for (const page of pages) {
    for (const s of sheetInk(page)) {
      const xs = s.kind === "line" ? [s.x1, s.x2] : s.kind === "text" ? [s.x] : [s.x ?? 36];
      const ys = s.kind === "line" ? [s.y1, s.y2] : [s.y ?? 36];
      for (const x of xs) assert.ok(x >= 18 && x <= geom.width - 18, `${kind}: x ${x}`);
      for (const y of ys) assert.ok(y >= 18 && y <= geom.height - 18, `${kind}: y ${y}`);
    }
  }
});

test("free pages carry the footer line; licensed ones don't", () => {
  for (const [kind, { pages }] of plans()) {
    const n = (licensed) => sheetInk(pages[0], { licensed }).filter((s) => s.kind === "text" && s.text === SHEET_FOOTER).length;
    assert.equal(n(false), 1, kind);
    assert.equal(n(true), 0, kind);
  }
});
