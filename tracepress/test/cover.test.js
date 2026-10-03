// The cover: KDP's size for every trim and paper, every word on the front
// inside the trim by more than KDP's 0.125", nothing on the spine or back but
// the free cover's note, and PREVIEW on free covers only (read back from the
// rendered PDF, not from the flag).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { layoutCover, renderCover, PAPER } from "../src/pdf/cover.js";
import { TRIMS, PT } from "../src/pdf/kdp.js";
import { planBook } from "../src/pdf/plan.js";

const bytes = {
  bold: readFileSync(new URL("../fonts/LiberationSans-Bold.ttf", import.meta.url)),
  regular: readFileSync(new URL("../fonts/LiberationSans-Regular.ttf", import.meta.url)),
};
const doc = await PDFDocument.create();
doc.registerFontkit(fontkit);
const fonts = { bold: await doc.embedFont(bytes.bold), regular: await doc.embedFont(bytes.regular) };
const pageCount = planBook().pages.length;
const SAFE = 0.125 * PT;
const TITLES = [
  { title: "My Letter Tracing Book" },
  { title: "My First ABC Letter Tracing Book for Preschool and Kindergarten Kids Ages 3 to 5", subtitle: "Practice capital and lowercase letters with arrows and numbered start dots, A to Z", author: "Someone With A Rather Long Pen Name Indeed" },
  { title: "Supercalifragilisticexpialidocious", author: "X" },
];

test("the cover is KDP's size: bleed + back + spine + front + bleed", () => {
  for (const trim of Object.keys(TRIMS)) for (const paper of Object.keys(PAPER)) {
    const { g } = layoutCover({ trim, paper, pageCount }, fonts);
    const spine = pageCount * PAPER[paper].thickness;
    assert.ok(Math.abs(g.width - (0.25 + 2 * TRIMS[trim].w + spine) * PT) < 0.01, `${trim} ${paper} width`);
    assert.ok(Math.abs(g.height - (0.25 + TRIMS[trim].h) * PT) < 0.01, `${trim} ${paper} height`);
  }
});

test("every word and mark on the front is inside the trim by more than 0.125\"", () => {
  for (const trim of Object.keys(TRIMS)) for (const t of TITLES) for (const abc of [false, true]) {
    const { g, shapes } = layoutCover({ ...t, trim, pageCount, abc }, fonts);
    const x0 = g.frontX + SAFE, x1 = g.frontX + g.panelW - SAFE, y0 = g.panelY + SAFE, y1 = g.panelY + g.panelH - SAFE;
    const words = shapes.filter((s) => s.kind === "text");
    assert.ok(words.some((s) => s.size >= 16), `${trim}: a title at 16pt or more`);
    for (const s of shapes) {
      if (s.kind === "rect" && s.w === g.width) continue; // the background, full bleed on purpose
      const box = s.kind === "text"
        ? (() => { const w = fonts[s.font].widthOfTextAtSize(s.text, s.size); return [s.x - w / 2, s.y - s.size * 0.25, s.x + w / 2, s.y + s.size * 0.8]; })()
        : s.kind === "rect" ? [s.x, s.y, s.x + s.w, s.y + s.h]
        : s.kind === "dot" ? [s.x - s.r, s.y - s.r, s.x + s.r, s.y + s.r]
        : s.kind === "line" ? [Math.min(s.x1, s.x2), Math.min(s.y1, s.y2), Math.max(s.x1, s.x2), Math.max(s.y1, s.y2)]
        : s.kind === "outline" ? [s.x, s.y - 24 * s.scale, s.x + 24 * s.scale, s.y]
        : [Math.min(...s.pts.map((p) => p[0])), Math.min(...s.pts.map((p) => p[1])), Math.max(...s.pts.map((p) => p[0])), Math.max(...s.pts.map((p) => p[1]))];
      const what = `${trim} "${t.title.slice(0, 20)}" ${s.kind} ${s.text ?? ""}`;
      assert.ok(box[0] >= x0 && box[2] <= x1 && box[1] >= y0 && box[3] <= y1, `${what} at ${box.map(Math.round)} outside ${[x0, y0, x1, y1].map(Math.round)}`);
      if (s.kind === "text") assert.ok(s.size >= 7, `${what}: ${s.size}pt`);
    }
  }
});

async function coverText(opts) {
  const dir = mkdtempSync(join(tmpdir(), "tp-cover-"));
  const pdf = join(dir, "c.pdf");
  writeFileSync(pdf, await renderCover(opts, bytes));
  const text = execFileSync("pdftotext", ["-raw", pdf, "-"], { encoding: "utf8" });
  const info = execFileSync("pdfinfo", [pdf], { encoding: "utf8" });
  rmSync(dir, { recursive: true, force: true });
  return { text, info };
}

