// Free books carry the watermark line on every page and paid books carry it
// on none. Read back from the rendered PDF's text, not from the code's flags.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderBook, letterPairs } from "../src/pdf/book.js";
import { WATERMARK } from "../src/pdf/page.js";

const fonts = {
  bold: readFileSync(new URL("../fonts/LiberationSans-Bold.ttf", import.meta.url)),
  regular: readFileSync(new URL("../fonts/LiberationSans-Regular.ttf", import.meta.url)),
};

// pdftotext -raw, one string per page (pages split on form feed).
async function pagesText(opts) {
  const dir = mkdtempSync(join(tmpdir(), "tp-wm-"));
  const pdf = join(dir, "b.pdf");
  writeFileSync(pdf, await renderBook(opts, fonts));
  const text = execFileSync("pdftotext", ["-raw", pdf, "-"], { encoding: "utf8" });
  rmSync(dir, { recursive: true, force: true });
  return text.split("\f").slice(0, -1);
}

// The narrowest trim: if the line fits here at 7pt it fits everywhere.
test("a free book has the watermark on every page, whole, on the narrowest trim", async () => {
  const pages = await pagesText({ trim: "5x8", guideIn: 0.45 });
  assert.equal(pages.length, letterPairs().length);
  pages.forEach((t, i) => assert.ok(t.replace(/\s+/g, " ").includes(WATERMARK), `page ${i + 1}: ${JSON.stringify(t.slice(0, 120))}`));
});

test("a paid book has no watermark anywhere", async () => {
  const pages = await pagesText({ trim: "5x8", guideIn: 0.45, licensed: true });
  assert.equal(pages.length, letterPairs().length);
  for (const t of pages) assert.ok(!/Trace Press|free preview/.test(t), t.slice(0, 120));
});

test("anything but licensed: true is the free book", async () => {
  for (const licensed of [undefined, "true", 1, "yes"]) {
    const [first] = await pagesText({ trim: "5x8", guideIn: 0.45, licensed });
    assert.ok(first.includes("free preview"), `licensed ${JSON.stringify(licensed)} rendered without the watermark`);
  }
});
