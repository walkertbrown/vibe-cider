// The public samples (scripts/sample.mjs) as committed: a search-result title
// that fits, the free tier's marks still on them, and a way back to the site
// from every page. Link annotations are read through pdf-lib, not by grepping
// the file's bytes (compressed object streams hide them from a grep).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PDFDocument, PDFName } from "pdf-lib";

const SITE = "https://tracepress.bananafest-destiny.com/";
const path = (f) => fileURLToPath(new URL(`../public/samples/${f}`, import.meta.url));
const BOOK = path("letter-tracing-workbook-sample-8.5x11.pdf");
const COVER = path("letter-tracing-cover-sample-8.5x11.pdf");
const SIGHT = path("sight-word-tracing-workbook-sample-8.5x11.pdf");

function links(doc, page) {
  const annots = page.node.lookup(PDFName.of("Annots"));
  if (!annots) return [];
  return annots.asArray().map((r) => doc.context.lookup(r)).map((a) => ({
    rect: a.lookup(PDFName.of("Rect")).asArray().map((n) => n.asNumber()),
    uri: a.lookup(PDFName.of("A")).lookup(PDFName.of("URI")).decodeText(),
  }));
}

test("the sample book: titled for search, free marks on, a link on every page", async () => {
  const doc = await PDFDocument.load(readFileSync(BOOK));
  assert.ok(doc.getTitle().length <= 70 && /Letter Tracing/.test(doc.getTitle()), doc.getTitle());
  assert.equal(doc.getPageCount(), 27);
  for (let i = 0; i < 27; i++) {
    const l = links(doc, doc.getPage(i));
    assert.ok(l.some((x) => x.uri === SITE), `page ${i + 1} has no link to the site`);
  }
  const { width, height } = doc.getPage(26).getSize();
  const last = links(doc, doc.getPage(26))[0].rect;
  assert.deepEqual(last, [0, 0, width, height], "the last page is one big link");
  const text = execFileSync("pdftotext", ["-f", "1", "-l", "1", BOOK, "-"], { encoding: "utf8" });
  assert.match(text, /Made with Trace Press, free preview/);
});

test("the sample cover: one sheet, PREVIEW on it, and a link", async () => {
  const doc = await PDFDocument.load(readFileSync(COVER));
  assert.ok(doc.getTitle().length <= 70 && /Cover/.test(doc.getTitle()), doc.getTitle());
  assert.equal(doc.getPageCount(), 1);
  assert.ok(links(doc, doc.getPage(0)).some((x) => x.uri === SITE));
  assert.match(execFileSync("pdftotext", [COVER, "-"], { encoding: "utf8" }), /PREVIEW/);
});

test("the sight word sample: A to Z, then the 40 pre-primer words, a link on every page", async () => {
  const doc = await PDFDocument.load(readFileSync(SIGHT));
  assert.ok(doc.getTitle().length <= 70 && /Sight Word/.test(doc.getTitle()), doc.getTitle());
  assert.equal(doc.getPageCount(), 67);
  for (let i = 0; i < 67; i++) assert.ok(links(doc, doc.getPage(i)).some((x) => x.uri === SITE), `page ${i + 1} has no link to the site`);
  const page = (n) => execFileSync("pdftotext", ["-f", String(n), "-l", String(n), SIGHT, "-"], { encoding: "utf8" });
  assert.match(page(66), /Made with Trace Press, free preview/);
  assert.match(page(67), /Made with Trace Press/);
});
