// A YouTube Short for Trace Press: the size of a KDP cover for a tracing
// book, which is not two covers side by side. A fact-led Short, like
// video-kdpfacts.mjs. Every figure is read from the code the cover maker uses
// (src/pdf/cover-geometry.js: 0.125" bleed, KDP's paper thickness a page),
// the same figures as /tracing-book-cover-size, and the cover shown is the
// free A–Z sample's.
//
//   node scripts/video-coversize.mjs  → public/video/coversize-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium } from "playwright";
import { BLEED_IN, PAPER, SPINE_TEXT_MIN_PAGES, BARCODE_IN, coverGeometry } from "../src/pdf/cover-geometry.js";

const [W, H] = [1080, 1920];
const outName = "coversize-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "tp-coversize-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const inch = (pt, d = 3) => (pt / 72).toFixed(d);
const g26 = coverGeometry({ trim: "8.5x11", pageCount: 26, paper: "white" });
const g78 = coverGeometry({ trim: "8.5x11", pageCount: 78, paper: "white" });
const c26 = coverGeometry({ trim: "8.5x11", pageCount: 26, paper: "cream" });
const s26 = coverGeometry({ trim: "6x9", pageCount: 26, paper: "white" });
const F = {
  w26: inch(g26.width), h: inch(g26.height, 2), spine26: inch(g26.spine, 4),
  w78: inch(g78.width), spine78: inch(g78.spine, 4), wc26: inch(c26.width),
  w6x9: inch(s26.width), h6x9: inch(s26.height, 2),
  white: PAPER.white.thickness, cream: PAPER.cream.thickness,
};
console.log(F);

const samples = new URL("../public/samples/", import.meta.url).pathname;
execFileSync("pdftoppm", ["-r", "60", "-png", "-singlefile", join(samples, "letter-tracing-cover-sample-8.5x11.pdf"), join(tmp, "cover")]);
const COVER = `data:image/png;base64,${readFileSync(join(tmp, "cover.png")).toString("base64")}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);

const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:#f6f7f9;color:#234e3a;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h2{font-size:62px;margin:0 0 8px;letter-spacing:-.02em;line-height:1.15}
  .big{font-size:120px;font-weight:800;line-height:1;margin:0}
  img{width:1000px;border-radius:8px;box-shadow:0 8px 24px rgba(20,30,20,.18);background:#fff}
  p{font-size:36px;margin:10px 0 0;color:#5c6470;line-height:1.35}
  small{font-size:26px;color:#5c6470}
  .wrap{display:flex;width:1000px;height:200px;font-size:26px;font-weight:700;color:#fff}
  .wrap div{display:flex;align-items:center;justify-content:center}
  .b{background:#c0392b;width:28px}.p{background:#234e3a;flex:1}.s{background:#d68910;width:40px}`;
const scene = (body) => page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);

await scene(`<h2>Your KDP cover is not<br>17 × 11</h2><p>An 8.5 × 11 tracing book needs<br>one PDF: back, spine and front.</p><img src="${COVER}">`);
await wait(3800);

await scene(`<p>Cover width =</p>
  <div class="wrap"><div class="b"></div><div class="p">back 8.5"</div><div class="s"></div><div class="p">front 8.5"</div><div class="b"></div></div>
  <p><b style="color:#c0392b">${BLEED_IN}" bleed</b> + back + <b style="color:#d68910">spine</b> + front + <b style="color:#c0392b">${BLEED_IN}" bleed</b></p>
  <p>Height = ${BLEED_IN}" + 11" + ${BLEED_IN}" = ${F.h}"</p>`);
await wait(5200);

await scene(`<p>26 pages (A to Z), white paper</p><div class="big">${F.w26}"</div><p>wide × ${F.h}" high.<br>The spine is ${F.spine26}": ${F.white}" a page.</p>
  <p>78 pages: ${F.w78}" wide.<br>Cream paper is thicker: 26 pages, ${F.wc26}".</p>`);
await wait(5200);

await scene(`<p>A 6 × 9 book, 26 pages, white</p><div class="big">${F.w6x9}"</div><p>wide × ${F.h6x9}" high.</p>
  <p>No spine text: KDP allows it<br>from ${SPINE_TEXT_MIN_PAGES} pages. Leave a ${BARCODE_IN.w}" × ${BARCODE_IN.h}"<br>clear box on the back for the barcode.</p>
  <small>Source: KDP help, "Create a Paperback Cover"</small>`);
await wait(5200);

await scene(`<h2>Trace Press sizes the<br>cover from your book</h2>
  <p>Trim, pages and paper set the width.<br>Every size, all six trims, 26 to 78 pages,<br>is in one free table.</p>`);
await wait(3600);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#234e3a;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:92px;margin:0 0 14px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#cfe2d6;line-height:1.35}
  .u{margin-top:44px;font-size:40px;font-weight:700;background:#fff;color:#234e3a;padding:16px 28px;border-radius:14px;line-height:1.35}</style>
  <h1>Trace Press</h1><p>Type the address:</p><div class="u">tracepress.bananafest-destiny.com<br>/tracing-book-cover-size</div>`);
await wait(4400);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
