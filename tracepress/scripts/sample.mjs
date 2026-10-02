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
import { renderBook, planBook, renderName } from "../src/pdf/book.js";
import { renderCover, coverGeometry } from "../src/pdf/cover.js";
import { BARCODE_IN } from "../src/pdf/cover-geometry.js";
import { pageInk } from "../src/pdf/ink.js";
import { PT, TRIMS } from "../src/pdf/kdp.js";
import { drawLetterPage } from "../src/pdf/draw.js";
import { cursiveWidth } from "../src/pdf/cursive.js";
import { cursiveChart } from "../src/pdf/chart.js";

const SITE = "https://tracepress.bananafest-destiny.com/";
const TRIM = "8.5x11";
const GUIDE_IN = 0.75;
const fonts = {
  bold: readFileSync(new URL("../fonts/LiberationSans-Bold.ttf", import.meta.url)),
  regular: readFileSync(new URL("../fonts/LiberationSans-Regular.ttf", import.meta.url)),
  cursive: readFileSync(new URL("../public/fonts/PlaywriteUSTrad.ttf", import.meta.url)),
};
const cursiveFont = fontkit.create(fonts.cursive);
const measure = (text, unit) => cursiveWidth(cursiveFont, text, unit);
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
  sightWords: {
    file: "sight-word-tracing-workbook-sample-8.5x11.pdf",
    title: "Free Sight Word Tracing Workbook PDF, Dolch Pre-Primer · Trace Press",
    subject: "A 66-page handwriting workbook: A to Z, then one page for each of the 40 Dolch pre-primer sight words, with stroke-order arrows, numbered start dots and dotted words to trace on four-line guides. 8.5 x 11, laid out to Amazon KDP's rules. Made free with Trace Press.",
  },
  numbers: {
    file: "number-tracing-worksheets-0-9.pdf",
    title: "Free Number Tracing Worksheets 0–9, Printable PDF · Trace Press",
    subject: "Ten printable number tracing pages, 0 to 9: each digit large with a numbered start dot and stroke-order arrows, then rows of dotted digits to trace on four-line guides with 1-inch lines for ages 4 to 5. 8.5 x 11. Made free with Trace Press.",
  },
  lines: {
    file: "tracing-lines-worksheets.pdf",
    title: "Free Tracing Lines Worksheets, Pre-Writing Printable PDF · Trace Press",
    subject: "Four printable pre-writing pages: down and across lines, slants, zigzags and waves, circles and crosses, each with numbered start dots and direction arrows, then rows to trace on four-line guides with 1-inch lines for ages 4 to 5. 8.5 x 11. Made free with Trace Press.",
  },
  upper: {
    file: "uppercase-letter-tracing-worksheets.pdf",
    title: "Free Uppercase Letter Tracing Worksheets A–Z, PDF · Trace Press",
    subject: "26 printable capital letter tracing pages, A to Z: each letter large with numbered start dots and stroke-order arrows, then rows of dotted capitals to trace on four-line guides with 1-inch lines for ages 4 to 5. 8.5 x 11. Made free with Trace Press.",
  },
  lower: {
    file: "lowercase-letter-tracing-worksheets.pdf",
    title: "Free Lowercase Letter Tracing Worksheets a–z, PDF · Trace Press",
    subject: "26 printable lowercase letter tracing pages, a to z: each letter large with numbered start dots and stroke-order arrows, then rows of dotted letters to trace on four-line guides with 1-inch lines for ages 4 to 5. 8.5 x 11. Made free with Trace Press.",
  },
  cursiveAdult: {
    file: "cursive-practice-sheets-for-adults.pdf",
    title: "Free Cursive Practice Sheets for Adults, A–Z (PDF) · Trace Press",
    subject: "26 printable cursive handwriting practice pages for adults and older students: each capital and lowercase letter in solid cursive, then rows in grey to trace, on 0.45-inch four-line guides. 8.5 x 11. Made free with Trace Press.",
  },
  printAdult: {
    file: "handwriting-practice-sheets-for-adults.pdf",
    title: "Free Handwriting Practice Sheets for Adults, A–Z, 0–9 (PDF)",
    subject: "36 printable handwriting practice pages for adults and older students: each letter A to Z, capital and lowercase, and each number 0 to 9, to trace on 0.45-inch four-line guides. 8.5 x 11. Made free with Trace Press.",
  },
  preschool: {
    file: "preschool-tracing-worksheets.pdf",
    title: "Free Preschool Tracing Worksheets: Lines, A–Z, 0–9 (PDF)",
    subject: "40 printable preschool tracing worksheets on big 1-inch lines: 4 pages of pre-writing lines, the capital letters A to Z, and the numbers 0 to 9, each with a start dot and arrows. 8.5 x 11. Made free with Trace Press.",
  },
  halloween: {
    file: "halloween-tracing-worksheets.pdf",
    title: "Free Halloween Tracing Worksheets: 20 Words to Trace (PDF)",
    subject: "20 printable Halloween word tracing worksheets: bat, moon, witch, pumpkin, skeleton and more, each with numbered start dots, stroke-order arrows and dotted rows to trace on four-line guides. 8.5 x 11. Made free with Trace Press.",
  },
  christmas: {
    file: "christmas-tracing-worksheets.pdf",
    title: "Free Christmas Tracing Worksheets: 20 Words to Trace (PDF)",
    subject: "20 printable Christmas word tracing worksheets: tree, star, snowman, reindeer and more, each with numbered start dots, stroke-order arrows and dotted rows to trace on four-line guides. 8.5 x 11. Made free with Trace Press.",
  },
  cursiveBook: {
    file: "cursive-handwriting-workbook-sample-8.5x11.pdf",
    title: "Free Cursive Handwriting Workbook PDF, A–Z, 0–9, Words · Trace Press",
    subject: "A 76-page cursive handwriting workbook: A to Z, 0 to 9 and the 40 Dolch pre-primer sight words in joined cursive, solid once, then grey rows to trace on four-line guides. 8.5 x 11, laid out to Amazon KDP's rules. Made free with Trace Press.",
  },
  cursive: {
    file: "cursive-letter-tracing-worksheets.pdf",
    title: "Free Cursive Letter Tracing Worksheets A–Z, PDF · Trace Press",
    subject: "26 printable cursive alphabet tracing pages, A to Z: the capital and lowercase letter in solid cursive, rows of grey cursive letters to trace on four-line handwriting guides, then rows to write alone. 8.5 x 11. Made free with Trace Press.",
  },
};

