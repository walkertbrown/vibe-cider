// The handwriting paper page: pick a trim, a line size and a page count, see
// a left and a right page as they print, download the PDF. Free, so no
// licence and no footer.
import { planPaper, PAPER_PAGES } from "../pdf/paper.js";
import { GUIDES } from "../pdf/plan.js";
import { TRIMS } from "../pdf/kdp.js";
import { pageSvg } from "./preview.js";
import { px } from "./px.js";

const SUPPORT = "support@bananafest-destiny.com";
const $ = (id) => document.getElementById(id);
const el = { trim: $("trim"), age: $("age"), pages: $("pages"), bleed: $("bleed"), preview: $("preview"), prev: $("prev"), next: $("next"), pageNo: $("pageNo"), download: $("download"), status: $("status") };

for (const [key, t] of Object.entries(TRIMS)) el.trim.add(new Option(t.label, key, false, key === "8.5x11"));
for (const [label, inches] of Object.entries(GUIDES)) el.age.add(new Option(`${label} — ${inches}" lines`, String(inches), false, inches === 0.75));

let side = 1; // 1: a right-hand (odd) page, 0: a left-hand (even) page
const opts = () => ({ trim: el.trim.value, bleed: el.bleed.checked, guideIn: Number(el.age.value), pageCount: Number(el.pages.value) || PAPER_PAGES.default });

function show() {
  const { geom, pages, pageCount } = planPaper(opts());
  const i = side === 1 ? 0 : 1;
  const svg = pageSvg(geom, pages[i], { licensed: true });
  svg.setAttribute("aria-label", `A ${side === 1 ? "right" : "left"}-hand page of handwriting practice lines`);
  el.preview.replaceChildren(svg);
  el.pageNo.textContent = `${side === 1 ? "Right-hand (odd) page" : "Left-hand (even) page"} · ${pages[i].rows.length} rows · ${pageCount} pages`;
  el.prev.disabled = side === 0;
  el.next.disabled = side === 1;
}

for (const c of [el.trim, el.age, el.bleed, el.pages]) c.addEventListener("change", (e) => { if (e.isTrusted) px("papertouched"); show(); });
el.prev.addEventListener("click", () => { side = 0; show(); });
el.next.addEventListener("click", () => { side = 1; show(); });

el.download.addEventListener("click", async () => {
  px("paperdownload");
  el.download.disabled = true;
  el.status.textContent = "Making your PDF…";
  try {
    const { renderPaper } = await import("../pdf/book.js");
    const o = opts();
    const { pageCount } = planPaper(o);
    const bytes = await renderPaper(o);
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `handwriting-paper-${o.trim}${o.bleed ? "-bleed" : ""}-${String(o.guideIn).replace(".", "")}in-${pageCount}p.pdf`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    px("papermade");
    el.status.textContent = `Downloaded: ${pageCount} pages.`;
  } catch (err) {
    px("failed");
    el.status.textContent = `Could not make the PDF: ${err.message}. Reload the page and try again, or email ${SUPPORT}.`;
  } finally {
    el.download.disabled = false;
  }
});

px("paper");
show();
