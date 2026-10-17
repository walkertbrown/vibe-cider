// Raw portrait footage for the house channel: the live royalty calculator on
// a phone-sized screen, answering "what does a KDP paperback earn at each
// price" for a 6×9, 120-page book, then the same book in premium colour.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-royalty.mjs
//     → public/media/kdp-royalty-at-each-price.mp4 (the .json beside it is hand-written)
import { shoot } from "./footage-lib.mjs";

await shoot("kdp-royalty-at-each-price", async ({ page, wait, tap, typeInto, scrollTo, start }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/royalty-calculator", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "6x9");
  await page.fill("#pages", "120");
  await page.selectOption("#ink", "black");
  await page.fill("#list", "9.99");
  await page.dispatchEvent("#list", "input");
  await start();
  await wait(1800);

  await scrollTo(".calc");
  await wait(600);
  // Under $9.99 KDP pays 50%; at $9.99 and up, 60%.
  for (const [price, hold] of [["6.99", 3200], ["9.99", 2600], ["12.99", 2600]]) {
    await typeInto("#list", price);
    await scrollTo("#earn", "center");
    await wait(hold);
    await scrollTo(".calc");
  }
  // The same book in premium colour: printing passes the royalty.
  await tap("#ink");
  await page.selectOption("#ink", "premiumColor");
  await wait(600);
  await scrollTo("#earn", "center");
  await wait(3600);
});
