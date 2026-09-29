// The print alphabet, drawn as pencil strokes rather than as a font.
//
// A font gives the outline of a letter. A child tracing it needs the path
// the pencil takes: where it starts, which way it goes, and when it lifts.
// So every letter here is a list of strokes, and every stroke a list of
// segments in the order they are written. The model letter, the dotted
// trace, the numbered start dots and the arrows are all drawn from this one
// table.
//
// Units are the four-line guide: baseline 0, midline 1, headline 2,
// descender line -1. x runs right from 0 to the letter's width. y runs up.
// Stroke order and direction follow a vertical manuscript model; the
// reference is scratch/trace-press-stroke-order.md. The drawings are mine.
//
// Segments:
//   line(x0, y0, x1, y1)
//   arc(cx, cy, rx, ry, fromDeg, toDeg): angles counter-clockwise from 3
//     o'clock. toDeg > fromDeg runs counter-clockwise ("circle back"), and
//     toDeg < fromDeg runs clockwise ("circle forward").
//   dot(x, y)

const line = (x0, y0, x1, y1) => ({ type: "line", x0, y0, x1, y1 });
const arc = (cx, cy, rx, ry, from, to) => ({ type: "arc", cx, cy, rx, ry, from, to });
const dot = (x, y) => ({ type: "dot", x, y });
const circle = (cx, cy, r, from, to) => arc(cx, cy, r, r, from, to);

// Lowercase: bowls are a circle of diameter 1 sitting on the baseline.
const BOWL = (from, to) => circle(0.5, 0.5, 0.5, from, to);

