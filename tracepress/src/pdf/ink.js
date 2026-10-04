// Everything a laid-out page (page.js) puts on paper, as plain shapes in
// points with y up: lines, dots, arrowheads, discs and text. The PDF
// (draw.js) and the web preview (ui/preview.js) both draw this one list, so
// the preview can't drift from the book. No pdf-lib here.
import { GLYPHS } from "../glyphs/lines.js";
import { sample } from "../glyphs/print.js";
import { traceDots } from "./trace.js";
import { strokeArrows, strokeStarts } from "./arrows.js";
import { cursiveRun } from "./cursive.js";
import { DOT_R, FOOTER_PT, LABEL_PT, LINE_W, WATERMARK, labelRadius } from "./page.js";

// Colours as [r, g, b] in 0..1.
export const GREY = [0.45, 0.45, 0.45]; // far above KDP's 10% minimum
export const BASE = [0.2, 0.2, 0.2];
export const BLACK = [0, 0, 0];
export const WHITE = [1, 1, 1];
export const RED = [0.8, 0.15, 0.1];
export const GREEN = [0.1, 0.45, 0.25];
// A picture's outline, in points: well above KDP's 0.75 pt minimum line.
export const PICTURE_W = 2.5;
export const TRACE = [0.7, 0.7, 0.7]; // cursive to write over: a 30% tint, KDP's floor is 10%

// Shapes:
//   { kind: "line", x1, y1, x2, y2, width, color, dash }
//   { kind: "dot", x, y, r, color }
//   { kind: "tri", pts: [[x, y] × 3], color }
//   { kind: "path", d, x, y, scale, color }
//     (an SVG path, y down, in font units: cursive.js; filled)
//   { kind: "outline", paths, x, y, scale, width, color }
//     (SVG paths, y down, on a 24-unit grid with (x, y) its top left: a
//     picture from pictures.js; stroked `width` pt with round ends, not filled)
//   { kind: "text", text, x, y, size, font: "bold" | "regular", color, align: "center" }
//     (x is the centre; y the baseline)
// `heavy` (the cover) thickens dots and arrows with the letter size; the
// interior keeps its fixed weights.
// `cursive` is the loaded cursive font (fontkit), needed for rows with runs.
export function pageInk(layout, { licensed = false, heavy = false, cursive } = {}) {
  const out = [];
  if (!licensed) {
    const { box } = layout;
    out.push({ kind: "text", text: WATERMARK, x: (box.left + box.right) / 2, y: box.bottom - FOOTER_PT + 3, size: LABEL_PT, font: "regular", color: GREY });
  }
  for (const row of layout.rows) {
    const { unit, baseY, left, right } = row;
    const rule = (u, color, dash) => out.push({ kind: "line", x1: left, y1: baseY + u * unit, x2: right, y2: baseY + u * unit, width: LINE_W, color, dash });
    rule(2, GREY);
    rule(1, GREY, [4, 3]);
    rule(0, BASE);
    rule(-1, GREY, [1, 3]);
    for (const l of row.letters) letterInk(out, l, row, heavy);
    for (const r of row.runs ?? []) out.push(...cursiveRun(cursive, r.text, { x: r.x, baseY, unit, color: row.kind === "model" ? BASE : TRACE }).shapes);
  }
  for (const t of layout.text ?? []) out.push({ kind: "text", color: BLACK, ...t });
  for (const p of layout.pictures ?? []) out.push({ kind: "outline", paths: p.paths, x: p.x, y: p.y, scale: p.size / 24, width: p.width ?? PICTURE_W, color: BLACK });
  return out;
}

// A solid letter (the alphabet chart: a model to copy, not to trace) is its
// strokes drawn as one line, its joints and ends rounded with discs.
export const solidWidth = (unit) => Math.max(1.5, unit * 0.07);
function letterInk(out, { ch, x, marks, solid }, { unit, baseY }, heavy) {
  const glyph = GLYPHS[ch];
  const P = ([gx, gy]) => [x + gx * unit, baseY + gy * unit];
  if (solid) {
    const w = solidWidth(unit);
    for (const seg of glyph.strokes.flat()) {
      const pts = sample(seg, 24).map(P);
      if (seg.type === "dot") { out.push({ kind: "dot", x: pts[0][0], y: pts[0][1], r: w, color: BASE }); continue; }
      for (let i = 1; i < pts.length; i++) out.push({ kind: "line", x1: pts[i - 1][0], y1: pts[i - 1][1], x2: pts[i][0], y2: pts[i][1], width: w, color: BASE });
      for (const [px, py] of pts) out.push({ kind: "dot", x: px, y: py, r: w / 2, color: BASE });
    }
    return;
  }
  const r = heavy ? Math.max(DOT_R * 1.3, unit * 0.03) : marks ? DOT_R * 1.3 : DOT_R;
  const spacing = heavy ? Math.max(5.5, r * 3.4) : marks ? 5.5 : 4;
  for (const d of traceDots(glyph, spacing / unit).flat()) {
    const [cx, cy] = P(d);
    out.push({ kind: "dot", x: cx, y: cy, r, color: BLACK });
  }
  if (!marks) return;
  const head = Math.max(3.2, unit * 0.1);
  for (const a of strokeArrows(glyph)) {
    const [fx, fy] = P(a.from), [tx, ty] = P(a.to);
    const len = Math.hypot(tx - fx, ty - fy), ux = (tx - fx) / len, uy = (ty - fy) / len;
    // The shaft stops at the head's base so its square end doesn't poke past the point.
    out.push({ kind: "line", x1: fx, y1: fy, x2: tx - ux * head * 0.8, y2: ty - uy * head * 0.8, width: heavy ? Math.max(1, unit * 0.02) : 1, color: RED });
    out.push({
      kind: "tri",
      pts: [[tx, ty], [tx - ux * head - uy * head * 0.6, ty - uy * head + ux * head * 0.6], [tx - ux * head + uy * head * 0.6, ty - uy * head - ux * head * 0.6]],
      color: RED,
    });
  }
  const lr = labelRadius(unit);
  const size = Math.max(LABEL_PT, lr * 1.5);
  for (const { n, at } of strokeStarts(glyph)) {
    const [sx, sy] = P(at);
    out.push({ kind: "dot", x: sx, y: sy, r: lr, color: GREEN });
    out.push({ kind: "text", text: String(n), x: sx, y: sy - size * 0.36, size, font: "bold", color: WHITE });
  }
}
