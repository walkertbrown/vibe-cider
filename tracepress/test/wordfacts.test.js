// A word page's "Which letters the words practise" and "The words by length
// and strokes" are counted from its own word list and the shapes Trace Press
// draws. Every page that carries them is checked here, against the words its
// "Make a … book" button opens, so a changed word or glyph must change the page.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { GLYPHS } from "../src/glyphs/lines.js";
import { LETTER_WORDS } from "../src/pdf/page.js";
import { pictureFor } from "../src/pdf/pictures.js";

const dir = new URL("../public/", import.meta.url);
const pages = readdirSync(dir).filter((f) => f.endsWith(".html"))
  .map((f) => [f, readFileSync(new URL(f, dir), "utf8")])
  .filter(([, html]) => html.includes("Which letters the words practise"));
const NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const list = (a) => (a.length === 1 ? a[0] : a.slice(0, -1).join(", ") + " and " + a.at(-1));
const letters = (w) => [...w.replace(/ /g, "")];
const strokes = (w) => letters(w).reduce((n, c) => n + GLYPHS[c].strokes.length, 0);

test("the holiday and themed word pages carry the word facts", () => {
  for (const h of ["christmas", "halloween", "thanksgiving", "animal", "food", "transportation", "picture-word"])
    assert.ok(pages.some(([f]) => f === `${h}-tracing-worksheets.html`), h);
});

for (const [f, html] of pages) {
  test(`${f}: its word facts match its words and the glyphs`, () => {
    const words = html.match(/\?words=([^"]+)"/)[1].split(",").map(decodeURIComponent);
    const text = html.replace(/\s+/g, " ");

    const rows = [...html.matchAll(/<tr><td>([^<]+)<\/td><td>(\d+)<\/td><td>(\d+)<\/td><\/tr>/g)].map((m) => [m[1], +m[2], +m[3]]);
    assert.deepEqual(rows, words.map((w) => [w, letters(w).length, strokes(w)]), "the table");

    const ks = words.map(strokes);
    assert.ok(text.includes(`run from ${Math.min(...ks)} to ${Math.max(...ks)} strokes, ${ks.reduce((a, b) => a + b, 0)} in all`), "the stroke range");

    const used = new Set(words.flatMap(letters));
    const missing = [..."abcdefghijklmnopqrstuvwxyz"].filter((c) => !used.has(c));
    const add = missing.map((c) => LETTER_WORDS[c.toUpperCase()]);
    assert.ok(text.includes(`the ${words.length === 20 ? "twenty" : words.length} words use ${26 - missing.length} of the 26 lowercase letters. The ${NUM[missing.length]} they leave out are ${list(missing)}.`), "the missing letters");
    assert.ok(text.includes(`add ${list(add)} to the words`), "the words to add");
    for (const [i, w] of add.entries()) {
      assert.ok(w.includes(missing[i]), `${w} brings in ${missing[i]}`);
      assert.ok(pictureFor(w), `${w} has a picture`);
    }
  });
}
