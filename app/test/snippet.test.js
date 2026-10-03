// Google shows about 155 characters of a meta description. Past that the end
// is cut off, and the end is where "free" and the price sit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const pub = new URL("../public/", import.meta.url);
const files = [
  ...readdirSync(pub).filter((f) => f.endsWith(".html")),
  ...readdirSync(new URL("word-lists/", pub)).filter((f) => f.endsWith(".html")).map((f) => `word-lists/${f}`),
];
const unescape = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

test("every description fits in a Google result", () => {
  assert.ok(files.length > 90);
  for (const f of files) {
    const d = readFileSync(new URL(f, pub), "utf8").match(/name="description" content="([^"]*)"/)?.[1];
    if (d === undefined) continue;
    assert.ok(unescape(d).length <= 155, `${f}: ${unescape(d).length} characters`);
  }
});

// Google shows a site's icon beside its results, and fetches it like a page:
// a data: URI can't be fetched, and Google wants a square that's a multiple of
// 48px. Until 10-03 every page had a data: URI and favicon.ico was 32px.
test("every page names an icon file that exists, and favicon.ico has a 48px one", () => {
  const all = readdirSync(pub, { recursive: true }).filter((f) => f.endsWith(".html"));
  assert.ok(all.length >= files.length);
  for (const f of all) {
    const icons = [...readFileSync(new URL(f, pub), "utf8").matchAll(/<link rel="icon" href="([^"]*)"/g)].map((m) => m[1]);
    assert.ok(icons.length, `${f} has no icon`);
    for (const href of icons) {
      assert.ok(href.startsWith("/"), `${f}: icon ${href.slice(0, 30)} is not a file Google can fetch`);
      assert.ok(existsSync(new URL(href.slice(1), pub)), `${f}: ${href} is not in public/`);
    }
  }
  const ico = readFileSync(new URL("favicon.ico", pub));
  const sizes = Array.from({ length: ico.readUInt16LE(4) }, (_, i) => ico[6 + 16 * i] || 256);
  assert.ok(sizes.includes(48), `favicon.ico sizes ${sizes}`);
});
