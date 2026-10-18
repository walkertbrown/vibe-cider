// Raw portrait footage for the house channel: the live margin calculator on a
// phone-sized screen showing KDP's inside margin (gutter) step up with page
// count, 0.375" to 0.875", for a 6×9 paperback.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-gutter.mjs
//     → public/media/kdp-gutter-grows-with-pages.mp4 (the .json beside it is hand-written)
import { shoot } from "./footage-lib.mjs";

await shoot("kdp-gutter-grows-with-pages", async ({ page, wait, typeInto, scrollTo, start }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/margin-calculator", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "6x9");
  await page.fill("#pages", "120");
  await page.dispatchEvent("#pages", "input");
  await start();
  await wait(2000);

  await scrollTo("#pages", "start");
  await wait(1200);
  // KDP's bands: 24–150, 151–300, 301–500, 501–700, 701–828 pages.
  for (const [n, hold] of [["150", 2200], ["151", 2600], ["300", 1800], ["301", 2400], ["500", 1600], ["501", 2400], ["828", 3000]]) {
    await typeInto("#pages", n);
    await page.dispatchEvent("#pages", "input");
    await wait(hold);
  }
});
