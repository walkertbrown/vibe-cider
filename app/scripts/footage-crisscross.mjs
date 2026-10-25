// Raw portrait footage for the house channel: the criss-cross page's own
// measurement (1,800 grids, each solved again from scratch, every one with
// exactly one fill), then the live tool making a hard criss-cross book from
// that page's button, then its first puzzle.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-crisscross.mjs
//     → public/media/crisscross-1800-one-fill-each.mp4 (the .json beside it is hand-written)
import { execFileSync } from "node:child_process";
import { shoot } from "./footage-lib.mjs";

await shoot("crisscross-1800-one-fill-each", async ({ page, wait, tap, typeInto, scrollTo, download, start, png, show }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/criss-cross-book-generator", { waitUntil: "networkidle" });
  await start();
  await wait(1200);

  // Lead with the number: the measured section and its table.
  await page.evaluate(() => [...document.querySelectorAll("h2")].find((h) => h.textContent.startsWith("Measured on"))
    .scrollIntoView({ behavior: "smooth", block: "start" }));
  await wait(6000);

  // The page's own button into the tool.
  await scrollTo("a.btn[href='/?kind=crisscross#tool']", "center");
  await wait(600);
  await Promise.all([page.waitForURL(/kind=crisscross/), tap("a.btn[href='/?kind=crisscross#tool']")]);
  await page.waitForSelector("#difficulty option", { state: "attached" });
  await wait(1200);

  await scrollTo("#difficulty", "center");
  await tap("#difficulty");
  const hard = await page.$eval("#difficulty", (s) => [...s.options].find((o) => /^hard/i.test(o.textContent.trim())).value);
  await page.selectOption("#difficulty", hard);
  await wait(700);
  await scrollTo("#count", "center");
  await typeInto("#count", "20");
  await wait(600);

  await scrollTo("#download", "center");
  const pdf = await download("#download", "crisscross.pdf");
  const pages = execFileSync("pdftotext", ["-layout", pdf, "-"]).toString().split("\f");
  const first = pages.findIndex((t) => /Puzzle 1\b/.test(t)) + 1;
  console.log("status:", await page.$eval("#status", (e) => e.textContent).catch(() => "?"));
  console.log("first puzzle page", first, "\n" + pages[first - 1].slice(0, 1500));
  await wait(1200);

  await show(png(pdf, first, 150), 4200, 94);
});
