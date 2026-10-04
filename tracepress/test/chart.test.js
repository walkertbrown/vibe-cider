// The cursive alphabet chart (src/pdf/chart.js): every letter and digit is on
// it once, rows don't touch, and every mark stays inside KDP's margins, at
// every trim.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import fontkit from "@pdf-lib/fontkit";
import { cursiveWidth } from "../src/pdf/cursive.js";
import { cursiveChart } from "../src/pdf/chart.js";
import { CURSIVE_REACH } from "../src/pdf/cursive-page.js";
import { planBook } from "../src/pdf/plan.js";
import { TRIMS, marginsForPage } from "../src/pdf/kdp.js";
import { pageInk } from "../src/pdf/ink.js";
import { GLYPHS } from "../src/glyphs/lines.js";
import { sample } from "../src/glyphs/print.js";

const font = fontkit.create(readFileSync(new URL("../public/fonts/PlaywriteUSTrad.ttf", import.meta.url)));
const measure = (text, unit) => cursiveWidth(font, text, unit);

test("the chart has A–Z and 0–9 once, in cursive, inside the margins", () => {
  for (const trim of Object.keys(TRIMS)) {
    const { geom } = planBook({ trim, guideIn: 0.75 });
    const chart = cursiveChart({ geom, measure });
    const runs = chart.rows.flatMap((r) => r.runs);
    assert.equal(runs.map((r) => r.text.replace(/ /g, "")).join(""), "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789", trim);
    assert.ok(chart.guideIn > 0.25, `${trim}: guide only ${chart.guideIn}"`);
    for (let r = 1; r < chart.rows.length; r++) {
      const up = chart.rows[r - 1], dn = chart.rows[r];
      assert.ok(up.baseY + CURSIVE_REACH.below * up.unit > dn.baseY + CURSIVE_REACH.above * dn.unit, `${trim}: rows ${r - 1} and ${r} can touch`);
    }
    // The title sits above the first row's ink.
    assert.ok(chart.text[0].y > chart.rows[0].baseY + CURSIVE_REACH.above * chart.unit, `${trim}: title on the letters`);
    const m = marginsForPage(geom, 1);
    for (const s of pageInk(chart, { cursive: font })) {
      if (s.kind !== "path") continue;
      const nums = s.d.match(/-?[\d.]+(e-?\d+)?/g).map(Number);
      for (let k = 0; k + 1 < nums.length; k += 2) {
        const x = s.x + nums[k] * s.scale, y = s.y - nums[k + 1] * s.scale;
        assert.ok(x >= m.left && x <= geom.width - m.right && y >= m.bottom && y <= geom.height - m.top, `${trim}: ink outside the margins`);
      }
    }
    // No two letters in a row overlap.
    for (const row of chart.rows) for (let c = 1; c < row.runs.length; c++) {
      const a = row.runs[c - 1];
      assert.ok(a.x + measure(a.text, row.unit) + 2 * CURSIVE_REACH.side * row.unit <= row.runs[c].x + 1e-6, `${trim}: ${a.text} runs into ${row.runs[c].text}`);
    }
  }
});

// The chart as a book page ("Alphabet chart"): print or cursive with the
// book, after the front matter, one of the 52 extra pages.
import { printChart } from "../src/pdf/chart.js";
import { wordsMax } from "../src/pdf/plan.js";
import { SPINE_TEXT_MIN_PAGES } from "../src/pdf/cover-geometry.js";
import { listingText } from "../src/pdf/listing.js";

