// A YouTube Short for Trace Press that leads with KDP facts a tracing-book
// seller needs (actual/2026-10-04.md). On Buffer's counts the Puzzle Press
// Shorts that lead with a fact had 59 to 77 views and the Trace Press tool
// Short 12. Each figure here is read from the code that the tool uses:
//   24-page minimum           src/pdf/kdp.js MIN_PAGES
//   spine text from 79 pages  src/pdf/cover-geometry.js SPINE_TEXT_MIN_PAGES
//   0.0586" spine at 26pp     cover-geometry.js, spineWidthInches(26, "white")
//   $2.84 flat to 110 pages   app/src/pdf/kdp-cost.js, KDP "Paperback Printing
//                             Cost", Amazon.com, black ink, large trim
// and every page shown is a real page of the free A–Z sample and its cover.
//
//   node scripts/video-kdpfacts.mjs  → public/video/kdpfacts-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium } from "playwright";
import { MIN_PAGES } from "../src/pdf/kdp.js";
import { SPINE_TEXT_MIN_PAGES, spineWidthInches } from "../src/pdf/cover-geometry.js";
import { printingCost } from "../../app/src/pdf/kdp-cost.js";

const [W, H] = [1080, 1920];
const outName = "kdpfacts-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "tp-kdpfacts-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const SPINE_26 = spineWidthInches(26, "white").toFixed(4);
const COST_26 = printingCost({ trim: "8.5x11", pages: 26 }).cost;
const COST_110 = printingCost({ trim: "8.5x11", pages: 110 }).cost;
console.log({ MIN_PAGES, SPINE_TEXT_MIN_PAGES, SPINE_26, COST_26, COST_110 });

const samples = new URL("../public/samples/", import.meta.url).pathname;
const png = (file, n, name, r = 60) => {
  execFileSync("pdftoppm", ["-r", String(r), "-png", "-f", String(n), "-l", String(n), "-singlefile", join(samples, file), join(tmp, name)]);
  return `data:image/png;base64,${readFileSync(join(tmp, `${name}.png`)).toString("base64")}`;
};
const book = "letter-tracing-workbook-sample-8.5x11.pdf";
const [A, B, M, Z] = [[1, "a"], [2, "b"], [13, "m"], [26, "z"]].map(([n, w]) => png(book, n, w));
const COVER = png("letter-tracing-cover-sample-8.5x11.pdf", 1, "cover", 60);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);

const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:#f6f7f9;color:#234e3a;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h2{font-size:62px;margin:0 0 8px;letter-spacing:-.02em;line-height:1.15}
  .big{font-size:150px;font-weight:800;line-height:1;margin:0}
  .row{display:flex;gap:24px;justify-content:center;width:100%}
  .row img{flex:1;min-width:0}
  img{width:100%;border-radius:8px;box-shadow:0 8px 24px rgba(20,30,20,.18);background:#fff}
  p{font-size:36px;margin:10px 0 0;color:#5c6470;line-height:1.35}
  small{font-size:26px;color:#5c6470}`;
const scene = (body) => page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);

await scene(`<h2>Making a tracing book<br>for Amazon KDP?</h2><p>Three numbers to know<br>before you start.</p>`);
await wait(3000);

await scene(`<p>KDP's shortest paperback</p><div class="big">${MIN_PAGES} pages</div>
  <p>One page a letter, A to Z, is 26.<br>So an alphabet book clears it.</p>
  <div class="row"><img src="${A}"><img src="${B}"><img src="${M}"><img src="${Z}"></div>`);
await wait(4800);

await scene(`<p>Spine text is allowed from</p><div class="big">${SPINE_TEXT_MIN_PAGES} pages</div>
  <p>A 26-page book on white paper has a<br>${SPINE_26}" spine. Leave it blank.</p>
  <img src="${COVER}" style="width:1000px">`);
await wait(4800);

await scene(`<p>Printing, black ink, 8.5 x 11, Amazon.com</p><div class="big">$${COST_26.toFixed(2)}</div>
  <p>the same for every book from 24 to 110 pages.<br>Pages past 26 cost nothing more to print.</p>
  <small>Source: KDP help, "Paperback Printing Cost"</small>`);
await wait(4800);

await scene(`<h2>Trace Press makes the book<br>and the cover for KDP</h2>
  <p>A to Z with start dots and arrows,<br>numbers, your own words, six trim sizes.<br>Free to make, no sign-up.</p>`);
await wait(3800);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#234e3a;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:92px;margin:0 0 14px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#cfe2d6;line-height:1.35}
  .u{margin-top:44px;font-size:46px;font-weight:700;background:#fff;color:#234e3a;padding:16px 28px;border-radius:14px;line-height:1.35}</style>
  <h1>Trace Press</h1><p>Type the address:</p><div class="u">tracepress.bananafest-destiny.com</div>`);
await wait(4200);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
