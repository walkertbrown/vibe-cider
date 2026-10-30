// Raw portrait footage for the house channel: the word and picture matching
// cards. It opens on a finished sheet filling the frame and holds it (the
// docent's retention lead, 10-27), then its coloured back and two more sheets,
// then the live tool set to the same game by its URL, and then to single
// picture cards, so nothing is tapped and no tap ring is drawn into the
// product frame (the docent's rule, 10-28). Sheets come from the live sample
// PDF, fetched by this run.
//
//   cd app && FFMPEG=/path/to/ffmpeg node ../tracepress/scripts/footage-picture-cards.mjs
//     → tracepress/public/media/word-picture-matching-cards.mp4 (the .json beside it is hand-written)
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { shoot } from "../../app/scripts/footage-lib.mjs";

const SITE = "https://tracepress.bananafest-destiny.com";
const outDir = new URL("../public/media/", import.meta.url).pathname;
await shoot("word-picture-matching-cards", async ({ page, wait, scrollTo, start, png, show }) => {
  const res = await page.request.get(`${SITE}/samples/word-picture-matching-cards.pdf`);
  if (!res.ok()) throw new Error(`sample PDF: ${res.status()}`);
  const pdf = join(tmpdir(), `picture-cards-${process.pid}.pdf`);
  writeFileSync(pdf, await res.body());

  await show(png(pdf, 1, 150), 10, 96);
  await start();
  await wait(4200); // cat, bat, map, van, bag, rat and their pictures
  await show(png(pdf, 2, 150), 2400, 96); // its back
  await show(png(pdf, 5, 150), 2800, 96); // pin, fish, gift, ship, milk, dog
  await show(png(pdf, 9, 150), 2800, 96); // the last five pairs

  await page.goto(`${SITE}/sight-word-flash-cards?list=pictures&sheet=letter-game&pairs=1&backs=1`, { waitUntil: "networkidle" });
  await page.waitForSelector("#preview *");
  await wait(1200);
  await scrollTo("#preview", "center");
  await wait(3500);

  // The same words as single cards: the picture above the word.
  await page.goto(`${SITE}/sight-word-flash-cards?list=pictures&sheet=letter-game`, { waitUntil: "networkidle" });
  await page.waitForSelector("#preview *");
  await wait(800);
  await scrollTo("#preview", "center");
  await wait(3800);
}, { outDir });
