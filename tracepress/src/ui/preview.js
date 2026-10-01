// A letter page as SVG, from the same shape list (pdf/ink.js) the PDF is drawn
// from, so what the preview shows is what the book prints. No pdf-lib here:
// the preview is on screen before the heavy PDF code has loaded.
import { pageInk } from "../pdf/ink.js";

const NS = "http://www.w3.org/2000/svg";
const css = ([r, g, b]) => `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;

// PDF space has y up from the bottom of the page; SVG has y down.
// `shapes`, when given, is drawn instead of the layout's own ink.
export function pageSvg(geom, layout, { licensed = false, shapes } = {}) {
  const H = geom.height;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${geom.width} ${H}`);
  svg.setAttribute("role", "img");
  const add = (tag, attrs, text) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v != null) n.setAttribute(k, v);
    if (text != null) n.textContent = text;
    svg.append(n);
  };
  add("rect", { x: 0, y: 0, width: geom.width, height: H, fill: "#fff" });
  for (const s of shapes ?? pageInk(layout, { licensed })) {
    if (s.kind === "line") {
      add("line", { x1: s.x1, y1: H - s.y1, x2: s.x2, y2: H - s.y2, stroke: css(s.color), "stroke-width": s.width, "stroke-dasharray": s.dash?.join(" ") });
    } else if (s.kind === "dot") {
      add("circle", { cx: s.x, cy: H - s.y, r: s.r, fill: css(s.color) });
    } else if (s.kind === "tri") {
      add("polygon", { points: s.pts.map(([x, y]) => `${x},${H - y}`).join(" "), fill: css(s.color) });
    } else if (s.kind === "path") {
      add("path", { d: s.d, transform: `translate(${s.x} ${H - s.y}) scale(${s.scale})`, fill: css(s.color) });
    } else if (s.kind === "text") {
      add("text", { x: s.x, y: H - s.y, "font-size": s.size, "font-family": "Liberation Sans, Arial, Helvetica, sans-serif", "font-weight": s.font === "bold" ? 700 : 400, fill: css(s.color), "text-anchor": "middle" }, s.text);
    }
  }
  return svg;
}
