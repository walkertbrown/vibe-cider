// Google shows about 155 characters of a meta description. Past that, the
// end is cut off, and the end is where the price and "no sign-up" sit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

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
