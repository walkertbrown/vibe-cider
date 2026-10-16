// A cover template for the spine calculator: one PNG at 300 DPI, the size of
// the full-wrap cover, with the bleed, the trim, the spine folds, the text-safe
// lines and the barcode box drawn on it. Somebody designing in Canva or
// Photoshop drops it in as the bottom layer and lays their art over it.
//
// Every line comes from coverGeometry(), the function the book generator's
// cover PDFs are built from, so the template and our own covers cannot
// disagree. The text-safe line is KDP's "at least 0.125" (3.2 mm) inside the
// trim lines" (the rule test/coversafe.mjs checks our covers against); it is
// drawn at the spine folds too, since text across a fold is not readable on
// either side. The spine safe area is KDP's cover calculator's: 0.0625" in
// from each fold. The barcode box is BARCODE_IN, the clear area KDP's own
// downloadable templates reserve.
import { BARCODE_IN, SPINE_FOLD_IN } from "../pdf/cover-geometry.js";
import { PT } from "../pdf/kdp.js";

const SAFE_IN = 0.125;
const C = {
  bleed: "#f9d6d6", spine: "#e3e9f2", fold: "#1d3557", trim: "#c0392b",
  safe: "#2f6fd6", barcode: "#555b63", label: "#9aa3ad", ink: "#1d3557",
};

// g: coverGeometry(). Returns the canvas; the caller turns it into a file.
export function drawCoverTemplate(g, { dpi = 300, paperLabel = "", doc = document } = {}) {
  const s = dpi / PT; // points to pixels
  const W = Math.round((g.width / PT) * dpi), H = Math.round((g.height / PT) * dpi);
  const canvas = doc.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext("2d");
  const inch = (n) => n * dpi;
  const b = g.bleed * s, safe = inch(SAFE_IN);
  const backX = g.backX * s, spineX = g.spineX * s, frontX = g.frontX * s;
  const panelW = g.panelW * s, panelH = g.panelH * s, top = g.panelY * s;

  c.fillStyle = C.bleed;
  c.fillRect(0, 0, W, H);
  c.fillStyle = "#fff";
  c.fillRect(b, b, W - 2 * b, H - 2 * b);
  c.fillStyle = C.spine;
  c.fillRect(spineX, 0, frontX - spineX, H);

  const line = (x0, y0, x1, y1, color, width, dash = []) => {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.setLineDash(dash);
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
  };
  const box = (x, y, w, h, color, width, dash = []) => {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.setLineDash(dash);
    c.strokeRect(x, y, w, h);
  };
  const lw = Math.max(2, dpi / 100);

  // Trim, the folds, the text-safe box on each panel.
  box(b, b, W - 2 * b, H - 2 * b, C.trim, lw);
  line(spineX, 0, spineX, H, C.fold, lw);
  line(frontX, 0, frontX, H, C.fold, lw);
  for (const x of [backX, frontX]) box(x + safe, top + safe, panelW - 2 * safe, panelH - 2 * safe, C.safe, lw, [lw * 6, lw * 4]);
  const spineSafe = (frontX - spineX) - 2 * inch(SPINE_FOLD_IN);
  if (g.spineTextAllowed && spineSafe > 0) box(spineX + inch(SPINE_FOLD_IN), top + safe, spineSafe, panelH - 2 * safe, C.safe, lw, [lw * 6, lw * 4]);

  // The barcode box: lower right of the back cover, BARCODE_IN.margin in from
  // the trim at the bottom and from the spine fold.
  const bw = inch(BARCODE_IN.w), bh = inch(BARCODE_IN.h);
  const bx = backX + panelW - inch(BARCODE_IN.margin) - bw, by = top + panelH - inch(BARCODE_IN.margin) - bh;
  c.fillStyle = "#fff";
  c.fillRect(bx, by, bw, bh);
  box(bx, by, bw, bh, C.barcode, lw);

  const text = (str, x, y, px, color, { align = "center", weight = 700, max } = {}) => {
    c.font = `${weight} ${Math.round(px)}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    c.fillStyle = color;
    c.textAlign = align;
    c.textBaseline = "middle";
    c.fillText(str, x, y, max);
  };
  const big = inch(0.42), small = inch(0.12);
  text("BACK COVER", backX + panelW / 2, top + panelH * 0.32, big, C.label);
  text("FRONT COVER", frontX + panelW / 2, top + panelH * 0.32, big, C.label);
  text("Barcode area", bx + bw / 2, by + bh / 2 - small * 0.7, small, C.barcode, { weight: 600 });
  text(`${BARCODE_IN.w}" × ${BARCODE_IN.h}", keep clear`, bx + bw / 2, by + bh / 2 + small * 0.7, small, C.barcode, { weight: 400 });

  const spineW = frontX - spineX;
  const fix = (n) => `${n.toFixed(3)}"`;
  if (spineW > small * 1.6) {
    c.save();
    c.translate(spineX + spineW / 2, H / 2);
    c.rotate(Math.PI / 2);
    text(`SPINE ${fix(g.spine / PT)}${g.spineTextAllowed ? "" : " · no text under 80 pages"}`, 0, 0, Math.min(small, spineW * 0.6), C.ink);
    c.restore();
  }

  // The key, on the front panel's lower half, clear of every line.
  const t = g.trim;
  const kx = frontX + safe + inch(0.15);
  let ky = top + panelH * 0.52;
  const row = (str, color, weight = 400) => { text(str, kx, ky, small, color, { align: "left", weight, max: panelW - 2 * safe - inch(0.3) }); ky += small * 1.55; };
  row(`KDP cover template · ${t.w}" × ${t.h}" trim · ${g.pageCount} pages${paperLabel ? ` · ${paperLabel}` : ""}`, C.ink, 700);
  row(`Full cover ${fix(g.width / PT)} × ${fix(g.height / PT)} = ${W} × ${H} px at ${dpi} DPI · spine ${fix(g.spine / PT)}`, C.ink);
  row(`Pink: bleed, 0.125" that is trimmed off. Run background art to the outer edge.`, C.trim);
  row(`Red line: trim. Dark lines: spine folds.`, C.trim);
  row(`Blue dashes: keep all text inside (0.125" in from trim and folds).`, C.safe);
  row(`Hide or delete this layer before you export your cover PDF.`, C.ink, 700);
  row(`Made with the free spine calculator at puzzlepress.bananafest-destiny.com`, C.label);
  return canvas;
}
