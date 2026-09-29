// Does the ink actually stay inside KDP's margins? test/layout.test.js checks
// the numbers the layout computes; this renders real PDFs and reads pixels,
// which is what catches a mark drawn somewhere the layout didn't account for.
// Adapted from Puzzle Press's app/test/inkcheck.mjs.
//
// Run: node test/inkcheck.mjs  (TRIMS=5x8,6x9 to narrow the trims)
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { renderBook, planBook, GUIDES } from "../src/pdf/book.js";
import { marginsForPage, PT, TRIMS } from "../src/pdf/kdp.js";

const DPI = 100;
const INK = 200; // grey level below which a pixel counts as ink
const tmp = mkdtempSync(join(tmpdir(), "tp-ink-"));
const fonts = { bold: readFileSync(new URL("../fonts/LiberationSans-Bold.ttf", import.meta.url)) };
let failed = 0, pages = 0;

for (const trim of (process.env.TRIMS?.split(",") ?? Object.keys(TRIMS))) for (const bleed of [false, true]) {
  for (const [age, guideIn] of Object.entries(GUIDES)) {
    const opts = { trim, bleed, guideIn };
    const pdf = join(tmp, `${trim}-${bleed}-${guideIn}.pdf`);
    writeFileSync(pdf, await renderBook(opts, fonts));
    const { geom, pages: plan } = planBook(opts);
    const prefix = join(tmp, `p${Math.random().toString(36).slice(2, 7)}`);
    execFileSync("pdftoppm", ["-r", String(DPI), "-png", "-gray", pdf, prefix]);
    const files = readdirSync(tmp).filter((f) => f.startsWith(prefix.split("/").pop())).sort();
    if (files.length !== plan.length) { failed++; console.log(`FAIL ${trim} ${age}: ${files.length} pages rendered, ${plan.length} planned`); }
    for (const [i, f] of files.entries()) {
      pages++;
      const png = PNG.sync.read(readFileSync(join(tmp, f)));
      const m = marginsForPage(geom, i + 1);
      const px = (pts) => Math.ceil((pts / PT) * DPI); // a pixel partly in the margin counts as in it
      const left = px(m.left), right = png.width - px(m.right), top = px(m.top), bottom = png.height - px(m.bottom);
      let worst = null;
      for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
        const v = png.data[(png.width * y + x) << 2];
        if (v >= INK || (x >= left && x < right && y >= top && y < bottom)) continue;
        if (!worst || v < worst.v) worst = { x, y, v, where: x < left ? "left" : x >= right ? "right" : y < top ? "top" : "bottom" };
      }
      if (worst) {
        failed++;
        console.log(`FAIL ${trim}${bleed ? " bleed" : ""} ${age} p${i + 1}: ink in the ${worst.where} margin at ${worst.x},${worst.y} (box x ${left}..${right}, y ${top}..${bottom})`);
        break;
      }
    }
    for (const f of files) rmSync(join(tmp, f));
  }
}

rmSync(tmp, { recursive: true, force: true });
if (failed) { console.log(`\n${failed} margin problem(s)`); process.exit(1); }
console.log(`INK OK: ${pages} pages, ${Object.keys(TRIMS).length} trims × bleed on and off × ${Object.keys(GUIDES).length} guide sizes, every pixel of ink inside KDP's margins`);
