// Raw portrait footage for the house channel: the sudoku page's own measurement
// (2,400 puzzles, every one with exactly one solution), then the live tool
// making an expert sudoku book from that page's button, then a page of the PDF.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-sudoku.mjs
//     → public/media/sudoku-2400-puzzles-one-solution.mp4 (the .json beside it is hand-written)
import { execFileSync } from "node:child_process";
import { shoot } from "./footage-lib.mjs";

await shoot("sudoku-2400-puzzles-one-solution", async ({ page, wait, tap, typeInto, scrollTo, download, start, png, show }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/sudoku-book-generator", { waitUntil: "networkidle" });
  await start();
  await wait(1200);

  // Lead with the number: the measured section and its table.
  await page.evaluate(() => [...document.querySelectorAll("h2")].find((h) => h.textContent.startsWith("Measured on"))
    .scrollIntoView({ behavior: "smooth", block: "start" }));
  await wait(5000);

  // The page's own button into the tool.
  await scrollTo("a.btn[href='/?kind=sudoku#tool']", "center");
  await wait(600);
  await Promise.all([page.waitForURL(/kind=sudoku/), tap("a.btn[href='/?kind=sudoku#tool']")]);
  await page.waitForSelector("#difficulty option", { state: "attached" });
  await wait(1200);

  await scrollTo("#difficulty", "center");
  await tap("#difficulty");
  const expert = await page.$eval("#difficulty", (s) => [...s.options].find((o) => /expert/i.test(o.textContent)).value);
  await page.selectOption("#difficulty", expert);
  await wait(700);
  await scrollTo("#count", "center");
  await typeInto("#count", "20");
  await wait(600);

  await scrollTo("#download", "center");
  const pdf = await download("#download", "sudoku.pdf");
  const text = execFileSync("pdftotext", ["-layout", "-f", "3", "-l", "3", pdf, "-"]).toString();
  console.log("page 3 digits:", (text.match(/\b[1-9]\b/g) || []).length, "\n" + text.slice(0, 900));
  await wait(1200);

  await show(png(pdf, 3, 150), 3600, 94);
});
