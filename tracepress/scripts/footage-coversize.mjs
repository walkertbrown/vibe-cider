// Raw portrait footage for the house channel: why an 8.5×11 KDP tracing-book
// cover is 17.309" × 11.25" and not 17" × 11": the arithmetic and the table on
// the live cover-size page, then the 26-page sample cover it links to.
//
//   cd app && FFMPEG=/path/to/ffmpeg node ../tracepress/scripts/footage-coversize.mjs
//     → tracepress/public/media/tracing-book-cover-size.mp4 (the .json beside it is hand-written)
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { shoot } from "../../app/scripts/footage-lib.mjs";

const outDir = new URL("../public/media/", import.meta.url).pathname;
const SITE = "https://tracepress.bananafest-destiny.com";
await shoot("tracing-book-cover-size", async ({ page, wait, scrollTo, start, png, show }) => {
  const res = await page.request.get(`${SITE}/samples/letter-tracing-cover-sample-8.5x11.pdf`);
  const cover = join(mkdtempSync(join(tmpdir(), "cs-")), "cover.pdf");
  writeFileSync(cover, await res.body());

  await page.goto(`${SITE}/tracing-book-cover-size`, { waitUntil: "networkidle" });
  await start();
  await wait(3500);
  // Spine = pages × paper thickness; width = bleed + back + spine + front + bleed.
  await page.evaluate(() => [...document.querySelectorAll("h3")].find((h) => h.textContent.startsWith("The arithmetic")).scrollIntoView({ behavior: "smooth", block: "start" }));
  await wait(6500);
  await page.evaluate(() => [...document.querySelectorAll("h3")].find((h) => h.textContent.startsWith("White paper")).scrollIntoView({ behavior: "smooth", block: "start" }));
  await wait(4500);
  // The table is wider than a phone: slide it to the 78-page column and back.
  await page.evaluate(() => document.querySelector("table").parentElement.scrollTo({ left: 400, behavior: "smooth" }));
  await wait(3500);
  await page.evaluate(() => document.querySelector("table").parentElement.scrollTo({ left: 0, behavior: "smooth" }));
  await wait(2500);
  // The free 26-page 8.5×11 cover: 17.309" × 11.25", PREVIEW mark included.
  await show(png(cover, 1, 110), 5000, 96);
}, { outDir });
