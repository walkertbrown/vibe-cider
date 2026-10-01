// A name tracing sheet: one page with a child's name written once large, with
// numbered start dots and stroke arrows on every letter, then rows of the
// name in dots to trace, then rows left empty to write it alone. Pure, like
// plan.js, so the page can preview it without pdf-lib.
import { PRINT } from "../glyphs/print.js";
import { pageGeometry, PT } from "./kdp.js";
import { contentBox, reach, labelRadius, GAP_UNITS, LETTER_GAP, MARK_PAD, FOOTER_PT, LABEL_PT } from "./page.js";
import { pageInk, GREY } from "./ink.js";

export const NAME_MAX = 16;
const MODEL_SCALE = 1.5; // as in page.js
const PAD = 0.5; // as in page.js: room left of the first letter
const SPACE = 1.2; // a space between words, in guide units
const REPEAT_GAP = 2.5; // between copies of the name on a trace row, in guide units

// Only the letters there are strokes for (A–Z, a–z) and single spaces.
export function cleanName(s) {
  return [...String(s ?? "")].filter((ch) => PRINT[ch] || /\s/.test(ch)).join("").replace(/\s+/g, " ").trim().slice(0, NAME_MAX).trim();
}

// Letters of `name` placed from x0, each with its extent in guide units.
// Returns the letters and the x where the name ends.
function place(name, x0, unit, ext) {
  const letters = [];
  let x = x0;
  for (const ch of name) {
    if (ch === " ") { x += SPACE * unit; continue; }
    const e = ext(ch);
    x += -e.minX * unit; // a mark overhanging the left pushes the letter right
    letters.push({ ch, x });
    x += (e.maxX + LETTER_GAP) * unit;
  }
  return { letters, end: x - LETTER_GAP * unit };
}

const plain = (ch) => ({ minX: 0, maxX: PRINT[ch].width });

export function namePage({ geom, pageNumber = 1, name, guideIn }) {
  const box = contentBox(geom, pageNumber);
  const width = box.right - box.left;
  const rows = [];
  let top = box.top;

  // The model row, shrunk until the name fits the width with its marks.
  let mUnit = (guideIn * MODEL_SCALE * PT) / 2, model;
  for (;;) {
    const labelR = labelRadius(mUnit) / mUnit;
    const reaches = new Map([...new Set(name.replace(/ /g, ""))].map((ch) => [ch, reach(PRINT[ch], labelR, MARK_PAD / mUnit)]));
    const p = place(name, box.left + PAD * mUnit, mUnit, (ch) => reaches.get(ch));
    if (p.end <= box.right || mUnit < 4) {
      const all = [...reaches.values()];
      model = { p, above: Math.max(2, ...all.map((r) => r.maxY)), below: Math.min(-1, ...all.map((r) => r.minY)) };
      break;
    }
    mUnit *= 0.95;
  }
  const mBase = top - model.above * mUnit;
  rows.push({ kind: "model", unit: mUnit, baseY: mBase, left: box.left, right: box.right, letters: model.p.letters.map((l) => ({ ...l, marks: true })) });
  top = mBase + model.below * mUnit - GAP_UNITS * mUnit;

  // Trace rows: as many whole copies of the name as fit. A name too long for
  // one copy at this guide size gets a smaller guide on these rows.
  const oneAt = (u) => place(name, 0, u, plain).end + 2 * PAD * u;
  let unit = (guideIn * PT) / 2;
  if (oneAt(unit) > width) unit = (width / oneAt(1)) * 0.999; // just under, so one copy fits
  const pitch = (3 + GAP_UNITS) * unit;
  const traceRow = () => {
    const letters = [];
    for (let x = box.left + PAD * unit; ; ) {
      const p = place(name, x, unit, plain);
      if (p.end > box.right - PAD * unit) break;
      letters.push(...p.letters.map((l) => ({ ...l, marks: false })));
      x = p.end + REPEAT_GAP * unit;
    }
    return letters;
  };
  let n = 0;
  for (let t = top; t - 3 * unit >= box.bottom; t -= pitch) n++;
  const free = n >= 5 ? 2 : n >= 3 ? 1 : 0;
  const trace = traceRow();
  for (let i = 0; i < n; i++, top -= pitch) {
    rows.push({ kind: i < n - free ? "trace" : "free", unit, baseY: top - 2 * unit, left: box.left, right: box.right, letters: i < n - free ? trace : [] });
  }
  return { box, rows };
}

export function planName({ trim = "8.5x11", guideIn = 0.75, name = "" } = {}) {
  const geom = pageGeometry({ trim, bleed: false });
  const clean = cleanName(name) || "Name";
  return { geom, name: clean, page: namePage({ geom, name: clean, guideIn }) };
}

// The one line of text on the sheet, in the footer band every page keeps free.
export const NAME_FOOTER = "Free tracing sheet from tracepress.bananafest-destiny.com";

export function nameInk(layout) {
  const { box } = layout;
  return [...pageInk(layout, { licensed: true }), { kind: "text", text: NAME_FOOTER, x: (box.left + box.right) / 2, y: box.bottom - FOOTER_PT + 3, size: LABEL_PT, font: "regular", color: GREY }];
}
