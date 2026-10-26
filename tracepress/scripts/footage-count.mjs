// Raw portrait footage for the house channel: the live free count and trace
// worksheets on a phone-sized screen. Page through both sheets (a ten frame
// to count, the number to trace), download the PDF, then both pages it made.
// Capture is shared with Puzzle Press (app/scripts/footage-lib.mjs).
//
//   cd app && FFMPEG=/path/to/ffmpeg node ../tracepress/scripts/footage-count.mjs
//     → tracepress/public/media/count-and-trace-1-10.mp4 (the .json beside it is hand-written)
import { shoot } from "../../app/scripts/footage-lib.mjs";

const outDir = new URL("../public/media/", import.meta.url).pathname;
await shoot("count-and-trace-1-10", async ({ page, wait, tap, scrollTo, download, start, png, show }) => {
  await page.goto("https://tracepress.bananafest-destiny.com/count-and-trace-worksheets", { waitUntil: "networkidle" });
  await page.waitForSelector("#preview *");
  await start();
  await wait(1500);

  await scrollTo("#preview", "center");
  await wait(2600);
  await tap("#next");
  await wait(2200);
  await scrollTo("#download", "center");
  const pdf = await download("#download", "count.pdf");
  await wait(1200);
  await show(png(pdf, 1, 150), 3400);
  await show(png(pdf, 2, 150), 2600);
}, { outDir });
