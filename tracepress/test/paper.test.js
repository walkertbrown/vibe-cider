// Blank handwriting paper: every guide line inside KDP's margins (from
// kdp.js, not the layout's own box) at every trim, bleed, guide size and
// across the page counts where the gutter changes; the gutter on the correct
// side of odd and even pages; and the PDF has the pages asked for, with no
// text on them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync, rmSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TRIMS, marginsForPage, gutterInches, PT } from "../src/pdf/kdp.js";
import { GUIDES } from "../src/pdf/plan.js";
import { planPaper, PAPER_PAGES } from "../src/pdf/paper.js";
import { renderPaper } from "../src/pdf/book.js";
import { LINE_W } from "../src/pdf/page.js";

const COUNTS = [24, 150, 151, 300];

test("every guide line on every paper page is inside KDP's margins", () => {
  for (const trim of Object.keys(TRIMS)) for (const bleed of [false, true]) for (const guideIn of Object.values(GUIDES)) for (const pageCount of COUNTS) {
    const { geom, pages } = planPaper({ trim, bleed, guideIn, pageCount });
    assert.equal(pages.length, pageCount);
    for (const n of [1, 2]) {
      const m = marginsForPage(geom, n);
      const where = `${trim}${bleed ? " bleed" : ""} ${guideIn}" ${pageCount}pp p${n}`;
      const { rows } = pages[n - 1];
      assert.ok(rows.length >= 2, `${where}: ${rows.length} rows`);
      for (const r of rows) {
        const top = r.baseY + 2 * r.unit + LINE_W / 2, bottom = r.baseY - r.unit - LINE_W / 2;
        assert.ok(r.left >= m.left && r.right <= geom.width - m.right, `${where}: x ${r.left}..${r.right}`);
        assert.ok(bottom >= m.bottom && top <= geom.height - m.top, `${where}: y ${bottom}..${top}`);
      }
      // The gutter is on the inside: the left of odd pages, the right of even.
      const inner = gutterInches(pageCount) * PT;
      if (n === 1) assert.ok(rows[0].left >= inner, `${where}: gutter`);
      else assert.ok(geom.width - rows[0].right >= inner, `${where}: gutter`);
    }
  }
});

test("page counts outside KDP's range are brought into it", () => {
  assert.equal(planPaper({ pageCount: 3 }).pageCount, PAPER_PAGES.min);
  assert.equal(planPaper({ pageCount: 9999 }).pageCount, PAPER_PAGES.max);
  assert.equal(planPaper({ pageCount: NaN }).pageCount, PAPER_PAGES.default);
});

test("the PDF has the pages asked for and no text", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tp-paper-"));
  const pdf = join(dir, "p.pdf");
  writeFileSync(pdf, await renderPaper({ trim: "6x9", guideIn: 0.6, pageCount: 40 }));
  const info = execFileSync("pdfinfo", [pdf], { encoding: "utf8" });
  const text = execFileSync("pdftotext", [pdf, "-"], { encoding: "utf8" });
  rmSync(dir, { recursive: true, force: true });
  assert.match(info, /Pages:\s+40\b/);
  assert.match(info, /432 x 648 pts/);
  assert.equal(text.replace(/\s/g, ""), "");
});

// The "How many lines fit on a page" table on /handwriting-paper is typed out;
// it must match planPaper on every trim and line size.
test("the lines-per-page table on /handwriting-paper matches planPaper", () => {
  const html = readFileSync(new URL("../public/handwriting-paper.html", import.meta.url), "utf8");
  const body = html.match(/id="rowsTable">[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/)[1];
  const got = [...body.matchAll(/<tr>(.*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<td>(.*?)<\/td>/g)].map((c) => c[1]));
  const want = Object.keys(TRIMS).map((trim) => [trim.replace("x", '" × ') + '"', ...Object.values(GUIDES).map((guideIn) => String(planPaper({ trim, guideIn }).pages[0].rows.length))]);
  assert.deepEqual(got, want);
});
