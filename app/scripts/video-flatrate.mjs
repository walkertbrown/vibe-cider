// A fact-led YouTube Short: on Amazon.com, KDP prints a black-ink paperback
// for one flat price from 24 to 110 pages, so a 6×9 word search book costs the
// same to print with 14 puzzles as with 88. Both books are real: generated and
// rendered here, their page counts read from the PDFs, their prices and
// royalties from src/pdf/kdp-cost.js (the code /royalty-calculator and the
// generator run, from KDP's "Paperback Printing Cost" page). Scenes only, no
// live site: nothing here is counted as a visitor.
//
//   node scripts/video-flatrate.mjs  → public/video/flatrate-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { generateBook } from "../src/generator/book.js";
import { THEMES } from "../src/generator/wordlists.js";
import { renderBook } from "../src/pdf/render.js";
import { renderCover } from "../src/pdf/cover.js";
import { printingCost, royalty } from "../src/pdf/kdp-cost.js";
import { FLAT_RATE_PAGES } from "../src/pdf/layout.js";

const [W, H] = [1080, 1920];
const outName = "flatrate-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "pp-flatrate-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });
const fonts = Object.fromEntries(["regular:LiberationSans-Regular", "bold:LiberationSans-Bold", "display:LilitaOne-Regular"]
  .map((s) => s.split(":")).map(([k, f]) => [k, readFileSync(new URL(`../public/fonts/${f}.ttf`, import.meta.url))]));

const TRIM = "6x9", LIST = 8.99;
const title = "Animal Word Search";
const make = async (count) => {
  const book = generateBook({ pools: [THEMES.animals], count, wordsPerPuzzle: 15, difficulty: "medium", seed: `flatrate-${count}` });
  const pdf = join(tmp, `book-${count}.pdf`);
  writeFileSync(pdf, await renderBook(book, { title, subtitle: `${count} puzzles with solutions`, author: "Puzzle Press", trim: TRIM, licensed: true, fonts }));
  const pages = +execFileSync("pdfinfo", [pdf], { encoding: "utf8" }).match(/Pages:\s+(\d+)/)[1];
  const cover = join(tmp, `cover-${count}.pdf`);
  writeFileSync(cover, await renderCover({ title, subtitle: `${count} puzzles with solutions`, author: "Puzzle Press", trim: TRIM, paper: "cream", pageCount: pages, puzzleCount: count, samplePuzzle: book.puzzles[0], backPuzzle: book.puzzles[1], seed: `flatrate-${count}`, licensed: true, fonts }));
  return { count, pdf, pages, cover, cost: printingCost({ trim: TRIM, pages, ink: "black" }).cost, royalty: royalty({ trim: TRIM, pages, ink: "black", list: LIST }).royalty };
};
const small = await make(14), big = await make(88), over = await make(89);
console.log([small, big, over].map(({ count, pages, cost, royalty }) => ({ count, pages, cost, royalty })));
// The claim is the flat band, so the books must sit at its two ends and the
// third one just past it, or the video says something the PDFs don't.
if (small.pages !== 24 || big.pages !== FLAT_RATE_PAGES || over.pages <= FLAT_RATE_PAGES) throw new Error("the books are not at 24, 110 and just past 110 pages");
if (small.cost !== big.cost || over.cost <= big.cost || small.royalty !== big.royalty) throw new Error("the flat band is not flat");
const at150 = printingCost({ trim: TRIM, pages: 150, ink: "black" }).cost;
const usd = (n) => `$${n.toFixed(2)}`;

const png = (pdf, n, name, r) => {
  execFileSync("pdftoppm", ["-r", String(r), "-png", "-f", String(n), "-l", String(n), "-singlefile", pdf, join(tmp, name)]);
  return `data:image/png;base64,${readFileSync(join(tmp, `${name}.png`)).toString("base64")}`;
};
const pageTexts = execFileSync("pdftotext", [big.pdf, "-"], { encoding: "utf8" }).split("\f");
const PUZZLE = png(big.pdf, pageTexts.findIndex((t) => /Puzzle 1\b/.test(t)) + 1, "puzzle", 110);
const COVER_S = png(small.cover, 1, "cs", 60), COVER_B = png(big.cover, 1, "cb", 60);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);
const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;background:#f4f6fa;color:#1d3557;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h2{font-size:62px;margin:0 0 8px;letter-spacing:-.02em;line-height:1.15}
  .big{font-size:130px;font-weight:800;line-height:1;margin:0}
  p{font-size:36px;margin:8px 0 0;color:#5c6470;line-height:1.35}
  img{border-radius:6px;box-shadow:0 8px 24px rgba(20,30,50,.18);background:#fff}
  table{border-collapse:collapse;font-size:44px;background:#fff;border-radius:14px;box-shadow:0 8px 24px rgba(20,30,50,.10)}
  td{padding:14px 34px;border-bottom:1px solid #d9dde3} td:last-child{font-weight:800;text-align:right} tr.hi td{color:#c0392b}`;
const scene = (body) => page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);

await scene(`<h2>A 24-page KDP paperback<br>and a ${FLAT_RATE_PAGES}-page one</h2><p>cost the same to print:</p><div class="big">${usd(big.cost)}</div>
  <p>6 × 9, black ink, Amazon.com<br>(KDP, "Paperback Printing Cost")</p>`);
await wait(4800);

await scene(`<img src="${COVER_S}" style="width:860px"><p><b>${small.count} puzzles · ${small.pages} pages · ${usd(small.cost)}</b></p>
  <img src="${COVER_B}" style="width:860px;margin-top:10px"><p><b>${big.count} puzzles · ${big.pages} pages · ${usd(big.cost)}</b></p>
  <p>Two real word search books. Same printing cost,<br>so the same ${usd(big.royalty)} royalty at ${usd(LIST)}.</p>`);
await wait(6400);

await scene(`<h2>Pages 25 to ${FLAT_RATE_PAGES}<br>add nothing to the price</h2><img src="${PUZZLE}" style="width:640px">
  <p>So a 6 × 9 word search book can hold ${big.count} puzzles,<br>with every solution in the back, for ${usd(big.cost)}.</p>`);
await wait(5600);

await scene(`<h2>Past ${FLAT_RATE_PAGES} pages, you pay per page</h2><table>
  <tr><td>24 pages</td><td>${usd(small.cost)}</td></tr><tr><td>${big.pages} pages</td><td>${usd(big.cost)}</td></tr>
  <tr class="hi"><td>${over.pages} pages</td><td>${usd(over.cost)}</td></tr><tr class="hi"><td>150 pages</td><td>${usd(at150)}</td></tr></table>
  <p>$1.00 + $0.012 a page, the whole book,<br>once it goes past ${FLAT_RATE_PAGES}.</p>`);
await wait(5600);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#1d3557;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:88px;margin:0 0 20px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#c9d3e6;line-height:1.35}
  .u{margin-top:50px;font-size:40px;font-weight:700;background:#fff;color:#1d3557;padding:14px 30px;border-radius:14px;line-height:1.35}</style>
  <h1>Puzzle Press</h1><p>The free generator shows the page count<br>and printing cost as you pick the puzzles.</p><div class="u">puzzlepress.bananafest-destiny.com</div>`);
await wait(4400);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
