// A YouTube Short for the free cursive practice sheets for adults
// (/cursive-practice-sheets-for-adults), aimed at the same audience as the
// cursive chart Short (the most-watched Trace Press Short, 86 views by 10-12).
// Every page in it is a real page of the free PDFs: the adult sheets on 0.45"
// lines and the children's cursive worksheets, both page 7 (G). The row counts,
// 12 and 5, are counted from those two pages.
//
//   node scripts/video-adults.mjs  → public/video/adults-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium } from "playwright";
const [W, H] = [1080, 1920];
const outName = "adults-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "tp-adults-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const png = (file, n, name, r) => {
  const pdf = new URL(`../public/samples/${file}`, import.meta.url).pathname;
  execFileSync("pdftoppm", ["-r", String(r), "-png", "-f", String(n), "-l", String(n), "-singlefile", pdf, join(tmp, name)]);
  return `data:image/png;base64,${readFileSync(join(tmp, `${name}.png`)).toString("base64")}`;
};
// Pages 1 to 26 are A to Z.
const ADULT = png("cursive-practice-sheets-for-adults.pdf", 7, "adult", 110);
const CLOSE = png("cursive-practice-sheets-for-adults.pdf", 7, "close", 220);
const KID = png("cursive-letter-tracing-worksheets.pdf", 7, "kid", 60);
const ADULT_SMALL = png("cursive-practice-sheets-for-adults.pdf", 7, "adultsmall", 60);
const M = png("cursive-practice-sheets-for-adults.pdf", 13, "m", 60);
const Z = png("cursive-practice-sheets-for-adults.pdf", 26, "z", 60);

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
  .big{font-size:96px;font-weight:800;line-height:1}
  p{font-size:34px;margin:14px 0 0;color:#5c6470;line-height:1.35}
  .crop{width:1000px;height:400px;overflow:hidden;border-radius:8px;box-shadow:0 8px 24px rgba(20,30,20,.18);background:#fff}
  .crop img{width:118%;margin:-40px 0 0 -9%;display:block;border-radius:0;box-shadow:none}`;
const scene = (body) => page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);

await scene(`<h2>Cursive practice sheets<br>sized for adults</h2>
  <div style="width:760px">${card(ADULT, "Free, A to Z, one page a letter")}</div>`);
await wait(4000);

await scene(`<h2>Children's sheets<br>vs these</h2>
  <div class="row">${card(KID, "5 rows a page")}${card(ADULT_SMALL, "12 rows a page")}</div>
  <p>Smaller lines, 0.45" tall,<br>so more practice on each page.</p>`);
await wait(4800);

await scene(`<h2>The letter in solid cursive,<br>then rows to write over</h2>
  <div class="crop"><img src="${CLOSE}"></div>
  <p>Then rows with one letter<br>to start you off.</p>`);
await wait(4400);

await scene(`<div class="big">26</div><p>sheets, Aa to Zz, as one PDF</p>
  <div class="row" style="width:760px">${card(M, "m")}${card(Z, "z")}</div>`);
await wait(4000);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#234e3a;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:92px;margin:0 0 14px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#cfe2d6;line-height:1.35}
  .u{margin-top:44px;font-size:42px;font-weight:700;background:#fff;color:#234e3a;padding:16px 28px;border-radius:14px;line-height:1.35}</style>
  <h1>Trace Press</h1><p>Free, no sign-up.<br>The sheets are at</p><div class="u">tracepress.bananafest-destiny.com<br>/cursive-practice-sheets-for-adults</div>`);
await wait(4200);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
