// Cursive (src/pdf/cursive.js): the font fits the four-line guide, every
// letter is in it, and joined text really joins: no gap in the ink between
// one shape and the next, for every lowercase pair.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import fontkit from "@pdf-lib/fontkit";
import { cursiveRun, cursiveWidth } from "../src/pdf/cursive.js";

const font = fontkit.create(readFileSync(new URL("../public/fonts/PlaywriteUSTrad.ttf", import.meta.url)));
const LOWER = "abcdefghijklmnopqrstuvwxyz";

test("the font is 1000 units to the em, body half the capital height", () => {
  assert.equal(font.unitsPerEm, 1000);
  assert.equal(font.xHeight, 500);
  assert.equal(font.capHeight, 1000);
});

test("every letter and digit is in the font", () => {
  for (const c of LOWER + LOWER.toUpperCase() + "0123456789") assert.notEqual(font.glyphForCodePoint(c.codePointAt(0)).id, 0, c);
});

// The font joins by putting a connector stroke (a glyph named cnct.*) between
// two letters. pdf-lib's own drawText left them out, so no pair joined.
const connectors = (glyphs) => glyphs.filter((g) => g.name.startsWith("cnct.")).length;

test("every lowercase pair gets a connector stroke between the letters", () => {
  const unjoined = [];
  for (const a of LOWER) for (const b of LOWER) {
    const g = font.layout(a + b).glyphs;
    // ij is one ligature glyph, drawn joined: the only pair that is.
    if (connectors(g) !== 1 && !(g.length === 1 && a + b === "ij")) unjoined.push(a + b);
  }
  assert.deepEqual(unjoined, []);
});

test("a word gets one connector per join, and a space breaks the join", () => {
  assert.equal(connectors(font.layout("bob").glyphs), 2);
  assert.equal(connectors(font.layout("a b").glyphs), 0);
});

test("letters shaped one at a time get no connector (the check can fail)", () => {
  assert.equal(connectors([...font.layout("a").glyphs, ...font.layout("b").glyphs]), 0);
});

test("shapes sit on the guide: body to the midline, tall letters to the top line", () => {
  const unit = 20;
  const { shapes, width } = cursiveRun(font, "lax", { x: 100, baseY: 300, unit, color: [0, 0, 0] });
  assert.ok(shapes.length >= 3);
  for (const s of shapes) assert.equal(s.kind, "path");
  assert.equal(shapes[0].scale, (2 * unit) / 1000);
  assert.ok(Math.abs(width - cursiveWidth(font, "lax", unit)) < 1e-9);
  // l reaches the top line (2 units up), x stops at the midline (1 unit).
  const top = (ch) => font.layout(ch).glyphs[0].path.bbox.maxY * (2 * unit) / 1000;
  assert.ok(Math.abs(top("l") - 2 * unit) < 0.05 * unit, top("l"));
  assert.ok(Math.abs(top("x") - unit) < 0.05 * unit, top("x"));
});

// The page layout (cursive-page.js) trusts CURSIVE_REACH for how far ink goes
// past the guide and past a run's advance. Hold the font to it.
test("no glyph reaches past CURSIVE_REACH, in any letter, digit or pair", async () => {
  const { CURSIVE_REACH } = await import("../src/pdf/cursive-page.js");
  const UPPER = LOWER.toUpperCase();
  const texts = [...LOWER, ...UPPER, ..."0123456789", ...[...LOWER + UPPER].flatMap((a) => [...LOWER].map((b) => a + b))];
  for (const t of texts) {
    const run = font.layout(t);
    let pen = 0;
    run.glyphs.forEach((g, i) => {
      const b = g.path.bbox;
      if (g.path.commands.length) {
        assert.ok(b.maxY / 500 <= CURSIVE_REACH.above && b.minY / 500 >= CURSIVE_REACH.below, `${t}: ${b.minY}..${b.maxY}`);
        assert.ok((pen + b.minX) / 500 >= -CURSIVE_REACH.side && (pen + b.maxX - run.advanceWidth) / 500 <= CURSIVE_REACH.side, `${t} sideways`);
      }
      pen += run.positions[i].xAdvance;
    });
  }
});

test("a cursive book: same pages as print, lines stay print, every mark inside KDP's margins", async () => {
  const { planBook, GUIDES } = await import("../src/pdf/plan.js");
  const { TRIMS, marginsForPage } = await import("../src/pdf/kdp.js");
  const { pageInk } = await import("../src/pdf/ink.js");
  const measure = (text, unit) => cursiveWidth(font, text, unit);
  const opts = { lines: true, numbers: true, words: "the,butterfly,Grandma,Christopher", belongs: true };
  assert.throws(() => planBook({ ...opts, script: "cursive" }), /measure/);
  for (const trim of Object.keys(TRIMS)) for (const guideIn of Object.values(GUIDES)) for (const bleed of [false, true]) {
    const print = planBook({ ...opts, trim, guideIn, bleed });
    const { geom, pages } = planBook({ ...opts, trim, guideIn, bleed, script: "cursive", measure });
    assert.equal(pages.length, print.pages.length);
    for (const [i, page] of pages.entries()) {
      const where = `${trim} ${guideIn}" bleed=${bleed} p${i + 1}`;
      const runs = page.rows.flatMap((r) => r.runs ?? []);
      if (i >= 1 && i <= 4) assert.equal(runs.length, 0, `${where}: a line page in cursive`);
      if (i >= 5) assert.ok(runs.length > 0 && page.rows.every((r) => r.letters.length === 0), `${where}: not cursive`);
      const m = marginsForPage(geom, i + 1);
      for (const s of pageInk(page, { cursive: font })) {
        if (s.kind !== "path") continue;
        const xs = [], ys = [];
        // The path's own bounds, in points on the page.
        const nums = s.d.match(/-?[\d.]+(e-?\d+)?/g).map(Number);
        for (let k = 0; k + 1 < nums.length; k += 2) { xs.push(s.x + nums[k] * s.scale); ys.push(s.y - nums[k + 1] * s.scale); }
        assert.ok(Math.min(...xs) >= m.left && Math.max(...xs) <= geom.width - m.right, `${where}: ink outside the side margins`);
        assert.ok(Math.min(...ys) >= m.bottom && Math.max(...ys) <= geom.height - m.top, `${where}: ink outside the top or bottom margin`);
      }
    }
  }
});
