// Pictures on word pages: every holiday page's words have one; a picture
// stays inside KDP's margins and clear of the model word (with its start
// dots and arrows) and of the first trace row, at every trim and guide size;
// the model row's guide lines stop short of a picture beside it; a word with
// no picture gets the same page as before; and the outlines are
// strokes only, so a child can colour them in.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { TRIMS, pageGeometry, marginsForPage } from "../src/pdf/kdp.js";
import { GUIDES } from "../src/pdf/plan.js";
import { namePage, planName } from "../src/pdf/name.js";
import { pictureFor, PICTURES } from "../src/pdf/pictures.js";
import { PRINT } from "../src/glyphs/print.js";
import { reach, labelRadius, MARK_PAD, letterPage, LETTER_WORDS, NUMBER_WORDS, PICTURE_GAP } from "../src/pdf/page.js";
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
// Every "-tracing-worksheets" page whose button opens a word book with
// pictures (the days and months page has none: nothing there to draw).
const SLUGS = readdirSync(new URL("../public/", import.meta.url))
  .map((f) => f.match(/^(.+)-tracing-worksheets\.html$/)?.[1])
  .filter((slug) => slug && /href="\/\?words=[\s\S]*A word gets a picture|A word gets a picture[\s\S]*href="\/\?words=/.test(readFileSync(new URL(`../public/${slug}-tracing-worksheets.html`, import.meta.url), "utf8")));
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
    assert.ok(beside ? model.right <= pic.x && model.right >= right : model.right === first.right, `${at}: model guide lines run into the picture, or stop short of the word`);
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
    assert.ok(beside ? model.right <= pic.x && model.right >= right : model.right === first.right, `${at}: model guide lines run into the picture, or stop short of the word`);
    assert.ok(model.baseY + down * u > first.baseY + up * first.unit, `${at}: word overlaps the first trace row`);
  }
  assert.ok(besides > 0 && aboves > 0, `both placements tested: ${besides} beside, ${aboves} above`);
});

test("A is for apple: every letter has a picture, inside the margins, clear of the letters and the trace rows", () => {
  const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const ch of ABC) assert.ok(pictureFor(LETTER_WORDS[ch] ?? ""), ch);
  for (const [ch, w] of Object.entries(LETTER_WORDS)) assert.ok(w.startsWith(ch.toLowerCase()) || (ch === "X" && w.endsWith("x")), `${ch}: ${w}`);
  let besides = 0, aboves = 0;
  for (const trim of Object.keys(TRIMS)) for (const guideIn of Object.values(GUIDES)) for (const ch of ABC) for (const letters of [[ch, ch.toLowerCase()], [ch], [ch.toLowerCase()]]) {
    const geom = pageGeometry({ trim, bleed: false });
    const m = marginsForPage(geom, 1);
    const at = `${trim} ${guideIn} ${letters.join("")}`;
    const layout = letterPage({ geom, pageNumber: 1, letters, guideIn, picture: true });
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
    assert.ok(beside ? model.right <= L && model.right >= right : model.right === first.right, `${at}: model guide lines run into the picture, or stop short of the letters`);
    assert.ok(B > first.baseY + 2 * first.unit, `${at}: word reaches the first trace row`);
  }
  assert.ok(besides > 0 && aboves > 0, `both placements tested: ${besides} beside, ${aboves} above`);
});

