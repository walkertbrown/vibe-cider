// A cursive YouTube Short for Trace Press (actual/2026-10-05.md). Like the
// Halloween Short it leads with a free thing, and every page in it is a real
// page of the free PDFs: the one-page cursive alphabet chart, and the 26-page
// cursive letter tracing worksheets.
//
//   node scripts/video-cursive.mjs  → public/video/cursive-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium } from "playwright";
const [W, H] = [1080, 1920];
const outName = "cursive-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "tp-cursive-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const png = (file, n, name, r) => {
  const pdf = new URL(`../public/samples/${file}`, import.meta.url).pathname;
  execFileSync("pdftoppm", ["-r", String(r), "-png", "-f", String(n), "-l", String(n), "-singlefile", pdf, join(tmp, name)]);
  return `data:image/png;base64,${readFileSync(join(tmp, `${name}.png`)).toString("base64")}`;
};
const CHART = png("cursive-alphabet-chart.pdf", 1, "chart", 110);
const CLOSE = png("cursive-alphabet-chart.pdf", 1, "close", 220);
// Pages 1 to 26 are A to Z.
const [F, Q] = [[6, "f"], [17, "q"]].map(([n, w]) => png("cursive-letter-tracing-worksheets.pdf", n, w, 60));

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
  p{font-size:32px;margin:14px 0 0;color:#5c6470;line-height:1.35}
  .crop{width:1000px;height:470px;overflow:hidden;border-radius:8px;box-shadow:0 8px 24px rgba(20,30,20,.18);background:#fff}
  .crop img{width:118%;margin:-95px 0 0 -9%;display:block;border-radius:0;box-shadow:none}`;
const scene = (body) => page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);

await scene(`<h2>Free cursive<br>alphabet chart</h2>
  <div style="width:760px">${card(CHART, "Aa to Zz, then 0 to 9, on one page")}</div>`);
await wait(4000);

await scene(`<h2>Capital and lowercase<br>side by side</h2>
  <div class="crop"><img src="${CLOSE}"></div>
  <p>On four-line handwriting guides,<br>so you can see where each letter<br>starts and stops.</p>`);
await wait(4400);

await scene(`<h2>To practise, not just look:<br>a page for every letter</h2>
  <div class="row">${card(F, "f")}${card(Q, "q")}</div>
  <p>The letter once in solid cursive,<br>then rows of it in grey to write over.<br>A to Z, 26 pages, also free.</p>`);
await wait(4600);

await scene(`<h2>Making a cursive workbook<br>to sell on Amazon KDP?</h2>
  <div class="c">A to Z, numbers, your own words</div><div class="c">A matching full-wrap cover</div><div class="c">Six KDP trim sizes</div>
  <p>Free to make the whole book, no sign-up.</p>`);
await wait(4000);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#234e3a;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:92px;margin:0 0 14px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#cfe2d6;line-height:1.35}
  .u{margin-top:44px;font-size:42px;font-weight:700;background:#fff;color:#234e3a;padding:16px 28px;border-radius:14px;line-height:1.35}</style>
  <h1>Trace Press</h1><p>The free cursive chart<br>is at</p><div class="u">tracepress.bananafest-destiny.com<br>/cursive-alphabet-chart</div>`);
await wait(4200);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
