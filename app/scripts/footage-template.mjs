// Raw portrait footage for the house channel: the live spine calculator on a
// phone-sized screen gives the spine width and full cover size for a 6×9,
// 120-page book on white paper, then downloads the 300 DPI cover template it
// draws, shown from the file itself.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-template.mjs
//     → public/media/kdp-cover-template-300dpi.mp4 (the .json beside it is hand-written)
import { readFileSync } from "node:fs";
import { shoot } from "./footage-lib.mjs";

await shoot("kdp-cover-template-300dpi", async ({ page, wait, tap, typeInto, scrollTo, download, start, show }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/spine-calculator", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "6x9");
  await page.fill("#pages", "24");
  await page.dispatchEvent("#pages", "input");
  await start();
  await wait(1500);

  await scrollTo("#trim", "center");
  await wait(500);
  await typeInto("#pages", "120");
  await tap("#paper");
  await page.selectOption("#paper", "white");
  await wait(500);
  await scrollTo("#spine", "center");
  await wait(3200);
  await scrollTo("#tplBtn", "center");
  await wait(800);
  const png = await download("#tplBtn", "template.png");
  await wait(800);
  const src = `data:image/png;base64,${readFileSync(png).toString("base64")}`;
  await show(src, 2600, 96);
  // Landscape on a portrait screen: then pan across it at full height, back
  // cover to front, so the bleed, folds and barcode box can be read.
  // A phone zooms out to fit anything wider than the screen, so clip it in a fixed box.
  await page.setContent(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>
    html,body{margin:0;height:100%;background:#e9edf3}
    #box{position:fixed;inset:0;overflow:hidden}
    img{position:absolute;top:7vh;height:86vh;left:12px;max-width:none;background:#fff;box-shadow:0 8px 24px rgba(20,30,50,.22)}</style><div id="box"><img src="${src}"></div>`);
  await wait(900);
  await page.evaluate(() => {
    const img = document.querySelector("img");
    const dx = img.getBoundingClientRect().width - innerWidth + 24;
    img.animate([{ transform: "translateX(0)" }, { transform: `translateX(${-dx}px)` }], { duration: 7000, easing: "ease-in-out", fill: "forwards" });
  });
  await wait(8200);
});
