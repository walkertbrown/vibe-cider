// The nav is complete or it's broken: a page missing from the footers can't
// report itself. Every page on the sitemap is linked from every other page's
// footer, and from the 404 page. Derived from the sitemap, not a typed list.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dir = new URL("../public/", import.meta.url);
const read = (f) => readFileSync(new URL(f, dir), "utf8");
const paths = [...read("sitemap.xml").matchAll(/<loc>https:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]).filter((p) => !p.endsWith(".pdf"));
const file = (p) => (p === "/" ? "index.html" : `${p.slice(1)}.html`);

test("every sitemap page is in every other page's footer", () => {
  assert.ok(paths.length >= 10, `${paths.length} pages`);
  for (const p of paths) {
    const footer = read(file(p)).match(/<footer>[\s\S]*?<\/footer>/)?.[0];
    assert.ok(footer, `${p} has no footer`);
    for (const q of paths) if (q !== p && q !== "/") assert.ok(footer.includes(`href="${q}"`), `${p}'s footer doesn't link ${q}`);
  }
});

test("the 404 page links every sitemap page", () => {
  const html = read("404.html");
  for (const q of paths) assert.ok(html.includes(`href="${q}"`), `404 doesn't link ${q}`);
});
