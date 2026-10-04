// Each page's one <h1> is what the page is about. It used to be the site
// name, "Trace Press", on every page, with the page's own topic an <h2>;
// the name is now a <p class="brand"> that looks the same. Only the home
// page, whose topic is the product, keeps the name as its heading.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const dir = new URL("../public/", import.meta.url);
const pages = readdirSync(dir).filter((f) => f.endsWith(".html") && !["index.html", "404.html"].includes(f));

test("every page has one <h1>, its topic, not the site name", () => {
  assert.ok(pages.length >= 30);
  for (const f of pages) {
    const html = readFileSync(new URL(f, dir), "utf8");
    const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]+>/g, "").trim());
    assert.equal(h1.length, 1, `${f}: ${h1.length} <h1>`);
    assert.notEqual(h1[0], "Trace Press", `${f}: the <h1> is the site name`);
    const title = html.match(/<title>([^<]*)<\/title>/)[1];
    const words = (s) => new Set(s.toLowerCase().match(/[a-z]+/g));
    const shared = [...words(h1[0])].filter((w) => w.length > 3 && words(title).has(w));
    assert.ok(shared.length >= 1, `${f}: <h1> "${h1[0]}" shares no word with the title`);
    assert.match(html, /<header>\s*<p class="brand">/, `${f}: brand`);
  }
});
