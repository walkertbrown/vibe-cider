// Page numbers: off by default; when on, every page but the front matter
// carries its own number at the outside corner of the footer strip, inside
// the content box's width, and clear of the free book's centred footer line
// on every trim and bleed, measured in the real embedded font.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { TRIMS } from "../src/pdf/kdp.js";
import { planBook } from "../src/pdf/plan.js";
import { pageInk } from "../src/pdf/ink.js";
import { WATERMARK } from "../src/pdf/page.js";

test("off by default; front matter counted, not numbered", () => {
  assert.ok(!planBook({}).pages.some((p) => p.folio));
  const p = planBook({ folios: true, titled: true, copyright: true, belongs: true, done: true, words: "cat" }).pages;
  assert.deepEqual(p.slice(0, 3).map((x) => x.folio), [undefined, undefined, undefined]);
  p.slice(3).forEach((x, i) => assert.equal(x.folio, i + 4));
  assert.equal(p.at(-1).folio, p.length, "the last number is the page count");
});

test("the number sits at the outside corner, clear of the footer line, on every trim", async () => {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(readFileSync(new URL("../public/fonts/LiberationSans-Regular.ttf", import.meta.url)));
  const many = Array(99).fill("go").join(",");
  for (const trim of Object.keys(TRIMS)) for (const bleed of [false, true]) {
    const { pages } = planBook({ trim, bleed, folios: true, numbers: true, lines: true, shapes: true, done: true, words: many });
    for (const page of pages.filter((x) => x.folio >= 9)) {
      const ink = pageInk(page, { licensed: false }).filter((s) => s.kind === "text");
      const num = ink.find((s) => s.text === String(page.folio)), wm = ink.find((s) => s.text === WATERMARK);
      const at = `${trim} bleed=${bleed} p${page.folio}`;
      const nw = font.widthOfTextAtSize(num.text, num.size), ww = font.widthOfTextAtSize(wm.text, wm.size);
      const [nl, nr, wl, wr] = [num.x - nw / 2, num.x + nw / 2, wm.x - ww / 2, wm.x + ww / 2];
      assert.ok(nl >= page.box.left && nr <= page.box.right, `${at}: number outside the box`);
      assert.ok(nr + 4 < wl || nl - 4 > wr, `${at}: number touches the footer line`);
      assert.equal(num.x > wm.x, page.folio % 2 === 1, `${at}: odd pages right, even left`);
      assert.equal(num.y, wm.y);
    }
  }
});
