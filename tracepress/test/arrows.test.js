import { test } from "node:test";
import assert from "node:assert/strict";
import { PRINT, sample } from "../src/glyphs/print.js";
import { strokeArrows, strokeStarts } from "../src/pdf/arrows.js";

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const along = (a, b, n = 12) => Array.from({ length: n + 1 }, (_, k) => [a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);

test("no two arrows on a letter touch, including the down and up of a retraced stem", () => {
  for (const [ch, glyph] of Object.entries(PRINT)) {
    const arrows = strokeArrows(glyph);
    for (let i = 0; i < arrows.length; i++) {
      for (let j = i + 1; j < arrows.length; j++) {
        const gap = Math.min(...along(arrows[i].from, arrows[i].to).flatMap((p) => along(arrows[j].from, arrows[j].to).map((q) => dist(p, q))));
        assert.ok(gap >= 0.15, `${ch}: arrows ${i + 1} and ${j + 1} are ${gap.toFixed(3)} apart`);
      }
    }
  }
});

test("no arrow sits on the letter it describes", () => {
  for (const [ch, glyph] of Object.entries(PRINT)) {
    const path = glyph.strokes.flat().flatMap((s) => sample(s, 96));
    strokeArrows(glyph).forEach((a, i) => {
      const gap = Math.min(...along(a.from, a.to).flatMap((p) => path.map((q) => dist(p, q))));
      assert.ok(gap >= 0.1, `${ch}: arrow ${i + 1} is ${gap.toFixed(3)} from the letter`);
    });
  }
});

test("every stroke gets a number, in writing order", () => {
  for (const [ch, glyph] of Object.entries(PRINT)) {
    assert.deepEqual(strokeStarts(glyph).map((s) => s.n), glyph.strokes.map((_, i) => i + 1), ch);
  }
});

// Segments with no room for an arrow, as of 2026-09-29. Listed so that a
// change which loses another arrow fails here rather than on a printed page.
// b: the push-up is 0.5 long and its right-hand side is inside the bowl.
// g, j: the hooks are small and turn clockwise, so the arrow falls inside.
// w: the middle up-stroke has no clear spot between the two V's.
const NO_ROOM = { b: ["1.2"], g: ["1.4"], j: ["1.2"], w: ["1.3"] };

test("only the known segments go without an arrow", () => {
  for (const [ch, glyph] of Object.entries(PRINT)) {
    const skipped = [];
    strokeArrows(glyph, skipped);
    assert.deepEqual(skipped.map((s) => `${s.stroke}.${s.segment}`), NO_ROOM[ch] ?? [], ch);
  }
});
