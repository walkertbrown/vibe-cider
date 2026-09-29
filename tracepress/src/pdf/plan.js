// What a book is, before anything is drawn: its pages laid out. Pure, so the
// web preview can plan a book without loading pdf-lib.
import { PRINT } from "../glyphs/print.js";
import { pageGeometry } from "./kdp.js";
import { letterPage } from "./page.js";

// The letter pairs, in order. A letter with no strokes in PRINT is left off
// its page rather than drawn wrong.
export function letterPairs() {
  return [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((U) => [U, U.toLowerCase()].filter((ch) => PRINT[ch]));
}

// Guide heights on offer, headline to baseline, in inches.
export const GUIDES = { "ages 4-5": 1, "ages 5-7": 0.75, "ages 7-9": 0.6, "older": 0.45 };

export function planBook({ trim = "8.5x11", bleed = false, guideIn = 0.75 } = {}) {
  const pairs = letterPairs();
  const geom = pageGeometry({ trim, bleed, pageCount: pairs.length });
  return { geom, pages: pairs.map((letters, i) => letterPage({ geom, pageNumber: i + 1, letters, guideIn })) };
}
