// A YouTube Short for the margin calculator's free interior page templates.
// Every picture is a template drawn by src/ui/page-template.js (the code the
// page's buttons run) from pageGeometry(), so the figures on screen are the
// ones the download gives. Scenes only, no live site: nothing here is counted
// as a visitor.
//
//   node scripts/video-pagetpl.mjs  → public/video/pagetpl-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import { PT, pageGeometry, gutterInches } from "../src/pdf/kdp.js";

const [W, H] = [1080, 1920];
const outName = "pagetpl-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "pp-pagetpl-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

// The page's own drawing code, bundled to run in a blank browser page.
const bundle = (await build({
  stdin: { contents: `import { drawPageTemplate } from "./src/ui/page-template.js"; import { pageGeometry } from "./src/pdf/kdp.js";
    window.tpl = (o, pageNo) => drawPageTemplate(pageGeometry(o), { pageNo, pageCount: o.pageCount }).toDataURL("image/png");`, resolveDir: new URL("..", import.meta.url).pathname },
  bundle: true, format: "iife", write: false,
})).outputFiles[0].text;

const browser = await chromium.launch();
const draw = await browser.newPage();
await draw.setContent("<!doctype html><body></body>");
await draw.addScriptTag({ content: bundle });
const tpl = (pageCount, bleed, pageNo) => draw.evaluate(([o, n]) => window.tpl(o, n), [{ trim: "6x9", pageCount, bleed }, pageNo]);
const ODD = await tpl(120, false, 1), EVEN = await tpl(120, false, 2);
const ODD600 = await tpl(600, false, 1);
const BLEED = await tpl(120, true, 1);
await draw.close();

const g = pageGeometry({ trim: "6x9", pageCount: 120, bleed: true });
const bw = Math.ceil((g.width / PT) * 300), bh = Math.ceil((g.height / PT) * 300);
const steps = [[24, 150], [151, 300], [301, 500], [501, 700], [701, 828]].map(([a, b]) => [a, b, gutterInches(b)]);
if (steps.some(([a, , gi]) => gutterInches(a) !== gi)) throw new Error("gutter steps are not where the table says");
console.log({ bw, bh, steps });

const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);
const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:#f4f6fa;color:#1d3557;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h2{font-size:62px;margin:0 0 8px;letter-spacing:-.02em;line-height:1.15}
  p{font-size:36px;margin:10px 0 0;color:#5c6470;line-height:1.35}
  .pair{display:flex;gap:10px;justify-content:center;align-items:flex-start}
  .pair figure{margin:0} .pair img{width:470px;display:block;box-shadow:0 8px 24px rgba(20,30,50,.18)}
  figcaption{font-size:32px;font-weight:700;margin-top:12px}
  .one{width:640px;box-shadow:0 8px 24px rgba(20,30,50,.18)}
  table{font-size:36px;border-collapse:collapse;background:#fff;border-radius:10px} td{padding:8px 26px;border-bottom:1px solid #d9dde3} td:last-child{font-weight:700}`;
const scene = (body) => page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);
const fig = (src, cap) => `<figure><img src="${src}"><figcaption>${cap}</figcaption></figure>`;

await scene(`<h2>Free KDP interior<br>page templates</h2><div class="pair">${fig(EVEN, "even page")}${fig(ODD, "odd page")}</div>
  <p>Your exact PDF page at 300 DPI,<br>with KDP's margins drawn on it.</p>`);
await wait(4600);

await scene(`<h2>The gutter swaps sides</h2><div class="pair">${fig(EVEN, "gutter on the right")}${fig(ODD, "gutter on the left")}</div>
  <p>The shaded strip is the inside margin,<br>against the spine. Same side on every page<br>gets an interior rejected.</p>`);
await wait(5600);

await scene(`<h2>The gutter grows<br>with the page count</h2><div class="pair">${fig(ODD, "120 pages: 0.375\"")}${fig(ODD600, "600 pages: 0.75\"")}</div>
  <table>${steps.map(([a, b, gi]) => `<tr><td>${a} to ${b} pages</td><td>${gi}"</td></tr>`).join("")}</table>`);
await wait(6200);

await scene(`<h2>With bleed</h2><img class="one" src="${BLEED}">
  <p>The page is 0.125" wider and 0.25" taller:<br>6 × 9 becomes ${bw} × ${bh} px.<br>Pink is the bleed: outside edge, top<br>and bottom, never the gutter side.</p>`);
await wait(5600);

await scene(`<h2>How to use them</h2><div class="pair">${fig(EVEN, "")}${fig(ODD, "")}</div>
  <p>Put the matching one under each page<br>as the bottom layer. Keep text inside<br>the blue dashes. Hide it before you export.</p>`);
await wait(4400);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#1d3557;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:88px;margin:0 0 20px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#c9d3e6;line-height:1.35}
  .u{margin-top:50px;font-size:40px;font-weight:700;background:#fff;color:#1d3557;padding:14px 30px;border-radius:14px;line-height:1.35}</style>
  <h1>Puzzle Press</h1><p>Free, no sign-up. The template<br>buttons are on the margin calculator.</p><div class="u">puzzlepress.bananafest-destiny.com<br>/margin-calculator</div>`);
await wait(4400);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
