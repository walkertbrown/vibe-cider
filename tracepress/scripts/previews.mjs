// Preview pictures of the free samples, for the pages that offer them: a
// worksheet page is chosen by looking, and "letter tracing worksheets" is an
// image search as much as a web one. Page 1 of each PDF (or the page named),
// 720px wide, reduced to 64 colours: the pages are black, grey, green and red.
//
//   node scripts/previews.mjs  → public/img/*.png
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const PREVIEWS = [
  ["letter-tracing-workbook-sample-8.5x11.pdf", 1, "letter-tracing-worksheet-a"],
  ["number-tracing-worksheets-0-9.pdf", 4, "number-tracing-worksheet-3"],
  ["tracing-lines-worksheets.pdf", 3, "tracing-lines-worksheet-zigzag-wave"],
  ["sight-word-tracing-workbook-sample-8.5x11.pdf", 28, "sight-word-tracing-worksheet"],
  ["uppercase-letter-tracing-worksheets.pdf", 1, "uppercase-letter-tracing-worksheet-a"],
  ["lowercase-letter-tracing-worksheets.pdf", 1, "lowercase-letter-tracing-worksheet-a"],
  ["this-book-belongs-to-page-8.5x11.pdf", 1, "this-book-belongs-to-page"],
  ["name-tracing-worksheet-maya.pdf", 1, "name-tracing-worksheet-maya"],
  ["cursive-name-tracing-worksheet-maya.pdf", 1, "cursive-name-tracing-worksheet-maya"],
  ["tracing-worksheet-cat-sun-dog.pdf", 1, "tracing-worksheet-cat-sun-dog"],
  ["cursive-letter-tracing-worksheets.pdf", 2, "cursive-letter-tracing-worksheet-b"],
  ["cursive-alphabet-chart.pdf", 1, "cursive-alphabet-chart"],
  ["cursive-practice-sheets-for-adults.pdf", 13, "cursive-practice-sheet-for-adults-m"],
  ["handwriting-practice-sheets-for-adults.pdf", 7, "handwriting-practice-sheet-for-adults-g"],
  ["preschool-tracing-worksheets.pdf", 5, "preschool-tracing-worksheet-a"],
  ["letter-tracing-cover-sample-8.5x11.pdf", 1, "tracing-book-cover-sample"],
  ["christmas-tracing-worksheets.pdf", 15, "christmas-tracing-worksheet-snowman"],
  ["halloween-tracing-worksheets.pdf", 1, "halloween-tracing-worksheet-bat"],
  ["thanksgiving-tracing-worksheets.pdf", 18, "thanksgiving-tracing-worksheet-pumpkin"],
  ["picture-word-tracing-worksheets.pdf", 11, "picture-word-tracing-worksheet-fish"],
  ["transportation-tracing-worksheets.pdf", 11, "transportation-tracing-worksheet-tractor"],
  ["animal-tracing-worksheets.pdf", 14, "animal-tracing-worksheet-rabbit"],
  ["food-tracing-worksheets.pdf", 16, "food-tracing-worksheet-banana"],
  ["cursive-handwriting-workbook-sample-8.5x11.pdf", 47, "cursive-handwriting-workbook-word"],
];
const pub = new URL("../public/", import.meta.url).pathname;
mkdirSync(`${pub}img`, { recursive: true });
for (const [pdf, page, name] of PREVIEWS) {
  const out = `${pub}img/${name}`;
  execFileSync("pdftoppm", ["-png", "-scale-to-x", "720", "-scale-to-y", "-1", "-f", String(page), "-l", String(page), "-singlefile", `${pub}samples/${pdf}`, out]);
  execFileSync("python3", ["-c", "import sys;from PIL import Image;p=sys.argv[1];Image.open(p).convert('RGB').quantize(64,dither=Image.Dither.NONE).save(p,optimize=True)", `${out}.png`]);
  console.log(`img/${name}.png`);
}
