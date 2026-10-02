// A cursive alphabet chart: one page with every letter, capital and
// lowercase together ("Aa"), in solid cursive on four-line guides, four to a
// row, then the numbers 0 to 9. A page to pin up and copy from, not to trace
// over, so every letter is a model.
//
// Pure, like cursive-page.js: the caller passes `measure(text, unit)`.
import { PT } from "./kdp.js";
import { contentBox, GAP_UNITS } from "./page.js";
import { CURSIVE_REACH } from "./cursive-page.js";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const COLS = 4;
const TITLE_PT = 22;
const DIGITS = [..."0123456789"].join("  "); // spaced so they don't join

export function cursiveChart({ geom, measure, title = "The Cursive Alphabet" }) {
  const box = contentBox(geom, 1);
  const cells = [];
  for (let i = 0; i < LETTERS.length; i += COLS) cells.push([...LETTERS.slice(i, i + COLS)].map((c) => c + c.toLowerCase()));
  cells.push([DIGITS]);
  const { above, below, side } = CURSIVE_REACH;

  // The guide size: as big as fits down the page under the title, and across
  // a cell for the widest pair (or across the page for the digits).
  const titleRoom = TITLE_PT * 2.2;
  const pitchU = above - below + GAP_UNITS;
  const width = box.right - box.left;
  const cellW = width / COLS;
  const widestPair = Math.max(...cells.slice(0, -1).flat().map((t) => measure(t, 1)));
  const unit = Math.min(
    (box.top - titleRoom - box.bottom + GAP_UNITS) / (cells.length * pitchU),
    cellW / (widestPair + 2 * side),
    width / (measure(DIGITS, 1) + 2 * side),
  ) * 0.999;

  const rows = [];
  let top = box.top - titleRoom;
  for (const row of cells) {
    const baseY = top - above * unit;
    const across = row.length === 1 ? width : cellW;
    const runs = row.map((text, c) => ({ text, x: box.left + c * across + (across - measure(text, unit)) / 2 }));
    rows.push({ kind: "model", unit, baseY, left: box.left, right: box.right, letters: [], runs });
    top -= pitchU * unit;
  }
  const text = [{ text: title, x: (box.left + box.right) / 2, y: box.top - TITLE_PT, size: TITLE_PT, font: "bold" }];
  return { box, rows, text, unit, guideIn: (2 * unit) / PT };
}
