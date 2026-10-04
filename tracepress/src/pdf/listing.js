// A description for the book's Amazon listing, written from the book itself:
// what planBook laid out, in the order it comes. Plain text, so it pastes
// into KDP's Description box as it is; KDP allows 4,000 characters there
// (help topic G201189630). Nothing here is a claim about the child or the
// reader, only what is on the pages (test/listing.test.js).
import { planBook, cleanWords, wordsMax } from "./plan.js";
import { LETTER_WORDS } from "./page.js";
import { TRIMS } from "./kdp.js";
import { pictureFor } from "./pictures.js";

export const LISTING_MAX = 4000;
const list = (a) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a.at(-1));

export function listingText(o) {
  const { pages } = planBook(o);
  const cursive = o.script === "cursive";
  const words = cleanWords(o.words ?? "", wordsMax(o.numbers, o.lines, o.belongs, o.shapes, o.done, o.copyright, o.titled));
  const pictured = words.filter((w) => pictureFor(w));
  const cases = { both: "capital and lowercase", upper: "capital", lower: "lowercase" }[o.cases ?? "both"];
  const how = cursive
    ? "in cursive, the letters joined, to trace over and then write"
    : "with numbered start dots and arrows showing the order of the strokes, then dotted rows to trace and lines to write each letter alone";

  const inside = [];
  if (o.belongs) inside.push(`A "This book belongs to" page with a line for the child's name.`);
  if (o.lines) inside.push("Pre-writing lines to trace first: straight lines, slants, zigzags, waves, circles and crosses (4 pages).");
  if (o.shapes) inside.push("Six shapes to trace: square, triangle, rectangle, diamond, star and heart, each with a start dot and arrows.");
  inside.push(`The alphabet, A to Z, ${cases} letters, a page each, ${how}.${o.abc && !cursive ? ` Each letter page has a picture to colour, A is for ${LETTER_WORDS.A} to Z is for ${LETTER_WORDS.Z}.` : ""}`);
  if (o.numbers) inside.push(`Numbers 0 to 9, a page each${cursive ? "" : ", with start dots and arrows like the letters"}.${o.abc && !cursive ? " Pages 1 to 9 have that many stars to count." : ""}`);
  if (words.length) inside.push(`${words.length} word${words.length === 1 ? "" : "s"} to trace, a page each: ${list(words)}.${pictured.length === words.length ? " Each word has a picture to colour." : pictured.length ? ` ${pictured.length} of them ${pictured.length === 1 ? "has" : "have"} a picture to colour.` : ""}`);
  if (o.done) inside.push(`A "Well done!" page at the end, with a line for the child's name.`);

  const lines = [
    o.title ? (o.subtitle ? `${o.title}: ${o.subtitle}` : o.title) : "",
    `A ${cursive ? "cursive" : "print"} handwriting workbook: ${pages.length} pages, ${TRIMS[o.trim ?? "8.5x11"].label}${o.guideIn ? `, ${o.guideIn}" writing lines` : ""}.`,
    "Inside:",
    ...inside.map((s) => `- ${s}`),
    o.folios ? "Pages are numbered." : "",
  ];
  return lines.filter(Boolean).join("\n").slice(0, LISTING_MAX);
}
