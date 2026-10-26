// A workbook interior as a PDF: one letter page per letter pair, A a to Z z.
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { planBook } from "./plan.js";
import { planPaper } from "./paper.js";
import { planName, nameInk } from "./name.js";
import { planCards, cardsInk } from "./cards.js";
import { planCvc, planCount, sheetInk } from "./sheets.js";
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
// `opts.names` (licensed: a class list) makes one page per name, with no footer.
export async function renderName(opts, fonts) {
  const cursive = opts.script === "cursive" ? fontkit.create(new Uint8Array(fonts.cursive)) : undefined;
  const measure = cursive && ((text, unit) => cursiveWidth(cursive, text, unit));
  const sheets = (opts.names?.length ? opts.names : [opts.name]).map((name) => planName({ ...opts, name, measure }));
  const { name } = sheets[0];
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(sheets.length > 1 ? `Name tracing worksheets: ${sheets.length} names` : `Name tracing worksheet: ${name}`);
  doc.setCreator("Trace Press — tracepress.bananafest-destiny.com");
  const embedded = {
    bold: await doc.embedFont(fonts.bold, { subset: true }),
    regular: await doc.embedFont(fonts.regular, { subset: true }),
  };
  for (const { geom, page } of sheets) drawShapes(doc.addPage([geom.width, geom.height]), nameInk(page, { cursive, licensed: opts.licensed === true }), embedded);
  return doc.save();
}

// Sight word flash cards (cards.js): free with a footer line, clean once
// licensed.
export async function renderCards(opts, fonts) {
  const plan = planCards(opts);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Sight word flash cards${opts.tag ? `: ${opts.tag}` : ""}`);
  doc.setCreator("Trace Press — tracepress.bananafest-destiny.com");
  const embedded = {
    bold: await doc.embedFont(fonts.bold, { subset: true }),
    regular: await doc.embedFont(fonts.regular, { subset: true }),
  };
  for (const page of plan.pages) drawShapes(doc.addPage([plan.geom.width, plan.geom.height]), cardsInk(plan, page, { licensed: opts.licensed === true }), embedded);
  return doc.save();
}

// Kindergarten sheets (sheets.js): `opts.kind` is "cvc" or "count".
export async function renderSheets(opts, fonts) {
  const { geom, pages } = opts.kind === "count" ? planCount(opts) : planCvc(opts);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(opts.kind === "count" ? "Count and trace worksheets, 1 to 10" : "CVC word worksheets with pictures");
  doc.setCreator("Trace Press — tracepress.bananafest-destiny.com");
  const embedded = {
    bold: await doc.embedFont(fonts.bold, { subset: true }),
    regular: await doc.embedFont(fonts.regular, { subset: true }),
  };
  for (const page of pages) drawShapes(doc.addPage([geom.width, geom.height]), sheetInk(page, { licensed: opts.licensed === true }), embedded);
  return doc.save();
}
