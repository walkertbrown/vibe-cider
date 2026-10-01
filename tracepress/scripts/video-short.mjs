// A YouTube Short for Trace Press (actual/2026-09-30.md). Shorts get views
// (the Puzzle Press large-print Short: 76) but the channel-page link sent no
// one in five days, so the address is on screen, not "link in bio".
//
// The tool part is the live site at phone width; the cards are real pages from
// the committed samples, rendered with pdftoppm.
//
//   node scripts/video-short.mjs [base]  → public/video/trace-press-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium } from "playwright";
const base = process.argv.find((a) => a.startsWith("http")) || "https://tracepress.bananafest-destiny.com";
const [W, H] = [1080, 1920];
const outName = "trace-press-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "tp-short-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const samples = new URL("../public/samples/", import.meta.url).pathname;
const pagePng = (pdf, n, name, r = 60) => {
  execFileSync("pdftoppm", ["-r", String(r), "-png", "-f", String(n), "-l", String(n), "-singlefile", join(samples, pdf), join(tmp, name)]);
  return `data:image/png;base64,${readFileSync(join(tmp, `${name}.png`)).toString("base64")}`;
};
const A = pagePng("letter-tracing-workbook-sample-8.5x11.pdf", 1, "a");
const EIGHT = pagePng("number-tracing-worksheets-0-9.pdf", 9, "eight");
const COVER = pagePng("letter-tracing-cover-sample-8.5x11.pdf", 1, "cover", 90);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
// Runs against the live domain: don't count it as a visitor.
await ctx.route("https://static.cloudflareinsights.com/**", (route) => route.abort());
await ctx.route("**/px/**", (route) => route.abort());
await ctx.addInitScript((css) => {
  const add = () => { const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); };
  if (document.head) add(); else document.addEventListener("DOMContentLoaded", add);
}, `html{zoom:2} main{grid-template-columns:1fr !important} .viewer{order:-1}`);
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);
const overlay = () => page.evaluate(() => {
  const s = document.createElement("style");
  s.textContent = `#__cap{position:fixed;left:0;right:0;bottom:0;z-index:99998;display:flex;justify-content:center;pointer-events:none;padding:0 12px 40px;transition:opacity .25s}
    #__cap span{background:rgba(20,40,30,.93);color:#fff;font:600 21px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:12px 20px;border-radius:12px;max-width:500px;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.25)}`;
  document.head.appendChild(s);
  const cap = document.createElement("div"); cap.id = "__cap"; cap.style.opacity = "0"; cap.innerHTML = "<span></span>"; document.body.appendChild(cap);
});
const caption = async (text, hold = 0) => {
  await page.evaluate((t) => { const c = document.getElementById("__cap"); c.style.opacity = t ? "1" : "0"; if (t) c.querySelector("span").textContent = t; }, text);
  if (hold) await wait(hold);
};

await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForSelector("#preview svg");
await overlay();
await page.evaluate(() => document.querySelector("#preview").scrollIntoView({ block: "start" }));
await caption("Making a handwriting workbook for Amazon KDP?", 2600);
await caption("Every letter: numbered start dots, stroke arrows, rows to trace.", 1200);
for (let i = 0; i < 3; i++) { await page.click("#next"); await wait(700); }
await wait(600);
await caption("");

const card = (img, label) => `<figure><img src="${img}"><figcaption>${label}</figcaption></figure>`;
const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:#f6f7f9;color:#234e3a;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h2{font-size:58px;margin:0 0 8px;letter-spacing:-.02em;line-height:1.15}
  .row{display:flex;gap:28px;justify-content:center;align-items:flex-start}
  figure{margin:0;flex:1} img{width:100%;border-radius:8px;box-shadow:0 8px 24px rgba(20,30,20,.18);background:#fff}
  figcaption{font-size:32px;margin-top:14px;color:#5c6470;line-height:1.3}
  div.c{font-size:40px;font-weight:700;background:#fff;padding:18px 28px;border-radius:14px;box-shadow:0 8px 24px rgba(20,30,20,.10)}
  p{font-size:32px;margin:14px 0 0;color:#5c6470}`;

await page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>
  <h2>A to Z, then 0 to 9</h2>
  <div class="row">${card(A, "A, capital and lowercase")}${card(EIGHT, "8, from the top")}</div>`);
await wait(4200);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>${style} .crop{width:720px;overflow:hidden;border-radius:8px;box-shadow:0 8px 24px rgba(20,30,20,.18)} .crop img{width:208%;margin-left:-108%;display:block;border-radius:0;box-shadow:none}</style>
  <h2>And a matching cover</h2>
  <div class="crop"><img src="${COVER}"></div><p>the front of a full wrap, spine sized<br>from the page count, as KDP asks</p>`);
await wait(3600);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>
  <h2>Ready to upload to KDP</h2>
  <div class="c">Six trim sizes, four line sizes</div><div class="c">Numbers and your own words</div><div class="c">$2.84 to print at 8.5×11</div>
  <p>Free to make the whole book, no sign-up.</p>`);
await wait(3800);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#234e3a;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:92px;margin:0 0 14px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#cfe2d6;line-height:1.35}
  .u{margin-top:44px;font-size:42px;font-weight:700;background:#fff;color:#234e3a;padding:16px 28px;border-radius:14px}</style>
  <h1>Trace Press</h1><p>Handwriting workbooks for KDP,<br>made in your browser.</p><div class="u">tracepress.bananafest-destiny.com</div>`);
await wait(3800);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
