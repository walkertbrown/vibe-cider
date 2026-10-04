// What a book is, before anything is drawn: its pages laid out. Pure, so the
// web preview can plan a book without loading pdf-lib.
import { PRINT } from "../glyphs/print.js";
import { LINE_PAGES, SHAPE_PAGES } from "../glyphs/lines.js";
import { pageGeometry } from "./kdp.js";
import { letterPage, belongsPage, donePage, copyrightPage, titlePage, FOOTER_PT } from "./page.js";
import { namePage, cleanName } from "./name.js";
import { cursivePage } from "./cursive-page.js";
import { pictureFor } from "./pictures.js";
import { printChart, cursiveChart } from "./chart.js";

// Print is drawn as dotted strokes with start dots and arrows; cursive as
// joined letters to trace over (cursive-page.js), which needs `measure`.
export const SCRIPTS = { print: "Print", cursive: "Cursive" };

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
// book belongs to" page, first of all, the copyright page after it, and the
// "Well done!" page, last; and the title page, before them all; and the
// alphabet chart, after the front matter.
export const wordsMax = (numbers, lines = false, belongs = false, shapes = false, done = false, copyright = false, titled = false, chart = false) => EXTRA_MAX - (chart ? 1 : 0) - (titled ? 1 : 0) - (copyright ? 1 : 0) - (numbers ? DIGITS.length : 0) - (lines ? LINE_PAGES.length : 0) - (belongs ? 1 : 0) - (shapes ? SHAPE_PAGES.length : 0) - (done ? 1 : 0);
export function cleanWords(words, max = WORDS_MAX) {
  const list = typeof words === "string" ? words.split(/[,\n;]+/) : words ?? [];
  return list.map(cleanName).filter(Boolean).slice(0, max);
}

export function planBook({ trim = "8.5x11", bleed = false, guideIn = 0.75, numbers = false, lines = false, shapes = false, words = [], cases = "both", belongs = false, done = false, copyright = false, titled = false, folios = false, chart = false, title = "", subtitle = "", author = "", year = new Date().getFullYear(), script = "print", measure, abc = false } = {}) {
  if (script === "cursive" && !measure) throw new Error("cursive needs measure()");
  const cursive = script === "cursive";
  const front = (titled ? 1 : 0) + (belongs ? 1 : 0) + (copyright ? 1 : 0);
  const first = front + (chart ? 1 : 0);
  const singles = [...(lines ? LINE_PAGES : []), ...(shapes ? SHAPE_PAGES : []), ...letterPairs(CASES[cases] ? cases : "both"), ...(numbers ? DIGITS.map((d) => [d]) : [])];
  const extra = cleanWords(words, wordsMax(numbers, lines, belongs, shapes, done, copyright, titled, chart));
  const last = first + singles.length + extra.length;
  const geom = pageGeometry({ trim, bleed, pageCount: last + (done ? 1 : 0) });
  const pages = [
      // Front matter: with a title page, its copyright page is on its back
      // and the name page comes after; without one, the copyright page backs
      // the name page.
      ...(titled
        ? [titlePage({ geom, pageNumber: 1, title, subtitle, author }), ...(copyright ? ["c"] : []), ...(belongs ? ["b"] : [])]
        : [...(belongs ? ["b"] : []), ...(copyright ? ["c"] : [])]
      ).map((p, i) => p === "b" ? belongsPage({ geom, pageNumber: i + 1, guideIn }) : p === "c" ? copyrightPage({ geom, pageNumber: i + 1, author, year }) : p),
      // The alphabet chart, whole, before the practice: in the book's own script.
      ...(chart ? [{ ...(cursive ? cursiveChart({ geom, measure, pageNumber: front + 1 }) : printChart({ geom, pageNumber: front + 1 })), chart: true }] : []),
      ...singles.map((letters, i) => {
        const pageNumber = first + i + 1;
        // Pre-writing lines and shapes are strokes, not letters: print-drawn either way.
        if (!cursive || !PRINT[letters[0]] || !/[A-Za-z0-9]/.test(letters[0])) return letterPage({ geom, pageNumber, letters, guideIn, picture: abc });
        return cursivePage({ geom, pageNumber, model: letters.join("   "), trace: [...letters, ...letters], guideIn, measure });
      }),
      ...extra.map((word, i) => {
        const pageNumber = first + singles.length + i + 1;
        return { ...(cursive ? cursivePage({ geom, pageNumber, model: word, trace: [word], guideIn, measure, word: true, picture: pictureFor(word) }) : namePage({ geom, pageNumber, name: word, guideIn, picture: pictureFor(word) })), word };
      }),
      ...(done ? [donePage({ geom, pageNumber: last + 1, guideIn })] : []),
  ];
  return { geom, pages: folios ? pages.map((p, i) => withFolio(p, i + 1)) : pages };
}

// Page numbers, if chosen: each page's own number in the footer strip, at the
// outside corner (right on odd pages, left on even), 9pt, level with the
// free book's centred footer line and clear of it on every trim
// (test/folio.test.js). The front matter (title, copyright and name pages)
// is counted but not numbered.
export const FOLIO_PT = 9;
function withFolio(page, n) {
  if (page.titlePage || page.copyright || page.belongs) return page;
  const { box } = page, inset = FOLIO_PT * 0.9;
  const x = n % 2 ? box.right - inset : box.left + inset;
  return { ...page, folio: n, text: [...(page.text ?? []), { text: String(n), x, y: box.bottom - FOOTER_PT + 3, size: FOLIO_PT, font: "regular" }] };
}
