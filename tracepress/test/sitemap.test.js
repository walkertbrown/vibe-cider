// The sitemap's lastmod dates match each page's last commit
// (scripts/sitemap.mjs), so every deploy tells crawlers which pages moved.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";

test("every sitemap lastmod matches its file's last commit", () => {
  const r = spawnSync(process.execPath, [new URL("../scripts/sitemap.mjs", import.meta.url).pathname, "--check"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

// Every sample PDF is in the sitemap: crawlers that skip a page still fetch
// its PDF (bingbot 10-27: 30 of 31 PDFs, 12 of 38 pages). The extra "this book
// belongs to" trims are left out on purpose; 8.5x11 stands for them.
test("every sample PDF is in the sitemap", () => {
  const xml = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  const pdfs = readdirSync(new URL("../public/samples/", import.meta.url)).filter((f) => f.endsWith(".pdf") && !/^this-book-belongs-to-page-(?!8\.5x11)/.test(f));
  assert.ok(pdfs.length >= 34, `${pdfs.length}`);
  for (const f of pdfs) assert.ok(xml.includes(`/samples/${f}</loc>`), `${f} is not in the sitemap`);
});
