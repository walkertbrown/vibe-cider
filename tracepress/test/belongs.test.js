// The "This book belongs to" page: first when chosen, off by default, its
// heading and name line inside the content box on every trim, bleed and line
// size (the heading measured in the real embedded font), and it takes one of
// the 52 extra pages so the book still stops under the spine-text floor.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { TRIMS } from "../src/pdf/kdp.js";
import { planBook, GUIDES, wordsMax } from "../src/pdf/plan.js";
import { pageInk } from "../src/pdf/ink.js";
import { BELONGS } from "../src/pdf/page.js";
import { SPINE_TEXT_MIN_PAGES } from "../src/pdf/cover-geometry.js";

test("the page comes first, then A; off by default", () => {
  const { pages } = planBook({ belongs: true, lines: true });
  assert.equal(pages.length, 31);
  assert.ok(pages[0].belongs);
  assert.equal(pages[0].rows[0].letters.length, 0, "the name line is empty");
  assert.ok(!planBook({}).pages.some((p) => p.belongs));
});

test("heading and name line fit inside the page on every trim, bleed and size", async () => {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const bold = await doc.embedFont(readFileSync(new URL("../public/fonts/LiberationSans-Bold.ttf", import.meta.url)));
  for (const trim of Object.keys(TRIMS)) for (const bleed of [false, true]) for (const guideIn of Object.values(GUIDES)) {
    const page = planBook({ trim, bleed, guideIn, belongs: true }).pages[0];
    const { box } = page;
    const [h] = pageInk(page, { licensed: true }).filter((s) => s.kind === "text");
    assert.equal(h.text, BELONGS);
    assert.ok(h.size >= 7, `${trim}: ${h.size}pt`);
    const w = bold.widthOfTextAtSize(h.text, h.size);
    const at = `${trim} bleed=${bleed} ${guideIn}"`;
    assert.ok(h.x - w / 2 >= box.left && h.x + w / 2 <= box.right, `${at}: heading ${w.toFixed(1)}pt wide in ${(box.right - box.left).toFixed(1)}`);
    assert.ok(h.y + h.size <= box.top, `${at}: heading above the box`);
    const row = page.rows[0];
    assert.ok(row.baseY + 2 * row.unit < h.y, `${at}: name line overlaps the heading`);
    assert.ok(row.baseY - row.unit >= box.bottom, `${at}: name line below the box`);
  }
});

test("it takes one of the extra pages: still under the spine-text floor", () => {
  assert.equal(wordsMax(true, true, true), 37);
  const many = Array(99).fill("go").join(",");
  const n = planBook({ belongs: true, lines: true, numbers: true, words: many }).pages.length;
  assert.ok(n < SPINE_TEXT_MIN_PAGES, `${n} pages`);
  assert.equal(n, 78);
});
