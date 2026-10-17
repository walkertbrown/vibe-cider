// Raw portrait footage for the house channel: the live app on a phone-sized
// screen making a whole word-search book and its cover, free, no sign-up,
// then pages of the PDF it actually made.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-build.mjs
//     → public/media/puzzle-press-book-in-the-browser.mp4 (the .json beside it is hand-written)
import { shoot } from "./footage-lib.mjs";

await shoot("puzzle-press-book-in-the-browser", async ({ page, wait, tap, typeInto, scrollTo, download, start, png, show }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/", { waitUntil: "networkidle" });
  await page.waitForSelector(".grid div");
  await start();
  await wait(1500);

  await scrollTo("#tool");
  await typeInto("#title", "Halloween Word Search");
  await typeInto("#subtitle", "60 spooky puzzles, easy to hard");
  await typeInto("#count", "60");
  await wait(500);
  // Untick the default theme on camera, then pick Halloween.
  for (const v of await page.$$eval(".themes input:checked", (els) => els.map((e) => e.value))) {
    await scrollTo(`.themes input[value='${v}']`, "center");
    await tap(`.themes input[value='${v}']`);
    await wait(400);
  }
  await scrollTo(".themes input[value='halloween']", "center");
  await tap(".themes input[value='halloween']");
  await wait(900);
  await scrollTo("#difficulty", "center");
  await tap("#difficulty");
  await page.selectOption("#difficulty", "graded");
  await wait(500);
  await scrollTo("#download", "center");
  const pdf = await download("#download", "book.pdf");
  await page.locator("#status").scrollIntoViewIfNeeded();
  await wait(1800);
  // The free cover opens the price dialog by itself; let it show, then close it.
  const cover = await download("#downloadCover", "cover.pdf");
  await wait(2200);
  await page.keyboard.press("Escape");
  await wait(800);

  // 60 puzzles: pages 3–62 are puzzles, solutions start at 64.
  await show(png(pdf, 3, 220), 2600);
  await show(png(pdf, 62, 220), 2200);
  await show(png(pdf, 64, 220), 2200);
  await show(png(cover, 1, 150), 3000, 96);
});
