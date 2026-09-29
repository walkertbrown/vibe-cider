// Full-wrap paperback cover for KDP: back + spine + front on one PDF page,
// sized from the interior's page count (cover-geometry.js has KDP's
// equations and their source).
//
// The front is the buyer's title, a subtitle, and the book's own model row
// drawn big: a dotted "Aa" with its numbered starts and stroke arrows, from
// the same shapes as the interior pages. The back is left plain, with KDP's
// barcode area clear. A 26-page book is under KDP's 79-page floor for spine
// text, so the spine is blank.
//
// `layoutCover` returns plain shapes (the ink.js kinds, plus `rect`), so a
// test can check every word sits inside the safe area without rendering.
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { PT } from "./kdp.js";
import { coverGeometry, BARCODE_IN } from "./cover-geometry.js";
import { pageInk, WHITE } from "./ink.js";
import { drawShapes } from "./draw.js";
import { PRINT } from "../glyphs/print.js";
import { reach, labelRadius, MARK_PAD, LETTER_GAP } from "./page.js";

export { PAPER, coverGeometry, SPINE_TEXT_MIN_PAGES } from "./cover-geometry.js";

export const GROUND = [0.137, 0.306, 0.227]; // the site's green, #234e3a
const CARD = [1, 1, 1];
const PALE = [0.86, 0.93, 0.89];
// Every word on the front stays this far inside the trim. KDP asks for
// 0.125"; the extra is so nothing looks crowded against the cut.
export const TEXT_INSET_IN = 0.375;

function wrap(font, text, maxWidth, size) {
  const out = [];
  let cur = "";
  for (const w of String(text).split(/\s+/).filter(Boolean)) {
    const next = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > maxWidth && cur) { out.push(cur); cur = w; } else cur = next;
  }
  if (cur) out.push(cur);
  return out;
}

// Words larger than the line (a long single word) shrink the size until they
// fit; a title that would need more than `maxLines` shrinks too.
function fitLines(font, text, maxWidth, start, min, maxLines) {
  for (let s = start; s >= min; s -= 1) {
    const lines = wrap(font, text, maxWidth, s);
    if (lines.length <= maxLines && lines.every((l) => font.widthOfTextAtSize(l, s) <= maxWidth)) return { size: s, lines };
  }
  return { size: min, lines: wrap(font, text, maxWidth, min) };
}

// `fonts` are embedded pdf-lib fonts (only widthOfTextAtSize is used).
export function layoutCover({ title = "My Letter Tracing Book", subtitle = "", author = "", trim = "8.5x11", pageCount = 26, paper = "white" } = {}, fonts) {
  const g = coverGeometry({ trim, pageCount, paper });
  const shapes = [{ kind: "rect", x: 0, y: 0, w: g.width, h: g.height, color: GROUND }];
  const inset = TEXT_INSET_IN * PT;
  const left = g.frontX + inset, right = g.frontX + g.panelW - inset;
  const w = right - left, cx = (left + right) / 2;
  let top = g.panelY + g.panelH - inset;
  const bottom = g.panelY + inset;
  const text = (t, y, size, font, color) => shapes.push({ kind: "text", text: t, x: cx, y, size, font, color });

  // Top down: title, subtitle.
  const t = fitLines(fonts.bold, title, w, Math.round(g.panelH * 0.075), 16, 3);
  for (const line of t.lines) { top -= t.size * 0.9; text(line, top, t.size, "bold", WHITE); top -= t.size * 0.25; }
  if (subtitle) {
    const s = fitLines(fonts.regular, subtitle, w, Math.round(t.size * 0.45), 9, 2);
    top -= t.size * 0.15;
    for (const line of s.lines) { top -= s.size; text(line, top, s.size, "regular", PALE); top -= s.size * 0.3; }
  }
  // Bottom up: author.
  let floor = bottom;
  if (author) {
    const a = fitLines(fonts.bold, author, w, Math.round(t.size * 0.4), 9, 2);
    [...a.lines].reverse().forEach((line, i) => text(line, bottom + i * a.size * 1.2, a.size, "bold", WHITE));
    floor = bottom + a.lines.length * a.size * 1.2 + a.size * 0.6;
  }

  // Between them, a white card holding "A a" as the book's model row draws it.
  const gap = inset * 0.6;
  const card = { x: g.frontX + inset * 0.7, y: floor + gap * 0.5, w: g.panelW - inset * 1.4, h: top - gap - floor - gap * 0.5 };
  shapes.push({ kind: "rect", ...card, color: CARD });
  const letters = ["A", "a"];
  // Size the unit so the pair fits the card both ways. reach() depends on the
  // unit only through the label radius and mark padding, so solve twice.
  let unit = 60;
  for (let i = 0; i < 3; i++) {
    const rs = letters.map((ch) => reach(PRINT[ch], labelRadius(unit) / unit, MARK_PAD / unit));
    const across = rs.reduce((a, r) => a + r.maxX - r.minX, 0) + LETTER_GAP;
    const up = Math.max(...rs.map((r) => r.maxY)) - Math.min(...rs.map((r) => r.minY));
    unit = Math.min((card.w * 0.84) / across, (card.h * 0.84) / up);
  }
  const rs = letters.map((ch) => reach(PRINT[ch], labelRadius(unit) / unit, MARK_PAD / unit));
  const across = (rs.reduce((a, r) => a + r.maxX - r.minX, 0) + LETTER_GAP) * unit;
  const maxY = Math.max(...rs.map((r) => r.maxY)), minY = Math.min(...rs.map((r) => r.minY));
  const baseY = card.y + card.h / 2 - ((maxY + minY) / 2) * unit;
  let x = card.x + (card.w - across) / 2;
  const row = { unit, baseY, left: card.x + card.w * 0.04, right: card.x + card.w * 0.96, letters: [] };
  rs.forEach((r, i) => {
    x += -r.minX * unit;
    row.letters.push({ ch: letters[i], x, marks: true });
    x += (r.maxX + LETTER_GAP) * unit;
  });
  shapes.push(...pageInk({ rows: [row] }, { licensed: true, heavy: true }));
  return { g, shapes, card, unit };
}

