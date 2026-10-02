// A cursive page: a model row, trace rows, then free rows, like a print
// letter page (page.js), but the marks are runs of joined cursive text
// (cursive.js) rather than dotted strokes. There are no start dots or arrows:
// the model is drawn solid and the trace rows in light grey to write over.
//
// Pure, like plan.js. The width of cursive text comes from the font, so the
// caller passes `measure(text, unit)` (cursiveWidth bound to a loaded font)
// and this file never touches one.
import { PT } from "./kdp.js";
import { contentBox, GAP_UNITS, PICTURE_MAX, PICTURE_GAP, PICTURE_MIN, PICTURE_SHRINK } from "./page.js";

// How far any glyph reaches past the guide (-1..2) and past its text's
// advance, in guide units. test/cursive.test.js holds the font to these.
export const CURSIVE_REACH = { above: 2.2, below: -1.1, side: 0.65 };
const MODEL_SCALE = 1.5; // as in page.js
const REPEAT = "  "; // between copies on a trace row: two spaces, so they don't join

// `model` is the text of the model row ("A  a", or a word). `trace` lists
// what each trace row repeats, in order (["A", "a", "A", "a"], or [word]);
// free rows after them start with one copy of trace[0] to copy from.
// `word` pages instead trace on every row but the last one or two, which are
// left empty, as on the print word pages (name.js), and `picture` puts the
// word's picture beside the model or above it, by name.js's rule.
export function cursivePage({ geom, pageNumber, model, trace, guideIn, measure, word = false, picture = null }) {
  const box = contentBox(geom, pageNumber);
  const pad = CURSIVE_REACH.side;
  const room = (u) => box.right - box.left - 2 * pad * u;
  const rows = [];

  // The model row, shrunk until it fits across, less `less` points.
  const fit = (less = 0) => {
    let u = (guideIn * MODEL_SCALE * PT) / 2;
    while (measure(model, u) > room(u) - less && u > 4) u *= 0.95;
    return u;
  };
  let mUnit = fit();
  let top = box.top;
  const pictures = [];
  if (picture) {
    const maxPic = Math.min(3 * (guideIn * MODEL_SCALE * PT) / 2, PICTURE_MAX * (box.right - box.left));
    const beside = fit(PICTURE_MIN * maxPic * (1 + PICTURE_GAP));
    if (beside >= PICTURE_SHRINK * mUnit) {
      mUnit = beside;
      const end = box.left + pad * mUnit + measure(model, mUnit) + pad * mUnit;
      const size = Math.min(maxPic, (box.right - end) / (1 + PICTURE_GAP));
      pictures.push({ paths: picture, x: box.right - size, y: top, size });
    } else {
      pictures.push({ paths: picture, x: (box.left + box.right - maxPic) / 2, y: top, size: maxPic });
      top -= maxPic + GAP_UNITS * mUnit;
    }
  }
  const mBase = top - CURSIVE_REACH.above * mUnit;
  rows.push({ kind: "model", unit: mUnit, baseY: mBase, left: box.left, right: box.right, letters: [], runs: [{ text: model, x: box.left + pad * mUnit }] });
  top = mBase + CURSIVE_REACH.below * mUnit - GAP_UNITS * mUnit;
  for (const pic of pictures) top = Math.min(top, pic.y - pic.size - GAP_UNITS * mUnit);

  // Trace rows share one guide size; a word too long for one copy at that
  // size gets a smaller one, as on the name sheet.
  const widest = Math.max(...trace.map((t) => measure(t, 1)));
  const unit = Math.min((guideIn * PT) / 2, ((box.right - box.left) / (widest + 2 * pad)) * 0.999);
  // Rows are spaced like print rows, guide to guide. The little the ink
  // reaches past the guides (0.2 above, 0.1 below) comes out of the gap, so
  // two rows' ink still can't meet (test/cursive.test.js).
  const pitch = (3 + GAP_UNITS) * unit;
  // As many copies as fit, measured as one string so the spacing is the font's.
  const copies = (t) => {
    let text = t;
    while (measure(text + REPEAT + t, unit) <= room(unit)) text += REPEAT + t;
    return text;
  };
  let n = 0;
  for (let t = top; t - (CURSIVE_REACH.above - CURSIVE_REACH.below) * unit >= box.bottom; t -= pitch) n++;
  const blank = !word ? 0 : n >= 5 ? 2 : n >= 3 ? 1 : 0;
  for (let i = 0; i < n; i++, top -= pitch) {
    const baseY = top - CURSIVE_REACH.above * unit;
    const t = word ? (i < n - blank ? trace[0] : undefined) : trace[i];
    const runs = t !== undefined ? [{ text: copies(t), x: box.left + pad * unit }] : word ? [] : [{ text: trace[0], x: box.left + pad * unit }];
    rows.push({ kind: t !== undefined ? "trace" : "free", unit, baseY, left: box.left, right: box.right, letters: [], runs });
  }
  return { box, rows, pictures };
}
