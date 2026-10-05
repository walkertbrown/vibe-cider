// A fact-led YouTube Short for the margin calculator: KDP's inside margin is
// not one number, it grows with the page count, and it swaps sides page to
// page. Like Trace Press's video-coversize.mjs, every figure is read from the
// code the books are laid out with (src/pdf/kdp.js, from KDP's "Set Trim Size,
// Bleed, and Margins" help page), the same figures as /margin-calculator.
// Scenes only, no live site: nothing here is counted as a visitor.
//
//   node scripts/video-margin.mjs  → public/video/margin-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { gutterInches, pageGeometry, PT, MIN_PAGES, MAX_PAGES } from "../src/pdf/kdp.js";

const [W, H] = [1080, 1920];
const outName = "margin-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "pp-margin-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

// The gutter table, as bands of page counts, from gutterInches itself.
const bands = [];
for (let n = MIN_PAGES; n <= MAX_PAGES; n++) {
  const g = gutterInches(n);
  if (bands.length && bands.at(-1).g === g) bands.at(-1).to = n;
  else bands.push({ from: n, to: n, g });
}
const plain = pageGeometry({ trim: "6x9", bleed: false, pageCount: 120 });
const bled = pageGeometry({ trim: "6x9", bleed: true, pageCount: 120 });
const inch = (pt) => +(pt / PT).toFixed(3);
const F = {
  outer: inch(plain.margin.outer), outerBleed: inch(bled.margin.outer - bled.bleed),
  bw: inch(bled.width), bh: inch(bled.height), g120: gutterInches(120), g320: gutterInches(320),
};
console.log(bands, F);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);

const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:#f4f6fa;color:#1d3557;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h2{font-size:62px;margin:0 0 8px;letter-spacing:-.02em;line-height:1.15}
  .big{font-size:120px;font-weight:800;line-height:1;margin:0}
  p{font-size:36px;margin:10px 0 0;color:#5c6470;line-height:1.35}
  small{font-size:26px;color:#5c6470}
  table{border-collapse:collapse;font-size:40px;background:#fff;border-radius:14px;box-shadow:0 8px 24px rgba(20,30,50,.10)}
  td,th{padding:14px 36px;border-bottom:1px solid #e3e7ef} th{font-size:30px;color:#5c6470;font-weight:600}
  td:last-child{font-weight:800;color:#e76f51}
  svg{width:960px}`;
const scene = (body) => page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);

// Two facing pages, the safe area shaded, the gutter (orange) against the spine.
const spread = (gutter) => {
  const s = 70, pw = 6 * s, ph = 9 * s, o = F.outer * s, gi = gutter * s, x2 = pw + 40;
  const pg = (x, left) => `<rect x="${x}" y="0" width="${pw}" height="${ph}" fill="#fff" stroke="#1d3557" stroke-width="3"/>
    <rect x="${x + (left ? o : gi)}" y="${o}" width="${pw - o - gi}" height="${ph - 2 * o}" fill="#a8dadc"/>
    <rect x="${left ? x + pw - gi : x}" y="0" width="${gi}" height="${ph}" fill="#e76f51" opacity=".85"/>`;
  return `<svg viewBox="-4 -4 ${x2 + pw + 8} ${ph + 8}">${pg(0, true)}${pg(x2, false)}</svg>`;
};

await scene(`<h2>Your KDP inside margin<br>is not one number</h2><p>It grows with the page count,<br>and it swaps sides every page.</p>${spread(F.g120)}`);
await wait(4000);

await scene(`<p>Inside margin (gutter), by page count</p>
  <table><tr><th>Pages</th><th>Gutter</th></tr>${bands.map((b) => `<tr><td>${b.from}–${b.to}</td><td>${b.g}"</td></tr>`).join("")}</table>
  <p>${F.g120}" at 120 pages, ${F.g320}" at 320.<br>These are minimums: more is fine.</p>`);
await wait(6200);

await scene(`<p>Outside, top and bottom</p><div class="big">${F.outer}"</div><p>or ${F.outerBleed}" if you use bleed.</p>
  <p>The gutter goes on the left of odd pages<br>and the right of even ones: mirror margins.</p>${spread(F.g120)}`);
await wait(5600);

await scene(`<p>With bleed, a 6 × 9 PDF page is</p><div class="big">${F.bw}" × ${F.bh}"</div>
  <p>0.125" wider and 0.25" taller, not 0.25" wider:<br>the inside edge is bound, never trimmed.</p>
  <small>Source: KDP help, "Set Trim Size, Bleed, and Margins"</small>`);
await wait(5600);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#1d3557;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:88px;margin:0 0 20px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#c9d3e6;line-height:1.35}
  .u{margin-top:50px;font-size:40px;font-weight:700;background:#fff;color:#1d3557;padding:14px 30px;border-radius:14px;line-height:1.35}</style>
  <h1>Puzzle Press</h1><p>A free margin calculator:<br>any trim, any page count, bleed or not.</p><div class="u">puzzlepress.bananafest-destiny.com<br>/margin-calculator</div>`);
await wait(4400);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
