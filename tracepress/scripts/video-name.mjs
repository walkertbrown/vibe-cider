// A YouTube Short for the free name tracing worksheet (/name-tracing), aimed
// at the same parents and teachers as the cursive chart Short (the most-watched
// Trace Press Short, 86 views by 10-12). Every picture is real: the two free
// "Maya" sample PDFs, and the live generator's own preview after typing "Leo".
//
//   node scripts/video-name.mjs  → public/video/name-short.webm (1080x1920)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium } from "playwright";
const [W, H] = [1080, 1920];
const outName = "name-short.webm";
const tmp = mkdtempSync(join(tmpdir(), "tp-name-"));
const outDir = new URL("../public/video/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const png = (file, name, r) => {
  const pdf = new URL(`../public/samples/${file}`, import.meta.url).pathname;
  execFileSync("pdftoppm", ["-r", String(r), "-png", "-singlefile", pdf, join(tmp, name)]);
  return `data:image/png;base64,${readFileSync(join(tmp, `${name}.png`)).toString("base64")}`;
};
const PRINT = png("name-tracing-worksheet-maya.pdf", "print", 110);
const BIG = png("name-tracing-worksheet-maya.pdf", "big", 220);
const CURSIVE = png("cursive-name-tracing-worksheet-maya.pdf", "cursive", 110);

const browser = await chromium.launch();

// The live generator, with a name typed in: its preview is the picture.
const live = await browser.newPage({ viewport: { width: 1200, height: 1400 } });
await live.route("**/px/**", (route) => route.abort());
await live.goto("https://tracepress.bananafest-destiny.com/name-tracing", { waitUntil: "networkidle" });
await live.fill("#name", "Leo");
await live.waitForTimeout(1500);
const LEO = `data:image/png;base64,${(await live.locator("#preview svg").first().screenshot()).toString("base64")}`;
await live.close();

const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);

const card = (img, label) => `<figure><img src="${img}"><figcaption>${label}</figcaption></figure>`;
const style = `body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:#f6f7f9;color:#234e3a;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h2{font-size:58px;margin:0 0 8px;letter-spacing:-.02em;line-height:1.15}
  figure{margin:0} figure img{width:100%;border-radius:8px;box-shadow:0 8px 24px rgba(20,30,20,.18);background:#fff}
  figcaption{font-size:32px;margin-top:14px;color:#5c6470;line-height:1.3}
  .cut{overflow:hidden;background:#fff;border-radius:10px;box-shadow:0 8px 24px rgba(20,30,20,.14)} .cut img{display:block}
  p{font-size:34px;margin:14px 0 0;color:#5c6470;line-height:1.35}`;
const scene = (body) => page.setContent(`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);

await scene(`<h2>Free name tracing<br>worksheet</h2>
  <div style="width:760px">${card(PRINT, "Type a name, print the page")}</div>`);
await wait(4000);

// The top 1.9" of the 220 dpi page: the name large, with start dots and arrows.
await scene(`<h2>A numbered dot where<br>each stroke starts,<br>an arrow for the way it goes</h2>
  <div class="cut" style="width:1000px;height:${Math.round(1000 * 1.9 / 8.5)}px"><img src="${BIG}" style="width:1000px"></div>
  <p>Then rows of the name in dots to trace,<br>and empty lines to write it alone.</p>`);
await wait(5000);

await scene(`<h2>Any name</h2>
  <div style="width:760px">${card(LEO, "Typed “Leo”: the preview redraws as you type")}</div>`);
await wait(4400);

await scene(`<h2>Or in cursive</h2>
  <div style="width:760px">${card(CURSIVE, "The same sheet, joined-up letters")}</div>`);
await wait(4000);

await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#234e3a;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:0 40px;box-sizing:border-box}
  h1{font-size:92px;margin:0 0 14px;letter-spacing:-.02em} p{font-size:40px;margin:0;color:#cfe2d6;line-height:1.35}
  .u{margin-top:44px;font-size:42px;font-weight:700;background:#fff;color:#234e3a;padding:16px 28px;border-radius:14px;line-height:1.35}</style>
  <h1>Trace Press</h1><p>Free, no sign-up.<br>The name never leaves your browser.</p><div class="u">tracepress.bananafest-destiny.com<br>/name-tracing</div>`);
await wait(4200);

await ctx.close();
const src = await page.video().path();
await browser.close();
execFileSync("cp", [src, join(outDir, outName)]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote public/video/${outName}`);
