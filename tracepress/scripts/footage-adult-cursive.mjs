// Raw portrait footage for the house channel: the live Trace Press tool on a
// phone-sized screen set up for grown-ups: joined cursive on 0.45" lines at
// 6×9, with an A–Z chart page and page numbers. Interior and cover, then
// pages of the PDFs it made.
//
//   cd app && FFMPEG=/path/to/ffmpeg node ../tracepress/scripts/footage-adult-cursive.mjs
//     → tracepress/public/media/cursive-workbook-for-adults.mp4 (the .json beside it is hand-written)
import { execFileSync } from "node:child_process";
import { shoot } from "../../app/scripts/footage-lib.mjs";

const outDir = new URL("../public/media/", import.meta.url).pathname;
await shoot("cursive-workbook-for-adults", async ({ page, wait, tap, typeInto, scrollTo, download, start, png, show }) => {
  await page.goto("https://tracepress.bananafest-destiny.com/", { waitUntil: "networkidle" });
  await page.waitForSelector("#preview svg");
  await start();
  await wait(1500);

  await scrollTo("#tool");
  for (const [sel, value] of [["#trim", "6x9"], ["#age", "0.45"], ["#script", "cursive"]]) {
    await scrollTo(sel, "center");
    await tap(sel);
    await page.selectOption(sel, value);
    await wait(700);
  }
  for (const id of ["chart", "folios"]) {
    await scrollTo(`#${id}`, "center");
    await tap(`#${id}`);
    await wait(500);
  }
  await scrollTo("#preview", "center");
  await wait(2200);
  await scrollTo("#title", "center");
  await typeInto("#title", "Cursive Practice for Adults");
  await typeInto("#subtitle", "A to Z on narrow lines");
  await scrollTo("#download", "center");
  const pdf = await download("#download", "book.pdf");
  console.log(execFileSync("pdfinfo", [pdf]).toString().match(/Pages:\s+\d+/)[0]);
  await page.locator("#status").scrollIntoViewIfNeeded();
  await wait(1800);
  // The free cover opens the price dialog by itself; let it show, then close it.
  const cover = await download("#downloadCover", "cover.pdf");
  await wait(2200);
  await page.keyboard.press("Escape");
  await wait(800);

  // The chart page comes first, then A from page 2.
  await show(png(pdf, 1, 160), 2400);
  await show(png(pdf, 2, 160), 2600);
  await show(png(pdf, 8, 160), 2200);
  await show(png(cover, 1, 120), 3000, 96);
}, { outDir });
