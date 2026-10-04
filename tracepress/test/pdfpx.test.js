// A free PDF is a plain link, so a crawler fetching it and a person clicking
// it look the same in the log. Every page that links a PDF carries the click
// beacon (only a trusted click fires it), and the beacon is a real file.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";

const dir = new URL("../public/", import.meta.url);
test("every page with a PDF link has the pdf click beacon", () => {
  const pages = readdirSync(dir).filter((f) => f.endsWith(".html")).filter((f) => /href="[^"]*\.pdf"/.test(readFileSync(new URL(f, dir), "utf8")));
  assert.ok(pages.length >= 25, `${pages.length} pages`);
  for (const f of pages) assert.ok(readFileSync(new URL(f, dir), "utf8").includes('"/px/pdf.gif?"'), `${f} has no pdf beacon`);
  assert.ok(existsSync(new URL("px/pdf.gif", dir)));
});
