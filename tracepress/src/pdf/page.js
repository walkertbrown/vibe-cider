// One letter page of a workbook: a model row, trace rows, then free rows.
//
//   model row  the letter pair (A a) drawn large, with its numbered starts and
//              direction arrows: how to write it
//   trace rows each letter repeated across the line as dots: practise it
//   free rows  one dotted letter, then an empty guide: write it alone
//
// Everything is laid out first as plain numbers (`letterPage`), so a test can
// check every mark sits inside KDP's margins without rendering, and drawn
// second (`drawLetterPage` in draw.js, which is the only part that needs
// pdf-lib, so the web page's preview can use this file without loading it).
// test/inkcheck.mjs then checks the pixels.
import { sample } from "../glyphs/print.js";
import { GLYPHS } from "../glyphs/lines.js";
import { strokeArrows, strokeStarts } from "./arrows.js";
import { PT, SAFETY_IN, marginsForPage } from "./kdp.js";
import { pictureFor } from "./pictures.js";

// Sizes of marks in points. KDP's floors: lines 0.75pt, type 7pt, and the
// numbers are type (reference_kdp_interior_print_rules in the Puzzle Press
// notes; the same rules apply to any KDP interior).
export const LINE_W = 0.75;
export const LABEL_PT = 7;
export const DOT_R = 1.25; // dot radius, trace rows
const MODEL_SCALE = 1.5; // model row guide height against the trace rows'
export const GAP_UNITS = 0.6; // clear space between rows, in guide units
export const LETTER_GAP = 0.8; // space between letters, in guide units
const PAD = 0.5; // room left of a letter for marks that overhang it (arrows, numbers)
// A word page's picture (pictures.js), print (name.js) or cursive (cursive-page.js).
export const PICTURE_MAX = 0.24; // a picture is at most this share of the content width
export const PICTURE_GAP = 0.15; // between the model word and its picture, in picture widths
export const PICTURE_MIN = 0.6; // the smallest picture, as a share of the largest
export const PICTURE_SHRINK = 0.9; // the word may shrink this far to sit beside its picture
export const MARK_PAD = 2.5; // points: half an arrow's line and its head's spread past its tip

