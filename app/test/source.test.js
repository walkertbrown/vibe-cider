// The Buy link's client_reference_id says where the buyer came from, and only
// that: a site name or a page name, never a search or a full path, and never
// anything the self-test filters in scripts/ would mistake for a test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { firstSource } from "../src/ui/source.js";

const HOST = "puzzlepress.bananafest-destiny.com";
const at = (search = "") => ({ host: HOST, search });

test("a site that linked here is named by its host", () => {
  assert.equal(firstSource(at(), "https://www.google.com/search?q=kdp+word+search"), "google_com");
  assert.equal(firstSource(at(), "https://dev.to/some-post"), "dev_to");
});

test("a page of this site is named by its first segment only", () => {
  assert.equal(firstSource(at(), `https://${HOST}/spine-calculator?pages=120`), "via-spine_calculator");
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