// A free cover is a real cover of the buyer's own book, marked so it can't be
// published: PREVIEW across the front, and a note on the back.
function drawPreviewMark(page, g, fonts) {
  const word = "PREVIEW";
  const angle = Math.PI / 6;
  let size = g.panelH * 0.14;
  while (size > 12 && fonts.bold.widthOfTextAtSize(word, size) * Math.cos(angle) > g.panelW * 0.82) size -= 1;
  const w = fonts.bold.widthOfTextAtSize(word, size);
  const cx = g.frontX + g.panelW / 2, cy = g.panelY + g.panelH / 2;
  for (const [dx, color, opacity] of [[0, rgb(0.85, 0.3, 0.3), 0.55], [2, rgb(1, 1, 1), 0.35]]) {
    page.drawText(word, {
      x: cx - (w / 2) * Math.cos(angle) + dx, y: cy - (w / 2) * Math.sin(angle) + dx,
      size, font: fonts.bold, color, opacity, rotate: { type: "degrees", angle: 30 },
    });
  }
  const lines = [["Made with Trace Press", fonts.bold], ["Unlock to remove the PREVIEW mark", fonts.regular]];
  const ns = 10;
  const nw = Math.max(...lines.map(([t, f]) => f.widthOfTextAtSize(t, ns)));
  const x = g.backX + BARCODE_IN.margin * PT, y = g.panelY + BARCODE_IN.margin * PT;
  page.drawRectangle({ x, y, width: nw + 20, height: ns * 2.6 + 14, color: rgb(1, 1, 1), opacity: 0.9 });
  lines.forEach(([t, f], i) => page.drawText(t, { x: x + 10, y: y + 9 + (lines.length - 1 - i) * ns * 1.3, size: ns, font: f, color: rgb(0.7, 0.2, 0.2) }));
}

// `fontBytes.bold` / `.regular` are TTF bytes. `opts.licensed` is true only
// after /api/verify has found a payment.
export async function renderCover(opts, fontBytes) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fonts = {
    bold: await doc.embedFont(fontBytes.bold, { subset: true }),
    regular: await doc.embedFont(fontBytes.regular, { subset: true }),
  };
  doc.setTitle(`${opts.title || "Letter tracing book"} — cover`);
  if (opts.author) doc.setAuthor(opts.author);
  const { g, shapes } = layoutCover(opts, fonts);
  const page = doc.addPage([g.width, g.height]);
  for (const s of shapes) {
    if (s.kind === "rect") page.drawRectangle({ x: s.x, y: s.y, width: s.w, height: s.h, color: rgb(...s.color) });
  }
  drawShapes(page, shapes.filter((s) => s.kind !== "rect"), fonts);
  if (opts.licensed !== true) drawPreviewMark(page, g, fonts);
  return doc.save();
}
