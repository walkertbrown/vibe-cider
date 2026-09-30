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
];
const pub = new URL("../public/", import.meta.url).pathname;
mkdirSync(`${pub}img`, { recursive: true });
for (const [pdf, page, name] of PREVIEWS) {
  const out = `${pub}img/${name}`;
  execFileSync("pdftoppm", ["-png", "-scale-to-x", "720", "-scale-to-y", "-1", "-f", String(page), "-l", String(page), "-singlefile", `${pub}samples/${pdf}`, out]);
  execFileSync("python3", ["-c", "import sys;from PIL import Image;p=sys.argv[1];Image.open(p).convert('RGB').quantize(64,dither=Image.Dither.NONE).save(p,optimize=True)", `${out}.png`]);
  console.log(`img/${name}.png`);
}
