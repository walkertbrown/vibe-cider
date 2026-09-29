// A proof sheet: every letter as a dotted trace on the four-line guide, with
// a start dot on each stroke. For looking at, not for sale: no margins logic,
// no text. Writes proofs/print-alphabet.pdf.
//
// Run: npm run proof
import { PDFDocument, rgb, LineCapStyle } from "pdf-lib";
import { mkdirSync, writeFileSync } from "node:fs";
import { PRINT, ends, sample } from "../src/glyphs/print.js";
import { PT } from "../src/pdf/kdp.js";

const GUIDE_IN = 0.75; // ages 5–7 preset: headline to baseline
const unit = (GUIDE_IN * PT) / 2; // one guide unit (baseline→midline) in points
const INK = rgb(0.45, 0.45, 0.45); // well above KDP's 10% grey minimum
const LINE_W = 0.75; // KDP's minimum line weight

const doc = await PDFDocument.create();
const page = doc.addPage([8.5 * PT, 11 * PT]);
const left = 0.75 * PT, right = 8.5 * PT - 0.75 * PT;

function guide(baseY) {
  const at = (u) => baseY + u * unit;
  page.drawLine({ start: { x: left, y: at(2) }, end: { x: right, y: at(2) }, thickness: LINE_W, color: INK });
  page.drawLine({ start: { x: left, y: at(1) }, end: { x: right, y: at(1) }, thickness: LINE_W, color: INK, dashArray: [4, 3] });
  page.drawLine({ start: { x: left, y: at(0) }, end: { x: right, y: at(0) }, thickness: LINE_W, color: rgb(0.2, 0.2, 0.2) });
  page.drawLine({ start: { x: left, y: at(-1) }, end: { x: right, y: at(-1) }, thickness: LINE_W, color: INK, dashArray: [1, 3] });
}

function letter(ch, x, baseY) {
  const P = ([gx, gy]) => [x + gx * unit, baseY + gy * unit];
  for (const stroke of PRINT[ch].strokes) {
    for (const seg of stroke) {
      if (seg.type === "dot") {
        const [cx, cy] = P([seg.x, seg.y]);
        page.drawCircle({ x: cx, y: cy, size: 1.6, color: rgb(0, 0, 0) });
        continue;
      }
      const pts = sample(seg).map(P);
      const d = pts.map(([px, py], i) => `${i ? "L" : "M"} ${px} ${-py}`).join(" ");
      page.drawSvgPath(d, { x: 0, y: 0, borderColor: rgb(0, 0, 0), borderWidth: 2.5, borderDashArray: [0.1, 4], borderLineCap: LineCapStyle.Round });
    }
    const [sx, sy] = P(ends(stroke[0])[0]);
    page.drawCircle({ x: sx, y: sy, size: 2.8, color: rgb(0.1, 0.45, 0.25) });
  }
}

const rows = ["abcdeghijklm", "nopqrstuvw", "xyz", "ABCDEFGHI", "JKLMNOPQR", "STUVWXYZ"];
let baseY = 11 * PT - 1.3 * PT;
for (const row of rows) {
  guide(baseY);
  let x = left + 0.2 * PT;
  for (const ch of row) {
    letter(ch, x, baseY);
    x += (PRINT[ch].width + 0.55) * unit;
  }
  baseY -= GUIDE_IN * PT * 2;
}

mkdirSync(new URL("../proofs/", import.meta.url), { recursive: true });
const out = new URL("../proofs/print-alphabet.pdf", import.meta.url);
writeFileSync(out, await doc.save());
console.log(`wrote ${out.pathname}`);
