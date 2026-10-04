// The copyright page: after the name page (first without one), off by
// default, every line inside the content box on every trim and bleed in the
// real embedded font, a long author wrapped rather than run off the page, and
// it takes one of the 52 extra pages so the book still stops under the
// spine-text floor.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { TRIMS } from "../src/pdf/kdp.js";
import { planBook, wordsMax } from "../src/pdf/plan.js";
import { pageInk } from "../src/pdf/ink.js";
import { RIGHTS } from "../src/pdf/page.js";
import { SPINE_TEXT_MIN_PAGES } from "../src/pdf/cover-geometry.js";

const LONG = "Bartholomew Montgomery-Fitzwilliam and the Kindergarten Teachers of Westfield";

test("after the name page, or first; off by default", () => {
  const both = planBook({ belongs: true, copyright: true, author: "Ana Ruiz", year: 2026 }).pages;
  assert.ok(both[0].belongs && both[1].copyright);
  assert.equal(both.length, 28);
  const alone = planBook({ copyright: true, year: 2026 }).pages;
  assert.ok(alone[0].copyright);
  assert.deepEqual(alone[0].text.map((t) => t.text), ["Copyright © 2026", RIGHTS], "no author, no author line");
  assert.deepEqual(both[1].text.map((t) => t.text), ["Copyright © 2026", "Ana Ruiz", RIGHTS]);
  assert.ok(!planBook({}).pages.some((p) => p.copyright));
});

test("every line fits the page on every trim and bleed, a long author wrapped", async () => {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const regular = await doc.embedFont(readFileSync(new URL("../public/fonts/LiberationSans-Regular.ttf", import.meta.url)));
  for (const trim of Object.keys(TRIMS)) for (const bleed of [false, true]) for (const author of ["", "Ana Ruiz", LONG, "W".repeat(30)]) {
    const page = planBook({ trim, bleed, copyright: true, author, year: 2026 }).pages[0];
    const { box } = page;
    const text = pageInk(page, { licensed: true }).filter((s) => s.kind === "text");
    const at = `${trim} bleed=${bleed} "${author.slice(0, 12)}"`;
    assert.equal(text.slice(1, -1).map((t) => t.text).join(" ").replace(/\s/g, ""), author.replace(/\s/g, ""), `${at}: author kept whole`);
    for (const s of text) {
      assert.ok(s.size >= 7, `${at}: ${s.size}pt`);
      const w = regular.widthOfTextAtSize(s.text, s.size);
      assert.ok(s.x - w / 2 >= box.left && s.x + w / 2 <= box.right, `${at}: "${s.text}" ${w.toFixed(1)}pt wide`);
      assert.ok(s.y - s.size * 0.25 >= box.bottom && s.y + s.size <= box.top, `${at}: "${s.text}" off the box`);
    }
  }
});

test("it takes one of the extra pages: still under the spine-text floor", () => {
  assert.equal(wordsMax(true, true, true, true, true, true), 29);
  const many = Array(99).fill("go").join(",");
  const n = planBook({ belongs: true, done: true, copyright: true, lines: true, shapes: true, numbers: true, words: many }).pages.length;
  assert.ok(n < SPINE_TEXT_MIN_PAGES, `${n} pages`);
  assert.equal(n, 78);
});

// The title page: first, with the copyright page on its back and the name
// page after; its lines inside the box in the real fonts on every trim.
import { TITLE_DEFAULT } from "../src/pdf/page.js";
test("title page first, then copyright on its back, then the name page", () => {
  const p = planBook({ titled: true, copyright: true, belongs: true, title: "ABC", author: "Ana", year: 2026 }).pages;
  assert.ok(p[0].titlePage && p[1].copyright && p[2].belongs);
  assert.equal(p.length, 29);
  assert.equal(planBook({ titled: true }).pages[0].text[0].text, TITLE_DEFAULT, "a blank title falls back to the cover's default");
  assert.equal(wordsMax(true, true, true, true, true, true, true), 28);
  const many = Array(99).fill("go").join(",");
  assert.equal(planBook({ titled: true, belongs: true, done: true, copyright: true, lines: true, shapes: true, numbers: true, words: many }).pages.length, 78);
});

test("title page lines fit on every trim and bleed", async () => {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const f = (n) => readFileSync(new URL(`../public/fonts/LiberationSans-${n}.ttf`, import.meta.url));
  const fonts = { bold: await doc.embedFont(f("Bold")), regular: await doc.embedFont(f("Regular")) };
  const titles = ["My Letter Tracing Book", "ALPHABET TRACING WORKBOOK FOR PRESCHOOL KIDS AGES 3-5: LEARN TO WRITE LETTERS AND NUMBERS WITH ARROWS", "Supercalifragilisticexpialidocious Handwriting"];
  const subtitle = "Practice A to Z with arrows and start dots, then sight words and numbers 0 to 9, for preschool and kindergarten kids aged three to six";
  for (const trim of Object.keys(TRIMS)) for (const bleed of [false, true]) for (const title of titles) {
    const page = planBook({ trim, bleed, titled: true, title, subtitle, author: LONG }).pages[0];
    const { box } = page, text = pageInk(page, { licensed: true }).filter((s) => s.kind === "text");
    const at = `${trim} bleed=${bleed} "${title.slice(0, 12)}"`;
    for (const s of text) {
      assert.ok(s.size >= 7, `${at}: ${s.size}pt`);
      const w = fonts[s.font].widthOfTextAtSize(s.text, s.size);
      assert.ok(s.x - w / 2 >= box.left && s.x + w / 2 <= box.right, `${at}: "${s.text}" ${w.toFixed(1)}pt wide`);
      assert.ok(s.y - s.size * 0.25 >= box.bottom && s.y + s.size <= box.top, `${at}: "${s.text}" off the box`);
    }
    for (let i = 1; i < text.length; i++) assert.ok(text[i].y + text[i].size * 0.8 < text[i - 1].y - text[i - 1].size * 0.2, `${at}: "${text[i].text}" overlaps the line above`);
  }
});
