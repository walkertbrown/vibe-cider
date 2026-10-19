// Raw portrait footage for the house channel: the free Halloween tracing
// worksheets page on a phone-sized screen, its button opening the live book
// maker with the twenty Halloween words filled in, then the 46-page book
// (A to Z, then one word a page with its picture) and its cover.
//
//   cd app && FFMPEG=/path/to/ffmpeg node ../tracepress/scripts/footage-halloween.mjs
//     → tracepress/public/media/halloween-tracing-book.mp4 (the .json beside it is hand-written)
import { shoot } from "../../app/scripts/footage-lib.mjs";

const outDir = new URL("../public/media/", import.meta.url).pathname;
await shoot("halloween-tracing-book", async ({ page, wait, tap, typeInto, scrollTo, download, start, png, show }) => {
  await page.goto("https://tracepress.bananafest-destiny.com/halloween-tracing-worksheets", { waitUntil: "networkidle" });
  await start();
  await wait(2200);
  await page.evaluate(() => window.scrollBy({ top: 260, behavior: "smooth" }));
  await wait(2000);
  const cta = "a.cta[href^='/?words=']";
  await scrollTo(cta, "center");
  await wait(800);
  await Promise.all([page.waitForURL(/\?words=/), tap(cta)]);
  await page.waitForSelector("#preview svg");
  await wait(1200);
  await scrollTo("#preview", "center");
  await wait(2000);
  await scrollTo("#title", "center");
  await typeInto("#title", "Halloween Tracing Book");
  await typeInto("#subtitle", "A to Z and 20 Halloween words");
  await scrollTo("#download", "center");
  const pdf = await download("#download", "book.pdf");
  await page.locator("#status").scrollIntoViewIfNeeded();
  await wait(1800);
  // The free cover opens the price dialog by itself; let it show, then close it.
  const cover = await download("#downloadCover", "cover.pdf");
  await wait(2200);
  await page.keyboard.press("Escape");
  await wait(800);

  // A–Z is pages 1–26, then the words: bat is 27, acorn 40, lollipop 45.
  await show(png(pdf, 27, 150), 2400);
  await show(png(pdf, 40, 150), 2400);
  await show(png(pdf, 45, 150), 2400);
  await show(png(cover, 1, 110), 3000, 96);
}, { outDir });
