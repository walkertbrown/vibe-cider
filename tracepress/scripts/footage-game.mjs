// Raw portrait footage for the house channel: the sight word matching game
// children play on screen. It opens on a finished board (every pair found,
// the docent's retention lead, 10-27), then deals a fresh game and plays it in
// real time, one miss and then the pairs. Cards are turned by the page's own
// click handler, not a drawn tap, so no tap ring is added to the product
// frame (the docent's rule, 10-28); being untrusted clicks, they send no
// gameflip beacon either.
//
//   cd app && FFMPEG=/path/to/ffmpeg node ../tracepress/scripts/footage-game.mjs
//     → tracepress/public/media/sight-word-matching-game-on-screen.mp4 (the .json beside it is hand-written)
import { shoot } from "../../app/scripts/footage-lib.mjs";

const SITE = "https://tracepress.bananafest-destiny.com";
const outDir = new URL("../public/media/", import.meta.url).pathname;

// Card indexes grouped by word: two cards of the same word carry the same image.
const pairsOf = (page) => page.evaluate(() => {
  const by = new Map();
  [...document.querySelectorAll("#board .card")].forEach((b, i) => {
    const k = b.querySelector("img").src;
    by.set(k, [...(by.get(k) ?? []), i]);
  });
  return [...by.values()];
});
const turn = (page, i) => page.evaluate((k) => document.querySelectorAll("#board .card")[k].click(), i);

await shoot("sight-word-matching-game-on-screen", async ({ page, wait, start }) => {
  await page.goto(`${SITE}/sight-word-matching-game?set=short-a&pairs=6`, { waitUntil: "networkidle" });
  await page.evaluate(() => { const s = document.getElementById("speak"); if (s) s.checked = false; });
  // Finish one game before the camera starts.
  for (const [a, b] of await pairsOf(page)) { await turn(page, a); await turn(page, b); }
  await wait(1500);
  await page.evaluate(() => document.getElementById("board").scrollIntoView({ block: "start" }));
  await wait(500);
  await start();
  await wait(3800);

  // A fresh game, played at a child's pace.
  await page.evaluate(() => document.getElementById("again").click());
  await page.evaluate(() => document.getElementById("board").scrollIntoView({ block: "start" }));
  await wait(1500);
  const pairs = await pairsOf(page);
  await turn(page, pairs[0][0]); await wait(900);
  await turn(page, pairs[1][0]); await wait(2200); // a miss: both turn back
  for (const [a, b] of pairs) {
    await turn(page, a); await wait(900);
    await turn(page, b); await wait(1100);
  }
  await wait(1500);
  await page.evaluate(() => document.getElementById("board").scrollIntoView({ block: "start" }));
  await wait(800);
}, { outDir });
