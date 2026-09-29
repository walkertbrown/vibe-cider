// A workbook interior: one letter page per letter pair, A a to Z z.
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { PRINT } from "../glyphs/print.js";
import { pageGeometry } from "./kdp.js";
import { letterPage, drawLetterPage } from "./page.js";

// The letter pairs, in order. A lowercase letter with no strokes yet (f) is
// left off its page rather than drawn wrong.
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

// `fonts.bold` is the bytes of an embeddable TTF (KDP needs fonts embedded).
export async function renderBook(opts, fonts) {
  const { geom, pages } = planBook(opts);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const bold = await doc.embedFont(fonts.bold, { subset: true });
  for (const layout of pages) drawLetterPage(doc.addPage([geom.width, geom.height]), layout, bold);
  return doc.save();
}
