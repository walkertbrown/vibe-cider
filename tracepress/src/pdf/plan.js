// What a book is, before anything is drawn: its pages laid out. Pure, so the
// web preview can plan a book without loading pdf-lib.
import { PRINT } from "../glyphs/print.js";
import { LINE_PAGES } from "../glyphs/lines.js";
import { pageGeometry } from "./kdp.js";
import { letterPage, belongsPage } from "./page.js";
import { namePage, cleanName } from "./name.js";

// The letter pages, in order: each capital with its lowercase, or one case
// alone ("upper" or "lower"), 26 pages either way. A letter with no strokes in
// PRINT is left off its page rather than drawn wrong.
export const CASES = { both: "Capital and lowercase", upper: "Capitals only", lower: "Lowercase only" };
export function letterPairs(cases = "both") {
  return [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((U) =>
    [cases !== "lower" && U, cases !== "upper" && U.toLowerCase()].filter((ch) => ch && PRINT[ch]));
}

// Guide heights on offer, headline to baseline, in inches.
export const GUIDES = { "ages 4-5": 1, "ages 5-7": 0.75, "ages 7-9": 0.6, "older": 0.45 };

// Numbers 0–9, if chosen, get a page each after Z, laid out like a letter
// page with one character on it.
export const DIGITS = [..."0123456789"].filter((d) => PRINT[d]);

// Practice words the buyer adds get a page each after that, laid out like the
// free name sheet (name.js). Numbers and words together are at most 52 pages
// past Z, so the book stays under KDP's 79-page floor for spine text and the
// cover's blank spine stays right: 52 words, or 10 numbers and 42 words.
export const EXTRA_MAX = 52;
export const WORDS_MAX = EXTRA_MAX;
// Pre-writing line pages, if chosen, come before A and count toward the same
// 52: 4 line pages, 10 numbers and 38 words at the most. So does the "This
// book belongs to" page, first of all.
export const wordsMax = (numbers, lines = false, belongs = false) => EXTRA_MAX - (numbers ? DIGITS.length : 0) - (lines ? LINE_PAGES.length : 0) - (belongs ? 1 : 0);
export function cleanWords(words, max = WORDS_MAX) {
  const list = typeof words === "string" ? words.split(/[,\n;]+/) : words ?? [];
  return list.map(cleanName).filter(Boolean).slice(0, max);
}

export function planBook({ trim = "8.5x11", bleed = false, guideIn = 0.75, numbers = false, lines = false, words = [], cases = "both", belongs = false } = {}) {
  const first = belongs ? 1 : 0;
  const singles = [...(lines ? LINE_PAGES : []), ...letterPairs(CASES[cases] ? cases : "both"), ...(numbers ? DIGITS.map((d) => [d]) : [])];
  const extra = cleanWords(words, wordsMax(numbers, lines, belongs));
  const geom = pageGeometry({ trim, bleed, pageCount: first + singles.length + extra.length });
  return {
    geom,
    pages: [
      ...(belongs ? [belongsPage({ geom, pageNumber: 1, guideIn })] : []),
      ...singles.map((letters, i) => letterPage({ geom, pageNumber: first + i + 1, letters, guideIn })),
      ...extra.map((word, i) => ({ ...namePage({ geom, pageNumber: first + singles.length + i + 1, name: word, guideIn }), word })),
    ],
  };
}
