// A number-led YouTube Short for the free number tracing worksheets: only 4
// and 5 of the ten digits lift the pencil. The stroke counts are computed here
// from src/glyphs/lines.js, the shapes the worksheets draw, and the wording of
// each stroke is /number-tracing's own "How each number is written" table.
// Every picture is a page of the free 0 to 9 PDF (page n + 1 is the digit n).
//
//   node scripts/video-numbers.mjs  → public/video/numbers-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { GLYPHS } from "../src/glyphs/lines.js";

const [W, H] = [1080, 1920];
const outName = "numbers-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "tp-numbers-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const DIGITS = [..."0123456789"];
const n = (c) => GLYPHS[c].strokes.length;
const F = { total: DIGITS.reduce((t, c) => t + n(c), 0), lift: DIGITS.filter((c) => n(c) > 1) };
console.log(F);
if (F.total !== 12 || F.lift.join() !== "4,5") throw new Error("digit strokes changed: update the scenes' wording");

const PDF = new URL("../public/samples/number-tracing-worksheets-0-9.pdf", import.meta.url).pathname;
const page = (d, r) => {
  const out = join(tmp, `p${d}-${r}`);
  execFileSync("pdftoppm", ["-r", String(r), "-png", "-f", String(+d + 1), "-l", String(+d + 1), "-singlefile", PDF, out]);
  return `data:image/png;base64,${readFileSync(`${out}.png`).toString("base64")}`;
};
// The model digit with its start dots and arrows: 0.3" to 2.5" across, 0.1" to 2.1" down.
const model = (d) => {
  const r = 200, out = join(tmp, `m${d}`);
  execFileSync("pdftoppm", ["-r", String(r), "-png", "-f", String(+d + 1), "-l", String(+d + 1), "-x", String(Math.round(0.3 * r)), "-y", String(Math.round(0.1 * r)), "-W", String(Math.round(2.2 * r)), "-H", String(Math.round(2.0 * r)), "-singlefile", PDF, out]);
  return `data:image/png;base64,${readFileSync(`${out}.png`).toString("base64")}`;
};
const M = Object.fromEntries(["4", "5", "0", "8"].map((d) => [d, model(d)]));
const P = Object.fromEntries(["0", "4", "8"].map((d) => [d, page(d, 60)]));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const tab = await ctx.newPage();
const wait = (ms) => tab.waitForTimeout(ms);

const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:#f6f7f9;color:#234e3a;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h2{font-size:60px;margin:0 0 8px;letter-spacing:-.02em;line-height:1.15}
  .big{font-size:150px;font-weight:800;line-height:1;margin:0}
  .row{display:flex;gap:28px;justify-content:center;align-items:flex-start;width:100%}
  .m{flex:1} .m img{width:100%;background:#fff;border-radius:10px;box-shadow:0 8px 24px rgba(20,30,20,.14);display:block}
  .m div{font-size:30px;margin-top:14px;color:#5c6470;line-height:1.3}
  figure{margin:0;flex:1} figure img{width:100%;border-radius:8px;box-shadow:0 8px 24px rgba(20,30,20,.18);background:#fff}
  div.c{font-size:40px;font-weight:700;background:#fff;padding:18px 28px;border-radius:14px;box-shadow:0 8px 24px rgba(20,30,20,.10)}
  p{font-size:34px;margin:14px 0 0;color:#5c6470;line-height:1.35}`;
const scene = (body) => tab.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);

await scene(`<h2>Writing 0 to 9,<br>only two numbers<br>lift the pencil</h2><div class="big">4 and 5</div>`);
await wait(3800);

await scene(`<h2>Start at 1, lift,<br>then start again at 2</h2>
  <div class="row"><div class="m"><img src="${M[4]}"><div>4: down to the middle and across.<br>Lift. Then the long line down.</div></div>
  <div class="m"><img src="${M[5]}"><div>5: down to the middle and round.<br>Lift. Then the top line, last.</div></div></div>`);
await wait(5600);

await scene(`<h2>The other eight<br>are one stroke each</h2>
  <div class="row"><div class="m"><img src="${M[0]}"><div>0: round to the left,<br>back to the top</div></div>
  <div class="m"><img src="${M[8]}"><div>8: an S to the bottom,<br>then a line back up to the start</div></div></div>`);
await wait(5000);

await scene(`<h2>${F.total} strokes for all ten.<br>A free page for each.</h2>
  <div class="row"><figure><img src="${P[0]}"></figure><figure><img src="${P[4]}"></figure><figure><img src="${P[8]}"></figure></div>
  <p>Start dots and arrows, then rows to trace,<br>then room to write it alone.</p>`);
await wait(4600);

await scene(`<h2>Making a tracing workbook<br>to sell on Amazon KDP?</h2>
  <div class="c">A to Z, then 0 to 9</div><div class="c">Your own practice words</div><div class="c">A matching full-wrap cover</div>
  <p>Free to make the whole book, no sign-up.</p>`);
await wait(4000);

await tab.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#234e3a;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:92px;margin:0 0 14px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#cfe2d6;line-height:1.35}
  .u{margin-top:44px;font-size:42px;font-weight:700;background:#fff;color:#234e3a;padding:16px 28px;border-radius:14px;line-height:1.35}</style>
  <h1>Trace Press</h1><p>The free number worksheets<br>are at</p><div class="u">tracepress.bananafest-destiny.com<br>/number-tracing</div>`);
await wait(4200);

await ctx.close();
const src = await tab.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
