// A cursive alphabet chart: one page with every letter, capital and
// lowercase together ("Aa"), in solid cursive on four-line guides, four to a
// row, then the numbers 0 to 9. A page to pin up and copy from, not to trace
// over, so every letter is a model.
//
// Pure, like cursive-page.js: the caller passes `measure(text, unit)`.
import { PT } from "./kdp.js";
import { contentBox, reach, GAP_UNITS, LETTER_GAP } from "./page.js";
import { GLYPHS } from "../glyphs/lines.js";
import { CURSIVE_REACH } from "./cursive-page.js";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const COLS = 4;
const TITLE_PT = 22;
const DIGITS = [..."0123456789"].join("  "); // spaced so they don't join

export function cursiveChart({ geom, measure, title = "The Cursive Alphabet", pageNumber = 1 }) {
  const box = contentBox(geom, pageNumber);
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

// The print chart, for a print book: the same page in solid print letters
// (no dots, numbers or arrows), each pair spaced by its strokes' own reach.
export function printChart({ geom, title = "The Alphabet", pageNumber = 1 }) {
  const box = contentBox(geom, pageNumber);
  const cells = [];
  for (let i = 0; i < LETTERS.length; i += COLS) cells.push([...LETTERS.slice(i, i + COLS)].map((c) => [c, c.toLowerCase()]));
  cells.push([[..."0123456789"]]);
  const r = (c) => reach(GLYPHS[c], 0, 0);
  const gap = (chars) => (chars.length > 2 ? 2 : 1) * LETTER_GAP; // the digits stand apart, as numbers, not a word
  const span = (chars) => chars.reduce((a, c) => a + r(c).maxX - r(c).minX, 0) + gap(chars) * (chars.length - 1);
  const above = Math.max(...cells.flat(2).map((c) => r(c).maxY)), below = Math.min(...cells.flat(2).map((c) => r(c).minY));

  const titleRoom = TITLE_PT * 2.2;
  const pitchU = above - below + GAP_UNITS;
  const width = box.right - box.left;
  const cellW = width / COLS;
  const unit = Math.min(
    (box.top - titleRoom - box.bottom + GAP_UNITS) / (cells.length * pitchU),
    cellW / (Math.max(...cells.slice(0, -1).flat().map(span)) + 2 * LETTER_GAP),
    width / (span(cells.at(-1)[0]) + 2 * LETTER_GAP),
  ) * 0.999;

  const rows = [];
  let top = box.top - titleRoom;
  for (const row of cells) {
    const baseY = top - above * unit;
    const across = row.length === 1 ? width : cellW;
    const letters = row.flatMap((chars, c) => {
      let x = box.left + c * across + (across - span(chars) * unit) / 2;
      return chars.map((ch) => { const at = x - r(ch).minX * unit; x += (r(ch).maxX - r(ch).minX + gap(chars)) * unit; return { ch, x: at, solid: true }; });
    });
    rows.push({ kind: "model", unit, baseY, left: box.left, right: box.right, letters });
    top -= pitchU * unit;
  }
  const text = [{ text: title, x: (box.left + box.right) / 2, y: box.top - TITLE_PT, size: TITLE_PT, font: "bold" }];
  return { box, rows, text, unit, guideIn: (2 * unit) / PT };
}
