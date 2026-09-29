// One letter page of a workbook: a model row, trace rows, then free rows.
//
//   model row  the letter pair (A a) drawn large, with its numbered starts and
//              direction arrows: how to write it
//   trace rows each letter repeated across the line as dots: practise it
//   free rows  one dotted letter, then an empty guide: write it alone
//
// Everything is laid out first as plain numbers (`letterPage`), so a test can
// check every mark sits inside KDP's margins without rendering, and drawn
// second (`drawLetterPage`). test/inkcheck.mjs then checks the pixels.
import { rgb } from "pdf-lib";
import { PRINT, sample } from "../glyphs/print.js";
import { traceDots } from "./trace.js";
import { strokeArrows, strokeStarts } from "./arrows.js";
import { PT, SAFETY_IN, marginsForPage } from "./kdp.js";

// Sizes of marks in points. KDP's floors: lines 0.75pt, type 7pt, and the
// numbers are type (reference_kdp_interior_print_rules in the Puzzle Press
// notes; the same rules apply to any KDP interior).
export const LINE_W = 0.75;
export const LABEL_PT = 7;
const DOT_R = 1.25; // dot radius, trace rows
const MODEL_SCALE = 1.5; // model row guide height against the trace rows'
const GAP_UNITS = 0.6; // clear space between rows, in guide units
const LETTER_GAP = 0.8; // space between letters, in guide units
const PAD = 0.5; // room left of a letter for marks that overhang it (arrows, numbers)
const MARK_PAD = 2.5; // points: half an arrow's line and its head's spread past its tip

// How far a glyph's marks reach, in guide units, beyond the four-line guide
// (which runs -1..2) and beyond its own width. Measured, not assumed: T's
// crossbar arrow sits above the headline, a start number overhangs its
// stroke by its own radius, and a dot on the headline overhangs it by its own.
function reach(glyph, labelR, pad) {
  const around = ([x, y], r) => [[x - r, y - r], [x + r, y + r]];
  const pts = [
    ...glyph.strokes.flat().flatMap((seg) => sample(seg, 48)).flatMap((p) => around(p, pad)), // the dots
    ...strokeArrows(glyph).flatMap((a) => [...around(a.from, pad), ...around(a.to, pad)]),
    ...strokeStarts(glyph).flatMap(({ at }) => around(at, labelR + pad)),
  ];
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { minX: Math.min(0, ...xs), maxX: Math.max(glyph.width, ...xs), minY: Math.min(-1, ...ys), maxY: Math.max(2, ...ys) };
}

// The content box of a page, in PDF points (y up), kept SAFETY_IN inside
// KDP's margins.
// The bottom FOOTER_PT is kept free of rows on every page, free or paid, so
// the free preview lays out exactly like the book the buyer pays for; on a
// free book the watermark line goes there.
export const FOOTER_PT = 14;
export function contentBox(geom, pageNumber) {
  const m = marginsForPage(geom, pageNumber);
  const s = SAFETY_IN * PT;
  return { left: m.left + s, right: geom.width - m.right - s, bottom: m.bottom + s + FOOTER_PT, top: geom.height - m.top - s };
}

// On every page of a free book. The address is in it because a free book can
// still reach a reader, and the line says where it came from. KDP's 7pt floor
// is the size; test/layout.test.js checks it fits the narrowest page.
export const WATERMARK = "Made with Trace Press, free preview — tracepress.bananafest-destiny.com";

// The layout for one page. `letters` is the pair on the page, e.g. ["A", "a"]
// (just ["F"] while lowercase f has no source). `guideIn` is the trace rows'
// headline-to-baseline height in inches. Returns rows top to bottom:
//   { kind, unit, baseY, left, right, letters: [{ ch, x, marks }] }
// in points, with `unit` the size of one guide unit.
export function letterPage({ geom, pageNumber, letters, guideIn }) {
  const box = contentBox(geom, pageNumber);
  const rows = [];
  let top = box.top;

  // The model row: its height is the tallest reach of any mark on it.
  const mUnit = (guideIn * MODEL_SCALE * PT) / 2;
  const labelR = labelRadius(mUnit) / mUnit;
  const reaches = letters.map((ch) => reach(PRINT[ch], labelR, MARK_PAD / mUnit));
  const above = Math.max(...reaches.map((r) => r.maxY)), below = Math.min(...reaches.map((r) => r.minY));
  const mBase = top - above * mUnit;
  let x = box.left + PAD * mUnit;
  const model = { kind: "model", unit: mUnit, baseY: mBase, left: box.left, right: box.right, letters: [] };
  for (const [i, ch] of letters.entries()) {
    const r = reaches[i];
    x += -r.minX * mUnit; // a mark overhanging the left edge pushes the letter right
    model.letters.push({ ch, x, marks: true });
    x += (r.maxX + LETTER_GAP) * mUnit;
  }
  rows.push(model);
  top = mBase + below * mUnit - GAP_UNITS * mUnit;

  // Trace rows, two per letter, alternating (A, a, A, a) so that a big guide
  // on a small trim, with room for only two rows, still gives each letter
  // one. Then free rows until the page is full.
  const unit = (guideIn * PT) / 2;
  const pitch = (3 + GAP_UNITS) * unit;
  const traceFor = (ch) => {
    const out = [];
    const step = (PRINT[ch].width + LETTER_GAP) * unit;
    for (let x = box.left + PAD * unit; x + PRINT[ch].width * unit <= box.right - PAD * unit; x += step) out.push({ ch, x, marks: false });
    return out;
  };
  const plan = [...letters, ...letters].map((ch) => ({ kind: "trace", ch }));
  for (let i = 0; ; i++) {
    const want = plan[i] ?? { kind: "free", ch: letters[(i - plan.length) % letters.length] };
    const baseY = top - 2 * unit;
    if (baseY - unit < box.bottom) break;
    const all = traceFor(want.ch);
    rows.push({ kind: want.kind, unit, baseY, left: box.left, right: box.right, letters: want.kind === "trace" ? all : all.slice(0, 1) });
    top -= pitch;
  }
  return { box, rows };
}

