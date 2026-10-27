// The kindergarten sheets (sheets.js): CVC words and count and trace. Every
// word and number gets its row, nothing prints off the page, and a free page
// carries its footer line.
import { test } from "node:test";
import assert from "node:assert/strict";
import { planCvc, planCount, sheetInk, CVC, COUNT, SHEET_FOOTER, SHEET_GUIDES, PAPERS } from "../src/pdf/sheets.js";
import { LETTERS } from "../src/glyphs/accents.js";
import { PICTURES } from "../src/pdf/pictures.js";

const plans = () => [["cvc", planCvc()], ["count", planCount()], ["cvc a4", planCvc({ paper: "a4" })], ["count a4", planCount({ paper: "a4" })]];

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

test("every CVC row leaves room to write the word after tracing it", () => {
  // Free space after the last dotted letter, against the traced word's width,
  // at every line size the page offers, on both papers.
  for (const paper of Object.keys(PAPERS)) for (const g of SHEET_GUIDES.cvc) for (const p of planCvc({ guideIn: g, paper }).pages) for (const r of p.rows) {
    const l = r.letters, last = l[l.length - 1], end = last.x + LETTERS[last.ch].width * r.unit;
    const word = l.slice(0, 3), wordW = word[2].x + LETTERS[word[2].ch].width * r.unit - word[0].x;
    assert.ok(r.right - 0.5 * r.unit - end >= 0.9 * wordW, `${paper} ${g}": ${word.map((x) => x.ch).join("")} has no room to write`);
  }
  assert.ok(planCvc().pages.every((p) => p.rows.every((r) => r.letters.length === 3)), "at 0.75\" lines, each word once");
});

test("A4 is 210 × 297 mm, with the same rows as Letter", () => {
  const a4 = planCvc({ paper: "a4" });
  assert.equal(Math.round(a4.geom.width / 72 * 25.4), 210);
  assert.equal(Math.round(a4.geom.height / 72 * 25.4), 297);
  for (const g of [1, 0.75, 0.6]) for (const [a, b] of [[planCvc({ guideIn: g }), planCvc({ guideIn: g, paper: "a4" })], [planCount({ guideIn: g }), planCount({ guideIn: g, paper: "a4" })]]) {
    assert.equal(b.pages.length, a.pages.length);
    assert.deepEqual(b.pages.map((p) => p.rows.map((r) => r.letters.length > 0)), a.pages.map((p) => p.rows.map(() => true)));
  }
});

test("free pages carry the footer line; licensed ones don't", () => {
  for (const [kind, { pages }] of plans()) {
    const n = (licensed) => sheetInk(pages[0], { licensed }).filter((s) => s.kind === "text" && s.text === SHEET_FOOTER).length;
    assert.equal(n(false), 1, kind);
    assert.equal(n(true), 0, kind);
  }
});
