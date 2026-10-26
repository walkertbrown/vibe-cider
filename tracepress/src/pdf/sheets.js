// Kindergarten worksheets on US Letter, one row per item:
//   CVC words: a picture, three boxes to write the word's letters in, then
//     the word in dots on writing lines to trace.
//   Count and trace: a ten frame with that many dots, then the numeral in
//     dots on writing lines to trace, the first with its start dots and arrows.
// Pure, like name.js: the page previews it without pdf-lib.
import { LETTERS } from "../glyphs/accents.js";
import { pageGeometry } from "./kdp.js";
import { contentBox, LETTER_GAP, FOOTER_PT, LABEL_PT } from "./page.js";
import { pageInk, GREY, BASE, BLACK } from "./ink.js";
import { PICTURES } from "./pictures.js";

// Every consonant-vowel-consonant word there's a picture for.
export const CVC = ["bat", "cat", "map", "rat", "van", "bed", "pig", "dog", "box", "bug", "bus", "cup", "mug", "nut", "sun"].filter((w) => PICTURES[w]);
export const COUNT = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const ROWS = 5; // a page
const PAD = 0.5; // units of room before the first letter on a writing row

const width = (word) => [...word].reduce((w, ch) => w + LETTERS[ch].width, 0) + LETTER_GAP * (word.length - 1);
function copies(word, x0, right, unit, max, marks) {
  const letters = [];
  for (let x = x0 + PAD * unit, n = 0; n < max && x + width(word) * unit <= right - PAD * unit; n++) {
    for (const ch of word) { letters.push({ ch, x, marks: marks && n === 0 }); x += (LETTERS[ch].width + LETTER_GAP) * unit; }
    x += (2.5 - LETTER_GAP) * unit;
  }
  return letters;
}
const rect = (x, y, w, h, color = BASE, lw = 1) => [
  { kind: "line", x1: x, y1: y, x2: x + w, y2: y, width: lw, color }, { kind: "line", x1: x + w, y1: y, x2: x + w, y2: y + h, width: lw, color },
  { kind: "line", x1: x + w, y1: y + h, x2: x, y2: y + h, width: lw, color }, { kind: "line", x1: x, y1: y + h, x2: x, y2: y, width: lw, color },
];

// Rows of `items` laid out five to a page; `row(item, top, pitch, box)` gives
// that row's writing row, pictures and shapes.
function paginate(items, guideIn, row, title) {
  const geom = pageGeometry({ trim: "8.5x11", bleed: false });
  const pages = [];
  for (let i = 0; i < items.length; i += ROWS) {
    const box = contentBox(geom, 1);
    const head = 22;
    const pitch = (box.top - head - box.bottom) / ROWS;
    const page = { box, rows: [], pictures: [], shapes: [], text: [{ text: title, x: (box.left + box.right) / 2, y: box.top - 16, size: 16, font: "bold" }] };
    items.slice(i, i + ROWS).forEach((item, k) => {
      const r = row(item, box.top - head - k * pitch, pitch, box, guideIn);
      page.rows.push(r.row); page.pictures.push(...(r.pictures ?? [])); page.shapes.push(...r.shapes);
    });
    pages.push(page);
  }
  return { geom, pages };
}

export function planCvc({ words = CVC, guideIn = 0.75 } = {}) {
  return paginate(words, guideIn, (word, top, pitch, box, g) => {
    const unit = Math.min((g * 72) / 2, (pitch * 0.8) / 3);
    const baseY = top - pitch / 2 - 0.5 * unit; // the row's ink centred in its band
    const pic = Math.min(pitch * 0.8, 80);
    const cell = Math.min(pic * 0.62, 50);
    const bx = box.left + pic + 14;
    const shapes = [...word].flatMap((_, j) => rect(bx + j * (cell + 6), top - pitch / 2 - cell / 2, cell, cell));
    const left = bx + 3 * (cell + 6) + 12;
    return {
      row: { kind: "trace", unit, baseY, left, right: box.right, letters: copies(word, left, box.right, unit, 3, false) },
      pictures: [{ paths: PICTURES[word], x: box.left, y: top - (pitch - pic) / 2, size: pic }],
      shapes,
    };
  }, "Say it. Write the letters. Trace the word, then write it.");
}

export function planCount({ numbers = COUNT, guideIn = 0.75 } = {}) {
  return paginate(numbers, guideIn, (n, top, pitch, box, g) => {
    const unit = Math.min((g * 72) / 2, (pitch * 0.8) / 3);
    const baseY = top - pitch / 2 - 0.5 * unit;
    // A ten frame: two rows of five squares, filled left to right, top row first.
    const cell = Math.min((pitch * 0.8) / 2, 34);
    const fx = box.left, fy = top - pitch / 2 - cell; // bottom left of the frame
    const shapes = [];
    for (let j = 0; j < 10; j++) {
      const x = fx + (j % 5) * cell, y = fy + (j < 5 ? cell : 0);
      shapes.push(...rect(x, y, cell, cell));
      if (j < n) shapes.push({ kind: "dot", x: x + cell / 2, y: y + cell / 2, r: cell * 0.32, color: BLACK });
    }
    const left = fx + 5 * cell + 18;
    return { row: { kind: "trace", unit, baseY, left, right: box.right, letters: copies(String(n), left, box.right, unit, 4, true) }, shapes };
  }, "Count the dots. Trace the number.");
}

export const SHEET_FOOTER = "Free worksheet from tracepress.bananafest-destiny.com";

export function sheetInk(page, { licensed = false } = {}) {
  const { box } = page;
  const ink = [...pageInk(page, { licensed: true }), ...page.shapes];
  return licensed ? ink : [...ink, { kind: "text", text: SHEET_FOOTER, x: (box.left + box.right) / 2, y: box.bottom - FOOTER_PT + 3, size: LABEL_PT, font: "regular", color: GREY }];
}
