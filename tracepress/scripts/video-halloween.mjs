// A Halloween YouTube Short for Trace Press (actual/2026-10-03.md). The first
// Short, about the tool, had 11 views; the Puzzle Press Shorts that lead with a
// fact or a free thing had 59 to 76. So this one leads with the free Halloween
// worksheets, and every page in it is a real page of that PDF.
//
//   node scripts/video-halloween.mjs  → public/video/halloween-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium } from "playwright";
const [W, H] = [1080, 1920];
const outName = "halloween-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "tp-halloween-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

// Pages 1 to 20 are the words in the page's order; 21 is the closing page.
const pdf = new URL("../public/samples/halloween-tracing-worksheets.pdf", import.meta.url).pathname;
const pagePng = (n, name, r = 60) => {
  execFileSync("pdftoppm", ["-r", String(r), "-png", "-f", String(n), "-l", String(n), "-singlefile", pdf, join(tmp, name)]);
  return `data:image/png;base64,${readFileSync(join(tmp, `${name}.png`)).toString("base64")}`;
};
const BAT = pagePng(1, "bat", 90);
const [GHOST, SPIDER, PUMPKIN, MUSHROOM] = [[11, "ghost"], [15, "spider"], [18, "pumpkin"], [20, "mushroom"]].map(([n, w]) => pagePng(n, w));
const CLOSE = pagePng(18, "close", 220);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);

const card = (img, label) => `<figure><img src="${img}"><figcaption>${label}</figcaption></figure>`;
const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:#f6f7f9;color:#234e3a;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h2{font-size:58px;margin:0 0 8px;letter-spacing:-.02em;line-height:1.15}
  .row{display:flex;gap:28px;justify-content:center;align-items:flex-start;width:100%}
  figure{margin:0;flex:1} img{width:100%;border-radius:8px;box-shadow:0 8px 24px rgba(20,30,20,.18);background:#fff}
  figcaption{font-size:32px;margin-top:14px;color:#5c6470;line-height:1.3}
  div.c{font-size:40px;font-weight:700;background:#fff;padding:18px 28px;border-radius:14px;box-shadow:0 8px 24px rgba(20,30,20,.10)}
  p{font-size:32px;margin:14px 0 0;color:#5c6470;line-height:1.35}`;
const scene = (body, extra = "") => page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}${extra}</style>${body}`);

await scene(`<h2>Free Halloween<br>tracing worksheets</h2>
  <div style="width:780px">${card(BAT, "bat: picture, then the word to trace")}</div>`);
await wait(3800);

await scene(`<h2>Twenty words, one a page</h2>
  <div class="row">${card(GHOST, "ghost")}${card(SPIDER, "spider")}</div>
  <div class="row">${card(PUMPKIN, "pumpkin")}${card(MUSHROOM, "mushroom")}</div>
  <p>from bat, three letters, to mushroom, eight</p>`);
await wait(4200);

await scene(`<h2>Numbered start dots<br>and arrows on every letter</h2>
  <div class="crop"><img src="${CLOSE}"></div>
  <p>A stroke is one movement of the pencil.<br>These twenty words take 115 in all.</p>`,
  ` .crop{width:1000px;height:262px;overflow:hidden;border-radius:8px;box-shadow:0 8px 24px rgba(20,30,20,.18);background:#fff}
    .crop img{width:100%;margin-top:-235px;display:block;border-radius:0;box-shadow:none}`);
await wait(4200);

await scene(`<h2>Selling tracing books<br>on Amazon KDP?</h2>
  <div class="c">A to Z, then these 20 words: 46 pages</div><div class="c">A matching full-wrap cover</div><div class="c">Six KDP trim sizes</div>
  <p>Free to make the whole book, no sign-up.</p>`);
await wait(4000);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#234e3a;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:92px;margin:0 0 14px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#cfe2d6;line-height:1.35}
  .u{margin-top:44px;font-size:42px;font-weight:700;background:#fff;color:#234e3a;padding:16px 28px;border-radius:14px;line-height:1.35}</style>
  <h1>Trace Press</h1><p>The free Halloween worksheets<br>are at</p><div class="u">tracepress.bananafest-destiny.com<br>/halloween-tracing-worksheets</div>`);
await wait(4200);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