test("the print chart has A–Z and 0–9 once, solid, apart, inside the margins on every trim and bleed", () => {
  for (const trim of Object.keys(TRIMS)) for (const bleed of [false, true]) for (const pageNumber of [1, 2]) {
    const at = `${trim} bleed=${bleed} p${pageNumber}`;
    const { geom } = planBook({ trim, bleed });
    const chart = printChart({ geom, pageNumber });
    const letters = chart.rows.flatMap((r) => r.letters);
    assert.equal(letters.map((l) => l.ch).join(""), "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789", at);
    assert.ok(letters.every((l) => l.solid), at);
    assert.ok(chart.guideIn > 0.25, `${at}: guide only ${chart.guideIn}"`);
    const ink = pageInk(chart, { licensed: true });
    // Solid: no grey trace dots, no green start dots, no arrows.
    assert.ok(!ink.some((s) => s.kind === "tri"), `${at}: arrows`);
    const m = marginsForPage(geom, pageNumber);
    const strokes = ink.filter((s) => s.kind === "line" && !s.dash && s.width > 1);
    assert.ok(strokes.length > 200, `${at}: ${strokes.length} solid strokes`);
    for (const s of ink) {
      const pts = s.kind === "line" ? [[s.x1, s.y1], [s.x2, s.y2]] : s.kind === "dot" ? [[s.x - s.r, s.y - s.r], [s.x + s.r, s.y + s.r]] : s.kind === "text" ? [[s.x, s.y]] : [];
      for (const [x, y] of pts) assert.ok(x >= m.left - 1e-6 && x <= geom.width - m.right + 1e-6 && y >= m.bottom - 1e-6 && y <= geom.height - m.top + 1e-6, `${at}: ${s.kind} outside the margins at ${x.toFixed(1)},${y.toFixed(1)}`);
    }
    // Rows don't touch, and no two characters in a row overlap.
    for (let r = 1; r < chart.rows.length; r++) assert.ok(chart.rows[r - 1].baseY - chart.rows[r].baseY >= 3.6 * chart.unit - 1e-6, `${at}: rows ${r - 1}, ${r}`);
    const w = (ch) => Math.max(...GLYPHS[ch].strokes.flat().flatMap((seg) => sample(seg, 24)).map((p) => p[0]));
    const x0 = (ch) => Math.min(...GLYPHS[ch].strokes.flat().flatMap((seg) => sample(seg, 24)).map((p) => p[0]));
    for (const row of chart.rows) for (let c = 1; c < row.letters.length; c++) {
      const a = row.letters[c - 1], b = row.letters[c];
      assert.ok(a.x + w(a.ch) * row.unit + 0.5 * row.unit <= b.x + x0(b.ch) * row.unit, `${at}: ${a.ch} runs into ${b.ch}`);
    }
  }
});

test("the Alphabet chart option: after the front matter, the book's script, one of the 52", () => {
  assert.ok(!planBook({}).pages.some((p) => p.chart), "off by default");
  const p = planBook({ chart: true }).pages;
  assert.equal(p.length, 27); assert.ok(p[0].chart && p[0].rows[0].letters[0].solid);
  const front = planBook({ chart: true, titled: true, copyright: true, belongs: true, title: "T" }).pages;
  assert.ok(front[3].chart && front[0].titlePage && front[1].copyright && front[2].belongs);
  assert.equal(planBook({ chart: true, lines: true }).pages[1].rows[0].letters[0].ch[0], "~", "lines after the chart");
  const c = planBook({ chart: true, script: "cursive", measure }).pages[0];
  assert.ok(c.chart && c.rows[0].runs.length === 4, "a cursive book gets the cursive chart");
  assert.equal(wordsMax(true, true, true, true, true, true, true, true), 27);
  const all = { numbers: true, lines: true, shapes: true, belongs: true, done: true, copyright: true, titled: true, chart: true, words: Array.from({ length: 60 }, (_, i) => "word" + "abcdefghij"[i % 10] + "abcdefghij"[(i / 10) | 0]) };
  const most = planBook(all).pages.length;
  assert.equal(most, 78); assert.ok(most < SPINE_TEXT_MIN_PAGES);
  assert.match(listingText(all), /\n- An alphabet chart: every letter, A to Z, capital and lowercase, and the numbers 0 to 9 on one page, in solid print/);
  assert.doesNotMatch(listingText({}), /alphabet chart/);
});
