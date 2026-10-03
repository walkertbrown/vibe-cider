// Pictures on word pages: every holiday page's words have one; a picture
// stays inside KDP's margins and clear of the model word (with its start
// dots and arrows) and of the first trace row, at every trim and guide size;
// a word with no picture gets the same page as before; and the outlines are
// strokes only, so a child can colour them in.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { TRIMS, pageGeometry, marginsForPage } from "../src/pdf/kdp.js";
import { GUIDES } from "../src/pdf/plan.js";
import { namePage, planName } from "../src/pdf/name.js";
import { pictureFor, PICTURES } from "../src/pdf/pictures.js";
import { PRINT } from "../src/glyphs/print.js";
import { reach, labelRadius, MARK_PAD, letterPage, LETTER_WORDS, PICTURE_GAP } from "../src/pdf/page.js";
import { GLYPHS } from "../src/glyphs/lines.js";
import { pageInk } from "../src/pdf/ink.js";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { cursivePage, CURSIVE_REACH } from "../src/pdf/cursive-page.js";
import { cursiveWidth } from "../src/pdf/cursive.js";

const holiday = (slug) => {
  const page = readFileSync(new URL(`../public/${slug}-tracing-worksheets.html`, import.meta.url), "utf8");
  return decodeURIComponent(page.match(/href="\/\?words=([^"]+)">Make a/)[1]).split(",");
};
// Every "-tracing-worksheets" page whose button opens a word book.
const SLUGS = readdirSync(new URL("../public/", import.meta.url))
  .map((f) => f.match(/^(.+)-tracing-worksheets\.html$/)?.[1])
  .filter((slug) => slug && /href="\/\?words=/.test(readFileSync(new URL(`../public/${slug}-tracing-worksheets.html`, import.meta.url), "utf8")));
const HOLIDAY = SLUGS.flatMap(holiday);

test("every word on the picture pages has a picture", () => {
  assert.ok(SLUGS.length >= 5, SLUGS.join());
  assert.equal(HOLIDAY.length, 20 * SLUGS.length);
  assert.deepEqual(HOLIDAY.filter((w) => !pictureFor(w)), []);
});

test("pictureFor matches case and a plain plural, and nothing else", () => {
  assert.equal(pictureFor("Bat"), PICTURES.bat);
  assert.equal(pictureFor("bats"), PICTURES.bat);
  assert.equal(pictureFor("zzz"), null);
  assert.equal(pictureFor(""), null);
});

test("a picture is inside the margins and clear of the model word and the trace rows", () => {
  const words = [...new Set([...HOLIDAY, "gingerbread", "snowflake", "bat"])];
  for (const trim of Object.keys(TRIMS)) for (const guideIn of Object.values(GUIDES)) for (const word of words) {
    const geom = pageGeometry({ trim, bleed: false });
    const m = marginsForPage(geom, 1);
    const layout = namePage({ geom, name: word, guideIn, picture: pictureFor(word) });
    const [pic] = layout.pictures;
    const at = `${trim} ${guideIn} ${word}`;
    assert.ok(pic, at);
    assert.ok(pic.x >= m.left - 0.01 && pic.x + pic.size <= geom.width - m.right + 0.01, `${at}: across`);
    assert.ok(pic.y <= geom.height - m.top + 0.01, `${at}: top`);
    const [model, first] = layout.rows;
    const u = model.unit, labelR = labelRadius(u) / u;
    const ext = model.letters.map((l) => ({ l, r: reach(PRINT[l.ch], labelR, MARK_PAD / u) }));
    const right = Math.max(...ext.map(({ l, r }) => l.x + r.maxX * u));
    const top = Math.max(...ext.map(({ r }) => model.baseY + r.maxY * u), model.baseY + 2 * u);
    const bottom = Math.min(...ext.map(({ r }) => model.baseY + r.minY * u), model.baseY - u);
    const beside = right <= pic.x, above = top <= pic.y - pic.size;
    assert.ok(beside || above, `${at}: overlaps the word`);
    if (beside) assert.ok(pic.y - pic.size >= first.baseY + 2 * first.unit, `${at}: overlaps the first trace row`);
    assert.ok(bottom > first.baseY + 2 * first.unit, `${at}: word overlaps the first trace row`);
  }
});

test("in cursive too, a picture is inside the margins and clear of the model word and the trace rows", () => {
  const font = fontkit.create(readFileSync(new URL("../public/fonts/PlaywriteUSTrad.ttf", import.meta.url)));
  const measure = (text, unit) => cursiveWidth(font, text, unit);
  const words = [...new Set([...HOLIDAY, "gingerbread", "snowflake", "bat"])];
  const { above: up, below: down, side } = CURSIVE_REACH;
  let besides = 0, aboves = 0;
  for (const trim of Object.keys(TRIMS)) for (const guideIn of Object.values(GUIDES)) for (const word of words) {
    const geom = pageGeometry({ trim, bleed: false });
    const m = marginsForPage(geom, 1);
    const layout = cursivePage({ geom, pageNumber: 1, model: word, trace: [word], guideIn, measure, word: true, picture: pictureFor(word) });
    const [pic] = layout.pictures;
    const at = `${trim} ${guideIn} ${word}`;
    assert.ok(pic, at);
    assert.ok(pic.x >= m.left - 0.01 && pic.x + pic.size <= geom.width - m.right + 0.01, `${at}: across`);
    assert.ok(pic.y <= geom.height - m.top + 0.01, `${at}: top`);
    const [model, first] = layout.rows;
    const u = model.unit, run = model.runs[0];
    const right = run.x + measure(run.text, u) + side * u;
    const beside = right <= pic.x, above = model.baseY + up * u <= pic.y - pic.size;
    assert.ok(beside || above, `${at}: overlaps the word`);
    beside ? besides++ : aboves++;
    if (beside) assert.ok(pic.y - pic.size >= first.baseY + up * first.unit, `${at}: overlaps the first trace row`);
    assert.ok(model.baseY + down * u > first.baseY + up * first.unit, `${at}: word overlaps the first trace row`);
  }
  assert.ok(besides > 0 && aboves > 0, `both placements tested: ${besides} beside, ${aboves} above`);
});

test("A is for apple: every letter but Q has a picture, inside the margins, clear of the letters and the trace rows", () => {
  const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const ch of ABC) assert.equal(!!pictureFor(LETTER_WORDS[ch] ?? ""), ch !== "Q", ch);
  for (const [ch, w] of Object.entries(LETTER_WORDS)) assert.ok(w.startsWith(ch.toLowerCase()) || (ch === "X" && w.endsWith("x")), `${ch}: ${w}`);
  let besides = 0, aboves = 0;
  for (const trim of Object.keys(TRIMS)) for (const guideIn of Object.values(GUIDES)) for (const ch of ABC) for (const letters of [[ch, ch.toLowerCase()], [ch], [ch.toLowerCase()]]) {
    const geom = pageGeometry({ trim, bleed: false });
    const m = marginsForPage(geom, 1);
    const at = `${trim} ${guideIn} ${letters.join("")}`;
    const layout = letterPage({ geom, pageNumber: 1, letters, guideIn, picture: true });
    if (ch === "Q") { assert.equal(layout.pictures, undefined, at); continue; }
    const [pic] = layout.pictures, [label] = layout.text;
    const half = (label.text.length * 0.62 * label.size) / 2; // as page.js estimates it
    const L = Math.min(pic.x, label.x - half), R = Math.max(pic.x + pic.size, label.x + half);
    const T = pic.y, B = label.y - 0.25 * label.size; // descenders
    assert.ok(label.size >= 7, `${at}: word under 7pt`);
    assert.ok(L >= m.left - 0.01 && R <= geom.width - m.right + 0.01 && T <= geom.height - m.top + 0.01, `${at}: outside the margins`);
    const [model, first] = layout.rows;
    const u = model.unit, labelR = labelRadius(u) / u;
    const ext = model.letters.map((l) => ({ l, r: reach(GLYPHS[l.ch], labelR, MARK_PAD / u) }));
    const right = Math.max(...ext.map(({ l, r }) => l.x + r.maxX * u));
    const top = Math.max(...ext.map(({ r }) => model.baseY + r.maxY * u));
    const beside = right + PICTURE_GAP * pic.size <= L + 0.02, above = top <= B;
    assert.ok(beside || above, `${at}: picture or word overlaps the letters, or crowds them`);
    beside ? besides++ : aboves++;
    assert.ok(B > first.baseY + 2 * first.unit, `${at}: word reaches the first trace row`);
  }
  assert.ok(besides > 0 && aboves > 0, `both placements tested: ${besides} beside, ${aboves} above`);
});

