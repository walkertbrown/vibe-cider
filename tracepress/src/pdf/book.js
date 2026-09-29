// A workbook interior as a PDF: one letter page per letter pair, A a to Z z.
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { planBook } from "./plan.js";
import { drawLetterPage } from "./draw.js";

export { letterPairs, GUIDES, planBook } from "./plan.js";

// `fonts.bold` and `fonts.regular` are the bytes of embeddable TTFs (KDP needs
// fonts embedded). `opts.licensed` is true only after /api/verify has found a
// payment; anything else is the free, watermarked book.
export async function renderBook(opts, fonts) {
  const { geom, pages } = planBook(opts);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const embedded = {
    bold: await doc.embedFont(fonts.bold, { subset: true }),
    regular: await doc.embedFont(fonts.regular, { subset: true }),
  };
  for (const layout of pages) drawLetterPage(doc.addPage([geom.width, geom.height]), layout, embedded, { licensed: opts.licensed === true });
  return doc.save();
}
