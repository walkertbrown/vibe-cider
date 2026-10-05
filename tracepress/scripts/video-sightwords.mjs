// A number-led YouTube Short for Trace Press: the 40 Dolch pre-primer sight
// words, read from /sight-word-tracing-workbook's own list, with their strokes
// counted from src/glyphs/lines.js (the shapes the worksheets draw, the same
// count as test/wordfacts.test.js). The pictures are pages of the free
// sight-word sample, which runs A to Z and then the words in list order.
// Scenes only, no live site: nothing here is counted as a visitor.
//
//   node scripts/video-sightwords.mjs  → public/video/sightwords-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { GLYPHS } from "../src/glyphs/lines.js";

const [W, H] = [1080, 1920];
const outName = "sightwords-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "tp-sightwords-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const html = readFileSync(new URL("../public/sight-word-tracing-workbook.html", import.meta.url), "utf8");
const WORDS = html.match(/Pre-primer:<\/strong> ([^.]+)\./)[1].split(", ");
const strokes = (w) => [...w].reduce((n, c) => n + GLYPHS[c].strokes.length, 0);
const total = WORDS.reduce((n, w) => n + strokes(w), 0);
const ks = WORDS.map(strokes);
const most = WORDS.filter((w) => strokes(w) === Math.max(...ks));
const least = WORDS.filter((w) => strokes(w) === Math.min(...ks));
const used = new Set(WORDS.join("").toLowerCase());
const missing = [..."abcdefghijklmnopqrstuvwxyz"].filter((c) => !used.has(c));
const PAGES = 26 + WORDS.length;
if (WORDS.length !== 40 || most.length !== 1 || least.length !== 1) throw new Error("the list changed; re-check the scenes");
console.log({ words: WORDS.length, total, most, max: Math.max(...ks), least, missing, PAGES });

// The sample is A to Z, then one page a word in the list's order.
const sample = new URL("../public/samples/sight-word-tracing-workbook-sample-8.5x11.pdf", import.meta.url).pathname;
const page = (word, name) => {
  const p = String(26 + WORDS.indexOf(word) + 1);
  execFileSync("pdftoppm", ["-r", "200", "-png", "-f", p, "-l", p, "-singlefile", sample, join(tmp, name)]);
  return `data:image/png;base64,${readFileSync(join(tmp, `${name}.png`)).toString("base64")}`;
};
const MOST = page(most[0], "most");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const pg = await ctx.newPage();
const wait = (ms) => pg.waitForTimeout(ms);

const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:#f6f7f9;color:#234e3a;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h2{font-size:60px;margin:0 0 8px;letter-spacing:-.02em;line-height:1.15}
  .big{font-size:130px;font-weight:800;line-height:1;margin:0;color:#c0392b}
  .letters{font-size:76px;font-weight:700;letter-spacing:.12em;margin:0;line-height:1.2}
  .words{font-size:40px;font-weight:600;line-height:1.5;margin:0;max-width:960px}
  p{font-size:36px;margin:10px 0 0;color:#5c6470;line-height:1.35}
  small{font-size:26px;color:#5c6470}
  .crop{width:1000px;height:560px;overflow:hidden;border-radius:8px;box-shadow:0 8px 24px rgba(20,30,20,.18);background:#fff}
  .crop img{width:112%;margin:-30px 0 0 -6%;display:block}`;
const scene = (body) => pg.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);
const NOTE = `<small>Counted from the Trace Press worksheets. A stroke is one time the pencil goes down.</small>`;

await scene(`<h2>The ${WORDS.length} first sight words<br>take</h2><div class="big">${total} strokes</div><p>Dolch pre-primer list, 1936</p>${NOTE}`);
await wait(4400);

await scene(`<div class="words">${WORDS.join(" · ")}</div>`);
await wait(4200);

await scene(`<h2>The most: “${most[0]}”, ${Math.max(...ks)} strokes</h2><div class="crop"><img src="${MOST}"></div><p>The fewest: “${least[0]}”, ${Math.min(...ks)}</p>`);
await wait(4800);

await scene(`<h2>They use ${26 - missing.length} of the 26 letters.<br>Never:</h2><div class="letters">${missing.join(" ")}</div>`);
await wait(4000);

await scene(`<h2>A to Z, then a page<br>for each word</h2><div class="big">${PAGES} pages</div><p>KDP prints any black-ink 8.5 × 11 paperback<br>of 24 to 110 pages for the same</p><div class="big">$2.84</div><small>Source: KDP help, "Paperback Printing Cost", Amazon.com</small>`);
await wait(5200);

await pg.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#234e3a;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:92px;margin:0 0 14px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#cfe2d6;line-height:1.35}
  .u{margin-top:44px;font-size:42px;font-weight:700;background:#fff;color:#234e3a;padding:16px 28px;border-radius:14px;line-height:1.35}</style>
  <h1>Trace Press</h1><p>The ${PAGES}-page sight word book,<br>free as a PDF:</p><div class="u">tracepress.bananafest-destiny.com<br>/sight-word-tracing-workbook</div>`);
await wait(4200);

await ctx.close();
const src = await pg.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
