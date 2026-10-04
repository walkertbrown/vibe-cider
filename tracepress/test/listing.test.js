// The listing description says what is in the book and nothing it lacks:
// each optional part appears only when it is on, the page count is
// planBook's, the words are the ones that made it into the book, and the
// largest book fits KDP's 4,000 characters.
import { test } from "node:test";
import assert from "node:assert/strict";
import { listingText, LISTING_MAX } from "../src/pdf/listing.js";
import { planBook, wordsMax } from "../src/pdf/plan.js";

const ALL = { trim: "8.5x11", guideIn: 0.75, numbers: true, lines: true, shapes: true, belongs: true, done: true, abc: true, folios: true, title: "Zoo Letters", subtitle: "Trace A to Z" };

test("a plain book says only the alphabet", () => {
  const t = listingText({ trim: "6x9", guideIn: 1 });
  assert.match(t, /^A print handwriting workbook: 26 pages, 6" × 9", 1" writing lines\.$/m);
  for (const no of ["belongs", "Pre-writing", "shapes", "Numbers", "to trace, a page each:", "Well done", "picture", "numbered."]) assert.ok(!t.includes(no), no);
});

test("every part that is on is named, in book order, with the plan's page count", () => {
  const o = { ...ALL, words: "cat, the, zebra" };
  const t = listingText(o);
  assert.ok(t.startsWith("Zoo Letters: Trace A to Z\n"));
  assert.ok(t.includes(`${planBook(o).pages.length} pages`));
  const at = ["This book belongs to", "Pre-writing", "Six shapes", "The alphabet", "Numbers 0 to 9", "3 words to trace", "Well done", "Pages are numbered."].map((s) => t.indexOf(s));
  assert.ok(at.every((i, k) => i >= 0 && (k === 0 || i > at[k - 1])), at.join());
  assert.ok(t.includes("A is for apple to Z is for zeppelin"));
  assert.ok(t.includes("cat, the and zebra. 1 of them has a picture"));
});

test("cursive claims no start dots on letters and no letter pictures", () => {
  const t = listingText({ ...ALL, script: "cursive", measure: (s, u) => s.length * u });
  assert.match(t, /^A cursive handwriting workbook/m);
  assert.ok(!/alphabet[^\n]*start dots/.test(t) && !t.includes("A is for") && !t.includes("stars"));
});

test("only the words that fit are listed, and the largest book fits KDP's box", () => {
  const many = Array.from({ length: 80 }, (_, i) => "wordnumber" + String.fromCharCode(97 + (i % 26)) + String.fromCharCode(97 + Math.floor(i / 26))).join(",");
  const t = listingText({ ...ALL, words: many });
  const max = wordsMax(true, true, true, true, true, false, false);
  assert.ok(t.includes(`${max} words to trace`));
  assert.ok(t.length < LISTING_MAX, `${t.length} chars`);
});

// Keywords: seven, from the contents, none already in the title, none of the
// things KDP asks you to leave out (G201298500).
import { keywordsFor, KEYWORDS } from "../src/pdf/listing.js";
test("keywords: seven content phrases, none in the title, nothing KDP asks you to avoid", () => {
  const books = [{}, { script: "cursive" }, { numbers: true, lines: true, shapes: true, chart: true, abc: true, words: "cat dog" }, { script: "cursive", numbers: true, chart: true, words: "cat", cases: "lower" }, { title: "Letter Tracing Book", subtitle: "Handwriting Practice Workbook" }, { script: "cursive", title: "Cursive Handwriting Workbook", subtitle: "Learn to write in cursive" }];
  for (const o of books) {
    const k = keywordsFor(o), at = JSON.stringify(o);
    assert.equal(k.length, KEYWORDS, at);
    assert.equal(new Set(k).size, k.length, `${at}: repeats`);
    for (const p of k) {
      assert.ok(p.length <= 50, `${at}: "${p}" is long`);
      assert.doesNotMatch(p, /["“”]|\b(best|new|free|sale|kindle|kdp|amazon)\b/i, `${at}: "${p}"`);
      if (o.title) assert.ok(!`${o.title} ${o.subtitle}`.toLowerCase().includes(p.toLowerCase()), `${at}: "${p}" is in the title`);
    }
  }
  assert.ok(!keywordsFor({}).some((p) => /number|shape|word|chart|coloring/.test(p)), "only what's in the book");
  assert.ok(keywordsFor({ numbers: true }).includes("number tracing 0 to 9"));
  assert.ok(keywordsFor({ script: "cursive" }).every((p) => /cursive|joined/.test(p)), "a cursive book's keywords say cursive");
  assert.ok(!keywordsFor({ title: "My Letter Tracing Book" }).includes("letter tracing book"));
});
