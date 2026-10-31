// Raw portrait footage for the house channel: the KDP cover template for an
// 8.5 × 11, 108-page puzzle book on white paper (the large-print size). It
// opens on the finished template filling the frame (the docent's retention
// lead), then shows the live spine calculator giving the figures and the
// download button making it, then pans across the template at full height.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-template-8x11.mjs
//     → public/media/kdp-cover-template-8x11.mp4 (the .json beside it is hand-written)
import { readFileSync } from "node:fs";
import { shoot } from "./footage-lib.mjs";

const URL_ = "https://puzzlepress.bananafest-destiny.com/spine-calculator";

await shoot("kdp-cover-template-8x11", async ({ page, wait, tap, typeInto, scrollTo, download, start, show }) => {
  // Make the template off camera first, so the clip can open on it.
  await page.goto(URL_, { waitUntil: "networkidle" });
  await page.selectOption("#trim", "8.5x11");
  await page.selectOption("#paper", "white");
  await page.fill("#pages", "108");
  await page.dispatchEvent("#pages", "input");
  const png = await download("#tplBtn", "template.png");
  const src = `data:image/png;base64,${readFileSync(png).toString("base64")}`;

  // At full height a landscape cover is wider than a phone, so open on the
  // spine and the whole front panel, with the template's notes.
  await page.setContent(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>
    html,body{margin:0;height:100%;background:#e9edf3}
    #box{position:fixed;inset:0;overflow:hidden}
    img{position:absolute;top:17vh;height:66vh;right:12px;max-width:none;background:#fff;box-shadow:0 8px 24px rgba(20,30,50,.22)}</style><div id="box"><img src="${src}"></div>`);
  await wait(600);
  await start();
  await wait(3200);

  // The calculator that made it.
  await page.goto(URL_, { waitUntil: "networkidle" });
  await page.selectOption("#trim", "6x9");
  await page.fill("#pages", "24");
  await page.dispatchEvent("#pages", "input");
  await wait(1200);
  await scrollTo("#trim", "center");
  await tap("#trim");
  await page.selectOption("#trim", "8.5x11");
  await wait(500);
  await typeInto("#pages", "108");
  await tap("#paper");
  await page.selectOption("#paper", "white");
  await wait(500);
  await scrollTo("#spine", "center");
  await wait(3600);
  await scrollTo("#tplBtn", "center");
  await wait(800);
  await download("#tplBtn", "template2.png");
  await wait(800);

  // The file itself, panned back cover to front at full height.
  await page.setContent(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>
    html,body{margin:0;height:100%;background:#e9edf3}
    #box{position:fixed;inset:0;overflow:hidden}
    img{position:absolute;top:7vh;height:86vh;left:12px;max-width:none;background:#fff;box-shadow:0 8px 24px rgba(20,30,50,.22)}</style><div id="box"><img src="${src}"></div>`);
  await wait(900);
  await page.evaluate(() => {
    const img = document.querySelector("img");
    const dx = img.getBoundingClientRect().width - innerWidth + 24;
    img.animate([{ transform: "translateX(0)" }, { transform: `translateX(${-dx}px)` }], { duration: 8000, easing: "ease-in-out", fill: "forwards" });
  });
  await wait(9200);
});
