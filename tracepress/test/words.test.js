// Practice words: each gets a page after Z; the page count, the gutter side
// and KDP's margins follow; the cap keeps the book under the spine-text floor;
// and a free book's word pages carry the footer line like its letter pages.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TRIMS, marginsForPage } from "../src/pdf/kdp.js";
import { planBook, cleanWords, WORDS_MAX, GUIDES } from "../src/pdf/plan.js";
import { SPINE_TEXT_MIN_PAGES } from "../src/pdf/cover-geometry.js";
import { renderBook } from "../src/pdf/book.js";
import { pageInk } from "../src/pdf/ink.js";

test("cleanWords splits on commas, semicolons and new lines, and caps the list", () => {
  assert.deepEqual(cleanWords("the, and\ncat;; 123 ,  big dog "), ["the", "and", "cat", "123", "big dog"]);
  assert.equal(cleanWords(Array(99).fill("go")).length, WORDS_MAX);
  assert.ok(26 + WORDS_MAX < SPINE_TEXT_MIN_PAGES);
});

test("word pages follow Z, inside KDP's margins, gutter on the inside", () => {
  const words = "the, and, Christopher, is";
  for (const trim of Object.keys(TRIMS)) for (const guideIn of Object.values(GUIDES)) {
    const { geom, pages } = planBook({ trim, guideIn, words });
    assert.equal(pages.length, 30);
    assert.deepEqual(pages.slice(26).map((p) => p.word), ["the", "and", "Christopher", "is"]);
    for (const [i, page] of pages.slice(26).entries()) {
      const m = marginsForPage(geom, 27 + i);
      for (const s of pageInk(page)) {
        const xs = s.kind === "line" ? [s.x1, s.x2] : s.kind === "tri" ? s.pts.map((p) => p[0]) : s.kind === "text" ? [] : [s.x];
        const r = s.r ?? 0;
        for (const x of xs) assert.ok(x - r >= m.left - 0.01 && x + r <= geom.width - m.right + 0.01, `${trim} ${guideIn} p${27 + i} x`);
      }
    }
  }
});

test("a free book with words: every page has the footer, the word pages too", async () => {
  const fonts = {
    bold: readFileSync(new URL("../fonts/LiberationSans-Bold.ttf", import.meta.url)),
    regular: readFileSync(new URL("../fonts/LiberationSans-Regular.ttf", import.meta.url)),
  };
  const dir = mkdtempSync(join(tmpdir(), "tp-words-"));
  const f = join(dir, "w.pdf");
  writeFileSync(f, await renderBook({ trim: "6x9", words: "cat, dog" }, fonts));
  const info = execFileSync("pdfinfo", [f], { encoding: "utf8" });
  const text = execFileSync("pdftotext", [f, "-"], { encoding: "utf8" });
  rmSync(dir, { recursive: true, force: true });
  assert.match(info, /Pages:\s+28\n/);
  assert.equal((text.match(/Made with Trace Press/g) || []).length, 28);
});
