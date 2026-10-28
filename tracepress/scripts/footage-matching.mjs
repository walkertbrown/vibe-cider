// Raw portrait footage for the house channel: the short vowel matching game.
// It opens on a finished sheet filling the frame and holds it (the docent's
// retention lead, 10-27), then its coloured back, then the live tool set to
// the same game by its URL, so nothing is tapped and no tap ring is drawn into
// the product frame (the docent's rule, 10-28). Sheets come from the live
// sample PDF, fetched by this run.
//
//   cd app && FFMPEG=/path/to/ffmpeg node ../tracepress/scripts/footage-matching.mjs
//     → tracepress/public/media/short-vowel-matching-game.mp4 (the .json beside it is hand-written)
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { shoot } from "../../app/scripts/footage-lib.mjs";

const SITE = "https://tracepress.bananafest-destiny.com";
const outDir = new URL("../public/media/", import.meta.url).pathname;
await shoot("short-vowel-matching-game", async ({ page, wait, scrollTo, start, png, show }) => {
  const res = await page.request.get(`${SITE}/samples/short-vowel-matching-cards.pdf`);
  if (!res.ok()) throw new Error(`sample PDF: ${res.status()}`);
  const pdf = join(tmpdir(), `matching-${process.pid}.pdf`);
  writeFileSync(pdf, await res.body());

  await show(png(pdf, 1, 150), 10, 96);
  await start();
  await wait(4200); // short a: six words, each twice
  await show(png(pdf, 2, 150), 2600, 96); // its back
  await show(png(pdf, 13, 150), 2600, 96); // short o
  await show(png(pdf, 14, 150), 1800, 96);
  await show(png(pdf, 17, 150), 2600, 96); // short u
  await show(png(pdf, 18, 150), 1800, 96);

  await page.goto(`${SITE}/sight-word-flash-cards?list=short-i&sheet=letter-game&pairs=1&backs=1`, { waitUntil: "networkidle" });
  await page.waitForSelector("#preview *");
  await wait(1200);
  await scrollTo("#preview", "center");
  await wait(3500);
}, { outDir });
