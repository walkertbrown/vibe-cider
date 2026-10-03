// The "Well done!" page: last when chosen, off by default, its two lines of
// text and the name line inside the content box on every trim, bleed and line
// size (measured in the real embedded fonts), and it takes one of the 52
// extra pages so the book still stops under the spine-text floor.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { TRIMS } from "../src/pdf/kdp.js";
import { planBook, GUIDES, wordsMax } from "../src/pdf/plan.js";
import { pageInk } from "../src/pdf/ink.js";
import { DONE, DONE_LINE } from "../src/pdf/page.js";
import { SPINE_TEXT_MIN_PAGES } from "../src/pdf/cover-geometry.js";

test("the page comes last, after the words; off by default", () => {
  const { pages } = planBook({ done: true, belongs: true, words: "cat,dog" });
  assert.equal(pages.length, 30);
  assert.ok(pages[0].belongs);
  assert.equal(pages.at(-2).word, "dog");
  assert.ok(pages.at(-1).done && !pages.at(-1).belongs);
  assert.equal(pages.at(-1).rows[0].letters.length, 0, "the name line is empty");
  assert.ok(!planBook({}).pages.some((p) => p.done));
});

test("text and name line fit inside the page on every trim, bleed and size", async () => {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = (f) => readFileSync(new URL(`../public/fonts/LiberationSans-${f}.ttf`, import.meta.url));
  const fonts = { bold: await doc.embedFont(font("Bold")), regular: await doc.embedFont(font("Regular")) };
  for (const trim of Object.keys(TRIMS)) for (const bleed of [false, true]) for (const guideIn of Object.values(GUIDES)) {
    const page = planBook({ trim, bleed, guideIn, done: true }).pages.at(-1);
    const { box } = page, row = page.rows[0];
    const [h, t] = pageInk(page, { licensed: true }).filter((s) => s.kind === "text");
    assert.deepEqual([h.text, t.text], [DONE, DONE_LINE]);
    const at = `${trim} bleed=${bleed} ${guideIn}"`;
    for (const s of [h, t]) {
      assert.ok(s.size >= 7, `${at}: ${s.size}pt`);
      const w = fonts[s.font].widthOfTextAtSize(s.text, s.size);
      assert.ok(s.x - w / 2 >= box.left && s.x + w / 2 <= box.right, `${at}: "${s.text}" ${w.toFixed(1)}pt wide`);
    }
    assert.ok(h.y + h.size <= box.top, `${at}: heading above the box`);
    assert.ok(row.baseY + 2 * row.unit < h.y, `${at}: name line overlaps the heading`);
    assert.ok(t.y + t.size < row.baseY - row.unit, `${at}: last line overlaps the name line`);
    assert.ok(t.y - t.size * 0.25 >= box.bottom, `${at}: last line below the box`);
  }
});

test("it takes one of the extra pages: still under the spine-text floor", () => {
  assert.equal(wordsMax(true, true, true, true, true), 30);
  const many = Array(99).fill("go").join(",");
  const n = planBook({ belongs: true, done: true, lines: true, shapes: true, numbers: true, words: many }).pages.length;
  assert.ok(n < SPINE_TEXT_MIN_PAGES, `${n} pages`);
  assert.equal(n, 78);
});
