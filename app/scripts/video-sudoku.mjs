// A fact-led YouTube Short for the sudoku generator: 17 is the fewest clues a
// 9x9 sudoku can give and still have one answer (McGuire, Tugemann, Civario,
// "There is no 16-Clue Sudoku", arXiv 1201.0749, 2012, re-read 2026-10-05).
// The clue counts on screen are counted from the free sudoku sample's own
// puzzles, regenerated from its seed, and each is solved again here: the video
// refuses to render unless every puzzle has exactly one answer. The pictures
// are pages of that sample. Scenes only, no live site: nothing here is counted
// as a visitor.
//
//   node scripts/video-sudoku.mjs  → public/video/sudoku-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { generateSudokuBook, countSolutions } from "../src/generator/sudoku.js";

const [W, H] = [1080, 1920];
const outName = "sudoku-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "pp-sudoku-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

// The same call scripts/sample.mjs makes for sample-sudoku-6x9.pdf.
const book = generateSudokuBook({ count: 20, difficulty: "graded", seed: "public-sudoku-1" });
const clues = (p) => p.puzzle.flat().filter(Boolean).length;
const LEVELS = ["easy", "medium", "hard", "expert"].map((d) => {
  const ps = book.puzzles.filter((p) => p.difficulty === d);
  const n = new Set(ps.map(clues));
  if (n.size !== 1) throw new Error(`${d}: clue counts differ`);
  return { d, label: d[0].toUpperCase() + d.slice(1), clues: [...n][0], first: book.puzzles.indexOf(ps[0]) + 1 };
});
if (!book.puzzles.every((p) => countSolutions(p.puzzle, 2) === 1)) throw new Error("a sample puzzle does not solve one way");
console.log(LEVELS);
const [EASY, , , EXPERT] = LEVELS;

// The sample opens with a title page and a copyright page, so puzzle n is page n + 2.
const sample = new URL("../public/samples/sample-sudoku-6x9.pdf", import.meta.url).pathname;
const text = execFileSync("pdftotext", ["-f", String(EASY.first + 2), "-l", String(EXPERT.first + 2), sample, "-"], { encoding: "utf8" }).split("\f");
if (!new RegExp(`Puzzle ${EASY.first}\\b`).test(text[0]) || !new RegExp(`Puzzle ${EXPERT.first}\\b`).test(text.at(-2))) throw new Error("sample page order changed");
const png = (n, name) => {
  execFileSync("pdftoppm", ["-r", "110", "-png", "-f", String(n + 2), "-l", String(n + 2), "-singlefile", sample, join(tmp, name)]);
  return `data:image/png;base64,${readFileSync(join(tmp, `${name}.png`)).toString("base64")}`;
};
const EASY_PNG = png(EASY.first, "easy");
const EXPERT_PNG = png(EXPERT.first, "expert");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);

const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:#f4f6fa;color:#1d3557;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h2{font-size:60px;margin:0 0 8px;letter-spacing:-.02em;line-height:1.15}
  .big{font-size:150px;font-weight:800;line-height:1;margin:0;color:#e76f51}
  p{font-size:36px;margin:10px 0 0;color:#5c6470;line-height:1.35}
  small{font-size:26px;color:#5c6470}
  img{width:700px;border-radius:6px;box-shadow:0 8px 24px rgba(20,30,50,.18);background:#fff}
  table{border-collapse:collapse;font-size:44px;background:#fff;border-radius:14px;box-shadow:0 8px 24px rgba(20,30,50,.10)}
  td,th{padding:16px 40px;border-bottom:1px solid #e3e7ef} th{font-size:28px;color:#5c6470;font-weight:600}
  td:last-child{font-weight:800;color:#e76f51}`;
const scene = (body) => page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);
const SRC = `<small>Source: McGuire, Tugemann and Civario,<br>"There is no 16-Clue Sudoku", 2012</small>`;

await scene(`<h2>The fewest clues a sudoku<br>can give and still have<br>one answer</h2><div class="big">17</div><p>of 81 squares</p>`);
await wait(4000);

await scene(`<h2>With 16 clues,<br>not one has a single answer</h2><p>Proven in 2012 by an exhaustive<br>computer search.</p>${SRC}`);
await wait(4600);

await scene(`<h2>${EASY.label}: ${EASY.clues} clues</h2><img src="${EASY_PNG}"><p>Puzzle ${EASY.first} of a free sample book.</p>`);
await wait(4200);

await scene(`<h2>${EXPERT.label}: ${EXPERT.clues} clues</h2><img src="${EXPERT_PNG}"><p>Puzzle ${EXPERT.first}, same book.</p>`);
await wait(4200);

await scene(`<table><tr><th>Level</th><th>Clues given</th></tr>${LEVELS.map((l) => `<tr><td>${l.label}</td><td>${l.clues}</td></tr>`).join("")}<tr><td>Fewest possible</td><td>17</td></tr></table>
  <p>Every one of these ${book.puzzles.length} puzzles<br>was solved again: exactly one answer each.</p>`);
await wait(6000);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#1d3557;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:88px;margin:0 0 20px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#c9d3e6;line-height:1.35}
  .u{margin-top:50px;font-size:40px;font-weight:700;background:#fff;color:#1d3557;padding:14px 30px;border-radius:14px;line-height:1.35}</style>
  <h1>Puzzle Press</h1><p>Sudoku books for KDP,<br>with a free ${book.puzzles.length}-puzzle sample:</p><div class="u">puzzlepress.bananafest-destiny.com<br>/sudoku-book-generator</div>`);
await wait(4400);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
