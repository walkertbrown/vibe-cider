// The uppercase and lowercase pages list the letters by strokes and by
// height. Those lists are facts about the shapes Trace Press draws, so they
// are checked against the shapes: change a letter and its page must follow.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GLYPHS } from "../src/glyphs/lines.js";
import { sample } from "../src/glyphs/print.js";

const page = (f) => readFileSync(new URL(`../public/${f}`, import.meta.url), "utf8");
const ys = (ch) => GLYPHS[ch].strokes.flat().flatMap((s) => sample(s, 24)).map((p) => Math.round(p[1] * 100) / 100); // f's hook samples to 1.99999
const listed = (html, label) => {
  const m = html.match(new RegExp(`<strong>${label}[^<]*\\((\\d+)\\)[^<]*</strong>([^<]*)`));
  assert.ok(m, `no "${label}" line`);
  const rest = m[2].includes(":") ? m[2].slice(m[2].lastIndexOf(":") + 1) : m[2]; // "(13), from … baseline: a, c"
  const letters = rest.trim().replace(/\.$/, "").split(/,\s*/).map((s) => s.trim()).filter(Boolean);
  assert.equal(letters.length, +m[1], `${label}: says ${m[1]}, lists ${letters.length}`);
  return letters.join("");
};
const pick = (chars, f) => [...chars].filter(f).join("");
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", LOWER = "abcdefghijklmnopqrstuvwxyz";

test("the uppercase page's stroke counts are the strokes on its pages", () => {
  const html = page("uppercase-letter-tracing.html");
  for (const [label, n] of [["One stroke", 1], ["Two strokes", 2], ["Three strokes", 3], ["Four strokes", 4]])
    assert.equal(listed(html, label), pick(UPPER, (c) => GLYPHS[c].strokes.length === n), label);
  assert.equal(pick(UPPER, (c) => GLYPHS[c].strokes.length > 4), "");
  assert.equal(pick(UPPER, (c) => Math.min(...ys(c)) < 0), "Q", "only Q crosses the baseline");
  assert.equal(pick(UPPER, (c) => Math.max(...ys(c)) < 2 || Math.min(...ys(c)) > 0), "", "every capital is full height");
});

test("the lowercase page's heights and stroke counts are the letters' own", () => {
  const html = page("lowercase-letter-tracing.html");
  const lo = (c) => Math.min(...ys(c)), hi = (c) => Math.max(...ys(c));
  assert.equal(listed(html, "Small letters"), pick(LOWER, (c) => lo(c) >= 0 && hi(c) <= 1));
  assert.equal(listed(html, "Tall letters"), pick(LOWER, (c) => lo(c) >= 0 && hi(c) >= 2));
  assert.equal(listed(html, "Letters that hang below the baseline"), pick(LOWER, (c) => lo(c) < 0));
  assert.equal(pick(LOWER, (c) => lo(c) >= 0 && hi(c) > 1 && hi(c) < 2), "i", "i alone has its dot between the lines");
  const two = pick(LOWER, (c) => GLYPHS[c].strokes.length === 2);
  assert.ok(html.includes(`Seven lowercase letters take two strokes: ${[...two].join(", ")}. The other 19 take one`), `two strokes: ${two}`);
  assert.equal(two.length, 7);
  assert.equal(pick(LOWER, (c) => GLYPHS[c].strokes.length > 2), "");
});

test("the both-cases page's pairs are the pairs on its pages", () => {
  const html = page("letter-tracing.html").replace(/\s+/g, " ");
  const n = (c) => GLYPHS[c].strokes.length;
  const pairs = (k) => [...UPPER].filter((C) => n(C) + n(C.toLowerCase()) === k).map((C) => C + C.toLowerCase()).join("");
  for (const [label, k] of [["Two strokes a page", 2], ["Three strokes a page", 3], ["Four strokes a page", 4], ["Five strokes a page", 5]])
    assert.equal(listed(html, label), pairs(k), label);
  assert.equal(pairs(1) + pairs(6) + pairs(7), "");
  // The same shape at half the height: each segment of the lowercase letter,
  // scaled into the capital's box, lands on the capital's segment.
  const box = (c) => { const p = GLYPHS[c].strokes.flat().flatMap((s) => sample(s, 24)); const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]); return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]; };
  const shape = (c) => { const [x0, x1, y0, y1] = box(c); return GLYPHS[c].strokes.map((st) => st.flatMap((s) => sample(s, 24)).map(([x, y]) => [((x - x0) / (x1 - x0)).toFixed(2), ((y - y0) / (y1 - y0)).toFixed(2)].join()).join(" ")).join("|"); };
  const same = pick(LOWER, (c) => shape(c) === shape(c.toUpperCase()));
  assert.equal(same, "cosvwxz");
  for (const c of same) assert.equal(box(c)[3] * 2, box(c.toUpperCase())[3], `${c} is half as tall`);
  assert.ok(html.includes(`at half the height, drawn with the same strokes in the same order and direction: ${[...same].slice(0, -1).join(", ")} and ${same.at(-1)}. The other ${26 - same.length} change shape`));
  assert.equal(n("u"), 1); assert.ok(GLYPHS.u.strokes[0].length > GLYPHS.U.strokes[0].length, "u has the extra line");
  for (const c of "bdpq") assert.deepEqual([n(c), n(c.toUpperCase())], [1, 2], c);
});
