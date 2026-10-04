// Accented letters (src/glyphs/accents.js): each is its base letter, written
// first, then the accent above it, clear of the letter, below the headline
// on lowercase and inside the row gap on capitals; i and j lose their dot.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PRINT, sample, ends } from "../src/glyphs/print.js";
import { ACCENTED } from "../src/glyphs/accents.js";
import { GAP_UNITS } from "../src/pdf/page.js";

const top = (strokes) => Math.max(...strokes.flat().flatMap((s) => sample(s)).map((p) => p[1]));
const bottom = (strokes) => Math.min(...strokes.flat().flatMap((s) => sample(s)).map((p) => p[1]));

test("every accented letter is its base letter and then an accent clear above it", () => {
  assert.equal(Object.keys(ACCENTED).length, 51);
  for (const [ch, g] of Object.entries(ACCENTED)) {
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
