// A YouTube Short for Trace Press: 6×9 or 8.5×11 for a tracing book. A
// fact-led Short, like video-coversize.mjs. The row counts are read from the
// layout code (letterPage in src/pdf/page.js), the pages shown are real pages
// of the book at each trim, drawn at the same scale, and the printing costs
// are KDP's (help page "Paperback Printing Cost", Amazon.com, black ink), the
// same figures as /how-to-make-a-handwriting-workbook.
//
//   node scripts/video-trims.mjs  → public/video/trims-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import { renderBook } from "../src/pdf/book.js";
import { letterPage } from "../src/pdf/page.js";
import { pageGeometry, TRIMS } from "../src/pdf/kdp.js";

const [W, H] = [1080, 1920];
const outName = "trims-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "tp-trims-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

// KDP printing cost, black ink, Amazon.com, a 26-page book.
const PRINT = { "8.5x11": 2.84, "6x9": 2.3 };
const PRICE = 7.99, RATE = 0.5; // below $9.99 the rate is 50%
const royalty = (t) => (RATE * PRICE - PRINT[t]).toFixed(2);
const rows = (trim, guideIn) => letterPage({ geom: pageGeometry({ trim, pageCount: 26 }), pageNumber: 1, letters: ["A", "a"], guideIn }).rows.length;
const F = {
  big1: rows("8.5x11", 1), small1: rows("6x9", 1), big45: rows("8.5x11", 0.45), small45: rows("6x9", 0.45),
  rBig: royalty("8.5x11"), rSmall: royalty("6x9"), diff: (PRINT["8.5x11"] - PRINT["6x9"]).toFixed(2),
};
console.log(F);
if (F.big1 !== 5 || F.small1 !== 4 || F.big45 !== 12 || F.small45 !== 9) throw new Error("row counts changed: update the scenes' wording");

// Page A of each book, 1" lines, at one scale: 62 px to the inch.
const fonts = {
  bold: readFileSync(new URL("../fonts/LiberationSans-Bold.ttf", import.meta.url)),
  regular: readFileSync(new URL("../fonts/LiberationSans-Regular.ttf", import.meta.url)),
};
const PX_IN = 62;
const img = {};
for (const trim of ["8.5x11", "6x9"]) {
  const whole = await PDFDocument.load(await renderBook({ trim, guideIn: 1 }, fonts));
  const one = await PDFDocument.create();
  const [p] = await one.copyPages(whole, [0]);
  one.addPage(p);
  writeFileSync(join(tmp, `${trim}.pdf`), await one.save());
  execFileSync("pdftoppm", ["-r", "144", "-png", "-singlefile", join(tmp, `${trim}.pdf`), join(tmp, trim)]);
  const t = TRIMS[trim];
  img[trim] = { src: `data:image/png;base64,${readFileSync(join(tmp, `${trim}.png`)).toString("base64")}`, w: Math.round(t.w * PX_IN), h: Math.round(t.h * PX_IN) };
}
const pages = (lines = true) => `<div class="pair">${["8.5x11", "6x9"].map((t) => `<figure><img src="${img[t].src}" style="width:${img[t].w}px;height:${img[t].h}px"><figcaption>${t.replace("x", " × ")}${lines ? `: ${t === "6x9" ? F.small1 : F.big1} rows` : ""}</figcaption></figure>`).join("")}</div>`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);

const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:#f6f7f9;color:#234e3a;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h2{font-size:62px;margin:0 0 8px;letter-spacing:-.02em;line-height:1.15}
  .big{font-size:120px;font-weight:800;line-height:1;margin:0}
  p{font-size:36px;margin:10px 0 0;color:#5c6470;line-height:1.35}
  small{font-size:26px;color:#5c6470}
  .pair{display:flex;gap:36px;align-items:flex-end}
  figure{margin:0} figure img{display:block;background:#fff;box-shadow:0 8px 24px rgba(20,30,20,.18);border-radius:4px}
  figcaption{font-size:32px;font-weight:700;margin-top:14px}
  table{font-size:40px;border-collapse:collapse} td{padding:10px 22px} td+td{font-weight:800;text-align:right}`;
const scene = (body) => page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);

await scene(`<h2>6 × 9 or 8.5 × 11<br>for a tracing book?</h2>${pages(false)}<p>The same A page, drawn to scale.</p>`);
await wait(3800);

await scene(`<p>KDP printing, 26 pages,<br>black ink, Amazon.com</p>
  <table><tr><td>8.5 × 11</td><td>$${PRINT["8.5x11"].toFixed(2)}</td></tr><tr><td>6 × 9</td><td>$${PRINT["6x9"].toFixed(2)}</td></tr></table>
  <p>At $${PRICE} (50% royalty) you keep</p>
  <table><tr><td>8.5 × 11</td><td>$${F.rBig}</td></tr><tr><td>6 × 9</td><td>$${F.rSmall}</td></tr></table>
  <small>Sources: KDP help, "Paperback Printing Cost"<br>and "Paperback Royalty Rates on Amazon.com"</small>`);
await wait(5600);

await scene(`<p>What the $${F.diff} buys: room.<br>Rows on a letter page, 1" lines</p>${pages()}`);
await wait(5200);

await scene(`<p>With smaller 0.45" lines</p><div class="big">${F.big45} vs ${F.small45}</div><p>rows a page, 8.5 × 11 against 6 × 9.</p>
  <p>At 1" lines it was ${F.big1} vs ${F.small1}.<br>One more row on every letter page.</p>`);
await wait(4600);

await scene(`<h2>Trace Press shows<br>the page before you choose</h2>
  <p>Six KDP trims, four line sizes.<br>The guide has every cost worked out.</p>`);
await wait(3600);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#234e3a;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:92px;margin:0 0 14px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#cfe2d6;line-height:1.35}
  .u{margin-top:44px;font-size:40px;font-weight:700;background:#fff;color:#234e3a;padding:16px 28px;border-radius:14px;line-height:1.35}</style>
  <h1>Trace Press</h1><p>Type the address:</p><div class="u">tracepress.bananafest-destiny.com<br>/how-to-make-a-handwriting-workbook</div>`);
await wait(4400);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