test("letter pages have no picture unless asked", () => {
  const geom = pageGeometry({ trim: "8.5x11", bleed: false });
  assert.equal(letterPage({ geom, pageNumber: 1, letters: ["A", "a"], guideIn: 0.75 }).pictures, undefined);
});

test("a word with no picture gets the page it always had", () => {
  const geom = pageGeometry({ trim: "8.5x11", bleed: false });
  const a = namePage({ geom, name: "zzz", guideIn: 0.75 }), b = namePage({ geom, name: "zzz", guideIn: 0.75, picture: null });
  assert.deepEqual(a, b);
  assert.deepEqual(a.pictures, []);
});

test("pictures are outlines: stroked, never filled", () => {
  const geom = pageGeometry({ trim: "8.5x11", bleed: false });
  const ink = pageInk(namePage({ geom, name: "bat", guideIn: 0.75, picture: pictureFor("bat") }), { licensed: true });
  const outline = ink.filter((s) => s.kind === "outline");
  assert.equal(outline.length, 1);
  assert.equal(outline[0].fill, undefined);
  const draw = readFileSync(new URL("../src/pdf/draw.js", import.meta.url), "utf8");
  const branch = draw.slice(draw.indexOf('s.kind === "outline"'), draw.indexOf("}", draw.indexOf('s.kind === "outline"')));
  assert.ok(branch.includes("borderColor") && !/[^r]color:/.test(branch), "draw.js outline must not set a fill colour");
});

test("pdf-lib can draw every picture's paths", async () => {
  const page = (await PDFDocument.create()).addPage();
  const broken = [];
  for (const [word, paths] of Object.entries(PICTURES)) {
    for (const d of paths) {
      try { page.drawSvgPath(d, { x: 10, y: 500, scale: 2, borderWidth: 1 }); } catch { broken.push(word); }
    }
  }
  assert.deepEqual(broken, []);
});

test("the free words tool draws a word's picture; the name tools don't", () => {
  assert.equal(planName({ name: "cat", pictures: true }).page.pictures.length, 1);
  assert.equal(planName({ name: "cat dog", pictures: true }).page.pictures.length, 0);
  assert.equal(planName({ name: "cat" }).page.pictures.length, 0);
  const body = (f) => readFileSync(new URL(`../public/${f}.html`, import.meta.url), "utf8").match(/<body[^>]*>/)[0];
  assert.match(body("tracing-worksheet-generator"), /data-pictures="1"/);
  for (const f of ["name-tracing", "cursive-name-tracing"]) assert.doesNotMatch(body(f), /data-pictures/);
});
