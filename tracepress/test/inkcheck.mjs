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
import fontkit from "@pdf-lib/fontkit";
import { cursiveWidth } from "../src/pdf/cursive.js";

const DPI = 100;
const INK = 200; // grey level below which a pixel counts as ink
const tmp = mkdtempSync(join(tmpdir(), "tp-ink-"));
// Free books: they carry everything a paid book does plus the watermark line.
const fonts = { bold: readFileSync(new URL("../fonts/LiberationSans-Bold.ttf", import.meta.url)), regular: readFileSync(new URL("../fonts/LiberationSans-Regular.ttf", import.meta.url)), cursive: readFileSync(new URL("../public/fonts/PlaywriteUSTrad.ttf", import.meta.url)) };
const cursiveFont = fontkit.create(fonts.cursive);
// Cursive books too, with digits and long words, whose rows are fitted to the width,
// and print books with a picture on each letter page ("A is for apple") and
// stars to count on number pages 1–9.
const SCRIPTS = { print: {}, abc: { abc: true, numbers: true }, cursive: { script: "cursive", numbers: true, words: "butterfly,Grandma", measure: (t, u) => cursiveWidth(cursiveFont, t, u) } };
let failed = 0, pages = 0;

for (const trim of (process.env.TRIMS?.split(",") ?? Object.keys(TRIMS))) for (const bleed of [false, true]) {
  for (const [age, guideIn] of Object.entries(GUIDES)) for (const [script, extra] of Object.entries(SCRIPTS)) {
    const opts = { trim, bleed, guideIn, ...extra };
    const pdf = join(tmp, `${trim}-${bleed}-${guideIn}-${script}.pdf`);
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
        console.log(`FAIL ${trim}${bleed ? " bleed" : ""} ${age} ${script} p${i + 1}: ink in the ${worst.where} margin at ${worst.x},${worst.y} (box x ${left}..${right}, y ${top}..${bottom})`);
        break;
      }
    }
    for (const f of files) rmSync(join(tmp, f));
  }
}

rmSync(tmp, { recursive: true, force: true });
if (failed) { console.log(`\n${failed} margin problem(s)`); process.exit(1); }
console.log(`INK OK: ${pages} pages, ${Object.keys(TRIMS).length} trims × bleed on and off × ${Object.keys(GUIDES).length} guide sizes × print, print with pictures and cursive, every pixel of ink inside KDP's margins`);
