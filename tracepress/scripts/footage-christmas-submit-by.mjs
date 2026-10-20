// Raw portrait footage for the house channel, leading with the date: the free
// Christmas tracing worksheets page on a phone-sized screen, held on its
// "Submit by Friday 30 October" line (a low-content book on sale for Black
// Friday), then its button opening the live book maker with the twenty
// Christmas words, the 46-page book and its cover.
//
//   cd app && FFMPEG=/path/to/ffmpeg node ../tracepress/scripts/footage-christmas-submit-by.mjs
//     → tracepress/public/media/christmas-tracing-submit-by-30-october.mp4 (the .json beside it is hand-written)
import { shoot } from "../../app/scripts/footage-lib.mjs";

const outDir = new URL("../public/media/", import.meta.url).pathname;
await shoot("christmas-tracing-submit-by-30-october", async ({ page, wait, tap, typeInto, scrollTo, download, start, png, show }) => {
  await page.goto("https://tracepress.bananafest-destiny.com/christmas-tracing-worksheets", { waitUntil: "networkidle" });
  // Open on the deadline itself, so the first frame is the reason to act now.
  await page.evaluate(() => {
    const p = [...document.querySelectorAll("p")].find((el) => /Submit by Friday 30 October/.test(el.textContent));
    p.id = "__submitby";
    p.scrollIntoView({ block: "center" });
    p.style.background = "#fff3c4";
  });
  await start();
  await wait(4500);
  const cta = "a.cta[href^='/?words=']";
  await scrollTo(cta, "center");
  await wait(800);
  await Promise.all([page.waitForURL(/\?words=/), tap(cta)]);
  await page.waitForSelector("#preview svg");
  await wait(1200);
  await scrollTo("#preview", "center");
  await wait(1800);
  await scrollTo("#title", "center");
  await typeInto("#title", "Christmas Tracing Book");
  await typeInto("#subtitle", "A to Z and 20 Christmas words");
  await scrollTo("#download", "center");
  const pdf = await download("#download", "book.pdf");
  await page.locator("#status").scrollIntoViewIfNeeded();
  await wait(1800);
  // The free cover opens the price dialog by itself; let it show, then close it.
  const cover = await download("#downloadCover", "cover.pdf");
  await wait(2200);
  await page.keyboard.press("Escape");
  await wait(800);

  // A–Z is pages 1–26, then the words in the button's order: star is 29, snowman 41, gingerbread 46.
  await show(png(pdf, 29, 150), 2400);
  await show(png(pdf, 41, 150), 2400);
  await show(png(pdf, 46, 150), 2400);
  await show(png(cover, 1, 110), 3000, 96);
}, { outDir });
