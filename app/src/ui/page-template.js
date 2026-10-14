// An interior page template for the margin calculator: one PNG at 300 DPI, the
// size of the PDF page KDP expects, with the trim, the bleed (when it is on)
// and the margins drawn on it. Somebody laying out pages in Canva or Affinity
// drops it in as the bottom layer and keeps everything that must print inside
// the blue box.
//
// Odd and even pages differ: the gutter (inside margin) is on the left of odd,
// right-hand pages and on the right of even ones, and with bleed the extra
// 0.125" is on the outside edge only. So there is one template per side. Every
// line comes from pageGeometry() and marginsForPage(), the functions the book
// generator lays out its own pages with. Pixel sizes round up, as the bleed
// table on the page does.
import { PT, marginsForPage } from "../pdf/kdp.js";

const C = {
  bleed: "#f9d6d6", trim: "#c0392b", safe: "#2f6fd6", live: "#eef3fb",
  gutter: "#e3e9f2", label: "#9aa3ad", ink: "#1d3557",
};

// g: pageGeometry(). pageNo: 1 for an odd (right-hand) page, 2 for even.
export function drawPageTemplate(g, { pageNo = 1, pageCount = 0, dpi = 300, doc = document } = {}) {
  const s = dpi / PT;
  const W = Math.ceil((g.width / PT) * dpi), H = Math.ceil((g.height / PT) * dpi);
  const canvas = doc.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext("2d");
  const inch = (n) => n * dpi;
  const m = marginsForPage(g, pageNo);
  const b = g.bleed * s;
  // The trim box: with bleed, the extra width is on the outside edge.
  const tx = m.rightHand ? 0 : b, tw = W - b, ty = b, th = H - 2 * b;
  const L = m.left * s, R = m.right * s, T = m.top * s, B = m.bottom * s;
  const lw = Math.max(2, dpi / 100);

  c.fillStyle = b ? C.bleed : "#fff";
  c.fillRect(0, 0, W, H);
  c.fillStyle = "#fff";
  c.fillRect(tx, ty, tw, th);
  // The gutter strip, shaded so the side is unmistakable.
  c.fillStyle = C.gutter;
  if (m.rightHand) c.fillRect(0, ty, L, th);
  else c.fillRect(W - R, ty, R, th);
  c.fillStyle = C.live;
  c.fillRect(L, T, W - L - R, H - T - B);

  c.setLineDash([]);
  c.lineWidth = lw;
  if (b) {
    c.strokeStyle = C.trim;
    c.strokeRect(tx, ty, tw, th);
  }
  c.strokeStyle = C.safe;
  c.setLineDash([lw * 6, lw * 4]);
  c.strokeRect(L, T, W - L - R, H - T - B);
  c.setLineDash([]);

  const text = (str, x, y, px, color, { align = "center", weight = 700, max, rotate = 0 } = {}) => {
    c.save();
    c.translate(x, y);
    c.rotate(rotate);
    c.font = `${weight} ${Math.round(px)}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    c.fillStyle = color;
    c.textAlign = align;
    c.textBaseline = "middle";
    c.fillText(str, 0, 0, max);
    c.restore();
  };
  const fix = (n) => `${(Math.round(n * 1000) / 1000).toString()}"`;
  const small = inch(0.1), big = inch(0.3);
  const gx = m.rightHand ? L / 2 : W - R / 2;
  text(`GUTTER (inside) ${fix((m.rightHand ? m.left : m.right) / PT)}`, gx, H / 2, Math.min(small, (m.rightHand ? L : R) * 0.5), C.ink, { rotate: m.rightHand ? -Math.PI / 2 : Math.PI / 2 });

  const liveW = W - L - R;
  const cx = L + liveW / 2;
  text(m.rightHand ? "ODD PAGE" : "EVEN PAGE", cx, T + (H - T - B) * 0.3, big, C.label, { max: liveW * 0.9 });
  text(m.rightHand ? "right-hand page: 1, 3, 5…" : "left-hand page: 2, 4, 6…", cx, T + (H - T - B) * 0.3 + big, small * 1.3, C.label, { weight: 600, max: liveW * 0.9 });

  let ky = T + (H - T - B) * 0.48;
  const row = (str, color, weight = 400) => { text(str, cx, ky, small, color, { weight, max: liveW * 0.92 }); ky += small * 1.6; };
  const t = g.trim;
  row(`KDP interior template · ${t.w}" × ${t.h}" trim${pageCount ? ` · ${pageCount} pages` : ""}${b ? " · with bleed" : ""}`, C.ink, 700);
  row(`PDF page ${fix(g.width / PT)} × ${fix(g.height / PT)} = ${W} × ${H} px at ${dpi} DPI`, C.ink);
  row(`Blue dashes: KDP's minimum margins. Keep all text inside.`, C.safe);
  row(`Inside ${fix(g.margin.inner / PT)} · outside ${fix(g.margin.outer / PT)} · top and bottom ${fix(g.margin.top / PT)}, from the page edge`, C.safe);
  if (b) row(`Pink: bleed, 0.125" trimmed off. Art meant to bleed runs to the edge.`, C.trim);
  row(`Hide or delete this layer before you export your PDF.`, C.ink, 700);
  row(`Made with the free margin calculator at puzzlepress.bananafest-destiny.com`, C.label);
  return canvas;
}
