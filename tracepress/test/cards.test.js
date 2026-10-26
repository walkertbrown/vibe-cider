// Sight word flash cards (cards.js) and the name tool's class list (name.js).
// A card the cut lines don't make exactly 3" × 5" isn't an index card, and
// a free sheet with no footer line is the paid product given away.
import { test } from "node:test";
import assert from "node:assert/strict";
import { planCards, cardsInk, cleanWords, LISTS, SHEETS, CARDS_FOOTER, WORDS_MAX } from "../src/pdf/cards.js";
import { planName, nameInk, cleanClass, NAME_FOOTER, CLASS_MAX } from "../src/pdf/name.js";
import { PT } from "../src/pdf/kdp.js";

const cuts = (shapes) => shapes.filter((s) => s.kind === "line" && s.dash?.[0] === 6);
const diffs = (xs) => xs.slice(1).map((x, i) => +(x - xs[i]).toFixed(3));

test("the cut lines make cards of exactly the size named, inside the page", () => {
  for (const [key, s] of Object.entries(SHEETS)) {
    const plan = planCards({ sheet: key });
    const lines = cuts(cardsInk(plan, plan.pages[0]));
    if (s.cols * s.rows === 1) { assert.equal(lines.length, 0, key); assert.deepEqual([plan.geom.width, plan.geom.height], s.card); continue; }
    const xs = [...new Set(lines.filter((l) => l.x1 === l.x2).map((l) => l.x1))].sort((a, b) => a - b);
    const ys = [...new Set(lines.filter((l) => l.y1 === l.y2).map((l) => l.y1))].sort((a, b) => a - b);
    assert.deepEqual(diffs(xs), Array(s.cols).fill(+s.card[0].toFixed(3)), key);
    assert.deepEqual(diffs(ys), Array(s.rows).fill(+s.card[1].toFixed(3)), key);
    assert.ok(xs[0] >= 0.25 * PT && ys[0] >= 0.25 * PT, `${key}: a home printer's margin`);
  }
  assert.deepEqual(SHEETS["letter-3x5"].card, [360, 216]);
});

test("every word's ink stays inside its card", () => {
  for (const sheet of Object.keys(SHEETS)) for (const trace of [false, true]) {
    const plan = planCards({ sheet, trace, words: [...LISTS["pre-primer"].words, ...LISTS.primer.words] });
    for (const page of plan.pages) {
      const ink = cardsInk(plan, page, { licensed: true }).filter((s) => s.kind === "dot");
      for (const card of page.cards) {
        const mine = ink.filter((d) => d.x >= card.x && d.x <= card.x + card.w && d.y >= card.y && d.y <= card.y + card.h);
        assert.ok(mine.length > 0, `${sheet} ${card.word}`);
      }
      for (const d of ink) assert.ok(page.cards.some((c) => d.x - d.r >= c.x && d.x + d.r <= c.x + c.w && d.y - d.r >= c.y && d.y + d.r <= c.y + c.h), `${sheet} dot off its card`);
    }
  }
});

test("free sheets carry the footer line; licensed ones don't", () => {
  for (const sheet of Object.keys(SHEETS)) {
    const plan = planCards({ sheet });
    const text = (licensed) => cardsInk(plan, plan.pages[0], { licensed }).filter((s) => s.kind === "text" && s.text === CARDS_FOOTER).length;
    assert.equal(text(false), 1, sheet);
    assert.equal(text(true), 0, sheet);
  }
});

test("the lists are Dolch's, the size the page says", () => {
  assert.equal(LISTS["pre-primer"].words.length, 40);
  assert.equal(LISTS.primer.words.length, 52);
  assert.equal(planCards({ sheet: "letter-3x5" }).pages.length, 10);
  assert.equal(planCards({ sheet: "letter-3x5", words: LISTS.primer.words }).pages.length, 13);
});

test("typed words keep only drawable letters, up to the limits", () => {
  assert.deepEqual(cleanWords("mom, dad\ncat;  the 123 ?!"), ["mom", "dad", "cat", "the"]);
  assert.equal(cleanWords("abcdefghijklmnopqrstuvwxyz")[0].length, 12);
  assert.equal(cleanWords(Array(500).fill("a").join(" ")).length, WORDS_MAX);
});

test("a class list is one clean name a line, repeats once", () => {
  assert.deepEqual(cleanClass("Maya\n noah \n\nSofía, Mary-Kate\nMaya\n?!"), ["Maya", "noah", "Sofía", "Mary-Kate"]);
  assert.equal(cleanClass(Array.from({ length: 80 }, (_, i) => "Ab" + "abcdefghijklmnopqrstuvwxyz"[i % 26].repeat(1 + Math.floor(i / 26))).join("\n")).length, CLASS_MAX);
});

test("a licensed name sheet has no footer; a free one has it", () => {
  const { page } = planName({ name: "Maya" });
  assert.equal(nameInk(page).filter((s) => s.text === NAME_FOOTER).length, 1);
  assert.equal(nameInk(page, { licensed: true }).filter((s) => s.text === NAME_FOOTER).length, 0);
});
