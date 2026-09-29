// Stroke-order marks for the model letter: a numbered start for each stroke
// and an arrow beside each segment showing which way the pencil goes.
//
// An arrow sits beside its segment, not on it, and always on the right-hand
// side of the direction of travel. So when a stroke goes down a line and
// straight back up it (a, b, d, h, m, n, p, q, r, u), the down arrow and the
// up arrow land on opposite sides of the line instead of on top of each other.
import { ends, sample } from "../glyphs/print.js";

const OFFSET = 0.2; // arrow distance from the path, guide units
const LENGTH = 0.36; // arrow length, guide units
const MIN_SEGMENT = 0.3; // shorter segments (a push-up of 0.5 is fine) get no arrow

function lengthOf(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return len;
}

// The point a fraction `f` of the way along a segment, and the unit direction
// of travel there.
function at(seg, f) {
  const pts = sample(seg, 96);
  const want = lengthOf(pts) * f;
  let walked = 0;
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]];
    const step = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (step > 0 && walked + step >= want) {
      const t = (want - walked) / step;
      return { at: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], dir: [(b[0] - a[0]) / step, (b[1] - a[1]) / step] };
    }
    walked += step;
  }
  return null;
}

const CLEAR_OF_LETTER = 0.1;
const CLEAR_OF_ARROW = 0.15;
const TRIES = [0.5, 0.35, 0.65, 0.2, 0.8];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const points = (a) => Array.from({ length: 13 }, (_, k) => [a.from[0] + ((a.to[0] - a.from[0]) * k) / 12, a.from[1] + ((a.to[1] - a.from[1]) * k) / 12]);
const gap = (ps, qs) => Math.min(...ps.flatMap((p) => qs.map((q) => dist(p, q))));

// Arrows for a glyph, in guide units: { from, to, stroke } with the head at
// `to`. Each arrow goes at the middle of its segment if that spot is clear of
// the letter and of the arrows already placed, and otherwise at the first
// clear spot further along or back (t's crossbar crosses its stem at the
// middle). A segment with no clear spot gets no arrow; `skipped` says which,
// so a page can't silently lose one. Dots and very short segments get none.
export function strokeArrows(glyph, skipped = []) {
  const path = glyph.strokes.flat().flatMap((s) => sample(s, 96));
  const out = [];
  glyph.strokes.forEach((stroke, si) => {
    stroke.forEach((seg, gi) => {
      if (seg.type === "dot") return;
      if (lengthOf(sample(seg, 96)) < MIN_SEGMENT) return;
      for (const f of TRIES) {
        const m = at(seg, f);
        if (!m) continue;
        const [dx, dy] = m.dir;
        const side = [dy, -dx]; // right-hand side of travel
        const c = [m.at[0] + side[0] * OFFSET, m.at[1] + side[1] * OFFSET];
        const arrow = {
          stroke: si + 1,
          from: [c[0] - (dx * LENGTH) / 2, c[1] - (dy * LENGTH) / 2],
          to: [c[0] + (dx * LENGTH) / 2, c[1] + (dy * LENGTH) / 2],
        };
        const ps = points(arrow);
        if (gap(ps, path) < CLEAR_OF_LETTER) continue;
        if (out.some((o) => gap(ps, points(o)) < CLEAR_OF_ARROW)) continue;
        out.push(arrow);
        return;
      }
      skipped.push({ stroke: si + 1, segment: gi + 1 });
    });
  });
  return out;
}

// Where each stroke's number goes: its start point.
export function strokeStarts(glyph) {
  return glyph.strokes.map((stroke, i) => ({ n: i + 1, at: ends(stroke[0])[0] }));
}
