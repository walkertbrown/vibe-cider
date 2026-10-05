// End-to-end in a real browser: the preview draws, the pager and controls
// work, a free download is a 26-page PDF with the footer line, the unlock
// dialog unlocks against a stubbed /api/verify, a licensed download has no
// footer, a free cover says PREVIEW and a licensed one doesn't, and ?paid=1
// opens the dialog. Stripe is never called: /api/verify
// is answered by page.route, because the Trace Press Payment Link is live.
//
// Run: node test/browser.mjs [baseUrl] [chromium|firefox|webkit]
// (Playwright is a dev dependency; `npx playwright install chromium` once.)
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as playwright from "playwright";
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
  const mainBeacons = [];
  page.on("request", (r) => { const m = r.url().match(/\/px\/(\w+)\.gif/); if (m) mainBeacons.push(m[1]); });
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
  await page.waitForFunction(() => /Next:/.test(document.querySelector("#status").textContent));
  check(/wrap cover for these 26 pages/.test(await page.textContent("#status")), `after a download the status points at the cover (${await page.textContent("#status")})`);

  check(/spine 0\.059" for 26 pages/.test(await page.textContent("#coverNote")), `cover note gives the spine (${await page.textContent("#coverNote")})`);
  await page.fill("#title", "Tracing Fun For Test");
  await page.fill("#back", "Back cover words for the test.");
  await page.waitForFunction(() => /Back cover words for the test\./.test(document.querySelector("#coverPreview svg")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  const cp = (await page.$$eval("#coverPreview svg text", (n) => n.map((x) => x.textContent))).join(" "); // the title wraps onto lines
  check(/Tracing Fun For Test/.test(cp) && /Back cover words for the test\./.test(cp), "cover preview redraws with the title and back text as they're typed");
  [dl] = await Promise.all([page.waitForEvent("download"), page.click("#downloadCover")]);
  got = pdfText(await (await dl.createReadStream()).toArray().then(Buffer.concat));
  check(got.pages === 1 && /PREVIEW/.test(got.text) && /Tracing Fun For Test/.test(got.text.replace(/\s+/g, " ")), "free cover: one page, the title, PREVIEW");
  check(/Back cover words for the test\./.test(got.text.replace(/\s+/g, " ")), "the cover PDF has the back text");
  await page.waitForSelector("dialog[open]", { timeout: 5000 }).catch(() => {});
  const dt = await page.$eval("dialog", (d) => (d.open ? d.querySelector("h2, h3")?.textContent ?? d.textContent : ""));
  check(/Your cover is downloaded/.test(dt), `a free cover opens the price dialog (${dt.trim().slice(0, 60)})`);
  await page.click("#closeDialog").catch(() => {});
  await page.fill("#back", "");
  const kw = await page.$$eval("#keywords li", (n) => n.map((x) => x.textContent.replace(/ Copy$/, "")));
  check(kw.length === 7 && !kw.some((k) => "tracing fun for test".includes(k.toLowerCase())), `seven keywords, none in the title (${kw.join(" | ")})`);
  check(/^trace-press-cover-6x9-white\.pdf$/.test(dl.suggestedFilename()), `cover file name ${dl.suggestedFilename()}`);

  // Practice words: two word pages after Z, the pager and the cover note follow.
  await page.fill("#words", "cat, the");
  check(/Page \d+ of 28/.test(await page.textContent("#pageNo")) && /2 word pages after Z/.test(await page.textContent("#wordsNote")), `words: 28 pages (${await page.textContent("#pageNo")})`);
  for (let i = 0; i < 30; i++) if (!(await page.isDisabled("#next"))) await page.click("#next");
  check(/Page 28 of 28 · “the”/.test(await page.textContent("#pageNo")), `words: last page is the word (${await page.textContent("#pageNo")})`);
  check(/for 28 pages/.test(await page.textContent("#coverNote")), "words: the cover note counts them");
  [dl] = await Promise.all([page.waitForEvent("download"), page.click("#download")]);
  got = pdfText(await (await dl.createReadStream()).toArray().then(Buffer.concat));
  check(got.pages === 28, `words: the download has 28 pages (${got.pages})`);
  // Numbers 0–9: ten digit pages between Z and the words.
  await page.check("#numbers");
  check(/for 38 pages/.test(await page.textContent("#coverNote")) && /2 word pages after 9/.test(await page.textContent("#wordsNote")), `numbers: 38 pages (${await page.textContent("#coverNote")})`);
  for (let i = 0; i < 40; i++) if (!(await page.isDisabled("#prev"))) await page.click("#prev");
  for (let i = 0; i < 26; i++) await page.click("#next");
  check(/Page 27 of 38 · 0$/.test(await page.textContent("#pageNo")), `numbers: page 27 is 0 (${await page.textContent("#pageNo")})`);
  [dl] = await Promise.all([page.waitForEvent("download"), page.click("#download")]);
  got = pdfText(await (await dl.createReadStream()).toArray().then(Buffer.concat));
  check(got.pages === 38, `numbers: the download has 38 pages (${got.pages})`);
  await page.uncheck("#numbers");
  await page.fill("#words", "");
  // Pre-writing lines: four pages before A.
  await page.check("#lines");
  for (let i = 0; i < 40; i++) if (!(await page.isDisabled("#prev"))) await page.click("#prev");
  check(/Page 1 of 30 · lines: down, across$/.test(await page.textContent("#pageNo")), `lines: page 1 is lines (${await page.textContent("#pageNo")})`);
  for (let i = 0; i < 4; i++) await page.click("#next");
  check(/Page 5 of 30 · A a$/.test(await page.textContent("#pageNo")), `lines: page 5 is A (${await page.textContent("#pageNo")})`);
  [dl] = await Promise.all([page.waitForEvent("download"), page.click("#download")]);
  got = pdfText(await (await dl.createReadStream()).toArray().then(Buffer.concat));
  check(got.pages === 30, `lines: the download has 30 pages (${got.pages})`);
  await page.uncheck("#lines");
  // One case: capitals alone, still 26 pages, and the download matches.
  await page.selectOption("#cases", "upper");
  for (let i = 0; i < 40; i++) if (!(await page.isDisabled("#prev"))) await page.click("#prev");
  check(/Page 1 of 26 · A$/.test(await page.textContent("#pageNo")), `capitals: page 1 is A alone (${await page.textContent("#pageNo")})`);
  [dl] = await Promise.all([page.waitForEvent("download"), page.click("#download")]);
  got = pdfText(await (await dl.createReadStream()).toArray().then(Buffer.concat));
  check(got.pages === 26, `capitals: the download has 26 pages (${got.pages})`);
  await page.selectOption("#cases", "both");
  // Cursive: the font loads on demand, the preview draws joined paths, the
  // download is the same 26 pages under its own name.
  // Picked with the keyboard, so the change event is a trusted one and fires the beacon.
  await page.focus("#script");
  await page.keyboard.press("ArrowDown");
  await page.waitForFunction(() => document.querySelectorAll("#preview svg path").length >= 10);
  check(/Page 1 of 26 · A a$/.test(await page.textContent("#pageNo")), `cursive: page 1 is A a (${await page.textContent("#pageNo")})`);
  check(await page.$$eval("#preview svg circle", (c) => c.length) === 0, "cursive: no tracing dots on a letter page");
  [dl] = await Promise.all([page.waitForEvent("download"), page.click("#download")]);
  got = pdfText(await (await dl.createReadStream()).toArray().then(Buffer.concat));
  check(got.pages === 26 && /-cursive\.pdf$/.test(dl.suggestedFilename()), `cursive: 26 pages, ${dl.suggestedFilename()}`);
  check(mainBeacons.includes("cursive"), `cursive: its beacon (${mainBeacons})`);
  [dl] = await Promise.all([page.waitForEvent("download"), page.click("#downloadCover")]);
  check(/^trace-press-cover-.*-cursive\.pdf$/.test(dl.suggestedFilename()), `cursive: its cover, ${dl.suggestedFilename()}`);
  await page.waitForSelector("dialog[open]", { timeout: 5000 }).catch(() => {});
  await page.click("#closeDialog").catch(() => {});
  await page.selectOption("#script", "print");
  check(await page.$$eval("#preview svg circle", (c) => c.length) > 20, "print again: dots are back");
  // "This book belongs to": first page, 27 in the download.
  await page.check("#belongs");
  for (let i = 0; i < 40; i++) if (!(await page.isDisabled("#prev"))) await page.click("#prev");
  check(/Page 1 of 27 · This book belongs to$/.test(await page.textContent("#pageNo")), `belongs: page 1 is the name page (${await page.textContent("#pageNo")})`);
  [dl] = await Promise.all([page.waitForEvent("download"), page.click("#download")]);
  got = pdfText(await (await dl.createReadStream()).toArray().then(Buffer.concat));
  check(got.pages === 27, `belongs: the download has 27 pages (${got.pages})`);
  await page.uncheck("#belongs");

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
  // The samples: linked from the landing page and served as PDFs.
  const home = await (await paper.request.get(`${base}/`)).text();
  for (const f of ["letter-tracing-workbook-sample-8.5x11.pdf", "letter-tracing-cover-sample-8.5x11.pdf"]) {
    const r = await paper.request.get(`${base}/samples/${f}`);
    check(home.includes(`href="/samples/${f}"`) && r.ok() && r.headers()["content-type"] === "application/pdf", `sample: ${f} linked from / and served (${r.status()} ${r.headers()["content-type"]})`);
  }
  const guideW = await phone.goto(`${base}${guide}`).then(() => phone.evaluate(() => document.documentElement.scrollWidth));
  check(guideW <= 390, `guide: no sideways scroll on a phone (${guideW}px)`);

  // The name tracing sheet: typing redraws the preview, the download is one
  // page with the name in its title, and every page a reader lands on links it.
  const nm = await (await browser.newContext({ acceptDownloads: true, userAgent: "trace-press-test/browser" })).newPage();
  nm.on("pageerror", (e) => errors.push(`name: ${e.message}`));
  await nm.goto(`${base}/name-tracing`);
  await nm.waitForSelector("#preview svg circle");
  const dotsMaya = await nm.locator("#preview svg circle").count();
  await nm.fill("#name", "Christopher+Lee");
  check(/Showing “ChristopherLee”/.test(await nm.textContent("#nameNote")), `name: dropped characters are reported (${await nm.textContent("#nameNote")})`);
  check((await nm.locator("#preview svg circle").count()) !== dotsMaya, "name: typing redraws the preview");
  await nm.fill("#name", "Sofía Zoë");
  check(!/Showing/.test(await nm.textContent("#nameNote")), `name: accented letters are drawn, not dropped (${await nm.textContent("#nameNote")})`);
  await nm.fill("#name", "Christopher+Lee");
  [dl] = await Promise.all([nm.waitForEvent("download"), nm.click("#download")]);
  const nf = join(tmp, "n.pdf");
  writeFileSync(nf, await (await dl.createReadStream()).toArray().then(Buffer.concat));
  const ninfo = execFileSync("pdfinfo", [nf], { encoding: "utf8" });
  check(/Pages:\s+1\n/.test(ninfo) && /Title:\s+Name tracing worksheet: ChristopherLee/.test(ninfo) && dl.suggestedFilename() === "name-tracing-christopherlee-8.5x11.pdf", `name: one-page PDF, ${dl.suggestedFilename()}`);
  for (const from of ["/", "/handwriting-paper", guide, "/nope-404"]) {
    check((await (await nm.request.get(`${base}${from}`)).text()).includes('href="/name-tracing"'), `name: linked from ${from}`);
  }
  check((await (await nm.request.get(`${base}/sitemap.xml`)).text()).includes("/name-tracing"), "name: in the sitemap");
  const nameW = await phone.goto(`${base}/name-tracing`).then(() => phone.evaluate(() => document.documentElement.scrollWidth));
  check(nameW <= 390, `name: no sideways scroll on a phone (${nameW}px)`);

  // The same tool framed for words: its own beacon and file name.
  const beacons = [];
  nm.on("request", (r) => { const m = r.url().match(/\/px\/(\w+)\.gif/); if (m) beacons.push(m[1]); });
  await nm.goto(`${base}/tracing-worksheet-generator`);
  await nm.waitForSelector("#preview svg circle");
  check(await nm.inputValue("#name") === "cat sun dog", "words: starts with cat sun dog");
  [dl] = await Promise.all([nm.waitForEvent("download"), nm.click("#download")]);
  check(dl.suggestedFilename() === "tracing-worksheet-cat-sun-dog-8.5x11.pdf", `words: file name ${dl.suggestedFilename()}`);
  check(beacons.includes("words") && !beacons.includes("name"), `words: own page beacon (${beacons})`);
  // Cursive on the same tool: picked with the keyboard (a trusted change, so
  // the beacon fires), the preview turns to joined paths with no dots, and
  // the download is one page under its own name. ?script=cursive opens on it.
  await nm.focus("#script");
  await nm.keyboard.press("ArrowDown");
  await nm.waitForFunction(() => document.querySelectorAll("#preview svg circle").length === 0 && document.querySelectorAll("#preview svg path").length >= 4);
  [dl] = await Promise.all([nm.waitForEvent("download"), nm.click("#download")]);
  const wf = join(tmp, "w.pdf");
  writeFileSync(wf, await (await dl.createReadStream()).toArray().then(Buffer.concat));
  check(/Pages:\s+1\n/.test(execFileSync("pdfinfo", [wf], { encoding: "utf8" })) && dl.suggestedFilename() === "tracing-worksheet-cat-sun-dog-8.5x11-cursive.pdf", `words cursive: one page, ${dl.suggestedFilename()}`);
  check(beacons.includes("namecursive"), `words cursive: its beacon (${beacons})`);
  await nm.goto(`${base}/name-tracing?script=cursive`);
  await nm.waitForFunction(() => document.querySelectorAll("#preview svg circle").length === 0 && document.querySelectorAll("#preview svg path").length >= 4);
  check(await nm.inputValue("#script") === "cursive", "name: ?script=cursive opens on Cursive");
  // /cursive-name-tracing: the same tool opening on Cursive, its own beacon and file name.
  beacons.length = 0;
  await nm.goto(`${base}/cursive-name-tracing`);
  await nm.waitForFunction(() => document.querySelectorAll("#preview svg circle").length === 0 && document.querySelectorAll("#preview svg path").length >= 4);
  [dl] = await Promise.all([nm.waitForEvent("download"), nm.click("#download")]);
  check(await nm.inputValue("#script") === "cursive" && dl.suggestedFilename() === "cursive-name-tracing-maya-8.5x11.pdf", `cursive names: opens on Cursive, ${dl.suggestedFilename()}`);
  check(beacons.includes("cursivename") && !beacons.includes("name"), `cursive names: own page beacon (${beacons})`);
  check((await (await nm.request.get(`${base}/sitemap.xml`)).text()).includes("/tracing-worksheet-generator"), "words: in the sitemap");
  const wordsW = await phone.goto(`${base}/tracing-worksheet-generator`).then(() => phone.evaluate(() => document.documentElement.scrollWidth));
  check(wordsW <= 390, `words: no sideways scroll on a phone (${wordsW}px)`);

  // The sight word page: its buttons open the tool with the list filled in,
  // and the book grows by that many pages.
  const sw = "/sight-word-tracing-workbook";
  await nm.goto(`${base}${sw}`);
  const ctas = await nm.$$eval("a.cta", (as) => as.map((a) => a.getAttribute("href")));
  check(ctas.length === 2 && ctas.every((h) => h.startsWith("/?words=")), `sight words: two buttons into the tool (${ctas.length})`);
  for (const [i, n] of [[0, 66], [1, 78]]) {
    await nm.goto(`${base}${ctas[i]}`);
    await nm.waitForSelector("#preview svg circle");
    check(new RegExp(`Page 1 of ${n} `).test(await nm.textContent("#pageNo")) && new RegExp(`for ${n} pages`).test(await nm.textContent("#coverNote")), `sight words: button ${i + 1} makes a ${n}-page book (${await nm.textContent("#pageNo")})`);
  }
  for (const from of ["/", "/handwriting-paper", guide, "/name-tracing", "/nope-404"]) {
    check((await (await nm.request.get(`${base}${from}`)).text()).includes(`href="${sw}"`), `sight words: linked from ${from}`);
  }
  check((await (await nm.request.get(`${base}/sitemap.xml`)).text()).includes(sw), "sight words: in the sitemap");
  {
    const f = "/samples/sight-word-tracing-workbook-sample-8.5x11.pdf";
    const r = await nm.request.get(`${base}${f}`);
    const swHtml = await (await nm.request.get(`${base}${sw}`)).text();
    const map = await (await nm.request.get(`${base}/sitemap.xml`)).text();
    check(swHtml.includes(`href="${f}"`) && map.includes(f) && r.ok() && r.headers()["content-type"] === "application/pdf", `sight words: sample PDF linked, in the sitemap, served (${r.status()} ${r.headers()["content-type"]})`);
  }
  // Number tracing worksheets: the PDF is linked and served, the button opens
  // the tool with Numbers ticked, and every page's footer links here.
  {
    const nt = "/number-tracing", f = "/samples/number-tracing-worksheets-0-9.pdf";
    const html = await (await nm.request.get(`${base}${nt}`)).text();
    const r = await nm.request.get(`${base}${f}`);
    const map = await (await nm.request.get(`${base}/sitemap.xml`)).text();
    check(html.includes(`href="${f}"`) && map.includes(`${nt}<`) && map.includes(f) && r.ok() && r.headers()["content-type"] === "application/pdf", `numbers page: PDF linked, both in the sitemap, served (${r.status()} ${r.headers()["content-type"]})`);
    await nm.goto(`${base}${nt}`);
    await nm.click('a[href="/?numbers=1"]');
    await nm.waitForSelector("#preview svg circle");
    check(await nm.isChecked("#numbers") && /for 36 pages/.test(await nm.textContent("#coverNote")), `numbers page: the button opens a 36-page book (${await nm.textContent("#coverNote")})`);
    for (const from of ["/", "/handwriting-paper", guide, "/name-tracing", sw, "/nope-404"]) {
      check((await (await nm.request.get(`${base}${from}`)).text()).includes(`href="${nt}"`), `numbers page: linked from ${from}`);
    }
    const w = await phone.goto(`${base}${nt}`).then(() => phone.evaluate(() => document.documentElement.scrollWidth));
    check(w <= 390, `numbers page: no sideways scroll on a phone (${w}px)`);
  }
  // Letter tracing worksheets: the A–Z sample is the download, it is served,
  // the page is in the sitemap, and every page's footer links here.
  {
    const lt = "/letter-tracing", f = "/samples/letter-tracing-workbook-sample-8.5x11.pdf";
    const html = await (await nm.request.get(`${base}${lt}`)).text();
    const r = await nm.request.get(`${base}${f}`);
    const map = await (await nm.request.get(`${base}/sitemap.xml`)).text();
    check(html.includes(`href="${f}"`) && map.includes(`${lt}<`) && r.ok() && r.headers()["content-type"] === "application/pdf", `letters page: PDF linked, in the sitemap, served (${r.status()} ${r.headers()["content-type"]})`);
    for (const from of ["/", "/handwriting-paper", guide, "/name-tracing", sw, "/number-tracing", "/nope-404"]) {
      check((await (await nm.request.get(`${base}${from}`)).text()).includes(`href="${lt}"`), `letters page: linked from ${from}`);
    }
    const w = await phone.goto(`${base}${lt}`).then(() => phone.evaluate(() => document.documentElement.scrollWidth));
    check(w <= 390, `letters page: no sideways scroll on a phone (${w}px)`);
  }
  // Tracing lines worksheets: the PDF is linked and served, the button opens
  // the tool with Pre-writing lines ticked, and every page links here.
  {
    const tl = "/tracing-lines", f = "/samples/tracing-lines-worksheets.pdf";
    const html = await (await nm.request.get(`${base}${tl}`)).text();
    const r = await nm.request.get(`${base}${f}`);
    const map = await (await nm.request.get(`${base}/sitemap.xml`)).text();
    check(html.includes(`href="${f}"`) && map.includes(`${tl}<`) && map.includes(f) && r.ok() && r.headers()["content-type"] === "application/pdf", `lines page: PDF linked, both in the sitemap, served (${r.status()} ${r.headers()["content-type"]})`);
    await nm.goto(`${base}${tl}`);
    await nm.click('a[href="/?lines=1"]');
    await nm.waitForSelector("#preview svg circle");
    check(await nm.isChecked("#lines") && /for 30 pages/.test(await nm.textContent("#coverNote")) && /Page 1 of 30 · lines/.test(await nm.textContent("#pageNo")), `lines page: the button opens a 30-page book at the lines (${await nm.textContent("#pageNo")})`);
    for (const from of ["/", "/handwriting-paper", guide, "/name-tracing", sw, "/number-tracing", "/letter-tracing", "/nope-404"]) {
      check((await (await nm.request.get(`${base}${from}`)).text()).includes(`href="${tl}"`), `lines page: linked from ${from}`);
    }
    const w = await phone.goto(`${base}${tl}`).then(() => phone.evaluate(() => document.documentElement.scrollWidth));
    check(w <= 390, `lines page: no sideways scroll on a phone (${w}px)`);
  }
  // Worksheet previews: the sitemap names each page's picture. Every one is
  // on its page and served as a PNG, and no page on the sitemap shows a
  // broken image. The pages come from the sitemap, not a list typed here.
  {
    const map = await (await nm.request.get(`${base}/sitemap.xml`)).text();
    const urls = [...map.matchAll(/<url>(.*?)<\/url>/g)].map((m) => m[1]);
    const imaged = urls.filter((u) => u.includes("<image:loc>"));
    check(imaged.length >= 4, `previews: ${imaged.length} sitemap pages name a picture`);
    for (const u of urls) {
      const path = new URL(u.match(/<loc>(.*?)<\/loc>/)[1]).pathname;
      if (path.endsWith(".pdf")) continue;
      await nm.goto(`${base}${path}`, { waitUntil: "load" });
      // A lazy image off screen hasn't loaded yet; that isn't broken. Load it, then judge.
      await nm.$$eval("img[loading=lazy]", (els) => Promise.all(els.map((e) => { e.loading = "eager"; return e.decode().catch(() => {}); })));
      const imgs = await nm.$$eval("img", (els) => els.map((e) => ({ src: e.getAttribute("src"), ok: e.complete && e.naturalWidth > 0, alt: e.alt.length })));
      const pics = [...u.matchAll(/<image:loc>(.*?)<\/image:loc>/g)].map((m) => new URL(m[1]).pathname);
      for (const p of pics) {
        const r = await nm.request.get(`${base}${p}`);
        check(r.ok() && r.headers()["content-type"] === "image/png" && imgs.some((i) => i.src === p && i.ok && i.alt > 40), `previews: ${p} shown on ${path} with alt text, served (${r.status()} ${r.headers()["content-type"]})`);
      }
      check(imgs.every((i) => i.ok), `previews: no broken image on ${path}`);
      // The share image: a 1200 × 630 PNG, and a page with a worksheet
      // picture shares its own card rather than the site-wide one.
      const og = await nm.getAttribute('meta[property="og:image"]', "content");
      const card = og && (await nm.request.get(og.replace(/^https:\/\/[^/]+/, base)));
      const png = card && card.ok() ? await card.body() : Buffer.alloc(0);
      const size = png.length > 24 ? `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}` : "none";
      check(size === "1200x630" && (!pics.length || og.includes("/img/card-")), `share image: ${path} → ${og && new URL(og).pathname} (${size})`);
    }
  }
  // The lowercase page links the tool with lowercase chosen.
  await nm.goto(`${base}/?letters=lower`);
  await nm.waitForSelector("#preview svg circle");
  check(/Page 1 of 26 · a$/.test(await nm.textContent("#pageNo")), `?letters=lower: page 1 is a alone (${await nm.textContent("#pageNo")})`);
  await nm.goto(`${base}/?script=cursive`);
  await nm.waitForFunction(() => document.querySelectorAll("#preview svg path").length >= 10);
  check(await nm.inputValue("#script") === "cursive", "?script=cursive: Cursive chosen");
  // The adult cursive page links the tool on the smallest lines; a size not
  // offered is ignored.
  await nm.goto(`${base}/?script=cursive&guide=0.45`);
  await nm.waitForFunction(() => document.querySelectorAll("#preview svg path").length >= 10);
  check(await nm.inputValue("#age") === "0.45" && await nm.inputValue("#script") === "cursive", `?guide=0.45: 0.45" lines in cursive (${await nm.inputValue("#age")})`);
  await nm.goto(`${base}/?guide=3`);
  await nm.waitForSelector("#preview svg");
  check(await nm.inputValue("#age") === "0.75", `?guide=3: ignored, stays 0.75" (${await nm.inputValue("#age")})`);
  // The "this book belongs to" page links the tool with the name page on.
  await nm.goto(`${base}/?belongs=1`);
  await nm.waitForSelector("#preview svg");
  check(/Page 1 of 27 · This book belongs to$/.test(await nm.textContent("#pageNo")), `?belongs=1: page 1 is the name page (${await nm.textContent("#pageNo")})`);
  // The copyright page has no rows; the preview must still page onto it.
  await nm.goto(`${base}/?belongs=1&copyright=1`);
  await nm.waitForSelector("#preview svg");
  await nm.click("#next");
  check(/Page 2 of 28 · Copyright page$/.test(await nm.textContent("#pageNo")), `?copyright=1: page 2 is the copyright page (${await nm.textContent("#pageNo")})`);
  check(/Copyright ©/.test(await nm.textContent("#preview svg")), "the copyright page's preview shows the © line");
  await nm.goto(`${base}/?titlepage=1`);
  await nm.waitForSelector("#preview svg");
  await nm.fill("#title", "Zoo Letters");
  await nm.dispatchEvent("#title", "change");
  await nm.waitForFunction(() => /Zoo Letters/.test(document.querySelector("#preview svg")?.textContent ?? ""));
  check(/Page 1 of 27 · Title page$/.test(await nm.textContent("#pageNo")), `?titlepage=1: page 1 is the title page, and it takes the cover's title (${await nm.textContent("#pageNo")})`);
  const lst = await nm.inputValue("#listing");
  check(lst.startsWith("Zoo Letters\n") && /: 27 pages, 8\.5" × 11"/.test(lst) && lst.includes("Inside:"), `the listing description follows the book (${lst.slice(0, 80).replace(/\n/g, " / ")})`);
  const phW = await phone.goto(`${base}/`).then(() => phone.evaluate(() => document.documentElement.scrollWidth));
  check(phW <= 390, `home with the listing box: no sideways scroll on a phone (${phW}px)`);
  const swW = await phone.goto(`${base}${sw}`).then(() => phone.evaluate(() => document.documentElement.scrollWidth));
  check(swW <= 390, `sight words: no sideways scroll on a phone (${swW}px)`);

  check(errors.length === 0, `no page errors ${errors.join("; ")}`);
} finally {
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
}
if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log(`\nBROWSER OK (${ENGINE}, ${base})`);
