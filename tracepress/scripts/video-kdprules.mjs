// A fact-led YouTube Short for Trace Press: KDP's three printing minimums for
// an interior (KDP help G201857950, "Interior specifications", re-read
// 2026-10-05), and the same three read back out of the free samples' own
// content streams, not from the constants that set them:
//   lines  "a minimum thickness/weight of 0.75 point"  → thinnest `w` 0.75
//   type   "Minimum font size: 7 points"               → smallest `Tf` 7
//   grey   "a minimum grayscale fill of 10%"           → cursive trace 30% tint
// Scenes only, no live site: nothing here is counted as a visitor.
//
//   node scripts/video-kdprules.mjs  → public/video/kdprules-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PDFDocument, PDFRawStream, decodePDFRawStream } from "pdf-lib";
import { chromium } from "playwright";

const [W, H] = [1080, 1920];
const outName = "kdprules-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "tp-kdprules-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });
const sample = (f) => new URL(`../public/samples/${f}`, import.meta.url).pathname;

// The figures on screen come from here; the video refuses to render if a
// sample ever drops below a floor.
async function measure(file) {
  const doc = await PDFDocument.load(readFileSync(sample(file)));
  const m = { line: Infinity, type: Infinity, tint: 1 };
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    let s;
    try { s = Buffer.from(decodePDFRawStream(obj).decode()).toString("latin1"); } catch { continue; }
    for (const x of s.matchAll(/([\d.]+) w\b/g)) m.line = Math.min(m.line, +x[1]);
    for (const x of s.matchAll(/\/\S+ ([\d.]+) Tf/g)) m.type = Math.min(m.type, +x[1]);
    // Grey fills and strokes; white (1 1 1) is paper, not a tint.
    for (const x of s.matchAll(/([\d.]+) \1 \1 (?:rg|RG)\b/g)) if (+x[1] < 1) m.tint = Math.min(m.tint, 1 - +x[1]);
  }
  return m;
}
const print = await measure("letter-tracing-workbook-sample-8.5x11.pdf");
const cursive = await measure("cursive-letter-tracing-worksheets.pdf");
console.log({ print, cursive });
for (const m of [print, cursive]) if (m.line < 0.75 || m.type < 7 || m.tint < 0.1) throw new Error("a sample is below a KDP floor");
const pct = (t) => `${Math.round(t * 100)}%`;

const png = (file, n, name, r) => {
  execFileSync("pdftoppm", ["-r", String(r), "-png", "-f", String(n), "-l", String(n), "-singlefile", sample(file), join(tmp, name)]);
  return `data:image/png;base64,${readFileSync(join(tmp, `${name}.png`)).toString("base64")}`;
};
// Pages 1 to 26 of the cursive worksheets are A to Z; page 6 is f.
const F = png("cursive-letter-tracing-worksheets.pdf", 6, "f", 200);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);

const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:#f6f7f9;color:#234e3a;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h2{font-size:60px;margin:0 0 8px;letter-spacing:-.02em;line-height:1.15}
  .big{font-size:130px;font-weight:800;line-height:1;margin:0;color:#c0392b}
  p{font-size:36px;margin:10px 0 0;color:#5c6470;line-height:1.35}
  q{font-size:36px;color:#234e3a;font-style:italic;line-height:1.35}
  small{font-size:26px;color:#5c6470}
  .crop{width:1000px;height:560px;overflow:hidden;border-radius:8px;box-shadow:0 8px 24px rgba(20,30,20,.18);background:#fff}
  .crop img{width:112%;margin:-40px 0 0 -6%;display:block}
  table{border-collapse:collapse;font-size:40px;background:#fff;border-radius:14px;box-shadow:0 8px 24px rgba(20,30,50,.10)}
  td,th{padding:16px 30px;border-bottom:1px solid #e3e7ef} th{font-size:28px;color:#5c6470;font-weight:600}
  td:last-child{font-weight:800}`;
const scene = (body) => page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);
const SRC = `<small>Source: KDP help, "Paperback Submission Guidelines"</small>`;

await scene(`<h2>Three numbers KDP sets<br>for every paperback interior</h2><p>A tracing book is all thin lines,<br>small numbers and light grey.<br>Trace Press books meet all three.</p>`);
await wait(3800);

await scene(`<div class="big">0.75 pt</div><p>thinnest line</p><q>give the lines a minimum<br>thickness/weight of 0.75 point</q>${SRC}`);
await wait(4200);

await scene(`<div class="big">7 pt</div><p>smallest type</p><q>Minimum font size: 7 points</q>${SRC}`);
await wait(4200);

await scene(`<div class="big">10%</div><p>lightest grey fill</p><q>we recommend a minimum<br>grayscale fill of 10%</q>${SRC}`);
await wait(4000);

await scene(`<h2>Read out of the free<br>Trace Press samples</h2>
  <table><tr><th></th><th>KDP</th><th>Sample</th></tr>
  <tr><td>Thinnest line</td><td>0.75 pt</td><td>${cursive.line} pt</td></tr>
  <tr><td>Smallest type</td><td>7 pt</td><td>${cursive.type} pt</td></tr>
  <tr><td>Grey to trace over</td><td>10%</td><td>${pct(cursive.tint)}</td></tr></table>
  <div class="crop"><img src="${F}"></div>`);
await wait(5600);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#234e3a;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:92px;margin:0 0 14px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#cfe2d6;line-height:1.35}
  .u{margin-top:44px;font-size:42px;font-weight:700;background:#fff;color:#234e3a;padding:16px 28px;border-radius:14px;line-height:1.35}</style>
  <h1>Trace Press</h1><p>Tracing workbooks and covers<br>for KDP, free to make.</p><div class="u">tracepress.bananafest-destiny.com</div>`);
await wait(4200);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