// "This book belongs to" pages, one PDF per KDP trim, for /this-book-belongs-to-page.
// Free and unmarked, like the handwriting paper: a seller drops the page into
// their own interior, so a footer would make it useless. The brand is in the
// file's metadata only.
export const BELONGS_FILE = (trim) => `this-book-belongs-to-page-${trim}.pdf`;
const belongsSample = (trim) => ({
  file: BELONGS_FILE(trim),
  title: `Free This Book Belongs To Page, ${trim} PDF for KDP · Trace Press`,
  subject: `A printable "This book belongs to" page for a children's book, with a large handwriting line for the child's name. ${trim} inches, inside Amazon KDP's margins, no bleed, no marks. Made free with Trace Press.`,
});

// The pre-primer list, read from the button on /sight-word-tracing-workbook
// rather than typed out a second time, so the sample and the page that links
// it cannot disagree.
const sightPage = readFileSync(new URL("../public/sight-word-tracing-workbook.html", import.meta.url), "utf8");
export const PRE_PRIMER = decodeURIComponent(sightPage.match(/href="\/\?words=([^"]+)">Open Trace Press with the 40 pre-primer words/)[1]).split(",");
if (PRE_PRIMER.length !== 40) throw new Error(`pre-primer list has ${PRE_PRIMER.length} words, expected 40`);
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

