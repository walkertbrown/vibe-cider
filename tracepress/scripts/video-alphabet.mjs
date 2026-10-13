// A YouTube Short for the free print alphabet chart, the sibling of the
// cursive chart Short (the most-watched Trace Press Short, 86 views by 10-12).
// It leads with a fact about the chart's letters, from /alphabet-chart's own
// "How the letters are drawn": a, d, g and q are each a circle and a straight
// line, and g and q are told apart by their tails. Every picture is a real
// page of the free PDFs: the one-page chart, and the A–Z letter tracing sample.
//
//   node scripts/video-alphabet.mjs  → public/video/alphabet-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium } from "playwright";
const [W, H] = [1080, 1920];
const outName = "alphabet-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "tp-alphabet-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const png = (file, n, name, r) => {
  const pdf = new URL(`../public/samples/${file}`, import.meta.url).pathname;
  execFileSync("pdftoppm", ["-r", String(r), "-png", "-f", String(n), "-l", String(n), "-singlefile", pdf, join(tmp, name)]);
  return `data:image/png;base64,${readFileSync(join(tmp, `${name}.png`)).toString("base64")}`;
};
const CHART = png("alphabet-chart.pdf", 1, "chart", 110);
const BIG = png("alphabet-chart.pdf", 1, "big", 220);
// One letter cut from the 220 dpi chart: a box in inches from the page's top left.
const BOX = { a: [1.38, 0.88], d: [7.25, 0.88], g: [5.31, 2.0], q: [1.38, 5.28] };
const cut = (l, size) => `<div class="cut" style="width:${size}px;height:${size * 4 / 3}px"><img src="${BIG}" style="width:${8.5 * 220 * size / (0.75 * 220)}px;margin:${-BOX[l][1] * size / 0.75}px 0 0 ${-BOX[l][0] * size / 0.75}px"></div>`;
// Pages 1 to 26 of the sample are A to Z.
const [G, Q] = [[7, "g"], [17, "q"]].map(([n, w]) => png("letter-tracing-workbook-sample-8.5x11.pdf", n, w, 60));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);

const card = (img, label) => `<figure><img src="${img}"><figcaption>${label}</figcaption></figure>`;
const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:#f6f7f9;color:#234e3a;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h2{font-size:58px;margin:0 0 8px;letter-spacing:-.02em;line-height:1.15}
  .row{display:flex;gap:28px;justify-content:center;align-items:flex-start;width:100%}
  figure{margin:0;flex:1} figure img{width:100%;border-radius:8px;box-shadow:0 8px 24px rgba(20,30,20,.18);background:#fff}
  figcaption{font-size:32px;margin-top:14px;color:#5c6470;line-height:1.3}
  .cut{overflow:hidden;background:#fff;border-radius:10px;box-shadow:0 8px 24px rgba(20,30,20,.14)} .cut img{display:block}
  .lab{font-size:44px;font-weight:800;margin-top:10px}
  div.c{font-size:40px;font-weight:700;background:#fff;padding:18px 28px;border-radius:14px;box-shadow:0 8px 24px rgba(20,30,20,.10)}
  p{font-size:34px;margin:14px 0 0;color:#5c6470;line-height:1.35}`;
const scene = (body) => page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);

await scene(`<h2>Free printable<br>alphabet chart</h2>
  <div style="width:760px">${card(CHART, "Aa to Zz, then 0 to 9, on one page")}</div>`);
await wait(4000);

await scene(`<h2>a, d, g and q:<br>each one is a circle<br>and a straight line</h2>
  <div class="row">${["a", "d", "g", "q"].map((l) => `<div>${cut(l, 210)}</div>`).join("")}</div>
  <p>The shapes a child is taught to write,<br>not the "a" and "g" in a printed book.</p>`);
await wait(5000);

await scene(`<h2>So how do you tell<br>g from q?</h2>
  <div class="row"><div>${cut("g", 380)}<div class="lab">g curls left</div></div><div>${cut("q", 380)}<div class="lab">q curls right</div></div></div>
  <p>The tail.</p>`);
await wait(4600);

await scene(`<h2>To practise them:<br>a page for every letter</h2>
  <div class="row">${card(G, "g")}${card(Q, "q")}</div>
  <p>Numbered start dots and stroke arrows,<br>then rows to trace. A to Z, also free.</p>`);
await wait(4600);

await scene(`<h2>Making a tracing workbook<br>to sell on Amazon KDP?</h2>
  <div class="c">The chart as its first page</div><div class="c">A to Z, numbers, your own words</div><div class="c">A matching full-wrap cover</div>
  <p>Free to make the whole book, no sign-up.</p>`);
await wait(4000);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#234e3a;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:92px;margin:0 0 14px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#cfe2d6;line-height:1.35}
  .u{margin-top:44px;font-size:42px;font-weight:700;background:#fff;color:#234e3a;padding:16px 28px;border-radius:14px;line-height:1.35}</style>
  <h1>Trace Press</h1><p>The free alphabet chart<br>is at</p><div class="u">tracepress.bananafest-destiny.com<br>/alphabet-chart</div>`);
await wait(4200);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
