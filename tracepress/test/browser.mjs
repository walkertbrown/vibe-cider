// End-to-end in a real browser: the preview draws, the pager and controls
// work, a free download is a 26-page PDF with the footer line, the unlock
// dialog unlocks against a stubbed /api/verify, a licensed download has no
// footer, a free cover says PREVIEW and a licensed one doesn't, and ?paid=1
// opens the dialog. Stripe is never called: /api/verify
// is answered by page.route, because the Trace Press Payment Link is live.
//
// Run: node test/browser.mjs [baseUrl] [chromium|firefox|webkit]
// (Playwright comes from app/node_modules.)
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const playwright = createRequire(new URL("../../app/package.json", import.meta.url))("playwright");
const args = process.argv.slice(2);
const ENGINE = args.find((a) => ["chromium", "firefox", "webkit"].includes(a)) || "chromium";
const base = args.find((a) => /^https?:\/\//.test(a)) || "https://tracepress.bananafest-destiny.com";
const tmp = mkdtempSync(join(tmpdir(), "tp-browser-"));
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? "ok  " : "FAIL"} ${what}`); if (!ok) failed++; };
const pdfText = (bytes) => {
  const f = join(tmp, "b.pdf");
  writeFileSync(f, bytes);
  const pages = Number(/Pages:\s+(\d+)/.exec(execFileSync("pdfinfo", [f], { encoding: "utf8" }))[1]);
  return { pages, text: execFileSync("pdftotext", [f, "-"], { encoding: "utf8" }) };
};

const browser = await playwright[ENGINE].launch();
try {
  const ctx = await browser.newContext({ acceptDownloads: true, userAgent: "trace-press-test/browser" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let verifyCalls = 0;
  await page.route("**/api/verify", (route) => {
    verifyCalls++;
    route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, email: "tester@example.com", token: "stub" }) });
  });

  await page.goto(`${base}/?t=${Date.now()}`);
  await page.waitForSelector("#preview svg circle");
  check((await page.locator("#preview svg circle").count()) > 100, "preview draws the dotted letters");
  check(/Page 1 of 26 · A a/.test(await page.textContent("#pageNo")), "page 1 is A a");
  check(/Made with Trace Press/.test(await page.textContent("#preview svg")), "free preview shows the footer line");
  for (let i = 0; i < 5; i++) await page.click("#next");
  check(/Page 6 of 26 · F f/.test(await page.textContent("#pageNo")), "pager reaches F f");
  const before = await page.getAttribute("#preview svg", "viewBox");
  await page.selectOption("#trim", "6x9");
  check((await page.getAttribute("#preview svg", "viewBox")) === "0 0 432 648", `6x9 preview is 432×648 pt (was ${before})`);
  await page.check("#bleed");
  check((await page.getAttribute("#preview svg", "viewBox")) === "0 0 441 666", "bleed adds 0.125\" wide and 0.25\" tall");
  await page.uncheck("#bleed");

  let [dl] = await Promise.all([page.waitForEvent("download"), page.click("#download")]);
  let got = pdfText(await (await dl.createReadStream()).toArray().then(Buffer.concat));
  check(got.pages === 26, `free download has 26 pages (${got.pages})`);
  check((got.text.match(/Made with Trace Press/g) || []).length === 26, "free download has the footer on every page");
  check(/^trace-press-6x9-075in\.pdf$/.test(dl.suggestedFilename()), `file name ${dl.suggestedFilename()}`);

  check(/spine 0\.059" for 26 pages/.test(await page.textContent("#coverNote")), `cover note gives the spine (${await page.textContent("#coverNote")})`);
  await page.fill("#title", "Tracing Fun For Test");
  [dl] = await Promise.all([page.waitForEvent("download"), page.click("#downloadCover")]);
  got = pdfText(await (await dl.createReadStream()).toArray().then(Buffer.concat));
  check(got.pages === 1 && /PREVIEW/.test(got.text) && /Tracing Fun For Test/.test(got.text.replace(/\s+/g, " ")), "free cover: one page, the title, PREVIEW");
  check(/^trace-press-cover-6x9-white\.pdf$/.test(dl.suggestedFilename()), `cover file name ${dl.suggestedFilename()}`);

  await page.click("#tier .linkish");
  check(await page.isVisible("#unlockDialog"), "the tier button opens the unlock dialog");
  const buy = page.locator("#buyLine a");
  check((await buy.getAttribute("href")) === "https://buy.stripe.com/bJe14p0IKcKV2gzblBeIw01" && (await buy.getAttribute("target")) === "_blank", "Buy is the Trace Press link, in a new tab (not clicked)");
  await page.fill("#email", "tester@example.com");
  await page.click("#verify");
  await page.waitForSelector("#unlockDialog", { state: "hidden" });
  check(verifyCalls === 1, "unlock called /api/verify once");
  check(/Unlocked for tester@example.com/.test(await page.textContent("#tier")), "tier says unlocked");
  check(!/Made with Trace Press/.test(await page.textContent("#preview svg")), "licensed preview has no footer");

  [dl] = await Promise.all([page.waitForEvent("download"), page.click("#download")]);
  got = pdfText(await (await dl.createReadStream()).toArray().then(Buffer.concat));
  check(got.pages === 26 && !/Made with Trace Press/.test(got.text), "licensed download: 26 pages, no footer");

  [dl] = await Promise.all([page.waitForEvent("download"), page.click("#downloadCover")]);
  got = pdfText(await (await dl.createReadStream()).toArray().then(Buffer.concat));
  check(got.pages === 1 && !/PREVIEW|Trace Press/.test(got.text) && /Tracing Fun For Test/.test(got.text.replace(/\s+/g, " ")), "licensed cover: the title, no PREVIEW");

  await page.reload();
  await page.waitForSelector("#preview svg");
  check(/Unlocked/.test(await page.textContent("#tier")), "unlock survives a reload");

  const fresh = await (await browser.newContext({ userAgent: "trace-press-test/browser" })).newPage();
  await fresh.goto(`${base}/?paid=1`);
  await fresh.waitForSelector("#unlockDialog[open]");
  check(/one step left/.test(await fresh.textContent("#dialogTitle")), "?paid=1 opens the just-paid dialog");
  check(!fresh.url().includes("paid=1"), "?paid=1 is removed from the address bar");

  const phone = await (await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: "trace-press-test/browser" })).newPage();
  await phone.goto(`${base}/`);
  await phone.waitForSelector("#preview svg");
  const box = await phone.locator("#preview svg").boundingBox();
  check(box.width <= 390 && box.y < 844 * 1.5, `phone: preview fits the width and starts at ${Math.round(box.y)}px`);
  const scrollW = await phone.evaluate(() => document.documentElement.scrollWidth);
  check(scrollW <= 390, `phone: no sideways scroll (${scrollW}px)`);

  const paper = await (await browser.newContext({ acceptDownloads: true, userAgent: "trace-press-test/browser" })).newPage();
  paper.on("pageerror", (e) => errors.push(`paper: ${e.message}`));
  await paper.goto(`${base}/handwriting-paper`);
  await paper.waitForSelector("#preview svg line", { state: "attached" });
  check(/Right-hand \(odd\) page · \d+ rows · 100 pages/.test(await paper.textContent("#pageNo")), `paper: preview (${await paper.textContent("#pageNo")})`);
  await paper.fill("#pages", "40");
  await paper.selectOption("#trim", "6x9");
  await paper.click("#prev");
  check(/Left-hand/.test(await paper.textContent("#pageNo")) && (await paper.getAttribute("#preview svg", "viewBox")) === "0 0 432 648", "paper: left page at 6x9");
  [dl] = await Promise.all([paper.waitForEvent("download"), paper.click("#download")]);
  got = pdfText(await (await dl.createReadStream()).toArray().then(Buffer.concat));
  check(got.pages === 40 && got.text.trim() === "", `paper: 40 blank-text pages (${got.pages}), ${dl.suggestedFilename()}`);
  check((await (await paper.request.get(`${base}/sitemap.xml`)).text()).includes("/handwriting-paper"), "paper: in the sitemap");

  // The KDP guide: served, reachable from the pages a reader arrives on, and
  // its links go to the tool and the paper page.
  const guide = "/how-to-make-a-handwriting-workbook";
  await paper.goto(`${base}${guide}`);
  const links = await paper.$$eval("article a", (as) => as.map((a) => a.getAttribute("href")));
  check(links.includes("/") && links.includes("/handwriting-paper"), `guide: links to the tool and the paper page (${links.length} links)`);
  for (const from of ["/", "/handwriting-paper", "/nope-404"]) {
    check((await (await paper.request.get(`${base}${from}`)).text()).includes(`href="${guide}"`), `guide: linked from ${from}`);
  }
  check((await (await paper.request.get(`${base}/sitemap.xml`)).text()).includes(guide), "guide: in the sitemap");
  const guideW = await phone.goto(`${base}${guide}`).then(() => phone.evaluate(() => document.documentElement.scrollWidth));
  check(guideW <= 390, `guide: no sideways scroll on a phone (${guideW}px)`);

  check(errors.length === 0, `no page errors ${errors.join("; ")}`);
} finally {
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
}
if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log(`\nBROWSER OK (${ENGINE}, ${base})`);
