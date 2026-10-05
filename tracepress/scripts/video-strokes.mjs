// A number-led YouTube Short for Trace Press: how many strokes the alphabet
// takes, which letters share a shape across cases, and the three lowercase
// heights. Every count is computed here from src/glyphs/lines.js, the shapes
// the worksheets draw (the same checks as test/letterfacts.test.js), and the
// pictures are pages of the free upper- and lowercase worksheets.
// Scenes only, no live site: nothing here is counted as a visitor.
//
//   node scripts/video-strokes.mjs  → public/video/strokes-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { GLYPHS } from "../src/glyphs/lines.js";
import { sample } from "../src/glyphs/print.js";

const [W, H] = [1080, 1920];
const outName = "strokes-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "tp-strokes-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const UPPER = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"], LOWER = UPPER.map((c) => c.toLowerCase());
const n = (c) => GLYPHS[c].strokes.length;
const sum = (cs) => cs.reduce((t, c) => t + n(c), 0);
const pts = (c) => GLYPHS[c].strokes.flat().flatMap((s) => sample(s, 24));
const ys = (c) => pts(c).map((p) => Math.round(p[1] * 100) / 100);
const lo = (c) => Math.min(...ys(c)), hi = (c) => Math.max(...ys(c));
const box = (c) => { const p = pts(c), xs = p.map((q) => q[0]), y = p.map((q) => q[1]); return [Math.min(...xs), Math.max(...xs), Math.min(...y), Math.max(...y)]; };
const shape = (c) => { const [x0, x1, y0, y1] = box(c); return GLYPHS[c].strokes.map((st) => st.flatMap((s) => sample(s, 24)).map(([x, y]) => [((x - x0) / (x1 - x0)).toFixed(2), ((y - y0) / (y1 - y0)).toFixed(2)].join()).join(" ")).join("|"); };

const most = Math.max(...UPPER.map(n));
const F = {
  upper: sum(UPPER), lower: sum(LOWER),
  most, mostLetters: UPPER.filter((c) => n(c) === most),
  oneUpper: UPPER.filter((c) => n(c) === 1),
  same: LOWER.filter((c) => shape(c) === shape(c.toUpperCase())),
  small: LOWER.filter((c) => lo(c) >= 0 && hi(c) <= 1),
  tall: LOWER.filter((c) => lo(c) >= 0 && hi(c) >= 2),
  hang: LOWER.filter((c) => lo(c) < 0),
};
console.log(F);
const list = (a) => a.join(" ");

// Pages 1 to 26 of each worksheet PDF are A to Z.
const page = (file, letter, name) => {
  const pdf = new URL(`../public/samples/${file}`, import.meta.url).pathname;
  const p = String(letter.toUpperCase().charCodeAt(0) - 64);
  execFileSync("pdftoppm", ["-r", "200", "-png", "-f", p, "-l", p, "-singlefile", pdf, join(tmp, name)]);
  return `data:image/png;base64,${readFileSync(join(tmp, `${name}.png`)).toString("base64")}`;
};
const E = page("uppercase-letter-tracing-worksheets.pdf", F.mostLetters[0], "most");
const G = page("lowercase-letter-tracing-worksheets.pdf", F.hang[0], "hang");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const pg = await ctx.newPage();
const wait = (ms) => pg.waitForTimeout(ms);

const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:#f6f7f9;color:#234e3a;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h2{font-size:60px;margin:0 0 8px;letter-spacing:-.02em;line-height:1.15}
  .big{font-size:130px;font-weight:800;line-height:1;margin:0;color:#c0392b}
  .letters{font-size:76px;font-weight:700;letter-spacing:.12em;margin:0;line-height:1.2}
  p{font-size:36px;margin:10px 0 0;color:#5c6470;line-height:1.35}
  small{font-size:26px;color:#5c6470}
  .crop{width:1000px;height:420px;overflow:hidden;border-radius:8px;box-shadow:0 8px 24px rgba(20,30,20,.18);background:#fff}
  .crop img{width:150%;margin:-30px 0 0 -6%;display:block}`;
const scene = (body) => pg.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);
const NOTE = `<small>Counted from the Trace Press worksheets. A stroke is one time the pencil goes down.</small>`;

await scene(`<h2>Writing A to Z in capitals takes</h2><div class="big">${F.upper} strokes</div><p>and a to z takes</p><div class="big">${F.lower}</div>${NOTE}`);
await wait(4400);

await scene(`<h2>The most: ${F.mostLetters.join(", ")}, with ${F.most}</h2><div class="crop"><img src="${E}"></div><p>Each green number is where<br>one stroke starts.</p>`);
await wait(4600);

await scene(`<h2>${F.oneUpper.length} capitals never<br>lift the pencil</h2><div class="letters">${list(F.oneUpper)}</div>`);
await wait(4000);

await scene(`<h2>${F.same.length} lowercase letters are<br>the capital at half height</h2><div class="letters">${list(F.same)}</div><p>Same strokes, same order, same direction.<br>The other ${26 - F.same.length} change shape.</p>`);
await wait(4600);

await scene(`<h2>Lowercase comes in three heights</h2>
  <p>${F.small.length} small</p><div class="letters" style="font-size:52px">${list(F.small)}</div>
  <p>${F.tall.length} tall</p><div class="letters" style="font-size:52px">${list(F.tall)}</div>
  <p>${F.hang.length} hang below the line</p><div class="letters" style="font-size:52px">${list(F.hang)}</div>
  <div class="crop" style="height:520px"><img src="${G}"></div>`);
await wait(5600);

await pg.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#234e3a;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:92px;margin:0 0 14px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#cfe2d6;line-height:1.35}
  .u{margin-top:44px;font-size:42px;font-weight:700;background:#fff;color:#234e3a;padding:16px 28px;border-radius:14px;line-height:1.35}</style>
  <h1>Trace Press</h1><p>Free capital letter worksheets,<br>A to Z with stroke arrows:</p><div class="u">tracepress.bananafest-destiny.com<br>/uppercase-letter-tracing</div>`);
await wait(4200);

await ctx.close();
const src = await pg.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
