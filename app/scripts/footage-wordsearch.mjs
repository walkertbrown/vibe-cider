// Raw portrait footage for the house channel: the word search page's own
// measurement (5,400 puzzles; every easy and medium book had a fill thrown away
// for spelling a rude word), then the live tool making an easy word search book
// from that page's button, then its first puzzle.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-wordsearch.mjs
//     → public/media/word-search-5400-rude-words-caught.mp4 (the .json beside it is hand-written)
import { execFileSync } from "node:child_process";
import { shoot } from "./footage-lib.mjs";

await shoot("word-search-5400-rude-words-caught", async ({ page, wait, tap, typeInto, scrollTo, download, start, png, show }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/word-search-book-generator", { waitUntil: "networkidle" });
  await start();
  await wait(1200);

  // Lead with the number: the measured section, then its blocklist paragraph.
  await page.evaluate(() => [...document.querySelectorAll("h2")].find((h) => h.textContent.startsWith("Measured on"))
    .scrollIntoView({ behavior: "smooth", block: "start" }));
  await wait(4500);
  await page.evaluate(() => [...document.querySelectorAll("p")].find((p) => p.textContent.startsWith("The blocklist is"))
    .scrollIntoView({ behavior: "smooth", block: "start" }));
  await wait(5500);

  // The page's own button into the tool.
  await scrollTo("a.btn[href='/?kind=wordsearch#tool']", "center");
  await wait(600);
  await Promise.all([page.waitForURL(/kind=wordsearch/), tap("a.btn[href='/?kind=wordsearch#tool']")]);
  await page.waitForSelector("#difficulty option", { state: "attached" });
  await wait(1200);

  await scrollTo("#difficulty", "center");
  await tap("#difficulty");
  const easy = await page.$eval("#difficulty", (s) => [...s.options].find((o) => /^easy/i.test(o.textContent.trim())).value);
  await page.selectOption("#difficulty", easy);
  await wait(700);
  await scrollTo("#count", "center");
  await typeInto("#count", "20");
  await wait(600);

  await scrollTo("#download", "center");
  const pdf = await download("#download", "wordsearch.pdf");
  const pages = execFileSync("pdftotext", ["-layout", pdf, "-"]).toString().split("\f");
  const first = pages.findIndex((t) => /Puzzle 1\b/.test(t)) + 1;
  console.log("status:", await page.$eval("#status", (e) => e.textContent).catch(() => "?"));
  console.log("first puzzle page", first, "\n" + pages[first - 1].slice(0, 1500));
  await wait(1200);

  await show(png(pdf, first, 150), 4200, 94);
});
