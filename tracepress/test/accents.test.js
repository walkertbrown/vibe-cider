// Accented letters (src/glyphs/accents.js): each is its base letter, written
// first, then the accent above it, clear of the letter, below the headline
// on lowercase and inside the row gap on capitals; i and j lose their dot.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PRINT, sample, ends } from "../src/glyphs/print.js";
import { ACCENTED, NAME_MARKS, LETTERS } from "../src/glyphs/accents.js";
import { GAP_UNITS } from "../src/pdf/page.js";

const top = (strokes) => Math.max(...strokes.flat().flatMap((s) => sample(s)).map((p) => p[1]));
const bottom = (strokes) => Math.min(...strokes.flat().flatMap((s) => sample(s)).map((p) => p[1]));

test("every accented letter is its base letter and then an accent clear above it", () => {
  assert.equal(Object.keys(ACCENTED).length, 53);
  for (const [ch, g] of Object.entries(ACCENTED)) {
    if (/[çÇ]/.test(ch)) continue;
    const base = PRINT[ch.normalize("NFD")[0]];
    const upper = ch !== ch.toLowerCase();
    const kept = base.strokes.filter((s) => !(s.length === 1 && s[0].type === "dot"));
    const accent = g.strokes.slice(kept.length);
    assert.ok(accent.length >= 1, ch);
    assert.equal(kept.length, /[ij]/i.test(ch.normalize("NFD")[0]) && !upper ? base.strokes.length - 1 : base.strokes.length, `${ch}: only i and j lose a stroke, their dot`);
    assert.ok(bottom(accent) > top(kept) + 0.05, `${ch}: accent touches the letter`);
    if (upper) assert.ok(top(accent) < 2 + GAP_UNITS, `${ch}: accent reaches the row above`);
    else assert.ok(top(accent) <= 2, `${ch}: accent above the headline`);
    for (const [x] of g.strokes.flat().flatMap((s) => sample(s))) assert.ok(x >= -1e-9 && x <= g.width + 1e-9, `${ch}: outside its width`);
    for (const stroke of g.strokes) for (let i = 1; i < stroke.length; i++) {
      const a = ends(stroke[i - 1])[1], b = ends(stroke[i])[0];
      assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6, `${ch}: stroke breaks`);
    }
  }
});

const breaks = (g) => g.strokes.some((stroke) => stroke.some((seg, i) => {
  if (!i) return false;
  const a = ends(stroke[i - 1])[1], b = ends(seg)[0];
  return Math.hypot(a[0] - b[0], a[1] - b[1]) > 1e-6;
}));

test("ç and Ç: the c, then a cedilla that starts on its bottom and hangs below the baseline, inside the descender", () => {
  for (const ch of "çÇ") {
    const g = ACCENTED[ch], c = PRINT[ch.normalize("NFD")[0]];
    assert.equal(g.width, c.width, ch);
    assert.deepEqual(g.strokes.slice(0, c.strokes.length), c.strokes, `${ch}: the c first`);
    const ced = g.strokes.slice(c.strokes.length);
    assert.equal(ced.length, 1, `${ch}: one cedilla stroke`);
    assert.ok(Math.abs(ends(ced[0][0])[0][1]) < 1e-9, `${ch}: cedilla starts on the baseline`);
    assert.ok(bottom(ced) < -0.2 && bottom(ced) > -1, `${ch}: cedilla below the baseline, above the descender line`);
    for (const [x] of ced.flat().flatMap((s) => sample(s))) assert.ok(x >= 0 && x <= g.width, `${ch}: cedilla outside the width`);
    assert.ok(!breaks(g), `${ch}: stroke breaks`);
  }
});

test("a hyphen sits across the lowercase middle; an apostrophe hangs from the headline", () => {
  const h = NAME_MARKS["-"], q = NAME_MARKS["'"];
  assert.ok(top(h.strokes) === 0.5 && bottom(h.strokes) === 0.5 && h.width > 0, "hyphen");
  assert.ok(top(q.strokes) === 2 && bottom(q.strokes) > 1, "apostrophe");
  assert.ok(LETTERS["-"] && LETTERS["'"] && LETTERS["ç"], "names can use them");
});
