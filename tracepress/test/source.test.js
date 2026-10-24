// The Buy link's client_reference_id says where the buyer came from, and only
// that: a site name or a page name, never a search or a full path, and never
// anything the self-test filters in scripts/ would mistake for a test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { firstSource } from "../src/ui/source.js";

const HOST = "tracepress.bananafest-destiny.com";
const at = (search = "") => ({ host: HOST, search });

test("a site that linked here is named by its host", () => {
  assert.equal(firstSource(at(), "https://www.google.com/search?q=kdp+word+search"), "google_com");
  assert.equal(firstSource(at(), "https://dev.to/some-post"), "dev_to");
});

test("a page of this site is named by its first segment only", () => {
  assert.equal(firstSource(at(), `https://${HOST}/name-tracing?name=Ada`), "via-name_tracing");
  assert.equal(firstSource(at(), `https://${HOST}/`), "via-home");
});

test("?ref= wins, and no referrer is direct", () => {
  assert.equal(firstSource(at("?ref=Newsletter-Oct"), "https://www.google.com/"), "newsletter_oct");
  assert.equal(firstSource(at(), ""), "direct");
  assert.equal(firstSource(at("?ref=%20%2F"), ""), "direct");
});

test("every tag is short, plain, and cannot read as a self-test", () => {
  const long = firstSource(at("?ref=" + "x".repeat(300)), "");
  assert.ok(long.length <= 40);
  for (const s of [long, firstSource(at("?ref=selftest-1"), ""), firstSource(at(), "https://a.b/")]) {
    assert.match(s, /^[a-z0-9_-]+$/);
    assert.ok(!("src-" + s).startsWith("selftest-"));
  }
});

// Every page but the tool records the first touch too; a page without it
// would tag a visitor who lands there as via-<page> and lose where they came
// from. /compare is exempt only while it is frozen for the newsletter (to 10-25).
test("every page loads first-touch.js or the tool", async () => {
  const { readdirSync, readFileSync } = await import("node:fs");
  const root = new URL("../public/", import.meta.url);
  const pages = readdirSync(root, { recursive: true }).filter((f) => f.endsWith(".html") && f !== "404.html" && f !== "compare.html");
  assert.ok(pages.length > 10);
  for (const f of pages) {
    const s = readFileSync(new URL(f, root), "utf8");
    assert.ok(s.includes('src="/js/first-touch.js"') || /src="\/?js\/main\.js"/.test(s), `${f} records no first touch`);
  }
});
