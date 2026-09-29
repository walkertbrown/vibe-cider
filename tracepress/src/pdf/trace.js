// Where the dots of a dotted tracing letter go.
//
// Stroking each segment with a dash pattern (the first proof, 2026-09-29)
// restarts the dot spacing at every segment and draws a retraced line twice:
// the stem of a, b, d and m came out as a doubled, uneven column of dots. So
// the dots are placed here instead. Walk each stroke in writing order, space
// dots evenly along each segment, and skip any dot that would land on top of
// one already placed for this letter, whether by a retrace, a join, or another
// stroke crossing (the bars of E starting on the stem).
import { sample } from "../glyphs/print.js";

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// Points `at` fractions of the way along a polyline, by length.
function along(pts, fractions) {
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + dist(pts[i - 1], pts[i]));
  const total = lens[lens.length - 1];
  let i = 1;
  return fractions.map((f) => {
    const want = f * total;
    while (i < pts.length - 1 && lens[i] < want) i++;
    const a = pts[i - 1], b = pts[i];
    const span = lens[i] - lens[i - 1] || 1;
    const t = Math.min(1, Math.max(0, (want - lens[i - 1]) / span));
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  });
}

// Dots for a glyph, in guide units, one array per stroke. `spacing` is the
// distance between dot centres in guide units. Every segment gets a dot at
// both ends, so corners and turn-backs (the top of d's stem) are marked, and
// its length is split evenly into steps as close to `spacing` as fits. A dot
// closer than `spacing * keepApart` to an earlier one is skipped.
export function traceDots(glyph, spacing, keepApart = 0.6) {
  const placed = [];
  const out = [];
  for (const stroke of glyph.strokes) {
    const list = [];
    for (const seg of stroke) {
      const pts = sample(seg, 96);
      let len = 0;
      for (let i = 1; i < pts.length; i++) len += dist(pts[i - 1], pts[i]);
      const n = Math.max(1, Math.round(len / spacing));
      const fractions = len === 0 ? [0] : Array.from({ length: n + 1 }, (_, k) => k / n);
      for (const p of along(pts, fractions)) {
        if (placed.some((q) => dist(p, q) < spacing * keepApart)) continue;
        placed.push(p);
        list.push(p);
      }
    }
    out.push(list);
  }
  return out;
}
