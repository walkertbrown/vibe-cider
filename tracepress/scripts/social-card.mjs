// The 1200 × 630 share image (og:image). Takes a real page out of the site's
// own preview, which is drawn from the same shapes as the PDF, and sets it
// beside the headline. So the card shows what the book prints.
//
// Run: node scripts/social-card.mjs [baseUrl]  (writes public/social-card.png;
// Playwright comes from app/node_modules)
import { createRequire } from "node:module";

const playwright = createRequire(new URL("../../app/package.json", import.meta.url))("playwright");
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
} finally {
  await browser.close();
}
