// Raw portrait footage for the house channel: the maze page's own measurement
// (2,000 mazes, every one perfect; the longest easy route beat the shortest
// hard one), then the live tool making a graded maze book from that page's
// button, then its first and last mazes.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-maze.mjs
//     → public/media/maze-2000-measured-easy-to-expert.mp4 (the .json beside it is hand-written)
import { execFileSync } from "node:child_process";
import { shoot } from "./footage-lib.mjs";

await shoot("maze-2000-measured-easy-to-expert", async ({ page, wait, tap, typeInto, scrollTo, download, start, png, show }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/maze-book-generator", { waitUntil: "networkidle" });
  await start();
  await wait(1200);

  // Lead with the number: the measured section and its table.
  await page.evaluate(() => [...document.querySelectorAll("h2")].find((h) => h.textContent.startsWith("Measured on"))
    .scrollIntoView({ behavior: "smooth", block: "start" }));
  await wait(6000);

  // The page's own button into the tool.
  await scrollTo("a.btn[href='/?kind=maze#tool']", "center");
  await wait(600);
  await Promise.all([page.waitForURL(/kind=maze/), tap("a.btn[href='/?kind=maze#tool']")]);
  await page.waitForSelector("#difficulty option", { state: "attached" });
  await wait(1200);

  await scrollTo("#difficulty", "center");
  await tap("#difficulty");
  const graded = await page.$eval("#difficulty", (s) => [...s.options].find((o) => /graded/i.test(o.textContent)).value);
  await page.selectOption("#difficulty", graded);
  await wait(700);
  await scrollTo("#count", "center");
  await typeInto("#count", "20");
  await wait(600);

  await scrollTo("#download", "center");
  const pdf = await download("#download", "mazes.pdf");
  const pages = execFileSync("pdftotext", ["-layout", pdf, "-"]).toString().split("\f");
  const first = pages.findIndex((t) => /Puzzle 1\b/.test(t)) + 1;
  const last = pages.findIndex((t) => /Puzzle 20\b/.test(t)) + 1;
  console.log("first maze page", first, pages[first - 1].trim().slice(0, 80), "| last maze page", last, pages[last - 1].trim().slice(0, 80));
  await wait(1200);

  await show(png(pdf, first, 150), 3200, 94);
  await show(png(pdf, last, 150), 3600, 94);
});
