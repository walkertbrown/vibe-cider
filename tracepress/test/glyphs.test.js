import { test } from "node:test";
import assert from "node:assert/strict";
import { PRINT, ends, sample, spell } from "../src/glyphs/print.js";

// Stroke order and direction, transcribed from the reference in
// scratch/trace-press-stroke-order.md, one mark per segment and "|" at every
// pencil lift. This is the spec the drawings are checked against, so it is
// written out here rather than derived from the table it checks.
// Where the reference says "curve back" or "curve forward" for a hook, the
// mark is the way the hook actually turns: g and j's hooks turn clockwise.
const SPEC = {
  a: "⟲↑↓", b: "↓↑⟳", c: "⟲", d: "⟲↑↓", e: "→⟲", g: "⟲↑↓⟳", h: "↓↑⟳↓",
  i: "↓|•", j: "↓⟳|•", k: "↓|↙↘", l: "↓", m: "↓↑⟳↓↑⟳↓", n: "↓↑⟳↓", o: "⟲",
  p: "↓↑⟳", q: "⟲↑↓⟲", r: "↓↑⟳", s: "⟲⟳", t: "↓|→", u: "↓⟲↑↓", v: "↘↗",
  w: "↘↗↘↗", x: "↘|↙", y: "↘|↙", z: "→↙→",
  A: "↙|↘|→", B: "↓|→⟳←→⟳←", C: "⟲", D: "↓|→⟳←", E: "↓|→|→|→", F: "↓|→|→",
  G: "⟲←", H: "↓|↓|→", I: "↓|→|→", J: "↓⟳|→", K: "↓|↙↘", L: "↓→",
  M: "↓|↘↗↓", N: "↓|↘↑", O: "⟲", P: "↓|→⟳←", Q: "⟲|↘", R: "↓|→⟳←↘",
  S: "⟲⟳", T: "↓|→", U: "↓⟲↑", V: "↘↗", W: "↘↗↘↗", X: "↘|↙", Y: "↘|↙↓",
  Z: "→↙→",
};

const letters = Object.keys(PRINT);
const near = (a, b) => Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;

test("every letter a–z and A–Z is drawn, except lowercase f (no source yet)", () => {
  const want = [..."abcdeghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"];
  assert.deepEqual([...letters].sort(), want.sort());
});

test("every letter is written in the reference's stroke order and direction", () => {
  for (const ch of letters) assert.equal(spell(PRINT[ch]), SPEC[ch], `letter ${ch}`);
});

test("within a stroke the pencil never jumps: each segment starts where the last ended", () => {
  for (const ch of letters) {
    for (const [si, stroke] of PRINT[ch].strokes.entries()) {
      for (let i = 1; i < stroke.length; i++) {
        const end = ends(stroke[i - 1])[1], start = ends(stroke[i])[0];
        assert.ok(near(end, start), `${ch} stroke ${si + 1}, segment ${i + 1} starts at ${start} but the last ended at ${end}`);
      }
    }
  }
});

test("every mark stays between the descender line and the headline, inside the letter's width", () => {
  const e = 1e-6;
  for (const ch of letters) {
    const { width, strokes } = PRINT[ch];
    for (const seg of strokes.flat()) {
      for (const [x, y] of sample(seg)) {
        assert.ok(y >= -1 - e && y <= 2 + e, `${ch} reaches y=${y}`);
        assert.ok(x >= -e && x <= width + e, `${ch} reaches x=${x}, width ${width}`);
      }
    }
  }
});

test("lowercase without ascenders or descenders sits between baseline and midline", () => {
  for (const ch of "acemnorsuvwxz") {
    for (const seg of PRINT[ch].strokes.flat()) {
      for (const [, y] of sample(seg)) assert.ok(y >= -1e-6 && y <= 1 + 1e-6, `${ch} reaches y=${y}`);
    }
  }
});
