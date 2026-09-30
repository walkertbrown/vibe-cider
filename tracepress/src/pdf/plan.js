// What a book is, before anything is drawn: its pages laid out. Pure, so the
// web preview can plan a book without loading pdf-lib.
import { PRINT } from "../glyphs/print.js";
import { pageGeometry } from "./kdp.js";
import { letterPage } from "./page.js";
import { namePage, cleanName } from "./name.js";

// The letter pairs, in order. A letter with no strokes in PRINT is left off
// its page rather than drawn wrong.
export function letterPairs() {
  return [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((U) => [U, U.toLowerCase()].filter((ch) => PRINT[ch]));
}

// Guide heights on offer, headline to baseline, in inches.
export const GUIDES = { "ages 4-5": 1, "ages 5-7": 0.75, "ages 7-9": 0.6, "older": 0.45 };

// Practice words the buyer adds get a page each after Z, laid out like the
// free name sheet (name.js). At most 52, so the book stays under KDP's
// 79-page floor for spine text and the cover's blank spine stays right.
export const WORDS_MAX = 52;
export function cleanWords(words) {
  const list = typeof words === "string" ? words.split(/[,\n;]+/) : words ?? [];
  return list.map(cleanName).filter(Boolean).slice(0, WORDS_MAX);
}

export function planBook({ trim = "8.5x11", bleed = false, guideIn = 0.75, words = [] } = {}) {
  const pairs = letterPairs();
  const extra = cleanWords(words);
  const geom = pageGeometry({ trim, bleed, pageCount: pairs.length + extra.length });
  return {
    geom,
    pages: [
      ...pairs.map((letters, i) => letterPage({ geom, pageNumber: i + 1, letters, guideIn })),
      ...extra.map((word, i) => ({ ...namePage({ geom, pageNumber: pairs.length + i + 1, name: word, guideIn }), word })),
    ],
  };
}
