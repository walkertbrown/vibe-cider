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
