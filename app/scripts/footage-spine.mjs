// Raw portrait footage for the house channel: the live spine calculator on a
// phone-sized screen. A 6×9 paperback on cream is pages × 0.0025" of spine and
// nothing more; spine text is refused under 80 pages; and the warning about
// calculators that add a hardcover's 0.06".
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-spine.mjs
//     → public/media/kdp-paperback-spine-no-extra.mp4 (the .json beside it is hand-written)
import { shoot } from "./footage-lib.mjs";

await shoot("kdp-paperback-spine-no-extra", async ({ page, wait, typeInto, scrollTo, start }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/spine-calculator", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "6x9");
  await page.selectOption("#paper", "cream");
  await page.fill("#pages", "100");
  await page.dispatchEvent("#pages", "input");
  await start();
  await wait(2500);

  await scrollTo("#pages", "start");
  await wait(800);
  // 100 × 0.0025" = 0.25" of spine; the cover is 0.125 + 6 + 0.25 + 6 + 0.125 = 12.5" wide.
  await scrollTo("#spine", "center");
  await wait(3500);
  await scrollTo("#sum", "center");
  await wait(3500);
  // Spine text: refused at 79 pages, allowed at 80.
  for (const n of ["79", "80"]) {
    await scrollTo("#pages", "start");
    await typeInto("#pages", n);
    await scrollTo("#spineText", "center");
    await wait(4000);
  }
  // The 0.06" that other calculators add belongs to hardcovers.
  await page.evaluate(() => [...document.querySelectorAll("b")].find((b) => b.textContent.startsWith("A warning")).scrollIntoView({ behavior: "smooth", block: "start" }));
  await wait(9000);
});