test("counting pictures: a number page 1–9 has that many stars, inside the margins, apart, clear of the digit and the trace rows; 0 has none", () => {
  let besides = 0, aboves = 0;
  for (const trim of Object.keys(TRIMS)) for (const guideIn of Object.values(GUIDES)) for (let n = 0; n <= 9; n++) {
    const geom = pageGeometry({ trim, bleed: false });
    const m = marginsForPage(geom, 1);
    const at = `${trim} ${guideIn} ${n}`;
    const layout = letterPage({ geom, pageNumber: 1, letters: [String(n)], guideIn, picture: true });
    if (n === 0) { assert.equal(layout.pictures, undefined, at); continue; }
    const pics = layout.pictures, [label] = layout.text;
    assert.equal(pics.length, n, `${at}: count`);
    assert.equal(label.text, NUMBER_WORDS[n], at);
    assert.ok(label.size >= 7, `${at}: word under 7pt`);
    for (const [i, a] of pics.entries()) for (const b of pics.slice(i + 1)) {
      assert.ok(a.x + a.size <= b.x + 0.01 || b.x + b.size <= a.x + 0.01 || a.y - a.size >= b.y - 0.01 || b.y - b.size >= a.y - 0.01, `${at}: stars overlap`);
    }
    const half = (label.text.length * 0.62 * label.size) / 2;
    const L = Math.min(label.x - half, ...pics.map((p) => p.x)), R = Math.max(label.x + half, ...pics.map((p) => p.x + p.size));
    const T = Math.max(...pics.map((p) => p.y)), B = label.y - 0.25 * label.size;
    assert.ok(Math.min(...pics.map((p) => p.y - p.size)) > label.y + 0.75 * label.size, `${at}: stars run into their word`);
    assert.ok(L >= m.left - 0.01 && R <= geom.width - m.right + 0.01 && T <= geom.height - m.top + 0.01, `${at}: outside the margins`);
    const [model, first] = layout.rows;
    const u = model.unit, labelR = labelRadius(u) / u;
    const ext = model.letters.map((l) => ({ l, r: reach(GLYPHS[l.ch], labelR, MARK_PAD / u) }));
    const right = Math.max(...ext.map(({ l, r }) => l.x + r.maxX * u));
    const top = Math.max(...ext.map(({ r }) => model.baseY + r.maxY * u));
    const beside = right + PICTURE_GAP * (R - L) <= L + 0.02 || right <= L, above = top <= B;
    assert.ok(beside || above, `${at}: stars or word overlap the digit`);
    beside ? besides++ : aboves++;
    assert.ok(beside ? model.right <= L && model.right >= right : model.right === first.right, `${at}: model guide lines run into the stars`);
    assert.ok(B > first.baseY + 2 * first.unit, `${at}: word reaches the first trace row`);
  }
  assert.ok(besides > 0, `stars beside the digit somewhere: ${besides} beside, ${aboves} above`);
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

// Each word page says where its own twenty pictures come from. Those sentences
// are read against the icon each word is built from in scripts/pictures.mjs.
test("each word page names the sources of its own pictures", () => {
  const src = readFileSync(new URL("../scripts/pictures.mjs", import.meta.url), "utf8");
  const WORDS = Function(`return {${src.match(/const WORDS = \{([\s\S]*?)\n\};/)[1]}}`)();
  const N = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"];
  const and = (a) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a.at(-1)}`);
  const AS = { "ball-basketball": "a basketball", sailboat: "a sailboat", deer: "a deer's head", "christmas-ball": "a Christmas bauble", "cookie-man": "a gingerbread man", "leaf-maple": "a maple leaf" };
  const tabler = readdirSync(new URL("../node_modules/@tabler/icons/icons/outline/", import.meta.url));
  const pages = readdirSync(new URL("../public/", import.meta.url)).filter((f) => f.endsWith("-tracing-worksheets.html"));
  let checked = 0;
  for (const f of pages) {
    const html = readFileSync(new URL(`../public/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
    const cta = html.match(/class="cta" href="\/\?words=([^"&]*)/);
    if (!cta || !html.includes("A word gets a picture")) continue;
    const words = cta[1].split(",");
    assert.equal(words.length, 20, f);
    const lucide = words.filter((w) => WORDS[w].startsWith("lucide:"));
    const said = lucide.length
      ? `${N[20 - lucide.length]} of the twenty pictures on this page are from Tabler Icons, under the MIT licence, and ${N[lucide.length].toLowerCase()} are from Lucide, under the ISC licence: ${and(lucide)}.`
      : "All twenty pictures on this page are from Tabler Icons, under the MIT licence.";
    assert.ok(html.includes(said), `${f}: ${said}`);
    if (html.includes("Tabler has no icon for any of those")) for (const w of lucide) assert.ok(!tabler.includes(`${w}.svg`), `${f}: Tabler has ${w}`);
    if (lucide.includes("nut")) assert.ok(tabler.includes("nut.svg") && html.includes("Tabler has a nut, but it's the kind that goes on a bolt."), f);
    const other = words.filter((w) => WORDS[w] !== w && !WORDS[w].startsWith("lucide:") && !/-\d$/.test(WORDS[w]) && w !== "pumpkin");
    if (other.length) {
      for (const w of other) assert.ok(AS[WORDS[w]], `${f}: ${w} is ${WORDS[w]}, not described`);
      const s = `${N[other.length]} word${other.length > 1 ? "s use" : " uses"} a picture with another name: ${and(other.map((w) => `${w} is ${AS[WORDS[w]]}`))}.`;
      assert.ok(html.includes(s), `${f}: ${s}`);
    } else assert.ok(!html.includes("a picture with another name"), f);
    assert.equal(html.includes("Pumpkin is Tabler's carved pumpkin with the face taken out"), words.includes("pumpkin"), f);
    checked++;
  }
  assert.equal(checked, 7);
  assert.ok(src.includes('pumpkin: "pumpkin-scary"') && /const WITHOUT = \{\s*pumpkin:/.test(src), "the pumpkin sentence describes WITHOUT/WITH");
  assert.deepEqual(Object.keys(Function(`return {${src.match(/const DRAWN = \{([\s\S]*?)\n\};/)[1]}}`)()), ["quilt"], "\"except quilt, which Trace Press drew\"");
});
