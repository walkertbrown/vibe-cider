// A YouTube Short for the spine calculator's free cover template. Every
// picture is the template itself, drawn by src/ui/cover-template.js (the code
// the page's button runs) from coverGeometry(), so the figures on screen are
// the ones the download gives. Scenes only, no live site: nothing here is
// counted as a visitor.
//
//   node scripts/video-template.mjs  → public/video/template-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import { coverGeometry, spineWidthInches, BARCODE_IN } from "../src/pdf/cover-geometry.js";
import { PT } from "../src/pdf/kdp.js";

const [W, H] = [1080, 1920];
const DPI = 300;
const outName = "template-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "pp-template-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

// The page's own drawing code, bundled to run in a blank browser page.
const bundle = (await build({
  stdin: { contents: `import { drawCoverTemplate } from "./src/ui/cover-template.js"; import { coverGeometry } from "./src/pdf/cover-geometry.js";
    window.tpl = (o, label) => drawCoverTemplate(coverGeometry(o), { dpi: ${DPI}, paperLabel: label }).toDataURL("image/png");`, resolveDir: new URL("..", import.meta.url).pathname },
  bundle: true, format: "iife", write: false,
})).outputFiles[0].text;

const browser = await chromium.launch();
const draw = await browser.newPage();
await draw.setContent("<!doctype html><body></body>");
await draw.addScriptTag({ content: bundle });
const tpl = (trim, pageCount, paper, label) => draw.evaluate(([o, l]) => window.tpl(o, l), [{ trim, pageCount, paper }, label]);
const MAIN = await tpl("6x9", 120, "cream", "black & white on cream paper");
const THIN = await tpl("6x9", 100, "cream", "black & white on cream paper");
const THICK = await tpl("6x9", 400, "cream", "black & white on cream paper");
await draw.close();

const g = coverGeometry({ trim: "6x9", pageCount: 120, paper: "cream" });
const px = (pt) => (pt / PT) * DPI;
const [mw, mh] = [Math.round(px(g.width)), Math.round(px(g.height))];
const spine100 = spineWidthInches(100, "cream").toFixed(3), spine400 = spineWidthInches(400, "cream").toFixed(3);
const w100 = (coverGeometry({ trim: "6x9", pageCount: 100, paper: "cream" }).width / PT).toFixed(3);
const w400 = (coverGeometry({ trim: "6x9", pageCount: 400, paper: "cream" }).width / PT).toFixed(3);
console.log({ mw, mh, spine100, spine400, w100, w400 });

// A window onto the 300 DPI template: region in template pixels, shown `w` wide.
const crop = (src, x, y, rw, rh, w) => {
  const k = w / rw;
  return `<div class="crop" style="width:${w}px;height:${Math.round(rh * k)}px"><img src="${src}" style="width:${Math.round(mw * k)}px;margin:${-Math.round(y * k)}px 0 0 ${-Math.round(x * k)}px"></div>`;
};

const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);
const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:#f4f6fa;color:#1d3557;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h2{font-size:62px;margin:0 0 8px;letter-spacing:-.02em;line-height:1.15}
  p{font-size:36px;margin:10px 0 0;color:#5c6470;line-height:1.35}
  .full{width:1000px;border-radius:6px;box-shadow:0 8px 24px rgba(20,30,50,.18)}
  .crop{overflow:hidden;border-radius:10px;box-shadow:0 8px 24px rgba(20,30,50,.18);background:#fff} .crop img{display:block;max-width:none}
  .pair{display:flex;flex-direction:column;gap:14px;align-items:center} .pair b{font-size:34px}`;
const scene = (body) => page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);

await scene(`<h2>A free KDP<br>cover template</h2><img class="full" src="${MAIN}">
  <p>Back, spine and front at 300 DPI, sized to<br>your trim, page count and paper.<br>6 × 9, 120 pages, cream: ${mw} × ${mh} px.</p>`);
await wait(4600);

// Top-left corner: the bleed, the trim line, the text-safe dashes.
await scene(`<h2>Pink is the 0.125" bleed</h2>${crop(MAIN, 0, 0, px(0.9 * PT), px(0.9 * PT), 820)}
  <p>It is trimmed off, so run background art<br>to the outer edge. The red line is the trim.<br>Keep text inside the blue dashes, 0.125" in.</p>`);
await wait(5400);

// The lower right of the back cover, beside the spine.
const bx = px(g.spineX) - px((BARCODE_IN.w + BARCODE_IN.margin + 0.35) * PT), by = mh - px((BARCODE_IN.h + BARCODE_IN.margin + 0.5) * PT);
await scene(`<h2>The barcode box</h2>${crop(MAIN, bx, by, px(g.spineX) + px(0.45 * PT) - bx, mh - by, 960)}
  <p>${BARCODE_IN.w}" × ${BARCODE_IN.h}" in the lower right of the back,<br>${BARCODE_IN.margin}" in from the bottom and the spine.<br>Amazon prints the barcode there: keep it clear.</p>`);
await wait(5400);

await scene(`<h2>The spine grows<br>with the page count</h2>
  <div class="pair"><b>100 pages: spine ${spine100}"</b><img class="full" style="width:${Math.round(1000 * +w100 / +w400)}px" src="${THIN}"></div>
  <div class="pair"><b>400 pages: spine ${spine400}"</b><img class="full" src="${THICK}"></div>
  <p>Same 6 × 9 trim on cream paper.<br>Change the page count, download a new one.</p>`);
await wait(5600);

await scene(`<h2>How to use it</h2><img class="full" src="${MAIN}">
  <p>Put it in Canva, Photoshop or Affinity<br>as the bottom layer and design over it.<br>Hide it before you export the PDF.</p>`);
await wait(4400);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#1d3557;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:88px;margin:0 0 20px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#c9d3e6;line-height:1.35}
  .u{margin-top:50px;font-size:40px;font-weight:700;background:#fff;color:#1d3557;padding:14px 30px;border-radius:14px;line-height:1.35}</style>
  <h1>Puzzle Press</h1><p>Free, no sign-up. The template<br>button is on the spine calculator.</p><div class="u">puzzlepress.bananafest-destiny.com<br>/spine-calculator</div>`);
await wait(4400);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
