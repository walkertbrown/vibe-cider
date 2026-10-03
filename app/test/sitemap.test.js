// The sitemap's lastmod dates match each page's last commit
// (scripts/sitemap.mjs). It was a separate `npm run test:sitemap`, which no
// deploy ran, and on 2026-10-03 four pages that had gained Trace Press links
// still told Google they hadn't changed since before it existed. Here it runs
// with every `npm test`, which gates every deploy.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("every sitemap lastmod matches its file's last commit", () => {
  const r = spawnSync(process.execPath, [new URL("../scripts/sitemap.mjs", import.meta.url).pathname, "--check"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});
