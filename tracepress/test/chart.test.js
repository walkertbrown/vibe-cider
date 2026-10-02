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
