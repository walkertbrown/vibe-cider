// Google shows about 155 characters of a meta description. Past that, the
// end is cut off, and the end is where the price and "no sign-up" sit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const dir = new URL("../public/", import.meta.url);
const pages = readdirSync(dir).filter((f) => f.endsWith(".html") && f !== "404.html");

test("every page has a title and a description Google shows whole", () => {
  assert.ok(pages.length >= 7);
  for (const f of pages) {
    const html = readFileSync(new URL(f, dir), "utf8");
    const d = html.match(/name="description" content="([^"]*)"/)?.[1];
    assert.ok(d, `${f} has no description`);
    assert.ok(d.length <= 155, `${f} description is ${d.length} characters`);
    assert.ok(/<title>[^<]+<\/title>/.test(html), `${f} has no title`);
  }
});

// Google shows a site's icon beside its results. Its favicon page (Search
// Central, read 10-03) asks for a square file Googlebot-Image can crawl, at
// least 8px and ideally over 48px. Until 10-03 every page had a data: URI,
// which is no file to crawl, and /favicon.ico was a 404. The .svg scales.
test("every page names an icon file that exists, and favicon.ico has a 48px one", async () => {
  for (const f of [...pages, "404.html"]) {
    const html = readFileSync(new URL(f, dir), "utf8");
    const icons = [...html.matchAll(/<link rel="icon" href="([^"]*)"/g)].map((m) => m[1]);
    assert.ok(icons.length, `${f} has no icon`);
    for (const href of icons) {
      assert.ok(href.startsWith("/"), `${f}: icon ${href.slice(0, 30)} is not a file Google can fetch`);
      assert.ok(existsSync(new URL(href.slice(1), dir)), `${f}: ${href} is not in public/`);
    }
  }
  const ico = readFileSync(new URL("favicon.ico", dir));
  const sizes = Array.from({ length: ico.readUInt16LE(4) }, (_, i) => ico[6 + 16 * i] || 256);
  assert.ok(sizes.includes(48), `favicon.ico sizes ${sizes}`);
});
