// Raw portrait footage for the house channel: the same name in two cases on the
// live free name tracing worksheet. Maya, then MAYA: the numbered start dots
// (one per stroke) go from 6 to 10. Then the page's own paragraph that counts
// them, then page 1 of the PDF it made.
//
//   cd app && FFMPEG=/path/to/ffmpeg node ../tracepress/scripts/footage-name-capitals.mjs
//     → tracepress/public/media/name-tracing-capitals-strokes.mp4 (the .json beside it is hand-written)
import { shoot } from "../../app/scripts/footage-lib.mjs";

const outDir = new URL("../public/media/", import.meta.url).pathname;
await shoot("name-tracing-capitals-strokes", async ({ page, wait, typeInto, scrollTo, download, start, png, show }) => {
  await page.goto("https://tracepress.bananafest-destiny.com/name-tracing", { waitUntil: "networkidle" });
  await page.waitForSelector("#preview *");
  await start();
  await wait(1200);

  await scrollTo("#tool");
  await typeInto("#name", "Maya");
  await scrollTo("#preview", "center");
  await wait(3200);
  await scrollTo("#tool");
  await typeInto("#name", "MAYA");
  await scrollTo("#preview", "center");
  await wait(3200);

  // The paragraph that counts the strokes, from the page itself.
  await page.evaluate(() => [...document.querySelectorAll("h3")].find((h) => h.textContent.startsWith("Capitals"))
    .scrollIntoView({ behavior: "smooth", block: "start" }));
  await wait(5500);

  await scrollTo("#download", "center");
  const pdf = await download("#download", "name.pdf");
  await wait(1000);
  await show(png(pdf, 1, 150), 3600, 94);
}, { outDir });
