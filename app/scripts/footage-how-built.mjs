// Raw portrait footage for the docent's 2–5 min "how this got built" piece:
// the studio's own record of this agent (the zoo page and two days of its
// build log), then each app it built making a book on a phone-sized screen.
// Every screen is the live site; nothing is mocked.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-how-built.mjs
//     → public/media/how-vibe-cider-built-two-apps.mp4 (the .json beside it is hand-written)
import { shoot } from "./footage-lib.mjs";

const ZOO = "https://bananafest-destiny.com/zoo/vibe-cider";
await shoot("how-vibe-cider-built-two-apps", async ({ page, wait, tap, typeInto, scrollTo, download, start, png, show }) => {
  // Read down a page at a reading pace.
  const read = async (px, steps, gap) => {
    for (let i = 0; i < steps; i++) { await page.evaluate((px) => window.scrollBy({ top: px, behavior: "smooth" }), px); await wait(gap); }
  };

  // 1. The studio's record of this agent: born September 10.
  await page.goto(ZOO, { waitUntil: "networkidle" });
  await start();
  await wait(4000);
  await read(220, 6, 2400);

  // 2. Day one: the decision to build Puzzle Press.
  await page.goto(`${ZOO}/log/2026-09-10`, { waitUntil: "networkidle" });
  await wait(4000);
  await read(260, 10, 2400);

  // 3. Puzzle Press, as it is now: a word-search book in the browser.
  await page.goto("https://puzzlepress.bananafest-destiny.com/", { waitUntil: "networkidle" });
  await page.waitForSelector(".grid div");
  await wait(3000);
  await scrollTo("#tool");
  await typeInto("#title", "Ocean Word Search");
  await scrollTo("#download", "center");
  const pp = await download("#download", "pp.pdf");
  await page.locator("#status").scrollIntoViewIfNeeded();
  await wait(2500);
  await show(png(pp, 3, 150), 3500);

  // 4. Day 19: the first sale, and the second app it started.
  await page.goto(`${ZOO}/log/2026-09-29`, { waitUntil: "networkidle" });
  await wait(1500);
  await scrollTo("#actual-the-first-sale-and-what-it-started");
  await wait(3000);
  await read(200, 10, 2600);

  // 5. Trace Press: a handwriting workbook in the browser.
  await page.goto("https://tracepress.bananafest-destiny.com/", { waitUntil: "networkidle" });
  await page.waitForSelector("#preview svg");
  await wait(3000);
  await scrollTo("#preview", "center");
  await wait(2500);
  await scrollTo("#title", "center");
  await typeInto("#title", "Trace and Write");
  await scrollTo("#download", "center");
  const tp = await download("#download", "tp.pdf");
  await page.locator("#status").scrollIntoViewIfNeeded();
  await wait(2500);
  await show(png(tp, 1, 150), 3500);
  await show(png(tp, 5, 150), 3500);

  // 6. Back to the record: where it stands today.
  await page.goto(ZOO, { waitUntil: "networkidle" });
  await wait(5000);
}, { outDir: new URL("../public/media/", import.meta.url).pathname });
