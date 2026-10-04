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
    // Tall letters and tails, read off the glyphs' own heights: above the
    // midline (1) to the headline (2), or below the baseline (0).
    const ys = (g) => g.type === "line" ? [g.y0, g.y1] : g.type === "arc" ? [g.cy - g.ry, g.cy + g.ry] : [];
    const span = (c) => GLYPHS[c].strokes.flat().flatMap(ys);
    const tall = (c) => Math.max(...span(c)) > 1.5, tail = (c) => Math.min(...span(c)) < -0.1;
    assert.deepEqual([..."abcdefghijklmnopqrstuvwxyz"].filter(tall), [..."bdfhklt"]);
    assert.deepEqual([..."abcdefghijklmnopqrstuvwxyz"].filter(tail), [..."gjpqy"]);
    const tagged = (f) => words.filter((w) => letters(w).some(f)).map((w) => `${w} (${list([...new Set(letters(w).filter(f))])})`);
    const flat = words.filter((w) => !letters(w).some((c) => tall(c) || tail(c)));
    const sec = text.match(/<h3>Tall letters and tails<\/h3> <p>(.*?)<\/p>/)[1];
    assert.ok(sec.includes(`reach up to the headline: ${list(tagged(tall))}.`) || sec.includes(`reaches up to the headline: ${list(tagged(tall))}.`), "the tall words");
    assert.ok(tagged(tail).length ? sec.includes(`below the baseline: ${list(tagged(tail))}.`) : sec.includes("None of them drops"), "the tails");
    assert.ok(flat.length ? sec.includes(`all the way: ${list(flat)}.`) : sec.includes("None of these words stays"), "the one-height words");
    for (const [i, w] of add.entries()) {
      assert.ok(w.includes(missing[i]), `${w} brings in ${missing[i]}`);
      assert.ok(pictureFor(w), `${w} has a picture`);
    }
  });
}
