// The Stripe product image: 512 × 512, a white card on navy, matching the
// Puzzle Press one (same navy, sampled from its image, rgb 29 53 87). Drawn
// with the real trace renderer, so it shows what the book actually prints:
// a dotted "Aa" on the four-line guide with its stroke-order marks.
//
// Run: node scripts/product-image.mjs  (writes proofs/product-image.png;
// needs pdftoppm)
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { PRINT } from "../src/glyphs/print.js";
import { traceDots } from "../src/pdf/trace.js";
import { strokeArrows, strokeStarts } from "../src/pdf/arrows.js";

const S = 512; // page is 512pt, rendered at 72 dpi → 512px
const NAVY = rgb(29 / 255, 53 / 255, 87 / 255);
const RED = rgb(0.8, 0.15, 0.1);
const GREEN = rgb(0.1, 0.45, 0.25);

const doc = await PDFDocument.create();
doc.registerFontkit(fontkit);
const bold = await doc.embedFont(readFileSync(new URL("../fonts/LiberationSans-Bold.ttf", import.meta.url)), { subset: true });
const page = doc.addPage([S, S]);
page.drawRectangle({ x: 0, y: 0, width: S, height: S, color: NAVY });
// White card with rounded corners, inset 50 like the Puzzle Press image.
const r = 22, x0 = 50, y0 = 50, w = S - 100;
page.drawSvgPath(
  `M ${x0 + r} ${-y0} H ${x0 + w - r} A ${r} ${r} 0 0 0 ${x0 + w} ${-(y0 + r)} V ${-(y0 + w - r)} A ${r} ${r} 0 0 0 ${x0 + w - r} ${-(y0 + w)} H ${x0 + r} A ${r} ${r} 0 0 0 ${x0} ${-(y0 + w - r)} V ${-(y0 + r)} A ${r} ${r} 0 0 0 ${x0 + r} ${-y0} Z`,
  { x: 0, y: 0, color: rgb(1, 1, 1) },
);

const unit = 62; // one guide unit in points: headline to baseline is 124
const baseY = 225; // the guide spans -1..2 units, centred on the card
const left = 80, right = S - 80;
const guide = (u, opts) => page.drawLine({ start: { x: left, y: baseY + u * unit }, end: { x: right, y: baseY + u * unit }, thickness: 2, ...opts });
guide(2, { color: rgb(0.55, 0.55, 0.55) });
guide(1, { color: rgb(0.55, 0.55, 0.55), dashArray: [9, 7] });
guide(0, { color: rgb(0.25, 0.25, 0.25) });
guide(-1, { color: rgb(0.7, 0.7, 0.7), dashArray: [2, 6] });

function letter(ch, x) {
  const P = ([gx, gy]) => [x + gx * unit, baseY + gy * unit];
  for (const d of traceDots(PRINT[ch], 11 / unit).flat()) {
    const [cx, cy] = P(d);
    page.drawCircle({ x: cx, y: cy, size: 3.4, color: rgb(0.1, 0.1, 0.1) });
  }
  for (const a of strokeArrows(PRINT[ch])) {
    const [fx, fy] = P(a.from), [tx, ty] = P(a.to);
    page.drawLine({ start: { x: fx, y: fy }, end: { x: tx, y: ty }, thickness: 2.4, color: RED });
    const len = Math.hypot(tx - fx, ty - fy), ux = (tx - fx) / len, uy = (ty - fy) / len, h = 9;
    page.drawSvgPath(`M ${tx} ${-ty} L ${tx - ux * h - uy * h * 0.6} ${-(ty - uy * h + ux * h * 0.6)} L ${tx - ux * h + uy * h * 0.6} ${-(ty - uy * h - ux * h * 0.6)} Z`, { x: 0, y: 0, color: RED });
  }
  for (const { n, at } of strokeStarts(PRINT[ch])) {
    const [sx, sy] = P(at);
    page.drawCircle({ x: sx, y: sy, size: 11, color: GREEN });
    const label = String(n), size = 15;
    page.drawText(label, { x: sx - bold.widthOfTextAtSize(label, size) / 2, y: sy - size * 0.36, size, font: bold, color: rgb(1, 1, 1) });
  }
}

// "Aa", centred on the card.
const gap = 0.7;
const total = (PRINT.A.width + gap + PRINT.a.width) * unit;
const startX = (S - total) / 2;
letter("A", startX);
letter("a", startX + (PRINT.A.width + gap) * unit);

const dir = new URL("../proofs/", import.meta.url);
mkdirSync(dir, { recursive: true });
const pdf = new URL("product-image.pdf", dir).pathname;
writeFileSync(pdf, await doc.save());
execFileSync("pdftoppm", ["-r", "72", "-png", "-singlefile", pdf, pdf.replace(/\.pdf$/, "")]);
console.log(`wrote ${pdf.replace(/\.pdf$/, ".png")}`);
