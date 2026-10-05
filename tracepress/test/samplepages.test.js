// A download button's count is read off the PDF it links to. Free samples end
// with one "Made with Trace Press" page, so "(PDF, 20 worksheets)" is a
// 21-page file and "(PDF, 27 pages)" is a 27-page one. Every label said one
// page short of the file for weeks, 10-05, before this test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PDFDocument } from "pdf-lib";

const dir = new URL("../public/", import.meta.url);
const links = readdirSync(dir).filter((f) => f.endsWith(".html"))
  .flatMap((f) => [...readFileSync(new URL(f, dir), "utf8").matchAll(/href="\/samples\/([^"]+\.pdf)"[^>]*>[^<]*\(PDF, (\d+) (worksheets|sheets|pages)\)/g)]
    .map((m) => [f, m[1], +m[2], m[3]]));

test("the download buttons carry a count", () => assert.ok(links.length >= 15, `${links.length}`));

for (const [f, pdf, n, unit] of links) {
  test(`${f}: ${pdf} is ${n} ${unit}`, async () => {
    const doc = await PDFDocument.load(readFileSync(new URL(`samples/${pdf}`, dir)), { updateMetadata: false });
    assert.equal(doc.getPageCount(), unit === "pages" ? n : n + 1);
  });
}
