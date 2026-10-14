// A number-led YouTube Short for Trace Press, for the 10-22 slot: three first
// pencil moves start 12 of the 26 lowercase letters. The groups are computed
// here from src/glyphs/lines.js, the shapes the worksheets draw (letters whose
// first segment is identical), and every letter on screen is drawn from those
// same segments. The last picture is page 4 (d) of the free lowercase PDF.
// Scenes only, no live site: nothing here is counted as a visitor.
//
//   node scripts/video-starts.mjs  → public/video/starts-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { GLYPHS } from "../src/glyphs/lines.js";
import { sample } from "../src/glyphs/print.js";

const [W, H] = [1080, 1920];
const outName = "starts-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "tp-starts-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

// Letters grouped by their first segment: the first thing the pencil does.
const groups = new Map();
for (const c of "abcdefghijklmnopqrstuvwxyz") {
  const k = JSON.stringify(GLYPHS[c].strokes[0][0]);
  groups.set(k, [...(groups.get(k) ?? []), c]);
}
const big = [...groups.values()].filter((g) => g.length >= 4);
const find = (c) => big.find((g) => g.includes(c));
const [CIRCLE, TALL, SHORT] = [find("a"), find("b"), find("i")];
if (big.length !== 3 || !CIRCLE || !TALL || !SHORT) throw new Error(`expected three groups of 4+, got ${JSON.stringify(big)}`);
const COUNT = big.flat().length;
if (find("d") === find("b")) throw new Error("b and d start the same: the b/d scene is wrong");

// One letter as SVG on four-line guides (baseline 0, midline 1, headline 2,
// y up; descenders to -1). The first segment green with its start dot.
const U = 105, PAD = 26;
const svg = (c) => {
  const g = GLYPHS[c], w = (g.width ?? 1) * U + 2 * PAD, h = 3.4 * U;
  const X = (x) => PAD + x * U, Y = (y) => 2.3 * U - y * U;
  const path = (seg) => sample(seg, 48).map(([x, y], i) => `${i ? "L" : "M"}${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join("");
  const guides = [[2, "#9aa3ad", ""], [1, "#9aa3ad", "8 8"], [0, "#234e3a", ""], [-0.75, "#c7cdd4", "2 6"]]
    .map(([y, col, dash]) => `<line x1="0" x2="${w}" y1="${Y(y)}" y2="${Y(y)}" stroke="${col}" stroke-width="2" stroke-dasharray="${dash}"/>`).join("");
  const segs = g.strokes.flat();
  const rest = segs.slice(1).map((s) => `<path d="${path(s)}" fill="none" stroke="#b8bec6" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`).join("");
  const first = segs[0], [sx, sy] = sample(first, 2)[0];
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${guides}${rest}
    <path d="${path(first)}" fill="none" stroke="#1f9d55" stroke-width="15" stroke-linecap="round"/>
    <circle cx="${X(sx)}" cy="${Y(sy)}" r="17" fill="#1f9d55"/></svg>`;
};
const row = (cs) => `<div class="letters">${cs.map(svg).join("")}</div>`;

const pdf = new URL("../public/samples/lowercase-letter-tracing-worksheets.pdf", import.meta.url).pathname;
execFileSync("pdftoppm", ["-r", "110", "-png", "-f", "4", "-l", "4", "-singlefile", pdf, join(tmp, "d")]);
const PAGE = `data:image/png;base64,${readFileSync(join(tmp, "d.png")).toString("base64")}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);
const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;background:#f6f7f9;color:#234e3a;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h2{font-size:60px;margin:0;letter-spacing:-.02em;line-height:1.15}
  .big{font-size:150px;font-weight:800;line-height:1}
  p{font-size:36px;margin:0;color:#5c6470;line-height:1.35}
  .letters{display:flex;gap:18px;justify-content:center;background:#fff;border-radius:14px;padding:18px 22px;box-shadow:0 8px 24px rgba(20,30,20,.12)}
  img{width:760px;border-radius:8px;box-shadow:0 8px 24px rgba(20,30,20,.18);background:#fff}`;
const scene = (body) => page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);

await scene(`<h2>The first move of a<br>lowercase letter</h2><div class="big">${COUNT} of 26</div>
  <p>start with one of just three moves.<br>Counted from the Trace Press letters.</p>`);
await wait(4000);

await scene(`<h2>1. A circle</h2>${row(CIRCLE)}
  <p>Start at the green dot, go round<br>counterclockwise, then up and down<br>the right side.<br>Only how far that line goes changes.</p>`);
await wait(5200);

await scene(`<h2>2. A tall line,<br>top to bottom</h2>${row(TALL)}`);
await wait(4000);

await scene(`<h2>3. A short line,<br>from the middle down</h2>${row(SHORT)}`);
await wait(4000);

await scene(`<h2>So b and d<br>start differently</h2>${row(["b", "d"])}
  <p>b starts with the line,<br>d starts with the circle.</p>`);
await wait(4800);

await scene(`<h2>Every free page shows<br>where each stroke starts</h2><img src="${PAGE}">
  <p>A numbered dot and an arrow on every stroke.<br>26 pages, a to z.</p>`);
await wait(4800);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#234e3a;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:92px;margin:0 0 14px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#cfe2d6;line-height:1.35}
  .u{margin-top:44px;font-size:42px;font-weight:700;background:#fff;color:#234e3a;padding:16px 28px;border-radius:14px;line-height:1.35}</style>
  <h1>Trace Press</h1><p>Free, no sign-up.<br>The worksheets are at</p><div class="u">tracepress.bananafest-destiny.com<br>/lowercase-letter-tracing</div>`);
await wait(4200);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName} (${COUNT} letters: ${CIRCLE.join("")} ${TALL.join("")} ${SHORT.join("")})`);
