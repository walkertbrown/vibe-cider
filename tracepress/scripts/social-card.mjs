// The 1200 × 630 share image (og:image). Takes a real page out of the site's
// own preview, which is drawn from the same shapes as the PDF, and sets it
// beside the headline. So the card shows what the book prints.
//
// Each free worksheet page gets its own card too (public/img/card-*.png), with
// its headline beside the page it gives away, from public/img/ (previews.mjs).
// Shared on Facebook or Pinterest, the link then shows the worksheet itself.
//
// Run: node scripts/social-card.mjs [baseUrl]  (writes public/social-card.png
// and public/img/card-*.png)

import { readFileSync } from "node:fs";
import * as playwright from "playwright";
const base = process.argv[2] || "https://tracepress.bananafest-destiny.com";
const browser = await playwright.chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, userAgent: "trace-press-test/card" });
  await page.goto(`${base}/`);
  await page.waitForSelector("#preview svg");
  const svg = await page.$eval("#preview svg", (s) => s.outerHTML);
  await page.setContent(`<!doctype html><html><head><style>
    html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #234e3a; font-family: "Liberation Sans", Arial, sans-serif; }
    .text { position: absolute; left: 64px; top: 70px; width: 600px; color: #fff; }
    .brand { font-size: 30px; font-weight: 700; opacity: 0.85; }
    h1 { font-size: 60px; line-height: 1.08; margin: 26px 0 26px; }
    p { font-size: 27px; line-height: 1.35; margin: 0; opacity: 0.92; }
    .page { position: absolute; right: 70px; top: 40px; width: 420px; transform: rotate(2deg); box-shadow: 0 12px 40px rgba(0,0,0,0.35); }
    .page svg { display: block; width: 100%; height: auto; }
  </style></head><body>
    <div class="text"><div class="brand">Trace Press</div>
      <h1>A–Z letter tracing workbooks for Amazon KDP</h1>
      <p>Stroke-order arrows, numbered start dots, KDP margins. Made in your browser.</p></div>
    <div class="page">${svg}</div>
  </body></html>`);
  await page.screenshot({ path: new URL("../public/social-card.png", import.meta.url).pathname });
  console.log("wrote public/social-card.png");

  const CARDS = [
    ["letter-tracing", "letter-tracing-worksheet-a", "Free letter tracing worksheets, A to Z", "26 pages, capital and lowercase, with start dots and stroke arrows."],
    ["number-tracing", "number-tracing-worksheet-3", "Free number tracing worksheets, 0 to 9", "A page per digit, with start dots and stroke arrows."],
    ["tracing-lines", "tracing-lines-worksheet-zigzag-wave", "Free tracing lines worksheets", "Lines, slants, zigzags, waves, circles and crosses, before A."],
    ["cursive-letter-tracing", "cursive-letter-tracing-worksheet-b", "Free cursive letter tracing worksheets", "26 pages, A to Z, capital and lowercase cursive to trace."],
    ["uppercase-letter-tracing", "uppercase-letter-tracing-worksheet-a", "Free uppercase letter tracing worksheets", "26 pages, A to Z, one capital a page, with start dots and stroke arrows."],
    ["lowercase-letter-tracing", "lowercase-letter-tracing-worksheet-a", "Free lowercase letter tracing worksheets", "26 pages, a to z, one letter a page, with start dots and stroke arrows."],
    ["name-tracing", "name-tracing-worksheet-maya", "Free name tracing worksheet generator", "Type a name, print a page: start dots, stroke arrows, rows to trace."],
    ["tracing-worksheet-generator", "tracing-worksheet-cat-sun-dog", "Free tracing worksheet generator", "Type words, print a page on handwriting lines, with start dots and arrows."],
    ["this-book-belongs-to-page", "this-book-belongs-to-page", "Free “This book belongs to” page", "A name page for the front of a children’s book, in every KDP size."],
    ["sight-word-tracing-workbook", "sight-word-tracing-worksheet", "Sight word tracing workbook for KDP", "The Dolch lists, a page per word, with start dots and arrows."],
  ];
  for (const [slug, img, title, line] of CARDS) {
    const src = `data:image/png;base64,${readFileSync(new URL(`../public/img/${img}.png`, import.meta.url)).toString("base64")}`;
    await page.setContent(`<!doctype html><html><head><style>
      html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #234e3a; font-family: "Liberation Sans", Arial, sans-serif; }
      .text { position: absolute; left: 64px; top: 70px; width: 620px; color: #fff; }
      .brand { font-size: 30px; font-weight: 700; opacity: 0.85; }
      h1 { font-size: 58px; line-height: 1.08; margin: 26px 0 26px; }
      p { font-size: 27px; line-height: 1.35; margin: 0; opacity: 0.92; }
      .free { margin-top: 30px; display: inline-block; background: #fff; color: #234e3a; font-size: 26px; font-weight: 700; padding: 10px 18px; border-radius: 10px; }
      img { position: absolute; right: 70px; top: 36px; width: 420px; transform: rotate(2deg); box-shadow: 0 12px 40px rgba(0,0,0,0.35); background: #fff; }
    </style></head><body>
      <div class="text"><div class="brand">Trace Press</div><h1>${title}</h1><p>${line}</p><div class="free">Printable PDF · no sign-up</div></div>
      <img src="${src}">
    </body></html>`);
    await page.screenshot({ path: new URL(`../public/img/card-${slug}.png`, import.meta.url).pathname });
    console.log(`wrote public/img/card-${slug}.png`);
  }
} finally {
  await browser.close();
}
