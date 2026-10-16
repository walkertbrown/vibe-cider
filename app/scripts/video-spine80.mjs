// A fact-led YouTube Short: KDP's help pages give two answers to when a
// paperback may have spine text. "Create a Paperback Cover" (G201953020) says
// "at least 79 pages" and "more than 79 pages"; Cover Creator's help
// (G201113520) says 80. On 2026-10-12 a KDP Community member's book counted at
// 79 pages had its spine text refused, so both apps say 80 since 2026-10-16.
// Quotes re-read 2026-10-16. The spine figures come from cover-geometry.js and
// are checked against KDP's own cover calculator before anything is drawn.
// Scenes only, no live site: nothing here is counted as a visitor.
//
//   node scripts/video-spine80.mjs  → public/video/spine80-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { spineWidthInches, SPINE_FOLD_IN, SPINE_TEXT_MIN_PAGES, SPINE_TYPE_BOX_EM } from "../src/pdf/cover-geometry.js";
import { PT } from "../src/pdf/kdp.js";

const [W, H] = [1080, 1920];
const outName = "spine80-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "pp-spine80-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

// The quotes must still be on KDP's pages, word for word, or nothing is drawn.
const QUOTES = [
  ["G201953020", "To include spine text, your book must have at least 79 pages.", "Create a Paperback Cover"],
  ["G201953020", "We only print spine text on books with more than 79 pages.", "Create a Paperback Cover"],
  ["G201113520", "The minimum page count required to include text on the spine is 80 pages.", "Cover Creator"],
];
for (const [id, q] of QUOTES) {
  const text = execFileSync("curl", ["-sL", "-A", "Mozilla/5.0", `https://kdp.amazon.com/en_US/help/topic/${id}`], { encoding: "utf8" })
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  if (!text.includes(q)) throw new Error(`no longer on ${id}: ${q}`);
}

// 80 pages, white and cream, 6 x 9. The type figure is the largest bold sans
// whose capital top to "g" bottom (1.117 em) fits the safe area.
const rows = ["white", "cream"].map((paper) => {
  const spine = spineWidthInches(SPINE_TEXT_MIN_PAGES, paper);
  const safe = spine - 2 * SPINE_FOLD_IN;
  const html = execFileSync("curl", ["-s", "-X", "POST", "https://kdp.amazon.com/cover-calculator/measurements-table",
    "-H", "X-Requested-With: XMLHttpRequest", "-H", "Referer: https://kdp.amazon.com/cover-calculator",
    "--data", `bindingType=PAPERBACK&paperType=${paper.toUpperCase()}&interiorType=BLACK_AND_WHITE&rightToLeft=false&trimSize=6_0X9_0IN&unit=inches&pageCount=${SPINE_TEXT_MIN_PAGES}`], { encoding: "utf8" });
  const kdp = +html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").match(/Spine Safe Area ([\d.]+)/)[1];
  if (Math.abs(kdp - safe) > 0.0015) throw new Error(`${paper}: ours ${safe}, KDP ${kdp}`);
  return { paper, spine, safe, kdp, pt: Math.floor((safe * PT) / SPINE_TYPE_BOX_EM * 2) / 2 };
});
console.log(rows);
const in3 = (n) => `${n.toFixed(3)}"`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);
const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:#f4f6fa;color:#1d3557;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 60px;box-sizing:border-box}
  h2{font-size:64px;margin:0 0 8px;letter-spacing:-.02em;line-height:1.15}
  .big{font-size:150px;font-weight:800;line-height:1;margin:0;color:#e76f51}
  p{font-size:40px;margin:10px 0 0;color:#5c6470;line-height:1.35}
  q{font-size:52px;color:#1d3557;font-style:italic;line-height:1.3}
  small{font-size:28px;color:#5c6470}`;
const scene = (body) => page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);

await scene(`<h2>When can a KDP paperback<br>have text on its spine?</h2><p>KDP's own help pages<br>give two answers.</p>`);
await wait(3400);
for (const [i, [, q, where]] of QUOTES.entries()) {
  await scene(`<div class="big">${i + 1}</div><q>${q}</q><small>KDP help, "${where}"</small>`);
  await wait(4600);
}
await scene(`<h2>Which one does KDP use?</h2><p>In October 2026 a book KDP counted<br>at 79 pages had its spine text refused.</p><div class="big">80</div><p>Plan on 80 pages.</p><small>Source: KDP Community, "Spine on my 80 page book"</small>`);
await wait(5600);
await scene(`<h2>And at 80 pages, 6 × 9</h2>${rows.map((r) => `<p>${r.paper} paper: ${in3(r.spine)} spine,<br><b style="color:#e76f51">${in3(r.safe)}</b> left for text, about ${r.pt} pt of bold type</p>`).join("")}<small>Text stays 0.0625" inside each fold. Same as KDP's cover calculator.</small>`);
await wait(6000);
await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#1d3557;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:88px;margin:0 0 20px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#c9d3e6;line-height:1.35}
  .u{margin-top:50px;font-size:40px;font-weight:700;background:#fff;color:#1d3557;padding:14px 30px;border-radius:14px;line-height:1.35}</style>
  <h1>Puzzle Press</h1><p>A free spine calculator:<br>any trim, paper and page count.</p><div class="u">puzzlepress.bananafest-destiny.com<br>/spine-calculator</div>`);
await wait(4400);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
