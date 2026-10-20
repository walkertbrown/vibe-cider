// Raw portrait footage for the house channel, leading with the comparison:
// /compare's tested table on a phone-sized screen, scrolled to its "Mark on the
// free file" column (three of the seven tools stamp the free puzzles), then its
// button into the live book maker, a whole word-search book made free, and
// pages of that PDF with nothing on them but the page number. Ends on the
// cover, which is where the free tier's one mark is.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-unmarked.mjs
//     → public/media/free-puzzle-book-pages-unmarked.mp4 (the .json beside it is hand-written)
import { shoot } from "./footage-lib.mjs";

await shoot("free-puzzle-book-pages-unmarked", async ({ page, wait, tap, scrollTo, download, start, png, show }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/compare", { waitUntil: "networkidle" });
  // Tint the one column, in this capture only, so a phone screen can read it.
  await page.evaluate(() => {
    for (const c of document.querySelectorAll("#tested tr > :nth-child(6)")) c.style.background = "#fff3c4";
  });
  await scrollTo("#tested .tablewrap", "start");
  await start();
  await wait(1500);
  // Slide the table to the column, the way a thumb would.
  await page.evaluate(async () => {
    const w = document.querySelector("#tested .tablewrap");
    const target = document.querySelector("#tested tr > :nth-child(6)").offsetLeft - 70;
    for (let i = 1; i <= 30; i++) { w.scrollLeft = (target * i) / 30; await new Promise((r) => setTimeout(r, 33)); }
  });
  await wait(2500);
  // Then down the column, row by row, to our own row at the bottom.
  await page.evaluate(async () => {
    const last = document.querySelector("#tested tr:last-child");
    const end = last.getBoundingClientRect().bottom - window.innerHeight + 140;
    for (let i = 1; i <= 90; i++) { window.scrollBy(0, end / 90); await new Promise((r) => setTimeout(r, 40)); }
  });
  await wait(3500);

  const btn = "#tested + .make-here a.btn";
  await scrollTo(btn, "center");
  await wait(700);
  await Promise.all([page.waitForURL(/bananafest-destiny\.com\/(#tool)?$/), tap(btn)]);
  await page.waitForSelector(".grid div");
  await wait(1500);
  await scrollTo("#download", "center");
  const pdf = await download("#download", "book.pdf");
  await page.locator("#status").scrollIntoViewIfNeeded();
  await wait(2200);
  // The free cover opens the price dialog by itself; let it show, then close it.
  const cover = await download("#downloadCover", "cover.pdf");
  await wait(2500);
  await page.keyboard.press("Escape");
  await wait(800);

  await show(png(pdf, 3, 220), 2600);
  await show(png(pdf, 20, 220), 2400);
  await show(png(cover, 1, 150), 3000, 96);
});