export const PRINT = {
  a: { width: 1, strokes: [[BOWL(0, 360), line(1, 0.5, 1, 1), line(1, 1, 1, 0)]] },
  b: { width: 1, strokes: [[line(0, 2, 0, 0), line(0, 0, 0, 0.5), BOWL(180, -180)]] },
  c: { width: 1, strokes: [[BOWL(45, 315)]] },
  d: { width: 1, strokes: [[BOWL(0, 360), line(1, 0.5, 1, 2), line(1, 2, 1, 0)]] },
  e: { width: 1, strokes: [[line(0, 0.5, 1, 0.5), BOWL(0, 315)]] },
  // f: the one reference I have is wrong for lowercase f (it repeats F).
  // Left out until a second source says how it is written.
  g: { width: 1, strokes: [[BOWL(0, 360), line(1, 0.5, 1, 1), line(1, 1, 1, -0.75), circle(0.75, -0.75, 0.25, 0, -180)]] },
  h: { width: 1, strokes: [[line(0, 2, 0, 0), line(0, 0, 0, 0.5), BOWL(180, 0), line(1, 0.5, 1, 0)]] },
  i: { width: 0, strokes: [[line(0, 1, 0, 0)], [dot(0, 1.5)]] },
  j: { width: 0.5, strokes: [[line(0.5, 1, 0.5, -0.75), circle(0.25, -0.75, 0.25, 0, -180)], [dot(0.5, 1.5)]] },
  k: { width: 0.8, strokes: [[line(0, 2, 0, 0)], [line(0.8, 1, 0, 0.5), line(0, 0.5, 0.8, 0)]] },
  l: { width: 0, strokes: [[line(0, 2, 0, 0)]] },
  m: {
    width: 1.4,
    strokes: [[
      line(0, 1, 0, 0), line(0, 0, 0, 0.65), circle(0.35, 0.65, 0.35, 180, 0), line(0.7, 0.65, 0.7, 0),
      line(0.7, 0, 0.7, 0.65), circle(1.05, 0.65, 0.35, 180, 0), line(1.4, 0.65, 1.4, 0),
    ]],
  },
  n: { width: 1, strokes: [[line(0, 1, 0, 0), line(0, 0, 0, 0.5), BOWL(180, 0), line(1, 0.5, 1, 0)]] },
  o: { width: 1, strokes: [[BOWL(60, 420)]] },
  p: { width: 1, strokes: [[line(0, 1, 0, -1), line(0, -1, 0, 0.5), BOWL(180, -180)]] },
  q: { width: 1.5, strokes: [[BOWL(0, 360), line(1, 0.5, 1, 1), line(1, 1, 1, -0.75), circle(1.25, -0.75, 0.25, 180, 360)]] },
  r: { width: 1, strokes: [[line(0, 1, 0, 0), line(0, 0, 0, 0.5), BOWL(180, 45)]] },
  s: { width: 0.8, strokes: [[arc(0.4, 0.75, 0.4, 0.25, 30, 270), arc(0.4, 0.25, 0.4, 0.25, 90, -150)]] },
  t: { width: 0.8, strokes: [[line(0.4, 2, 0.4, 0)], [line(0, 1, 0.8, 1)]] },
  u: { width: 1, strokes: [[line(0, 1, 0, 0.5), BOWL(180, 360), line(1, 0.5, 1, 1), line(1, 1, 1, 0)]] },
  v: { width: 1, strokes: [[line(0, 1, 0.5, 0), line(0.5, 0, 1, 1)]] },
  w: { width: 1.4, strokes: [[line(0, 1, 0.35, 0), line(0.35, 0, 0.7, 1), line(0.7, 1, 1.05, 0), line(1.05, 0, 1.4, 1)]] },
  x: { width: 1, strokes: [[line(0, 1, 1, 0)], [line(1, 1, 0, 0)]] },
  y: { width: 1, strokes: [[line(0, 1, 0.5, 0)], [line(1, 1, 0, -1)]] },
  z: { width: 1, strokes: [[line(0, 1, 1, 1), line(1, 1, 0, 0), line(0, 0, 1, 0)]] },

  // Uppercase: headline to baseline. Big bowls are a circle of diameter 2.
  A: { width: 1.6, strokes: [[line(0.8, 2, 0, 0)], [line(0.8, 2, 1.6, 0)], [line(0.3, 0.75, 1.3, 0.75)]] },
  B: {
    width: 1.3,
    strokes: [[line(0, 2, 0, 0)], [
      line(0, 2, 0.7, 2), circle(0.7, 1.5, 0.5, 90, -90), line(0.7, 1, 0, 1),
      line(0, 1, 0.8, 1), circle(0.8, 0.5, 0.5, 90, -90), line(0.8, 0, 0, 0),
    ]],
  },
  C: { width: 2, strokes: [[circle(1, 1, 1, 45, 315)]] },
  D: { width: 1.6, strokes: [[line(0, 2, 0, 0)], [line(0, 2, 0.6, 2), circle(0.6, 1, 1, 90, -90), line(0.6, 0, 0, 0)]] },
  E: { width: 1.2, strokes: [[line(0, 2, 0, 0)], [line(0, 2, 1.2, 2)], [line(0, 1, 1, 1)], [line(0, 0, 1.2, 0)]] },
  F: { width: 1.2, strokes: [[line(0, 2, 0, 0)], [line(0, 2, 1.2, 2)], [line(0, 1, 1, 1)]] },
  G: { width: 2, strokes: [[circle(1, 1, 1, 45, 360), line(2, 1, 1.2, 1)]] },
  H: { width: 1.4, strokes: [[line(0, 2, 0, 0)], [line(1.4, 2, 1.4, 0)], [line(0, 1, 1.4, 1)]] },
  I: { width: 1, strokes: [[line(0.5, 2, 0.5, 0)], [line(0, 2, 1, 2)], [line(0, 0, 1, 0)]] },
  J: { width: 1.5, strokes: [[line(1, 2, 1, 0.5), circle(0.5, 0.5, 0.5, 0, -180)], [line(0.5, 2, 1.5, 2)]] },
  K: { width: 1.3, strokes: [[line(0, 2, 0, 0)], [line(1.3, 2, 0, 0.8), line(0, 0.8, 1.3, 0)]] },
  L: { width: 1.2, strokes: [[line(0, 2, 0, 0), line(0, 0, 1.2, 0)]] },
  M: { width: 1.8, strokes: [[line(0, 2, 0, 0)], [line(0, 2, 0.9, 0), line(0.9, 0, 1.8, 2), line(1.8, 2, 1.8, 0)]] },
  N: { width: 1.4, strokes: [[line(0, 2, 0, 0)], [line(0, 2, 1.4, 0), line(1.4, 0, 1.4, 2)]] },
  O: { width: 2, strokes: [[circle(1, 1, 1, 60, 420)]] },
  P: { width: 1.2, strokes: [[line(0, 2, 0, 0)], [line(0, 2, 0.7, 2), circle(0.7, 1.5, 0.5, 90, -90), line(0.7, 1, 0, 1)]] },
  Q: { width: 2, strokes: [[circle(1, 1, 1, 60, 420)], [line(1.2, 0.4, 1.9, -0.2)]] },
  R: { width: 1.3, strokes: [[line(0, 2, 0, 0)], [line(0, 2, 0.7, 2), circle(0.7, 1.5, 0.5, 90, -90), line(0.7, 1, 0, 1), line(0, 1, 1.2, 0)]] },
  S: { width: 1.4, strokes: [[arc(0.7, 1.5, 0.7, 0.5, 30, 270), arc(0.7, 0.5, 0.7, 0.5, 90, -150)]] },
  T: { width: 1.4, strokes: [[line(0.7, 2, 0.7, 0)], [line(0, 2, 1.4, 2)]] },
  U: { width: 1.4, strokes: [[line(0, 2, 0, 0.7), circle(0.7, 0.7, 0.7, 180, 360), line(1.4, 0.7, 1.4, 2)]] },
  V: { width: 1.6, strokes: [[line(0, 2, 0.8, 0), line(0.8, 0, 1.6, 2)]] },
  W: { width: 2.2, strokes: [[line(0, 2, 0.55, 0), line(0.55, 0, 1.1, 2), line(1.1, 2, 1.65, 0), line(1.65, 0, 2.2, 2)]] },
  X: { width: 1.4, strokes: [[line(0, 2, 1.4, 0)], [line(1.4, 2, 0, 0)]] },
  Y: { width: 1.4, strokes: [[line(0, 2, 0.7, 1)], [line(1.4, 2, 0.7, 1), line(0.7, 1, 0.7, 0)]] },
  Z: { width: 1.4, strokes: [[line(0, 2, 1.4, 2), line(1.4, 2, 0, 0), line(0, 0, 1.4, 0)]] },
};

