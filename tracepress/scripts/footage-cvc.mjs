// Raw portrait footage for the house channel: the live free CVC word
// worksheets on a phone-sized screen. Page through the three sheets (picture,
// a box per sound, the word to trace), download the PDF, then two of the
// pages it made.
// Capture is shared with Puzzle Press (app/scripts/footage-lib.mjs).
//
//   cd app && FFMPEG=/path/to/ffmpeg node ../tracepress/scripts/footage-cvc.mjs
//     → tracepress/public/media/cvc-word-worksheets.mp4 (the .json beside it is hand-written)
import { shoot } from "../../app/scripts/footage-lib.mjs";

const outDir = new URL("../public/media/", import.meta.url).pathname;
await shoot("cvc-word-worksheets", async ({ page, wait, tap, scrollTo, download, start, png, show }) => {
  await page.goto("https://tracepress.bananafest-destiny.com/cvc-worksheets", { waitUntil: "networkidle" });
  await page.waitForSelector("#preview *");
  await start();
  await wait(1500);

  await scrollTo("#preview", "center");
  await wait(2600);
  await tap("#next");
  await wait(2200);
  await tap("#next");
  await wait(2200);
  await scrollTo("#download", "center");
  const pdf = await download("#download", "cvc.pdf");
  await wait(1200);
  await show(png(pdf, 1, 150), 3400);
  await show(png(pdf, 3, 150), 2600);
}, { outDir });
