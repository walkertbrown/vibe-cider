import { test } from "node:test";
import assert from "node:assert/strict";
import { PRINT, sample } from "../src/glyphs/print.js";
import { traceDots } from "../src/pdf/trace.js";

// The dot spacings the guide presets will use: 4pt between dots, on guides
// from 0.45" to 1" (a guide unit is half the headline-to-baseline height).
const SPACINGS = [0.45, 0.6, 0.75, 1].map((inches) => 4 / ((inches * 72) / 2));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

test("no two dots of a letter crowd each other, even where a stroke retraces a line", () => {
  for (const s of SPACINGS) {
    for (const [ch, glyph] of Object.entries(PRINT)) {
      const dots = traceDots(glyph, s).flat();
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          assert.ok(dist(dots[i], dots[j]) >= s * 0.6 - 1e-9, `${ch} at spacing ${s.toFixed(3)}: dots ${i} and ${j} are ${dist(dots[i], dots[j]).toFixed(3)} apart`);
        }
      }
    }
  }
});

// Between two dots a point is at most half a spacing from one. The limit is
// 0.8, not 0.5, because where a stroke branches off another at a tangent (m's
// humps leaving the stem, e's bowl leaving its bar, r, B) the dot that would
// fill the gap would crowd a dot on the other path, and so it is skipped.
// Measured 2026-09-29: the worst is 0.75 (e, 0.6" guide), and the proof reads
// clean there.
test("no gap in the trace: every point of every stroke has a dot nearby", () => {
  for (const s of SPACINGS) {
    for (const [ch, glyph] of Object.entries(PRINT)) {
      const dots = traceDots(glyph, s).flat();
      for (const seg of glyph.strokes.flat()) {
        for (const p of sample(seg, 96)) {
          const nearest = Math.min(...dots.map((d) => dist(d, p)));
          assert.ok(nearest <= s * 0.8, `${ch} at spacing ${s.toFixed(3)}: a point at ${p.map((v) => v.toFixed(2))} is ${(nearest / s).toFixed(2)} spacings from a dot`);
        }
      }
    }
  }
});
