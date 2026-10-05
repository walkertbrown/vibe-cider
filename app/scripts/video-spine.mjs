// A fact-led YouTube Short for the spine calculator: KDP allows text on the
// spine from 79 pages ("Create a Paperback Cover", G201953020, re-read
// 2026-10-05), but at 79 pages the spine's safe area is 0.053" wide. Every
// width is computed by src/pdf/cover-geometry.js, the code /spine-calculator
// runs, and checked against KDP's own cover calculator before anything is
// drawn. The two covers are real renderCover output at 79 and 200 pages.
// Scenes only, no live site: nothing here is counted as a visitor.
//
//   node scripts/video-spine.mjs  → public/video/spine-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { generateBook } from "../src/generator/book.js";
import { THEMES } from "../src/generator/wordlists.js";
import { renderCover } from "../src/pdf/cover.js";
import { spineWidthInches, SPINE_FOLD_IN, SPINE_TEXT_MIN_PAGES, SPINE_TYPE_BOX_EM } from "../src/pdf/cover-geometry.js";
import { PT } from "../src/pdf/kdp.js";

const [W, H] = [1080, 1920];
const outName = "spine-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "pp-spine-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });
const fonts = Object.fromEntries(["regular:LiberationSans-Regular", "bold:LiberationSans-Bold", "display:LilitaOne-Regular"]
  .map((s) => s.split(":")).map(([k, f]) => [k, readFileSync(new URL(`../public/fonts/${f}.ttf`, import.meta.url))]));

// White paper, 6 x 9. The type figure is the largest bold sans whose capital
// top to "g" bottom (1.117 em) fits the safe area, rounded down to 0.5pt.
const PAPER = "white";
const rows = [SPINE_TEXT_MIN_PAGES, 100, 150, 200, 300].map((pages) => {
  const spine = spineWidthInches(pages, PAPER);
  const safe = spine - 2 * SPINE_FOLD_IN;
  return { pages, spine, safe, pt: Math.floor((safe * PT) / SPINE_TYPE_BOX_EM * 2) / 2 };
});
const in3 = (n) => `${n.toFixed(3)}"`;

// KDP's calculator rounds to 3 places; ours must agree with it at every row.
for (const r of rows) {
  const html = execFileSync("curl", ["-s", "-X", "POST", "https://kdp.amazon.com/cover-calculator/measurements-table",
    "-H", "X-Requested-With: XMLHttpRequest", "-H", "Referer: https://kdp.amazon.com/cover-calculator",
    "--data", `bindingType=PAPERBACK&paperType=WHITE&interiorType=BLACK_AND_WHITE&rightToLeft=false&trimSize=6_0X9_0IN&unit=inches&pageCount=${r.pages}`], { encoding: "utf8" });
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const kdp = +text.match(/Spine Safe Area ([\d.]+)/)[1];
  r.kdp = kdp;
  if (Math.abs(kdp - r.safe) > 0.0015) throw new Error(`safe area at ${r.pages} pages: ours ${r.safe}, KDP ${kdp}`);
}
console.log(rows);
const [first] = rows;
const PAPER_IN = (spineWidthInches(1, PAPER)).toFixed(6);

const title = "Animal Word Search";
const book = generateBook({ pools: [THEMES.animals], count: 2, wordsPerPuzzle: 15, difficulty: "medium", seed: "spine-short" });
const cover = async (pageCount, name) => {
  const pdf = join(tmp, `${name}.pdf`);
  writeFileSync(pdf, await renderCover({ title, subtitle: "100 puzzles with solutions", author: "Puzzle Press", trim: "6x9", paper: PAPER, pageCount, puzzleCount: 100, samplePuzzle: book.puzzles[0], backPuzzle: book.puzzles[1], seed: "spine-short", licensed: true, fonts }));
  execFileSync("pdftoppm", ["-r", "80", "-png", "-singlefile", pdf, join(tmp, name)]);
  return `data:image/png;base64,${readFileSync(join(tmp, `${name}.png`)).toString("base64")}`;
};
const THIN = await cover(first.pages, "thin");
const WIDE = await cover(200, "wide");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);

const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:#f4f6fa;color:#1d3557;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h2{font-size:60px;margin:0 0 8px;letter-spacing:-.02em;line-height:1.15}
  .big{font-size:120px;font-weight:800;line-height:1;margin:0;color:#e76f51}
  p{font-size:36px;margin:10px 0 0;color:#5c6470;line-height:1.35}
  q{font-size:36px;color:#1d3557;font-style:italic;line-height:1.35}
  small{font-size:26px;color:#5c6470}
  img{width:880px;border-radius:6px;box-shadow:0 8px 24px rgba(20,30,50,.18)}
  table{border-collapse:collapse;font-size:40px;background:#fff;border-radius:14px;box-shadow:0 8px 24px rgba(20,30,50,.10)}
  td,th{padding:14px 26px;border-bottom:1px solid #e3e7ef} th{font-size:28px;color:#5c6470;font-weight:600}
  td:last-child{font-weight:800;color:#e76f51}`;
const scene = (body) => page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);
const SRC = `<small>Source: KDP help, "Create a Paperback Cover"</small>`;

await scene(`<h2>KDP lets you put text<br>on the spine at</h2><div class="big">${first.pages} pages</div><p>But how much room is that?</p>`);
await wait(3600);

await scene(`<q>To include spine text, your book<br>must have at least 79 pages.</q><q>Text on larger spines must be<br>sized to fit the spine, with at<br>least 0.0625" (1.6 mm) of space<br>between the text and the<br>edge of the spine</q>${SRC}`);
await wait(5200);

await scene(`<p>${first.pages} pages, white paper</p><div class="big">${in3(first.spine)}</div><p>spine</p><div class="big">${in3(first.safe)}</div><p>left for text, after 0.0625" at each fold.<br>About ${first.pt} pt of bold type.</p>
  <small>Same figure as KDP's own cover calculator: ${in3(first.kdp)}</small>`);
await wait(5200);

await scene(`<h2>${first.pages} pages: allowed, but blank</h2><img src="${THIN}"><h2>200 pages: room for the title</h2><img src="${WIDE}">`);
await wait(5200);

await scene(`<p>White paper, 6 × 9</p>
  <table><tr><th>Pages</th><th>Safe area</th><th>Bold type up to</th></tr>${rows.map((r) => `<tr><td>${r.pages}</td><td>${in3(r.safe)}</td><td>${r.pt} pt</td></tr>`).join("")}</table>
  <p>Every page adds ${PAPER_IN}" of spine,<br>on white paper.</p>`);
await wait(6000);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#1d3557;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:88px;margin:0 0 20px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#c9d3e6;line-height:1.35}
  .u{margin-top:50px;font-size:40px;font-weight:700;background:#fff;color:#1d3557;padding:14px 30px;border-radius:14px;line-height:1.35}</style>
  <h1>Puzzle Press</h1><p>A free spine calculator:<br>any trim, paper and page count.</p><div class="u">puzzlepress.bananafest-destiny.com<br>/spine-calculator</div>`);
await wait(4400);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