// Where a segment starts and ends, in guide units.
export function ends(seg) {
  if (seg.type === "line") return [[seg.x0, seg.y0], [seg.x1, seg.y1]];
  if (seg.type === "dot") return [[seg.x, seg.y], [seg.x, seg.y]];
  const at = (deg) => [seg.cx + seg.rx * Math.cos((deg * Math.PI) / 180), seg.cy + seg.ry * Math.sin((deg * Math.PI) / 180)];
  return [at(seg.from), at(seg.to)];
}

// Points along a segment, for bounds checks and for drawing.
export function sample(seg, n = 48) {
  if (seg.type !== "arc") return ends(seg);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const deg = seg.from + ((seg.to - seg.from) * i) / n;
    const r = (deg * Math.PI) / 180;
    pts.push([seg.cx + seg.rx * Math.cos(r), seg.cy + seg.ry * Math.sin(r)]);
  }
  return pts;
}

// The direction a segment is written in, as one mark: ↓ ↑ → ← ↘ ↙ ↗ ↖ for
// lines, ⟲ (counter-clockwise) or ⟳ (clockwise) for arcs, • for a dot.
export function direction(seg) {
  if (seg.type === "dot") return "•";
  if (seg.type === "arc") return seg.to > seg.from ? "⟲" : "⟳";
  const dx = seg.x1 - seg.x0, dy = seg.y1 - seg.y0, e = 1e-9;
  if (Math.abs(dx) < e) return dy < 0 ? "↓" : "↑";
  if (Math.abs(dy) < e) return dx > 0 ? "→" : "←";
  if (dy < 0) return dx > 0 ? "↘" : "↙";
  return dx > 0 ? "↗" : "↖";
}

// A letter's strokes as marks, strokes separated by "|": "↓↑⟳" for b.
export function spell(glyph) {
  return glyph.strokes.map((s) => s.map(direction).join("")).join("|");
}
