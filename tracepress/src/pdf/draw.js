// Drawing into a PDF with pdf-lib, from the shapes in ink.js.
import {
  rgb, drawEllipsePath, fill, setFillingColor, pushGraphicsState, popGraphicsState,
  concatTransformationMatrix, drawObject,
} from "pdf-lib";
import { pageInk } from "./ink.js";

const colour = ([r, g, b]) => rgb(r, g, b);

// A letter page is thousands of tracing dots. page.drawCircle writes each one
// out as four full-precision Bézier curves, which made a 26-page book 2.1 MB
// (measured 2026-09-30: the page content streams were all of it). So each
// distinct dot (radius and colour) is drawn once, as a form XObject shared by
// every page of the document, and each dot on a page is a move and a call to
// it. The circle is the same four curves; only where it's stored changes.
// Positions are rounded to 1/1000 pt, far below anything a printer resolves.
const dotForms = new WeakMap(); // PDFDocument -> Map(key -> ref)
const dotNames = new WeakMap(); // page node -> Map(key -> PDFName)
const round = (n) => Math.round(n * 1000) / 1000;

function dotName(page, r, color) {
  const key = `${r}|${color.join(",")}`;
  let forms = dotForms.get(page.doc);
  if (!forms) dotForms.set(page.doc, (forms = new Map()));
  let ref = forms.get(key);
  if (!ref) {
    const ops = [setFillingColor(colour(color)), ...drawEllipsePath({ x: 0, y: 0, xScale: r, yScale: r }), fill()];
    ref = page.doc.context.register(page.doc.context.formXObject(ops, { BBox: [-r, -r, r, r] }));
    forms.set(key, ref);
  }
  let names = dotNames.get(page.node);
  if (!names) dotNames.set(page.node, (names = new Map()));
  if (!names.has(key)) names.set(key, page.node.newXObject("Dot", ref));
  return names.get(key);
}

function drawDot(page, s) {
  const name = dotName(page, s.r, s.color);
  page.pushOperators(pushGraphicsState(), concatTransformationMatrix(1, 0, 0, 1, round(s.x), round(s.y)), drawObject(name), popGraphicsState());
}

// `fonts` holds embedded `bold` and `regular`; a book that isn't `licensed`
// gets the watermark line.
export function drawLetterPage(page, layout, fonts, { licensed = false, cursive } = {}) {
  drawShapes(page, pageInk(layout, { licensed, cursive }), fonts);
}

export function drawShapes(page, shapes, fonts) {
  for (const s of shapes) {
    if (s.kind === "line") {
      page.drawLine({ start: { x: s.x1, y: s.y1 }, end: { x: s.x2, y: s.y2 }, thickness: s.width, color: colour(s.color), dashArray: s.dash });
    } else if (s.kind === "dot") {
      drawDot(page, s);
    } else if (s.kind === "tri") {
      const [a, b, c] = s.pts;
      page.drawSvgPath(`M ${a[0]} ${-a[1]} L ${b[0]} ${-b[1]} L ${c[0]} ${-c[1]} Z`, { x: 0, y: 0, color: colour(s.color) });
    } else if (s.kind === "path") {
      page.drawSvgPath(s.d, { x: s.x, y: s.y, scale: s.scale, color: colour(s.color) });
    } else if (s.kind === "text") {
      const font = fonts[s.font];
      page.drawText(s.text, { x: s.x - font.widthOfTextAtSize(s.text, s.size) / 2, y: s.y, size: s.size, font, color: colour(s.color) });
    }
  }
}
