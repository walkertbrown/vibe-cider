// Name tracing sheet: every row and every dot inside KDP's margins at every
// trim and guide size, for short, long and two-word names; the name cleaned
// to letters there are strokes for; and the PDF is one page carrying the
// footer line and no watermark.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TRIMS, marginsForPage } from "../src/pdf/kdp.js";
import { GUIDES } from "../src/pdf/plan.js";
import { planName, cleanName, nameInk, NAME_FOOTER, NAME_MAX } from "../src/pdf/name.js";
import { renderName } from "../src/pdf/book.js";
import { LINE_W, WATERMARK } from "../src/pdf/page.js";

const NAMES = ["Jo", "Maya", "Christopher Lee", "Wwwwwwwwwwwwwwww"];

test("cleanName keeps A–Z, a–z, 0–9 and single spaces, up to NAME_MAX", () => {
  assert.equal(cleanName("  Mary-Kate  O'Brien "), "MaryKate OBrien");
  assert.equal(cleanName("José"), "Jos");
  assert.equal(cleanName("a".repeat(40)).length, NAME_MAX);
  assert.equal(planName({ name: "123" }).name, "123");
  assert.equal(planName({ name: "-_-" }).name, "Name");
});

test("every row and every shape is inside KDP's margins", () => {
  for (const trim of Object.keys(TRIMS)) for (const guideIn of Object.values(GUIDES)) for (const name of NAMES) {
    const { geom, page } = planName({ trim, guideIn, name });
    const m = marginsForPage(geom, 1);
    const where = `${trim} ${guideIn}" ${name}`;
    const trace = page.rows.filter((r) => r.kind === "trace");
    assert.equal(page.rows[0].kind, "model", where);
    assert.equal(page.rows[0].letters.length, name.replace(/ /g, "").length, `${where}: model row has the whole name`);
    assert.ok(trace.length >= 2, `${where}: ${trace.length} trace rows`);
    for (const r of trace) assert.ok(r.letters.length >= name.replace(/ /g, "").length, `${where}: a trace row holds the name`);
    for (const r of page.rows) {
      assert.ok(r.left >= m.left && r.right <= geom.width - m.right, `${where}: x`);
      assert.ok(r.baseY - r.unit - LINE_W / 2 >= m.bottom && r.baseY + 2 * r.unit + LINE_W / 2 <= geom.height - m.top, `${where}: y`);
    }
    for (const s of nameInk(page)) {
      const xs = s.kind === "line" ? [s.x1, s.x2] : s.kind === "tri" ? s.pts.map((p) => p[0]) : [s.x];
      const ys = s.kind === "line" ? [s.y1, s.y2] : s.kind === "tri" ? s.pts.map((p) => p[1]) : [s.y];
      const r = s.r ?? 0;
      for (const x of xs) assert.ok(x - r >= m.left - 0.01 && x + r <= geom.width - m.right + 0.01, `${where}: ${s.kind} x ${x}`);
      for (const y of ys) assert.ok(y - r >= m.bottom - 0.01 && y + r <= geom.height - m.top + 0.01, `${where}: ${s.kind} y ${y}`);
    }
  }
});

test("the PDF is one page with the footer line and no watermark", async () => {
  const fonts = {
    bold: readFileSync(new URL("../fonts/LiberationSans-Bold.ttf", import.meta.url)),
    regular: readFileSync(new URL("../fonts/LiberationSans-Regular.ttf", import.meta.url)),
  };
  const dir = mkdtempSync(join(tmpdir(), "tp-name-"));
  const f = join(dir, "n.pdf");
  writeFileSync(f, await renderName({ name: "Maya", guideIn: 0.75 }, fonts));
  const info = execFileSync("pdfinfo", [f], { encoding: "utf8" });
  const text = execFileSync("pdftotext", [f, "-"], { encoding: "utf8" });
  rmSync(dir, { recursive: true, force: true });
  assert.match(info, /Pages:\s+1\n/);
  assert.match(info, /Title:\s+Name tracing worksheet: Maya/);
  assert.ok(text.includes(NAME_FOOTER) && !text.includes(WATERMARK), text);
});
