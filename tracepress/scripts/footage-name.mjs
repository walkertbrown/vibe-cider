// Raw portrait footage for the house channel: the live free name tracing
// worksheet on a phone-sized screen. Type a name, see it in print with start
// dots and arrows, switch to joined cursive, download the PDF, then the page
// it made. Capture is shared with Puzzle Press (app/scripts/footage-lib.mjs).
//
//   cd app && FFMPEG=/path/to/ffmpeg node ../tracepress/scripts/footage-name.mjs
//     → tracepress/public/media/name-tracing-worksheet.mp4 (the .json beside it is hand-written)
import { shoot } from "../../app/scripts/footage-lib.mjs";

const outDir = new URL("../public/media/", import.meta.url).pathname;
await shoot("name-tracing-worksheet", async ({ page, wait, tap, typeInto, scrollTo, download, start, png, show }) => {
  await page.goto("https://tracepress.bananafest-destiny.com/name-tracing", { waitUntil: "networkidle" });
  await page.waitForSelector("#preview *");
  await start();
  await wait(1500);

  await scrollTo("#tool");
  await typeInto("#name", "Oliver");
  await scrollTo("#preview", "center");
  await wait(2600);
  await scrollTo("#script", "center");
  await tap("#script");
  await page.selectOption("#script", "cursive");
  await wait(500);
  await scrollTo("#preview", "center");
  await wait(2600);
  await scrollTo("#download", "center");
  const pdf = await download("#download", "name.pdf");
  await wait(1200);
  await show(png(pdf, 1, 150), 3600, 94);
}, { outDir });
