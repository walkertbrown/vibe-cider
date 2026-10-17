// Raw portrait footage for the house channel: on the live royalty calculator,
// a 6×9 black-ink book at $9.99 earns the same at 24 pages as at 110, because
// KDP charges a flat $2.30 to print up to 110 pages on Amazon.com, then per page.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-flatrate.mjs
//     → public/media/kdp-printing-flat-to-110-pages.mp4 (the .json beside it is hand-written)
import { shoot } from "./footage-lib.mjs";

await shoot("kdp-printing-flat-to-110-pages", async ({ page, wait, typeInto, scrollTo, start }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/royalty-calculator", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "6x9");
  await page.selectOption("#ink", "black");
  await page.fill("#list", "9.99");
  await page.dispatchEvent("#list", "input");
  await page.fill("#pages", "24");
  await page.dispatchEvent("#pages", "input");
  await start();
  await wait(1500);

  await scrollTo(".calc");
  await wait(600);
  for (const [pages, hold] of [["24", 3000], ["110", 3000], ["112", 3200]]) {
    await typeInto("#pages", pages);
    await scrollTo("#earn", "center");
    await wait(hold);
    await scrollTo(".calc");
  }
});
