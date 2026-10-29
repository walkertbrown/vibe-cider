// Raw portrait footage for the house channel: the matching game with a
// teacher's own words. It opens on a finished board of one week's words (the
// docent's retention lead), then the words box: cleared, a second week's six
// words typed in, Enter, and the new game played through. The typing is real
// keyboard input; cards are turned by the page's own click handler, so no tap
// ring is drawn in the product frame.
//
//   cd app && FFMPEG=/path/to/ffmpeg node ../tracepress/scripts/footage-game-own.mjs
//     → tracepress/public/media/sight-word-matching-game-your-words.mp4 (the .json beside it is hand-written)
import { shoot } from "../../app/scripts/footage-lib.mjs";

const SITE = "https://tracepress.bananafest-destiny.com";
const outDir = new URL("../public/media/", import.meta.url).pathname;
const FIRST = "the,and,see,we,my,can";
const NEXT = "big, red, look, jump, play, said";

const pairsOf = (page) => page.evaluate(() => {
  const by = new Map();
  [...document.querySelectorAll("#board .card")].forEach((b, i) => {
    const k = b.querySelector("img").src;
    by.set(k, [...(by.get(k) ?? []), i]);
  });
  return [...by.values()];
});
const turn = (page, i) => page.evaluate((k) => document.querySelectorAll("#board .card")[k].click(), i);

await shoot("sight-word-matching-game-your-words", async ({ page, wait, start }) => {
  await page.goto(`${SITE}/sight-word-matching-game?words=${FIRST}&pairs=6`, { waitUntil: "networkidle" });
  await page.evaluate(() => { const s = document.getElementById("speak"); if (s) s.checked = false; });
  for (const [a, b] of await pairsOf(page)) { await turn(page, a); await turn(page, b); }
  await wait(1500);
  await page.evaluate(() => document.getElementById("board").scrollIntoView({ block: "start" }));
  await wait(500);
  await start();
  await wait(3800);

  // The words box: this week's words out, next week's in.
  await page.evaluate(() => document.getElementById("ownRow").scrollIntoView({ block: "start" }));
  await wait(1200);
  await page.fill("#own", "");
  await wait(500);
  await page.type("#own", NEXT, { delay: 110 });
  await wait(700);
  await page.press("#own", "Enter");
  await wait(1800);

  await page.evaluate(() => document.getElementById("board").scrollIntoView({ block: "start" }));
  await wait(1200);
  const pairs = await pairsOf(page);
  await turn(page, pairs[0][0]); await wait(900);
  await turn(page, pairs[1][0]); await wait(2200);
  for (const [a, b] of pairs) {
    await turn(page, a); await wait(900);
    await turn(page, b); await wait(1100);
  }
  await wait(1500);
  await page.evaluate(() => document.getElementById("board").scrollIntoView({ block: "start" }));
  await wait(800);
}, { outDir });
