// Blank handwriting paper: every page is four-line guides top to bottom, the
// same rules as the workbook's free rows, inside the same KDP margins. Pure,
// like plan.js, so the page can preview it without pdf-lib.
import { pageGeometry, MIN_PAGES, PT } from "./kdp.js";
import { contentBox, GAP_UNITS } from "./page.js";

export const PAPER_PAGES = { min: MIN_PAGES, max: 300, default: 100 };

export function paperPage({ geom, pageNumber, guideIn }) {
  const box = contentBox(geom, pageNumber);
  const unit = (guideIn * PT) / 2;
  const pitch = (3 + GAP_UNITS) * unit;
  const rows = [];
  // The same packing as letterPage's rows: a row takes 2 units above its
  // baseline and 1 below.
  for (let top = box.top; top - 3 * unit >= box.bottom; top -= pitch) {
    rows.push({ kind: "free", unit, baseY: top - 2 * unit, left: box.left, right: box.right, letters: [] });
  }
  return { box, rows };
}

export function planPaper({ trim = "8.5x11", bleed = false, guideIn = 0.75, pageCount = PAPER_PAGES.default } = {}) {
  const n = Math.max(PAPER_PAGES.min, Math.min(PAPER_PAGES.max, Math.round(pageCount) || PAPER_PAGES.default));
  const geom = pageGeometry({ trim, bleed, pageCount: n });
  // Odd and even pages differ only in which side the gutter is on.
  const pair = [1, 2].map((pageNumber) => paperPage({ geom, pageNumber, guideIn }));
  return { geom, pageCount: n, pages: Array.from({ length: n }, (_, i) => pair[i % 2]) };
}
