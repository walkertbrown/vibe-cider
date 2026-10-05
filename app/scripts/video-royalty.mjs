// A fact-led YouTube Short for the royalty calculator: on Amazon.com a
// paperback listed at $9.98 earns 50% of list, and at $9.99 earns 60%, so one
// cent on the price is about a dollar a copy. Every figure is computed by
// src/pdf/kdp-cost.js, the code /royalty-calculator runs, from KDP's
// "Paperback Royalty Rates on Amazon.com" and "Paperback Printing Cost" pages.
// Scenes only, no live site: nothing here is counted as a visitor.
//
//   node scripts/video-royalty.mjs  → public/video/royalty-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { royalty, ROYALTY_THRESHOLD } from "../src/pdf/kdp-cost.js";

const [W, H] = [1080, 1920];
const outName = "royalty-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "pp-royalty-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const BOOK = { trim: "8.5x11", pages: 100, ink: "black" };
const LOW = +(ROYALTY_THRESHOLD - 0.01).toFixed(2);
const rows = [8.99, LOW, ROYALTY_THRESHOLD].map((list) => ({ list, ...royalty({ ...BOOK, list }) }));
const [, below, at] = rows;
const usd = (n) => `$${n.toFixed(2)}`;
console.log(rows);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);

const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:#f4f6fa;color:#1d3557;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h2{font-size:62px;margin:0 0 8px;letter-spacing:-.02em;line-height:1.15}
  .big{font-size:120px;font-weight:800;line-height:1;margin:0}
  p{font-size:36px;margin:10px 0 0;color:#5c6470;line-height:1.35}
  small{font-size:26px;color:#5c6470}
  table{border-collapse:collapse;font-size:42px;background:#fff;border-radius:14px;box-shadow:0 8px 24px rgba(20,30,50,.10)}
  td,th{padding:16px 34px;border-bottom:1px solid #e3e7ef} th{font-size:30px;color:#5c6470;font-weight:600}
  td:last-child{font-weight:800;color:#e76f51}`;
const scene = (body) => page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);

await scene(`<h2>One cent on your<br>KDP paperback price</h2><div class="big">= ${usd(at.royalty - below.royalty)}</div><p>a copy, on Amazon.com.</p>`);
await wait(3600);

await scene(`<p>An 8.5 × 11, ${BOOK.pages}-page, black-ink paperback</p>
  <table><tr><th>List price</th><th>Rate</th><th>You earn</th></tr>${rows.map((r) => `<tr><td>${usd(r.list)}</td><td>${r.rate * 100}%</td><td>${usd(r.royalty)}</td></tr>`).join("")}</table>
  <p>Royalty = rate × list price − printing (${usd(at.printing)}).</p>`);
await wait(6400);

await scene(`<p>Amazon.com pays</p><div class="big">50%</div><p>at ${usd(LOW)} and below</p><div class="big">60%</div><p>at ${usd(ROYALTY_THRESHOLD)} and above</p>
  <small>Source: KDP help, "Paperback Royalty Rates on Amazon.com"</small>`);
await wait(5200);

await scene(`<p>Printing this book costs ${usd(at.printing)}, the same<br>at any page count from 24 to 110,<br>so the lowest price KDP will let you set is</p><div class="big">${usd(at.minList)}</div>
  <p>and at that price you earn $0.00.</p><small>Source: KDP help, "Paperback Printing Cost"</small>`);
await wait(5600);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#1d3557;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:88px;margin:0 0 20px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#c9d3e6;line-height:1.35}
  .u{margin-top:50px;font-size:40px;font-weight:700;background:#fff;color:#1d3557;padding:14px 30px;border-radius:14px;line-height:1.35}</style>
  <h1>Puzzle Press</h1><p>A free royalty calculator:<br>any trim, page count, ink and price.</p><div class="u">puzzlepress.bananafest-destiny.com<br>/royalty-calculator</div>`);
await wait(4400);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
