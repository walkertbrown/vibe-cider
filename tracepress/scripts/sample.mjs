// The public sample book and cover (linked from the landing page and the
// guide), exactly as the free tier makes them: footer line on every page,
// PREVIEW on the cover. Nothing mocked up.
//
// Two things are added here and only here, never in book.js or cover.js,
// which also render buyers' paid books and must stay unbranded:
//   - Document metadata. Google indexes PDFs and uses the file's Title as the
//     result headline (about 70 characters shown) and its Subject in the
//     snippet. book.js sets Title to the buyer's own title; on a sample that
//     would tell a searcher nothing. (Learned on Puzzle Press, where the
//     samples are the asset strangers open most: app/scripts/sample.mjs.)
//   - Links. A PDF opened from a search result, or detached from the tab on a
//     phone, has no way back to the site. So the free footer line on every
//     page becomes a link, the book ends with a whole-page link, and the
//     cover's back-panel note is a link.
//
// Run: npm run sample (writes public/samples/)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { PDFDocument, PDFName, PDFString, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { renderBook, planBook } from "../src/pdf/book.js";
import { renderCover, coverGeometry } from "../src/pdf/cover.js";
import { BARCODE_IN } from "../src/pdf/cover-geometry.js";
import { pageInk } from "../src/pdf/ink.js";
import { PT } from "../src/pdf/kdp.js";

const SITE = "https://tracepress.bananafest-destiny.com/";
const TRIM = "8.5x11";
const GUIDE_IN = 0.75;
const fonts = {
  bold: readFileSync(new URL("../fonts/LiberationSans-Bold.ttf", import.meta.url)),
  regular: readFileSync(new URL("../fonts/LiberationSans-Regular.ttf", import.meta.url)),
};
const out = new URL("../public/samples/", import.meta.url);
mkdirSync(out, { recursive: true });

export const SAMPLES = {
  book: {
    file: "letter-tracing-workbook-sample-8.5x11.pdf",
    title: "Free A–Z Letter Tracing Workbook PDF (Sample Book) · Trace Press",
    subject: "A 26-page A to Z handwriting workbook, capital and lowercase: stroke-order arrows, numbered start dots, dotted letters to trace on four-line guides. 8.5 x 11, laid out to Amazon KDP's rules. Made free with Trace Press.",
  },
  cover: {
    file: "letter-tracing-cover-sample-8.5x11.pdf",
    title: "Letter Tracing Book Cover for KDP, 8.5x11 (Free Sample) · Trace Press",
    subject: "A full-wrap paperback cover (back, spine, front) sized by KDP's formula for a 26-page 8.5 x 11 letter tracing book. Made free with Trace Press; free covers carry a PREVIEW mark.",
  },
};
const KEYWORDS = ["letter tracing", "handwriting workbook", "alphabet tracing", "KDP", "printable", "PDF", "Trace Press"];

function link(doc, page, rect) {
  const annot = doc.context.obj({ Type: "Annot", Subtype: "Link", Rect: rect, Border: [0, 0, 0], A: { Type: "Action", S: "URI", URI: PDFString.of(SITE) } });
  const ref = doc.context.register(annot);
  const existing = page.node.lookup(PDFName.of("Annots"));
  if (existing) existing.push(ref);
  else page.node.set(PDFName.of("Annots"), doc.context.obj([ref]));
}

function meta(doc, { title, subject }) {
  if (title.length > 70) throw new Error(`title is ${title.length} characters: ${title}`);
  doc.setTitle(title);
  doc.setSubject(subject);
  doc.setKeywords(KEYWORDS);
  doc.setAuthor("Trace Press");
  doc.setCreator(`Trace Press — ${SITE}`);
  doc.setProducer(`Trace Press — ${SITE}`);
}

// The book.
{
  const doc = await PDFDocument.load(await renderBook({ trim: TRIM, guideIn: GUIDE_IN }, fonts));
  doc.registerFontkit(fontkit);
  meta(doc, SAMPLES.book);
  const regular = await doc.embedFont(fonts.regular, { subset: true });
  const bold = await doc.embedFont(fonts.bold, { subset: true });
  const { geom, pages } = planBook({ trim: TRIM, guideIn: GUIDE_IN });
  pages.forEach((layout, i) => {
    const f = pageInk(layout).find((s) => s.kind === "text" && /Trace Press/.test(s.text));
    if (!f) throw new Error(`page ${i + 1}: no footer line to link`);
    const half = regular.widthOfTextAtSize(f.text, f.size) / 2 + 4;
    link(doc, doc.getPage(i), [f.x - half, f.y - 4, f.x + half, f.y + f.size + 2]);
  });
  const w = geom.width, h = geom.height, cx = w / 2;
  const page = doc.addPage([w, h]);
  const line = (t, font, size, y, color) => page.drawText(t, { x: cx - font.widthOfTextAtSize(t, size) / 2, y, size, font, color });
  line("Made with Trace Press", bold, 24, h / 2 + 60, rgb(0.1, 0.1, 0.1));
  line("Make your own A–Z tracing workbook and its cover for Amazon KDP,", regular, 13, h / 2 + 26, rgb(0.35, 0.35, 0.35));
  line("in your browser. Free to try.", regular, 13, h / 2 + 8, rgb(0.35, 0.35, 0.35));
  line("tracepress.bananafest-destiny.com", bold, 16, h / 2 - 22, rgb(0.137, 0.306, 0.227));
  line("Tap anywhere on this page to make your own.", regular, 11, h / 2 - 50, rgb(0.5, 0.5, 0.5));
  link(doc, page, [0, 0, w, h]);
  const bytes = await doc.save();
  writeFileSync(new URL(SAMPLES.book.file, out), bytes);
  console.log(`wrote public/samples/${SAMPLES.book.file}: ${pages.length} book pages + 1, ${bytes.length} bytes`);
}

// The cover, sized for that book. The link sits on the free cover's own
// back-panel note (cover.js drawPreviewMark puts it at the barcode margin).
{
  const pageCount = planBook({ trim: TRIM, guideIn: GUIDE_IN }).pages.length;
  const opts = { title: "My First Letter Tracing Book", subtitle: "Trace A to Z with stroke arrows and numbered start dots", author: "Trace Press", trim: TRIM, pageCount, paper: "white" };
  const doc = await PDFDocument.load(await renderCover(opts, fonts));
  meta(doc, SAMPLES.cover);
  const g = coverGeometry(opts);
  const x = g.backX + BARCODE_IN.margin * PT, y = g.panelY + BARCODE_IN.margin * PT;
  link(doc, doc.getPage(0), [x, y, x + 3 * PT, y + 0.75 * PT]);
  const bytes = await doc.save();
  writeFileSync(new URL(SAMPLES.cover.file, out), bytes);
  console.log(`wrote public/samples/${SAMPLES.cover.file}: ${bytes.length} bytes`);
}
