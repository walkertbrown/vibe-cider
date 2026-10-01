// A workbook interior as a PDF: one letter page per letter pair, A a to Z z.
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { planBook } from "./plan.js";
import { planPaper } from "./paper.js";
import { planName, nameInk } from "./name.js";
import { drawLetterPage, drawShapes } from "./draw.js";
import { cursiveWidth } from "./cursive.js";

export { letterPairs, CASES, GUIDES, planBook } from "./plan.js";

// `fonts.bold` and `fonts.regular` are the bytes of embeddable TTFs (KDP needs
// fonts embedded). `opts.licensed` is true only after /api/verify has found a
// payment; anything else is the free, watermarked book.
// A cursive book also needs `fonts.cursive`, the bytes of the cursive font.
export async function renderBook(opts, fonts) {
  const cursive = opts.script === "cursive" ? fontkit.create(new Uint8Array(fonts.cursive)) : undefined;
  const { geom, pages } = planBook({ ...opts, measure: cursive && ((text, unit) => cursiveWidth(cursive, text, unit)) });
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const embedded = {
    bold: await doc.embedFont(fonts.bold, { subset: true }),
    regular: await doc.embedFont(fonts.regular, { subset: true }),
  };
  for (const layout of pages) drawLetterPage(doc.addPage([geom.width, geom.height]), layout, embedded, { licensed: opts.licensed === true, cursive });
  return doc.save();
}

// Blank handwriting paper (paper.js): free, with no footer line.
// There's no text on it, so no font.
export async function renderPaper(opts) {
  const { geom, pages } = planPaper(opts);
  const doc = await PDFDocument.create();
  doc.setTitle("Handwriting practice paper");
  for (const layout of pages) drawLetterPage(doc.addPage([geom.width, geom.height]), layout, {}, { licensed: true });
  return doc.save();
}

// A name tracing sheet (name.js): one page, free, with its one footer line.
// A cursive sheet (`opts.script === "cursive"`) also needs `fonts.cursive`.
export async function renderName(opts, fonts) {
  const cursive = opts.script === "cursive" ? fontkit.create(new Uint8Array(fonts.cursive)) : undefined;
  const { geom, name, page } = planName({ ...opts, measure: cursive && ((text, unit) => cursiveWidth(cursive, text, unit)) });
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Name tracing worksheet: ${name}`);
  doc.setCreator("Trace Press — tracepress.bananafest-destiny.com");
  const embedded = {
    bold: await doc.embedFont(fonts.bold, { subset: true }),
    regular: await doc.embedFont(fonts.regular, { subset: true }),
  };
  drawShapes(doc.addPage([geom.width, geom.height]), nameInk(page, { cursive }), embedded);
  return doc.save();
}