// A book, with a link on every footer and a closing page that is one link.
// `from` keeps only the pages from that index on (the number worksheets are
// the digit pages of a book with numbers on, without A–Z in front), and `to`
// stops before that index (the line worksheets are the four pages before A).
async function book(sample, { words = [], numbers = false, lines = false, cases = "both", guideIn = GUIDE_IN, from = 0, to, script = "print" } = {}) {
  const opts = { trim: TRIM, guideIn, words, numbers, lines, cases, script, measure };
  let doc = await PDFDocument.load(await renderBook(opts, fonts));
  if (from || to) {
    const whole = doc;
    doc = await PDFDocument.create();
    for (const p of await doc.copyPages(whole, whole.getPageIndices().slice(from, to))) doc.addPage(p);
  }
  doc.registerFontkit(fontkit);
  meta(doc, sample);
  const regular = await doc.embedFont(fonts.regular, { subset: true });
  const bold = await doc.embedFont(fonts.bold, { subset: true });
  const { geom } = planBook(opts);
  const pages = planBook(opts).pages.slice(from, to);
  pages.forEach((layout, i) => {
    const f = pageInk(layout, { cursive: cursiveFont }).find((s) => s.kind === "text" && /Trace Press/.test(s.text));
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
  writeFileSync(new URL(sample.file, out), bytes);
  console.log(`wrote public/samples/${sample.file}: ${pages.length} book pages + 1, ${bytes.length} bytes`);
}
await book(SAMPLES.book);
await book(SAMPLES.sightWords, { words: PRE_PRIMER });
await book(SAMPLES.numbers, { numbers: true, guideIn: 1, from: 26 });
await book(SAMPLES.lines, { lines: true, guideIn: 1, to: 4 });
await book(SAMPLES.upper, { cases: "upper", guideIn: 1 });
await book(SAMPLES.lower, { cases: "lower", guideIn: 1 });
await book(SAMPLES.cursive, { script: "cursive", guideIn: 1 });
await book(SAMPLES.cursiveAdult, { script: "cursive", guideIn: 0.45 });
await book(SAMPLES.printAdult, { guideIn: 0.45, numbers: true });
await book(SAMPLES.preschool, { guideIn: 1, lines: true, cases: "upper", numbers: true });
// Holiday words are read from the button on each holiday page, like PRE_PRIMER.
const holidayWords = (slug, label) => {
  const page = readFileSync(new URL(`../public/${slug}-tracing-worksheets.html`, import.meta.url), "utf8");
  const words = decodeURIComponent(page.match(new RegExp(`href="/\\?words=([^"]+)">Make a ${label} tracing book`))[1]).split(",");
  if (words.length !== 20) throw new Error(`${slug} list has ${words.length} words, expected 20`);
  return words;
};
await book(SAMPLES.halloween, { words: holidayWords("halloween", "Halloween"), from: 26 });
await book(SAMPLES.christmas, { words: holidayWords("christmas", "Christmas"), from: 26 });
await book(SAMPLES.cursiveBook, { script: "cursive", numbers: true, words: PRE_PRIMER });

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

for (const trim of Object.keys(TRIMS)) {
  const sample = belongsSample(trim);
  const { geom, pages } = planBook({ trim, guideIn: 1, belongs: true });
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  meta(doc, sample);
  const embedded = { bold: await doc.embedFont(fonts.bold, { subset: true }), regular: await doc.embedFont(fonts.regular, { subset: true }) };
  drawLetterPage(doc.addPage([geom.width, geom.height]), pages[0], embedded, { licensed: true });
  const bytes = await doc.save();
  writeFileSync(new URL(sample.file, out), bytes);
  console.log(`wrote public/samples/${sample.file}: ${bytes.length} bytes`);
}

// An example name sheet, for the picture on /name-tracing (previews.mjs).
// Exactly what the page makes for "Maya" at its default settings.
{
  const sample = {
    file: "name-tracing-worksheet-maya.pdf",
    title: "Free Name Tracing Worksheet, Example for Maya (PDF) · Trace Press",
    subject: "A one-page name tracing worksheet: the name large with numbered start dots and stroke-order arrows, rows of the name in dotted letters to trace, then blank four-line guides. 8.5 x 11. Make one for any name, free, with Trace Press.",
  };
  const doc = await PDFDocument.load(await renderName({ name: "Maya", trim: TRIM, guideIn: GUIDE_IN }, fonts));
  meta(doc, sample);
  const bytes = await doc.save();
  writeFileSync(new URL(sample.file, out), bytes);
  console.log(`wrote public/samples/${sample.file}: ${bytes.length} bytes`);
}

// The same in cursive, for /cursive-name-tracing.
{
  const sample = {
    file: "cursive-name-tracing-worksheet-maya.pdf",
    title: "Free Cursive Name Tracing Worksheet, Example for Maya (PDF)",
    subject: "A one-page cursive name tracing worksheet: the name in solid joined cursive, rows of it in light grey to trace over on four-line handwriting guides, then blank lines. 8.5 x 11. Make one for any name, free, with Trace Press.",
  };
  const doc = await PDFDocument.load(await renderName({ name: "Maya", trim: TRIM, guideIn: GUIDE_IN, script: "cursive" }, fonts));
  meta(doc, sample);
  const bytes = await doc.save();
  writeFileSync(new URL(sample.file, out), bytes);
  console.log(`wrote public/samples/${sample.file}: ${bytes.length} bytes`);
}

// The same for /tracing-worksheet-generator, at its default words.
{
  const sample = {
    file: "tracing-worksheet-cat-sun-dog.pdf",
    title: "Free Tracing Worksheet with Lines and Arrows, cat sun dog (PDF)",
    subject: "A one-page word tracing worksheet: the words large with numbered start dots and stroke-order arrows, rows of dotted letters to trace on four-line handwriting guides, then blank lines. 8.5 x 11. Make one for any words, free, with Trace Press.",
  };
  const doc = await PDFDocument.load(await renderName({ name: "cat sun dog", trim: TRIM, guideIn: GUIDE_IN }, fonts));
  meta(doc, sample);
  const bytes = await doc.save();
  writeFileSync(new URL(sample.file, out), bytes);
  console.log(`wrote public/samples/${sample.file}: ${bytes.length} bytes`);
}

// The cursive alphabet chart, for /cursive-alphabet-chart: one page, A–Z and
// 0–9, with the free footer line as a link.
{
  const sample = {
    file: "cursive-alphabet-chart.pdf",
    title: "Free Printable Cursive Alphabet Chart, A–Z and 0–9 (PDF)",
    subject: "A one-page cursive alphabet chart: every capital and lowercase letter, A to Z, and the numbers 0 to 9 in traditional American cursive on four-line handwriting guides. 8.5 x 11. Free from Trace Press.",
  };
  const { geom } = planBook({ trim: TRIM, guideIn: GUIDE_IN });
  const layout = cursiveChart({ geom, measure });
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  meta(doc, sample);
  const embedded = { bold: await doc.embedFont(fonts.bold, { subset: true }), regular: await doc.embedFont(fonts.regular, { subset: true }) };
  const page = doc.addPage([geom.width, geom.height]);
  drawLetterPage(page, layout, embedded, { cursive: cursiveFont });
  const f = pageInk(layout, { cursive: cursiveFont }).find((s) => s.kind === "text" && /Trace Press/.test(s.text));
  const half = embedded.regular.widthOfTextAtSize(f.text, f.size) / 2 + 4;
  link(doc, page, [f.x - half, f.y - 4, f.x + half, f.y + f.size + 2]);
  const bytes = await doc.save();
  writeFileSync(new URL(sample.file, out), bytes);
  console.log(`wrote public/samples/${sample.file}: ${bytes.length} bytes`);
}
