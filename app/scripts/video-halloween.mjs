// A Halloween YouTube Short for Puzzle Press, for the 10-10 slot. Every page
// in it is a real page of a book the generator makes from the Halloween word
// list (/word-lists/halloween): a puzzle, its solution, and the wrap cover.
// The page count is read from the rendered PDF, not typed in. Scenes only, no
// live site: nothing here is counted as a visitor.
//
//   node scripts/video-halloween.mjs  → public/video/halloween-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { generateBook } from "../src/generator/book.js";
import { THEMES } from "../src/generator/wordlists.js";
import { renderBook } from "../src/pdf/render.js";
import { renderCover } from "../src/pdf/cover.js";

const [W, H] = [1080, 1920];
const outName = "halloween-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "pp-halloween-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });
const fonts = Object.fromEntries(["regular:LiberationSans-Regular", "bold:LiberationSans-Bold", "display:LilitaOne-Regular"]
  .map((s) => s.split(":")).map(([k, f]) => [k, readFileSync(new URL(`../public/fonts/${f}.ttf`, import.meta.url))]));

const WORDS = THEMES.halloween.words.length;
const COUNT = 100;
const title = "Halloween Word Search";
const book = generateBook({ pools: [THEMES.halloween], count: COUNT, wordsPerPuzzle: 15, difficulty: "medium", seed: "halloween-short" });
const bookPdf = join(tmp, "book.pdf");
writeFileSync(bookPdf, await renderBook(book, { title, subtitle: `${COUNT} puzzles with solutions`, author: "Puzzle Press", trim: "6x9", licensed: true, fonts }));
const PAGES = +execFileSync("pdfinfo", [bookPdf], { encoding: "utf8" }).match(/Pages:\s+(\d+)/)[1];
const coverPdf = join(tmp, "cover.pdf");
writeFileSync(coverPdf, await renderCover({ title, subtitle: `${COUNT} puzzles with solutions`, author: "Puzzle Press", trim: "6x9", paper: "cream", pageCount: PAGES, puzzleCount: COUNT, samplePuzzle: book.puzzles[0], backPuzzle: book.puzzles[1], seed: "halloween-short", licensed: true, fonts }));
const text = execFileSync("pdftotext", [bookPdf, "-"], { encoding: "utf8" });
console.log({ WORDS, PAGES, warnings: book.warnings });

const png = (pdf, n, name, r) => {
  execFileSync("pdftoppm", ["-r", String(r), "-png", "-f", String(n), "-l", String(n), "-singlefile", pdf, join(tmp, name)]);
  return `data:image/png;base64,${readFileSync(join(tmp, `${name}.png`)).toString("base64")}`;
};
// The first puzzle page and the page carrying its solution, found by text.
const pageTexts = text.split("\f");
const firstPuzzle = pageTexts.findIndex((t) => /Puzzle 1\b/.test(t)) + 1;
// The solutions start after a "Solutions" page, several puzzles to a page.
const firstSolution = pageTexts.findIndex((t) => /^Solutions\b/.test(t.trim())) + 2;
console.log({ firstPuzzle, firstSolution });
const PUZZLE = png(bookPdf, firstPuzzle, "puzzle", 110);
const SOLUTION = png(bookPdf, firstSolution, "solution", 110);
const COVER = png(coverPdf, 1, "cover", 60);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);

const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:#1f1a2e;color:#fff;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h2{font-size:60px;margin:0 0 8px;letter-spacing:-.02em;line-height:1.15}
  .big{font-size:120px;font-weight:800;line-height:1;margin:0;color:#f4a259}
  img{border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.45);background:#fff}
  p{font-size:36px;margin:10px 0 0;color:#cfc8e0;line-height:1.35}`;
const scene = (body) => page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);

await scene(`<h2>A Halloween word search<br>book for Amazon KDP</h2><img src="${PUZZLE}" style="width:820px"><p>A real page from it, 6 × 9 inches.</p>`);
await wait(4400);

await scene(`<h2>Every solution<br>in the back of the book</h2><img src="${SOLUTION}" style="width:820px">`);
await wait(3800);

await scene(`<div class="big">${WORDS}</div><p>Halloween words in the list</p><div class="big">15</div><p>of them in each puzzle</p><div class="big">${PAGES}</div><p>pages for ${COUNT} puzzles at 6 × 9</p>`);
await wait(5200);

await scene(`<h2>And the wrap cover,<br>spine sized to ${PAGES} pages</h2><img src="${COVER}" style="width:1000px">`);
await wait(4400);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#f4a259;color:#1f1a2e;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:88px;margin:0 0 20px;letter-spacing:-.02em} p{font-size:40px;margin:0;line-height:1.35}
  .u{margin-top:50px;font-size:40px;font-weight:700;background:#fff;color:#1f1a2e;padding:14px 30px;border-radius:14px;line-height:1.35}</style>
  <h1>Puzzle Press</h1><p>The Halloween word list,<br>with a button that makes the book:</p><div class="u">puzzlepress.bananafest-destiny.com<br>/word-lists/halloween</div>`);
await wait(4400);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
