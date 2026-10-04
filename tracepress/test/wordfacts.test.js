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
    const words = html.match(/class="cta" href="\/\?words=([^"]+)"/)[1].split(",").map(decodeURIComponent);
    const text = html.replace(/\s+/g, " ");

    const rows = [...html.matchAll(/<tr><td>([^<]+)<\/td><td>(\d+)<\/td><td>(\d+)<\/td><\/tr>/g)].map((m) => [m[1], +m[2], +m[3]]);
    assert.deepEqual(rows, words.map((w) => [w, letters(w).length, strokes(w)]), "the table");

    const ks = words.map(strokes);
    assert.ok(text.includes(`run from ${Math.min(...ks)} to ${Math.max(...ks)} strokes, ${ks.reduce((a, b) => a + b, 0)} in all`), "the stroke range");

    // In stroke order, ties keeping the button's order, with the word that
    // moves furthest down and why, and a link that opens the book that way.
    const ORD = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth"];
    const by = [...words].sort((a, b) => strokes(a) - strokes(b) || words.indexOf(a) - words.indexOf(b));
    assert.ok(text.includes(`fewest first, the words go ${list(by)}.`), "the stroke order");
    assert.ok(html.includes(`<a href="/?words=${by.join(",")}">open Trace Press with the words by strokes</a>`), "the stroke-order link");
    const moved = words.map((w, i) => [w, i, by.indexOf(w), by.indexOf(w) - i]);
    const top = Math.max(...moved.map((m) => m[3]));
    const tops = moved.filter((m) => m[3] === top);
    const said = text.match(/biggest changes? is (\w+): it has (\w+) letters but takes (\d+) strokes, as ([a-z, ]+?) takes? two(?: each)?, so it moves from (\w+) to (\w+)\./);
    assert.ok(said, "the biggest change");
    const m = tops.find((t) => t[0] === said[1]);
    assert.ok(m, `${said[1]} moves ${top}`);
    assert.ok(text.includes(tops.length > 1 ? "One of the biggest changes is" : "The biggest change is"), "tie wording");
    assert.deepEqual([NUM.indexOf(said[2]), +said[3], said[5], said[6]], [letters(m[0]).length, strokes(m[0]), ORD[m[1]], ORD[m[2]]]);
    assert.equal(said[4], list([...new Set(letters(m[0]).filter((c) => GLYPHS[c].strokes.length > 1))]));

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
