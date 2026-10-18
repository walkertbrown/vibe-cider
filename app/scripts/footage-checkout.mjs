// Raw portrait footage for the house channel: the path the one Puzzle Press
// buyer took (free book, free cover, the $19 checkout), shot on a phone-sized
// screen. The Buy button is pointed at the TEST payment link by answering
// /config.js locally, so Stripe shows its test-mode checkout and nothing is
// charged; the live Payment Link is never loaded (it would open a real,
// untagged checkout session).
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-checkout.mjs
//     → public/media/the-19-dollar-checkout.mp4 (the .json beside it is hand-written)
import { readFileSync } from "node:fs";
import { shoot } from "./footage-lib.mjs";

const TEST = readFileSync(new URL("../../.git-credentials", import.meta.url), "utf8").match(/^PAY_URL_TEST=(.+)$/m)?.[1]?.trim();
if (!TEST || !TEST.includes("/test_")) throw new Error("PAY_URL_TEST missing or not a test link");

await shoot("the-19-dollar-checkout", async ({ page, wait, tap, typeInto, scrollTo, download, start }) => {
  await page.route("**/config.js", (r) => r.fulfill({ contentType: "text/javascript", body: `window.PUZZLE_PRESS_PAY_URL = ${JSON.stringify(TEST)};\n` }));
  await page.route(/buy\.stripe\.com\/(?!test_)/, (r) => r.abort()); // belt and braces: never the live link
  await page.goto("https://puzzlepress.bananafest-destiny.com/", { waitUntil: "networkidle" });
  await page.waitForSelector(".grid div");
  await start();
  await wait(1500);

  await scrollTo("#tool");
  await typeInto("#title", "Garden Word Search");
  await scrollTo("#download", "center");
  await download("#download", "book.pdf");
  await page.locator("#status").scrollIntoViewIfNeeded();
  await wait(2200);
  // The free cover opens the price dialog by itself.
  await download("#downloadCover", "cover.pdf");
  await wait(3200);
  // Same tab, so the checkout is on camera (the real button opens a new tab).
  await page.$$eval("a.buybtn", (as) => as.forEach((a) => a.removeAttribute("target")));
  await Promise.all([page.waitForURL(/checkout\.stripe\.com|buy\.stripe\.com/, { timeout: 60000 }), tap("a.buybtn")]);
  await page.waitForLoadState("networkidle").catch(() => {});
  await wait(7000);
});
