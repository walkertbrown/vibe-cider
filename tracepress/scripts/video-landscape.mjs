// A regular (landscape) YouTube video for Trace Press: the live site making a
// real book, then pages from the PDF it just made. Shorts can't carry a
// clickable link and Buffer only posts Shorts (LEARNED.md, 09-11), so this one
// is uploaded by hand in YouTube Studio, where the description's links work
// and each Short can point to it as its "Related video".
//
// Shown as the free version: footer line and PREVIEW mark included, and the
// end card says what $19 removes.
//
//   node scripts/video-landscape.mjs [base]  → public/video/trace-press.webm (1440x810)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
const base = process.argv.find((a) => a.startsWith("http")) || "https://tracepress.bananafest-destiny.com";
const [W, H] = [1440, 810];
const outName = "trace-press.webm";
const tmp = mkdtempSync(join(tmpdir(), "tp-landscape-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, acceptDownloads: true, recordVideo: { dir: tmp, size: { width: W, height: H } } });
// Runs against the live domain: don't count it as a visitor.
await ctx.route("https://static.cloudflareinsights.com/**", (route) => route.abort());
await ctx.route("**/px/**", (route) => route.abort());
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);

// Caption bar and a visible pointer: headless Chromium draws no cursor.
const overlay = () => page.evaluate(() => {
  const s = document.createElement("style");
  s.textContent = `#__cap{position:fixed;left:0;right:0;bottom:0;z-index:99998;display:flex;justify-content:center;pointer-events:none;padding:0 16px 26px;transition:opacity .25s}
    #__cap span{background:rgba(20,40,30,.93);color:#fff;font:600 24px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:12px 22px;border-radius:12px;max-width:960px;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.25)}
    #__cur{position:fixed;z-index:99999;width:22px;height:22px;margin:-3px 0 0 -3px;pointer-events:none;transition:left .12s,top .12s;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))}`;
  document.head.appendChild(s);
  const cap = document.createElement("div"); cap.id = "__cap"; cap.style.opacity = "0"; cap.innerHTML = "<span></span>"; document.body.appendChild(cap);
  const cur = document.createElement("div"); cur.id = "__cur";
  cur.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 3l14 8-6 1.5L9.5 19z" fill="#fff" stroke="#234e3a" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  cur.style.left = "720px"; cur.style.top = "400px"; document.body.appendChild(cur);
  addEventListener("mousemove", (e) => { cur.style.left = e.clientX + "px"; cur.style.top = e.clientY + "px"; }, true);
});
const caption = async (text, hold = 0) => {
  await page.evaluate((t) => { const c = document.getElementById("__cap"); c.style.opacity = t ? "1" : "0"; if (t) c.querySelector("span").textContent = t; }, text);
  if (hold) await wait(hold);
};
const moveTo = async (sel) => {
  const box = await page.locator(sel).first().boundingBox();
  if (!box) throw new Error(`no box for ${sel}`);
  await page.mouse.move(box.x + Math.min(box.width / 2, 60), box.y + box.height / 2, { steps: 18 });
  await wait(180);
};
const click = async (sel) => { await moveTo(sel); await page.click(sel); };
const choose = async (sel, value) => { await moveTo(sel); await page.selectOption(sel, value); await wait(300); };
const typeInto = async (sel, text) => { await click(sel); await page.fill(sel, ""); await page.locator(sel).pressSequentially(text, { delay: 55 }); await wait(300); };
const scrollTo = async (sel, block = "start") => {
  await page.evaluate(([q, b]) => document.querySelector(q).scrollIntoView({ behavior: "smooth", block: b }), [sel, block]);
  await wait(1100);
};
const download = async (sel, name) => {
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 180000 }), click(sel)]);
  const f = join(tmp, name);
  await dl.saveAs(f);
  return f;
};

await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForSelector("#preview svg");
await overlay();
await caption("Trace Press makes handwriting workbooks for Amazon KDP, in your browser.", 3400);

await caption("");
await scrollTo("#trim", "center");
await caption("Pick a trim. The preview is the real page, at that size.", 300);
await choose("#trim", "6x9");
await wait(1800);
await choose("#trim", "8.5x11");
await wait(1200);
await caption("Pick a line size: 1\" lines for ages 4–5, down to 0.45\" for older hands.", 300);
await choose("#age", "1");
await wait(2200);
await caption("Every letter: numbered start dots and stroke arrows, then rows to trace.", 300);
for (let i = 0; i < 3; i++) { await click("#next"); await wait(800); }
await wait(800);
await caption("Print or cursive.", 300);
await choose("#script", "cursive");
await wait(2600);
await choose("#script", "print");
await wait(600);

await caption("Add pages: pre-writing lines before A, numbers 0 to 9 after Z.", 300);
await scrollTo("#lines", "center");
await click("#lines");
await wait(500);
await click("#numbers");
await wait(1600);

await caption("Download the interior, laid out to KDP's print rules.", 300);
await scrollTo("#download", "center");
const pdfPath = await download("#download", "book.pdf");
await moveTo("#status");
await wait(1800);

await caption("Then the full-wrap cover: spine sized from that book's page count.", 300);
await scrollTo("#title", "center");
await typeInto("#title", "My First Letters");
const coverPath = await download("#downloadCover", "cover.pdf");
await wait(1800);
await caption("");

// What came out: real pages from the two PDFs just made.
const pages = (await PDFDocument.load(readFileSync(pdfPath))).getPageCount();
const png = (file, n, r) => {
  const out = join(tmp, `p${n}-${r}`);
  execFileSync("pdftoppm", ["-r", String(r), "-png", "-f", String(n), "-l", String(n), "-singlefile", file, out]);
  return `data:image/png;base64,${readFileSync(`${out}.png`).toString("base64")}`;
};
const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;background:#f6f7f9;color:#234e3a;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;box-sizing:border-box}
  h2{font-size:44px;margin:0;letter-spacing:-.02em} p{font-size:26px;margin:0;color:#5c6470}
  .row{display:flex;gap:26px;align-items:flex-end} img{height:540px;background:#fff;border-radius:6px;box-shadow:0 8px 24px rgba(20,30,20,.18)}`;
// Page 5 is A (four pre-writing pages come first); the numbers 0 to 9 follow Z,
// so the last page is 9 (the frames were checked: pages - 1 is 8).
await page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>
  <h2>The book it just made: ${pages} pages</h2>
  <div class="row"><img src="${png(pdfPath, 1, 60)}"><img src="${png(pdfPath, 5, 60)}"><img src="${png(pdfPath, pages, 60)}"></div>
  <p>Pre-writing lines, A, and 9: pages from the downloaded PDF.</p>`);
await wait(5200);
await page.setContent(`<!doctype html><meta charset="utf-8"><style>${style} img{height:auto;width:940px}</style>
  <h2>And its cover</h2><img src="${png(coverPath, 1, 60)}"><p>Back, spine and front in one PDF, as KDP asks.</p>`);
await wait(4600);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#234e3a;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center}
  h1{font-size:80px;margin:0 0 10px;letter-spacing:-.02em} p{font-size:30px;margin:0;color:#cfe2d6;line-height:1.4}
  .u{margin-top:30px;font-size:36px;font-weight:700;background:#fff;color:#234e3a;padding:14px 28px;border-radius:14px}</style>
  <h1>Trace Press</h1><p>Free to make the whole book, no sign-up.<br>$19 once removes the footer line and the PREVIEW mark on the cover.</p>
  <div class="u">tracepress.bananafest-destiny.com</div>`);
await wait(5000);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}: book ${pages} pages`);
