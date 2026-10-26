// Raw portrait footage for the house channel: the live free sight word flash
// cards on a phone-sized screen. Page through the Dolch cards, add the copy to
// trace, download the PDF, then the sheet it made with its cut lines.
// Capture is shared with Puzzle Press (app/scripts/footage-lib.mjs).
//
//   cd app && FFMPEG=/path/to/ffmpeg node ../tracepress/scripts/footage-flashcards.mjs
//     → tracepress/public/media/sight-word-flash-cards-3x5.mp4 (the .json beside it is hand-written)
import { shoot } from "../../app/scripts/footage-lib.mjs";

const outDir = new URL("../public/media/", import.meta.url).pathname;
await shoot("sight-word-flash-cards-3x5", async ({ page, wait, tap, scrollTo, download, start, png, show }) => {
  await page.goto("https://tracepress.bananafest-destiny.com/sight-word-flash-cards", { waitUntil: "networkidle" });
  await page.waitForSelector("#preview *");
  await start();
  await wait(1500);

  await scrollTo("#preview", "center");
  await wait(2200);
  await tap("#next");
  await wait(1600);
  await tap("#next");
  await wait(1600);
  await scrollTo("#trace", "center");
  await tap("#trace");
  await wait(500);
  await scrollTo("#preview", "center");
  await wait(2800);
  await scrollTo("#download", "center");
  const pdf = await download("#download", "cards.pdf");
  await wait(1200);
  await show(png(pdf, 1, 150), 3600, 96);
  await show(png(pdf, 10, 150), 2600, 96);
}, { outDir });
