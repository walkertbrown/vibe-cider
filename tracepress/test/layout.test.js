import { test } from "node:test";
import assert from "node:assert/strict";
import { PRINT } from "../src/glyphs/print.js";
import { traceDots } from "../src/pdf/trace.js";
import { strokeArrows, strokeStarts } from "../src/pdf/arrows.js";
import { TRIMS, marginsForPage } from "../src/pdf/kdp.js";
import { planBook, GUIDES, letterPairs } from "../src/pdf/book.js";
import { labelRadius, LINE_W } from "../src/pdf/page.js";

// Every combination a buyer can pick.
const combos = Object.keys(TRIMS).flatMap((trim) => [false, true].flatMap((bleed) => Object.entries(GUIDES).map(([age, guideIn]) => ({ trim, bleed, age, guideIn }))));

// Where a row's ink reaches, in points: its four guide lines plus every dot,
// arrow end and number disc, each widened by half a line (dot radii are
// smaller than that plus the arrowhead's reach, so this also covers them).
function inkOf(row) {
  const pad = LINE_W / 2 + 2;
  const ys = [row.baseY - row.unit, row.baseY + 2 * row.unit];
  const xs = [row.left, row.right];
  for (const { ch, x, marks } of row.letters) {
    const P = ([gx, gy]) => [x + gx * row.unit, row.baseY + gy * row.unit];
    const pts = traceDots(PRINT[ch], 4 / row.unit).flat().map(P);
    if (marks) {
      pts.push(...strokeArrows(PRINT[ch]).flatMap((a) => [P(a.from), P(a.to)]));
      for (const s of strokeStarts(PRINT[ch])) {
        const [sx, sy] = P(s.at);
        const r = labelRadius(row.unit);
        pts.push([sx - r, sy - r], [sx + r, sy + r]);
      }
    }
    for (const [px, py] of pts) { xs.push(px - (marks ? pad : 0), px + (marks ? pad : 0)); ys.push(py - (marks ? pad : 0), py + (marks ? pad : 0)); }
  }
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

test("every mark on every page sits inside the content box, at every trim, bleed and guide size", () => {
  for (const c of combos) {
    const { geom, pages } = planBook(c);
    pages.forEach(({ rows }, i) => {
      // KDP's margins straight from kdp.js, not the box the layout reports, so
      // a layout that miscomputes its own box can't pass by agreeing with itself.
      const m = marginsForPage(geom, i + 1);
      const box = { left: m.left, right: geom.width - m.right, bottom: m.bottom, top: geom.height - m.top };
      for (const row of rows) {
        const ink = inkOf(row);
        const where = `${c.trim}${c.bleed ? " bleed" : ""} ${c.age} p${i + 1} ${row.kind} row`;
        assert.ok(ink.minX >= box.left - 1e-6 && ink.maxX <= box.right + 1e-6, `${where}: x ${ink.minX.toFixed(1)}..${ink.maxX.toFixed(1)} outside ${box.left.toFixed(1)}..${box.right.toFixed(1)}`);
        assert.ok(ink.minY >= box.bottom - 1e-6 && ink.maxY <= box.top + 1e-6, `${where}: y ${ink.minY.toFixed(1)}..${ink.maxY.toFixed(1)} outside ${box.bottom.toFixed(1)}..${box.top.toFixed(1)}`);
      }
    });
  }
});

test("rows never overlap: each row's ink ends above the next row's", () => {
  for (const c of combos) {
    planBook(c).pages.forEach(({ rows }, i) => {
      for (let r = 1; r < rows.length; r++) {
        const upper = inkOf(rows[r - 1]), lower = inkOf(rows[r]);
        assert.ok(lower.maxY < upper.minY, `${c.trim} ${c.age} p${i + 1}: row ${r + 1} reaches ${lower.maxY.toFixed(1)}, row ${r} comes down to ${upper.minY.toFixed(1)}`);
      }
    });
  }
});

// Room permitting, two trace rows per letter and then free rows. A 1" guide on
// a 5" x 8" page has room for only two rows under the model, so the floor is
// one trace row per letter, and only two W fit across it.
test("every page has the model pair and at least one trace row per letter, two letters or more", () => {
  for (const c of combos) {
    planBook(c).pages.forEach(({ rows }, i) => {
      const letters = letterPairs()[i];
      const where = `${c.trim}${c.bleed ? " bleed" : ""} ${c.age} p${i + 1} (${letters.join(" ")})`;
      assert.deepEqual(rows[0].letters.map((l) => l.ch), letters, `${where}: model row`);
      for (const ch of letters) {
        const trace = rows.filter((r) => r.kind === "trace" && r.letters[0]?.ch === ch);
        assert.ok(trace.length >= 1 && trace.length <= 2, `${where}: ${trace.length} trace rows for ${ch}`);
        for (const r of trace) assert.ok(r.letters.length >= 2, `${where}: only ${r.letters.length} ${ch} fit on a trace row`);
      }
    });
  }
});
