// "How a name fills the sheet" on the print and cursive name pages is counted
// from planName, the layout the PDF is drawn from: rows to trace and to write,
// copies of Maya and Christopher across a row, and the big name's size. A
// change to the layout must change the pages.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import fontkit from "@pdf-lib/fontkit";
import { planName } from "../src/pdf/name.js";
import { cursiveWidth } from "../src/pdf/cursive.js";
import { GUIDES } from "../src/pdf/plan.js";

const font = fontkit.create(readFileSync(new URL("../public/fonts/PlaywriteUSTrad.ttf", import.meta.url)));
const measure = (t, u) => cursiveWidth(font, t, u);
const page = (f) => readFileSync(new URL(`../public/${f}.html`, import.meta.url), "utf8");
const copies = (r, name) => (r.runs ? r.runs[0].text.split(/ {2,}/).length : r.letters.length / name.length);
const sheet = (name, g, script) => {
  const rows = planName({ name, guideIn: g, script, measure }).page.rows;
  return { model: rows.find((r) => r.kind === "model"), trace: rows.filter((r) => r.kind === "trace"), free: rows.filter((r) => r.kind === "free") };
};
const top = (g, script) => Math.round((100 * sheet("Christopher", g, script).model.unit) / sheet("Maya", g, script).model.unit);
const rows = (html) => [...html.matchAll(/<tr><td>([\d.]+)" \([^)]+\)<\/td><td>(\d+)<\/td><td>(\d+)<\/td><td>(\d+)<\/td><td>(\d+)<\/td><td>(\d+)%<\/td><\/tr>/g)].map((m) => m.slice(1).map(Number));
const expected = (script) => Object.values(GUIDES).map((g) => {
  const m = sheet("Maya", g, script), c = sheet("Christopher", g, script);
  return [g, m.trace.length, m.free.length, copies(m.trace[0], "Maya"), copies(c.trace[0], "Christopher"), top(g, script)];
});

test("print name page: the table and its sentences match the layout", () => {
  const html = page("name-tracing"), text = html.replace(/\s+/g, " ");
  assert.deepEqual(rows(html), expected("print"));
  const c1 = sheet("Christopher", 1, "print");
  assert.equal(copies(c1.trace[0], "Christopher"), 1);
  assert.ok(text.includes(`tracing rows use ${(c1.trace[0].unit / 36).toFixed(1)}" lines instead, which leaves room for four rows to trace and two to write`));
  assert.deepEqual([c1.trace.length, c1.free.length], [4, 2]);
  assert.ok(text.includes(`drawn at ${top(1, "print")}% of Maya's size on 1" lines and at ${top(0.45, "print")}% on 0.45" lines`));
});

test("cursive name page: the table and its sentences match the layout", () => {
  const html = page("cursive-name-tracing"), text = html.replace(/\s+/g, " ");
  assert.deepEqual(rows(html), expected("cursive"));
  assert.deepEqual([0.75, 0.6, 0.45].map((g) => top(g, "cursive")), [100, 100, 100]);
  assert.ok(text.includes(`except 1", where it is drawn at ${top(1, "cursive")}%`));
  assert.ok(text.includes(`drops to ${top(1, "print")}% at 1" and ${top(0.75, "print")}% at 0.75"`));
  const at = (s) => copies(sheet("Maya", 0.45, s).trace[0], "Maya");
  assert.deepEqual([at("cursive"), at("print")], [4, 3]);
  assert.ok(text.includes("Maya fits four times in cursive and three times in print"));
});