export function labelRadius(unit) {
  // The number's disc: 7pt type needs about 4.6pt of radius around it, and
  // grows with the letter so the model row doesn't look pinched.
  return Math.max(LABEL_PT * 0.66, unit * 0.16);
}

const GREY = rgb(0.45, 0.45, 0.45); // far above KDP's 10% minimum
const BASE = rgb(0.2, 0.2, 0.2);
const RED = rgb(0.8, 0.15, 0.1);
const GREEN = rgb(0.1, 0.45, 0.25);

// Draw a laid-out page onto a pdf-lib page. `fonts` holds embedded `bold`
// and `regular`; a book that isn't `licensed` gets the watermark line.
export function drawLetterPage(page, layout, { bold, regular }, { licensed = false } = {}) {
  if (!licensed) {
    const { box } = layout;
    const w = regular.widthOfTextAtSize(WATERMARK, LABEL_PT);
    page.drawText(WATERMARK, { x: box.left + (box.right - box.left - w) / 2, y: box.bottom - FOOTER_PT + 3, size: LABEL_PT, font: regular, color: GREY });
  }
  for (const row of layout.rows) {
    const { unit, baseY, left, right } = row;
    const at = (u) => baseY + u * unit;
    const rule = (u, color, dashArray) => page.drawLine({ start: { x: left, y: at(u) }, end: { x: right, y: at(u) }, thickness: LINE_W, color, dashArray });
    rule(2, GREY);
    rule(1, GREY, [4, 3]);
    rule(0, BASE);
    rule(-1, GREY, [1, 3]);
    for (const l of row.letters) drawLetter(page, l, row, bold);
  }
}

function drawLetter(page, { ch, x, marks }, { unit, baseY }, bold) {
  const glyph = PRINT[ch];
  const P = ([gx, gy]) => [x + gx * unit, baseY + gy * unit];
  const r = marks ? DOT_R * 1.3 : DOT_R;
  for (const d of traceDots(glyph, (marks ? 5.5 : 4) / unit).flat()) {
    const [cx, cy] = P(d);
    page.drawCircle({ x: cx, y: cy, size: r, color: rgb(0, 0, 0) });
  }
  if (!marks) return;
  const head = Math.max(3.2, unit * 0.1);
  for (const a of strokeArrows(glyph)) {
    const [fx, fy] = P(a.from), [tx, ty] = P(a.to);
    const len = Math.hypot(tx - fx, ty - fy), ux = (tx - fx) / len, uy = (ty - fy) / len;
    // The shaft stops at the head's base so its square end doesn't poke past the point.
    page.drawLine({ start: { x: fx, y: fy }, end: { x: tx - ux * head * 0.8, y: ty - uy * head * 0.8 }, thickness: 1, color: RED });
    page.drawSvgPath(
      `M ${tx} ${-ty} L ${tx - ux * head - uy * head * 0.6} ${-(ty - uy * head + ux * head * 0.6)} L ${tx - ux * head + uy * head * 0.6} ${-(ty - uy * head - ux * head * 0.6)} Z`,
      { x: 0, y: 0, color: RED },
    );
  }
  const lr = labelRadius(unit);
  const size = Math.max(LABEL_PT, lr * 1.5);
  for (const { n, at } of strokeStarts(glyph)) {
    const [sx, sy] = P(at);
    page.drawCircle({ x: sx, y: sy, size: lr, color: GREEN });
    const label = String(n);
    page.drawText(label, { x: sx - bold.widthOfTextAtSize(label, size) / 2, y: sy - size * 0.36, size, font: bold, color: rgb(1, 1, 1) });
  }
}
