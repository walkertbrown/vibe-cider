// Drawing into a PDF with pdf-lib, from the shapes in ink.js.
import { rgb } from "pdf-lib";
import { pageInk } from "./ink.js";

const colour = ([r, g, b]) => rgb(r, g, b);

// `fonts` holds embedded `bold` and `regular`; a book that isn't `licensed`
// gets the watermark line.
export function drawLetterPage(page, layout, fonts, { licensed = false } = {}) {
  drawShapes(page, pageInk(layout, { licensed }), fonts);
}

export function drawShapes(page, shapes, fonts) {
  for (const s of shapes) {
    if (s.kind === "line") {
      page.drawLine({ start: { x: s.x1, y: s.y1 }, end: { x: s.x2, y: s.y2 }, thickness: s.width, color: colour(s.color), dashArray: s.dash });
    } else if (s.kind === "dot") {
      page.drawCircle({ x: s.x, y: s.y, size: s.r, color: colour(s.color) });
    } else if (s.kind === "tri") {
      const [a, b, c] = s.pts;
      page.drawSvgPath(`M ${a[0]} ${-a[1]} L ${b[0]} ${-b[1]} L ${c[0]} ${-c[1]} Z`, { x: 0, y: 0, color: colour(s.color) });
    } else if (s.kind === "text") {
      const font = fonts[s.font];
      page.drawText(s.text, { x: s.x - font.widthOfTextAtSize(s.text, s.size) / 2, y: s.y, size: s.size, font, color: colour(s.color) });
    }
  }
}
