// The sitemap's lastmod dates match each page's last commit
// (scripts/sitemap.mjs), so every deploy tells crawlers which pages moved.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("every sitemap lastmod matches its file's last commit", () => {
  const r = spawnSync(process.execPath, [new URL("../scripts/sitemap.mjs", import.meta.url).pathname, "--check"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});
