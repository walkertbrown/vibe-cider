// The kindergarten sheet pages (CVC words, count and trace): pick a line
// size and US Letter or A4, page through the sheets as they print, download the PDF. Free with a
// footer line; the $19 licence takes it off. <body data-kind> says which.
import { planCvc, planCount, sheetInk, PAPERS, SHEET_GUIDES } from "../pdf/sheets.js";
import { GUIDES } from "../pdf/plan.js";
import { getLicense, PRICE_LABEL } from "./license.js";
import { pageSvg } from "./preview.js";
import { px } from "./px.js";

const SUPPORT = "support@bananafest-destiny.com";
const KIND = document.body.dataset.kind === "count" ? "count" : "cvc";
const plan = KIND === "count" ? planCount : planCvc;
const $ = (id) => document.getElementById(id);
const el = { age: $("age"), paper: $("paper"), preview: $("preview"), prev: $("prev"), next: $("next"), pageNo: $("pageNo"), download: $("download"), status: $("status"), tier: $("tier") };

for (const [label, inches] of Object.entries(GUIDES)) if (SHEET_GUIDES[KIND].includes(inches)) el.age.add(new Option(`${label} — ${inches}" lines`, String(inches), false, inches === 0.75));
for (const [key, label] of Object.entries(PAPERS)) el.paper.add(new Option(label, key));
const opts = () => ({ kind: KIND, guideIn: Number(el.age.value), paper: el.paper.value, licensed: !!getLicense() });

let pageIndex = 0;
function show() {
  const o = opts();
  const { geom, pages } = plan(o);
  pageIndex = Math.min(pageIndex, pages.length - 1);
  const svg = pageSvg(geom, null, { shapes: sheetInk(pages[pageIndex], { licensed: o.licensed }) });
  svg.setAttribute("aria-label", `Worksheet page ${pageIndex + 1} of ${pages.length}`);
  el.preview.replaceChildren(svg);
  el.pageNo.textContent = `Page ${pageIndex + 1} of ${pages.length}`;
  el.prev.disabled = pageIndex === 0;
  el.next.disabled = pageIndex >= pages.length - 1;
  el.tier.textContent = o.licensed
    ? `Unlocked for ${getLicense().email}: no footer line.`
    : `Free, with one footer line on each page. The Trace Press licence (${PRICE_LABEL}, unlocked on the home page) takes it off.`;
}

for (const c of [el.age, el.paper]) c.addEventListener("change", (e) => { if (e.isTrusted) px(`${KIND}touched`); show(); });
el.prev.addEventListener("click", () => { pageIndex--; show(); });
el.next.addEventListener("click", () => { pageIndex++; show(); });

let renderMod = null;
const loadRender = () => (renderMod ??= Promise.all([
  import("../pdf/book.js"),
  fetch("/fonts/LiberationSans-Bold.ttf").then((r) => r.arrayBuffer()),
  fetch("/fonts/LiberationSans-Regular.ttf").then((r) => r.arrayBuffer()),
]).catch((err) => { renderMod = null; throw err; }));

el.download.addEventListener("click", async () => {
  px(`${KIND}download`);
  el.download.disabled = true;
  el.status.textContent = "Making your PDF…";
  try {
    const [{ renderSheets }, bold, regular] = await loadRender();
    const o = opts();
    const bytes = await renderSheets(o, { bold: new Uint8Array(bold), regular: new Uint8Array(regular) });
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${KIND === "count" ? "count-and-trace-1-10" : "cvc-word-worksheets"}-${o.guideIn}in${o.paper === "a4" ? "-a4" : ""}.pdf`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    px(`${KIND}made`);
    el.status.textContent = `Downloaded. Print at 100% on ${PAPERS[o.paper]}.`;
  } catch (err) {
    px("failed");
    el.status.textContent = `Could not make the PDF: ${err.message}. Reload the page and try again, or email ${SUPPORT}.`;
  } finally {
    el.download.disabled = false;
  }
});

px(KIND);
show();