// How far a glyph's marks reach, in guide units, beyond the four-line guide
// (which runs -1..2) and beyond its own width. Measured, not assumed: T's
// crossbar arrow sits above the headline, a start number overhangs its
// stroke by its own radius, and a dot on the headline overhangs it by its own.
export function reach(glyph, labelR, pad) {
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

// The layout for one page. `letters` is the pair on the page, e.g. ["A", "a"].
// `guideIn` is the trace rows' headline-to-baseline height in inches. Returns rows top to bottom:
//   { kind, unit, baseY, left, right, letters: [{ ch, x, marks }] }
// in points, with `unit` the size of one guide unit.
// "A is for apple": with `picture` on, a letter's page also has a picture of
// a word that starts with it, the word printed under it, for a child to
// colour. X has "box" (x at the end, as many alphabet books do it); Q has
// "quilt", drawn for Trace Press, since no icon set has a child's Q picture.
export const LETTER_WORDS = {
  A: "apple", B: "ball", C: "cat", D: "dog", E: "egg", F: "fish", G: "grape", H: "horse", I: "ice cream",
  J: "jacket", K: "key", L: "lemon", M: "moon", N: "nut", O: "octagon", P: "pig", Q: "quilt", R: "rabbit", S: "sun",
  T: "tree", U: "umbrella", V: "van", W: "watch", X: "box", Y: "yarn", Z: "zeppelin",
};
const WORD_EM = 0.62; // Liberation Sans Bold, about this many ems a character, loosely (as BELONGS)

export function letterPage({ geom, pageNumber, letters, guideIn, picture = false }) {
  const box = contentBox(geom, pageNumber);
  const rows = [];
  let top = box.top;

  // The model row: its height is the tallest reach of any mark on it.
  const mUnit = (guideIn * MODEL_SCALE * PT) / 2;
  const labelR = labelRadius(mUnit) / mUnit;
  const reaches = letters.map((ch) => reach(GLYPHS[ch], labelR, MARK_PAD / mUnit));
  const above = Math.max(...reaches.map((r) => r.maxY)), below = Math.min(...reaches.map((r) => r.minY));
  let x = box.left + PAD * mUnit;
  const placed = [];
  for (const [i, ch] of letters.entries()) {
    const r = reaches[i];
    x += -r.minX * mUnit; // a mark overhanging the left edge pushes the letter right
    placed.push({ ch, x, marks: true });
    x += (r.maxX + LETTER_GAP) * mUnit;
  }
  const modelEnd = x - LETTER_GAP * mUnit;

  // The picture, beside the pair if there's room for a fair-sized one, else
  // above it. Its word sits under it, no wider than the picture.
  const word = picture && /^[A-Za-z]$/.test(letters[0]) ? LETTER_WORDS[letters[0].toUpperCase()] : undefined;
  const paths = word ? pictureFor(word) : null;
  const pictures = [], text = [];
  let lineEnd = box.right; // the model row's guide lines stop short of a picture beside them
  if (paths) {
    const maxPic = Math.min(3 * mUnit, PICTURE_MAX * (box.right - box.left));
    const labelFor = (size) => Math.max(LABEL_PT, Math.min(size * 0.2, size / (word.length * WORD_EM)));
    const tall = (size) => size + 0.5 * labelFor(size) + 1.2 * labelFor(size); // picture, gap, label to its descenders
    const wide = (size) => Math.max(size, word.length * WORD_EM * labelFor(size)); // the picture or its word
    const besideSize = Math.min(maxPic, (box.right - modelEnd) / (1 + PICTURE_GAP));
    const beside = besideSize >= PICTURE_MIN * maxPic && box.right - besideSize / 2 - wide(besideSize) / 2 >= modelEnd + PICTURE_GAP * besideSize - 0.01; // a hair's slack: besideSize is often exactly the room
    const size = beside ? besideSize : maxPic;
    const cx = beside ? box.right - size / 2 : (box.left + box.right) / 2;
    const ls = labelFor(size);
    pictures.push({ paths, x: cx - size / 2, y: top, size });
    text.push({ text: word, x: cx, y: top - size - 0.5 * ls - ls * 0.9, size: ls, font: "bold" });
    if (!beside) top -= tall(size) + GAP_UNITS * mUnit;
    else lineEnd = cx - wide(size) / 2 - (PICTURE_GAP / 2) * size;
    pictures[0].bottom = box.top - tall(size); // the label's lowest ink, for the rows below
  }
  const mBase = top - above * mUnit;
  rows.push({ kind: "model", unit: mUnit, baseY: mBase, left: box.left, right: lineEnd, letters: placed });
  top = mBase + below * mUnit - GAP_UNITS * mUnit;
  for (const pic of pictures) top = Math.min(top, pic.bottom - GAP_UNITS * mUnit);

  // Trace rows, two per letter, alternating (A, a, A, a) so that a big guide
  // on a small trim, with room for only two rows, still gives each letter
  // one. Then free rows until the page is full.
  const unit = (guideIn * PT) / 2;
  const pitch = (3 + GAP_UNITS) * unit;
  const traceFor = (ch) => {
    const out = [];
    const step = (GLYPHS[ch].width + (GLYPHS[ch].gap ?? LETTER_GAP)) * unit;
    for (let x = box.left + PAD * unit; x + GLYPHS[ch].width * unit <= box.right - PAD * unit; x += step) out.push({ ch, x, marks: false });
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
  return { box, rows, ...(pictures.length ? { pictures, text } : {}) };
}

export function labelRadius(unit) {
  // The number's disc: 7pt type needs about 4.6pt of radius around it, and
  // grows with the letter so the model row doesn't look pinched.
  return Math.max(LABEL_PT * 0.66, unit * 0.16);
}

// The "This book belongs to" page, first in the book if chosen: the words,
// then one empty guide at the model row's size for the child's name. Most
// printed tracing books open with one. The heading is sized to the narrowest
// trim (about 0.62 em a character in Liberation Sans Bold, measured loosely)
// and never below KDP's 7pt.
export const BELONGS = "This book belongs to";
export function belongsPage({ geom, pageNumber, guideIn }) {
  const box = contentBox(geom, pageNumber);
  const size = Math.max(LABEL_PT, Math.min(30, (box.right - box.left) / (BELONGS.length * 0.62)));
  const headY = box.top - (box.top - box.bottom) * 0.3;
  const unit = (guideIn * MODEL_SCALE * PT) / 2;
  const baseY = headY - size * 0.9 - 2 * unit;
  return {
    box,
    belongs: true,
    rows: [{ kind: "free", unit, baseY, left: box.left, right: box.right, letters: [] }],
    text: [{ text: BELONGS, x: (box.left + box.right) / 2, y: headY, size, font: "bold" }],
  };
}
