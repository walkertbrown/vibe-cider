// The README is the public repo's front page, and GitHub is crawled far more
// often than this site. It's a nav too: a page the README leaves out can't
// report itself. Every sitemap page (not the PDFs, not the home page) must be
// linked from it, by its full URL. Derived from the sitemap, not a typed list.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (f) => readFileSync(new URL(f, import.meta.url), "utf8");
const urls = [...read("../public/sitemap.xml").matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => !u.endsWith(".pdf") && !u.endsWith("/"));

test("the README links every sitemap page", () => {
  const readme = read("../README.md");
  assert.ok(urls.length >= 20, `${urls.length} pages`);
  for (const u of urls) assert.ok(readme.includes(`](${u})`), `README doesn't link ${u}`);
});

// llms.txt is the same list for AI crawlers (GPTBot and ClaudeBot fetch this
// site more than Bing does), home page included.
test("llms.txt links every sitemap page", () => {
  const llms = read("../public/llms.txt");
  for (const u of [...urls, "https://tracepress.bananafest-destiny.com/"]) assert.ok(llms.includes(`](${u})`), `llms.txt doesn't link ${u}`);
});
