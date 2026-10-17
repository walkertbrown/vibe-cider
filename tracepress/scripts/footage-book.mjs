// Raw portrait footage for the house channel: the live Trace Press tool on a
// phone-sized screen making a whole handwriting workbook for KDP, free, no
// sign-up: pre-writing lines, A to Z with pictures, 0 to 9, then the cover,
// and pages of the PDFs it made.
//
//   cd app && FFMPEG=/path/to/ffmpeg node ../tracepress/scripts/footage-book.mjs
//     → tracepress/public/media/handwriting-workbook-in-the-browser.mp4 (the .json beside it is hand-written)
import { shoot } from "../../app/scripts/footage-lib.mjs";

const outDir = new URL("../public/media/", import.meta.url).pathname;
await shoot("handwriting-workbook-in-the-browser", async ({ page, wait, tap, typeInto, scrollTo, download, start, png, show }) => {
  await page.goto("https://tracepress.bananafest-destiny.com/", { waitUntil: "networkidle" });
  await page.waitForSelector("#preview svg");
  await start();
  await wait(1500);

  await scrollTo("#tool");
  await wait(600);
  for (const id of ["abc", "lines", "numbers"]) {
    if (await page.isChecked(`#${id}`)) continue;
    await scrollTo(`#${id}`, "center");
    await tap(`#${id}`);
    await wait(600);
  }
  await scrollTo("#preview", "center");
  await wait(1800);
  await scrollTo("#title", "center");
  await typeInto("#title", "My First Letters");
  await typeInto("#subtitle", "Trace A to Z and 0 to 9");
  await scrollTo("#download", "center");
  const pdf = await download("#download", "book.pdf");
  await page.locator("#status").scrollIntoViewIfNeeded();
  await wait(1800);
  // The free cover opens the price dialog by itself; let it show, then close it.
  const cover = await download("#downloadCover", "cover.pdf");
  await wait(2200);
  await page.keyboard.press("Escape");
  await wait(800);

  // Lines pages 1–4, A is page 5, Z is 30, then 0–9 from 31.
  await show(png(pdf, 1, 150), 2200);
  await show(png(pdf, 5, 150), 2600);
  await show(png(pdf, 34, 150), 2200);
  await show(png(cover, 1, 110), 3000, 96);
}, { outDir });
