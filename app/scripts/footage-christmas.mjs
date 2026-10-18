// Raw portrait footage for the house channel: the live app on a phone-sized
// screen making a large-print Christmas word search at 8.5×11 and its cover,
// free, no sign-up, then pages of the PDF it actually made.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-christmas.mjs
//     → public/media/large-print-christmas-word-search.mp4 (the .json beside it is hand-written)
import { execFileSync } from "node:child_process";
import { shoot } from "./footage-lib.mjs";

await shoot("large-print-christmas-word-search", async ({ page, wait, tap, typeInto, scrollTo, download, start, png, show }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/", { waitUntil: "networkidle" });
  await page.waitForSelector(".grid div");
  await start();
  await wait(1500);

  await scrollTo("#tool");
  await typeInto("#title", "Large Print Christmas Word Search");
  await typeInto("#subtitle", "50 festive puzzles in big type");
  await scrollTo("#trim", "center");
  await tap("#trim");
  await page.selectOption("#trim", "8.5x11");
  await wait(500);
  await scrollTo("#largePrint", "center");
  await tap("#largePrint");
  await wait(600);
  // Untick the default theme on camera, then pick Christmas.
  for (const v of await page.$$eval(".themes input:checked", (els) => els.map((e) => e.value))) {
    await scrollTo(`.themes input[value='${v}']`, "center");
    await tap(`.themes input[value='${v}']`);
    await wait(400);
  }
  await scrollTo(".themes input[value='christmas']", "center");
  await tap(".themes input[value='christmas']");
  await wait(900);
  await scrollTo("#download", "center");
  const pdf = await download("#download", "book.pdf");
  const pages = +execFileSync("pdfinfo", [pdf]).toString().match(/Pages:\s+(\d+)/)[1];
  const text = execFileSync("pdftotext", ["-layout", pdf, "-"]).toString().split("\f");
  const firstSolution = text.findIndex((t) => /solution/i.test(t) && !/puzzle 1\b/i.test(t.slice(0, 40))) + 1;
  console.log(`pages ${pages}, first solution page ${firstSolution}`);
  await page.locator("#status").scrollIntoViewIfNeeded();
  await wait(1800);
  // The free cover opens the price dialog by itself; let it show, then close it.
  const cover = await download("#downloadCover", "cover.pdf");
  await wait(2200);
  await page.keyboard.press("Escape");
  await wait(800);

  await show(png(pdf, 3, 150), 2800);
  await show(png(pdf, firstSolution + 1, 150), 2400); // the page after the "Solutions" divider
  await show(png(cover, 1, 110), 3000, 96);
});