test("a free cover says PREVIEW and a paid one doesn't", async () => {
  const free = await coverText({ title: "Tracing Fun", trim: "6x9" });
  assert.match(free.text, /PREVIEW/);
  assert.match(free.text, /Made with Trace Press/);
  assert.match(free.text, /Tracing Fun/);
  const paid = await coverText({ title: "Tracing Fun", trim: "6x9", licensed: true });
  assert.doesNotMatch(paid.text, /PREVIEW|Trace Press/);
  assert.match(paid.text, /Tracing Fun/);
  assert.match(paid.info, /Pages:\s+1\b/);
});

// A cursive book's cover: the card holds "Aa" in joined cursive (glyph paths,
// no tracing dots or arrows), and all of it stays inside the card, so inside
// the trim like the rest of the front.
test("a picture book's cover has the apple beside the letters, inside the card and clear of them", () => {
  for (const trim of Object.keys(TRIMS)) for (const t of TITLES) {
    const plain = layoutCover({ ...t, trim, pageCount }, fonts);
    const { shapes, card, unit } = layoutCover({ ...t, trim, pageCount, abc: true }, fonts);
    const what = `${trim} "${t.title.slice(0, 20)}"`;
    const pics = shapes.filter((s) => s.kind === "outline");
    assert.equal(pics.length, 1, `${what}: ${pics.length} pictures`);
    const p = pics[0], size = 24 * p.scale;
    const word = shapes.find((s) => s.kind === "text" && s.text === "apple");
    assert.ok(word && word.size >= 7, `${what}: the word under the apple, at 7pt or more`);
    const ww = fonts.bold.widthOfTextAtSize(word.text, word.size);
    const right = { x: Math.min(p.x, word.x - ww / 2), top: p.y, bottom: word.y - word.size * 0.25 };
    assert.ok(right.x >= card.x && p.x + size <= card.x + card.w && word.x + ww / 2 <= card.x + card.w && right.bottom >= card.y && right.top <= card.y + card.h, `${what}: apple outside the card`);
    assert.ok(word.y + word.size * 0.8 < p.y - size, `${what}: the word runs into the apple`);
    // Every letter mark (dots, arrows, start numbers) and the guide lines stop left of it.
    for (const s of shapes) {
      const x = s.kind === "dot" ? s.x + s.r : s.kind === "tri" ? Math.max(...s.pts.map((q) => q[0])) : s.kind === "line" && s.y1 > card.y && s.y1 < card.y + card.h ? Math.max(s.x1, s.x2) : null;
      if (x !== null) assert.ok(x < right.x, `${what}: ${s.kind} at ${Math.round(x)} reaches the apple at ${Math.round(right.x)}`);
    }
    // The letters stay the cover's main thing: no less than 60% of their size without the apple.
    assert.ok(unit >= 0.6 * plain.unit, `${what}: letters ${Math.round(unit)} vs ${Math.round(plain.unit)}`);
  }
});

test("a cursive book's cover has a cursive model, inside the card", async () => {
  const cursiveBytes = readFileSync(new URL("../public/fonts/PlaywriteUSTrad.ttf", import.meta.url));
  const cursive = fontkit.create(cursiveBytes);
  for (const trim of Object.keys(TRIMS)) for (const t of TITLES) {
    const { shapes, card } = layoutCover({ ...t, trim, pageCount, cursive }, fonts);
    const what = `${trim} "${t.title.slice(0, 20)}"`;
    assert.equal(shapes.filter((s) => s.kind === "dot" || s.kind === "tri").length, 0, `${what}: print marks on a cursive cover`);
    const paths = shapes.filter((s) => s.kind === "path");
    assert.ok(paths.length >= 2, `${what}: ${paths.length} cursive paths`);
    const xs = [], ys = [];
    for (const s of paths) {
      const nums = s.d.match(/-?[\d.]+(e-?\d+)?/g).map(Number);
      for (let k = 0; k + 1 < nums.length; k += 2) { xs.push(s.x + nums[k] * s.scale); ys.push(s.y - nums[k + 1] * s.scale); }
    }
    assert.ok(Math.min(...xs) >= card.x && Math.max(...xs) <= card.x + card.w && Math.min(...ys) >= card.y && Math.max(...ys) <= card.y + card.h, `${what}: cursive outside the card`);
    // Big enough to read as the book's letters: at least half the card's width.
    assert.ok(Math.max(...xs) - Math.min(...xs) >= card.w * 0.5 || Math.max(...ys) - Math.min(...ys) >= card.h * 0.5, `${what}: cursive too small`);
  }
  const free = await PDFDocument.load(await renderCover({ title: "Cursive Fun", trim: "8.5x11", pageCount, script: "cursive" }, { ...bytes, cursive: cursiveBytes }));
  assert.equal(free.getPageCount(), 1);
});
