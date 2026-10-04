// Trace Press in the browser: pick a trim and an age, see any page of the
// book exactly as it prints, download the interior PDF. Nothing typed here
// leaves the browser except the email in the unlock dialog, which goes to
// /api/verify and nowhere else.
import { planBook, GUIDES, CASES, SCRIPTS, cleanWords, wordsMax } from "../pdf/plan.js";
import { cursiveWidth } from "../pdf/cursive.js";
import { TRIMS } from "../pdf/kdp.js";
import { listingText } from "../pdf/listing.js";
import { SHAPES } from "../glyphs/lines.js";
import { coverGeometry, PAPER } from "../pdf/cover-geometry.js";
import { pageSvg } from "./preview.js";
import { getLicense as storedLicense, setLicense, clearLicense, verifyEmail, PRICE_LABEL } from "./license.js";
import { px } from "./px.js";

const PAY_URL = window.TRACE_PRESS_PAY_URL || "";
const SUPPORT = "support@bananafest-destiny.com";

// A licence verified in this tab still counts when the browser refuses to
// store it (private windows).
let sessionLicense = null;
const getLicense = () => storedLicense() ?? sessionLicense;

const $ = (id) => document.getElementById(id);
const el = {
  trim: $("trim"), script: $("script"), bleed: $("bleed"), age: $("age"), cases: $("cases"), numbers: $("numbers"), lines: $("lines"), shapes: $("shapes"), belongs: $("belongs"), done: $("done"), copyright: $("copyright"), titled: $("titled"), folios: $("folios"), abc: $("abc"), words: $("words"), wordsNote: $("wordsNote"),
  preview: $("preview"), prev: $("prev"), next: $("next"), pageNo: $("pageNo"),
  download: $("download"), status: $("status"), tier: $("tier"),
  dialog: $("unlockDialog"), dialogTitle: $("dialogTitle"), dialogLede: $("dialogLede"), buyLine: $("buyLine"),
  title: $("title"), subtitle: $("subtitle"), author: $("author"), paper: $("paper"), coverNote: $("coverNote"),
  downloadCover: $("downloadCover"), coverStatus: $("coverStatus"), listing: $("listing"), copyListing: $("copyListing"), listingStatus: $("listingStatus"),
  email: $("email"), unlockErr: $("unlockErr"), verify: $("verify"), closeDialog: $("closeDialog"),
};

for (const [key, t] of Object.entries(TRIMS)) el.trim.add(new Option(t.label, key, false, key === "8.5x11"));
for (const [key, p] of Object.entries(PAPER)) el.paper.add(new Option(p.label, key, false, key === "white"));
for (const [value, label] of Object.entries(CASES)) el.cases.add(new Option(label, value));
for (const [value, label] of Object.entries(SCRIPTS)) el.script.add(new Option(label, value));
for (const [label, inches] of Object.entries(GUIDES)) el.age.add(new Option(`${label} — ${inches}" lines`, String(inches), false, inches === 0.75));

// The cursive font (and fontkit, to join its letters) loads only when
// someone picks Cursive. Until it has, the page shows print.
let cursive = null, cursiveBytes = null, cursiveLoading = null;
const loadCursive = () => (cursiveLoading ??= Promise.all([
  import("@pdf-lib/fontkit"),
  fetch("/fonts/PlaywriteUSTrad.ttf").then((r) => { if (!r.ok) throw new Error(`cursive font: ${r.status}`); return r.arrayBuffer(); }),
]).then(([fk, bytes]) => {
  cursiveBytes = bytes;
  cursive = (fk.default ?? fk).create(new Uint8Array(bytes));
}).catch((err) => { cursiveLoading = null; throw err; }));
const wantsCursive = () => el.script.value === "cursive";
const script = () => (wantsCursive() && cursive ? "cursive" : "print");

let pageIndex = 0;
const opts = () => ({ script: script(), measure: cursive ? (text, unit) => cursiveWidth(cursive, text, unit) : undefined, trim: el.trim.value, bleed: el.bleed.checked, guideIn: Number(el.age.value), cases: el.cases.value, numbers: el.numbers.checked, lines: el.lines.checked, shapes: el.shapes.checked, belongs: el.belongs.checked, done: el.done.checked, copyright: el.copyright.checked, titled: el.titled.checked, folios: el.folios.checked, title: el.title.value.trim(), subtitle: el.subtitle.value.trim(), author: el.author.value.trim(), abc: el.abc.checked, words: el.words.value });

// The cover's size, before it's made: what to type into KDP's cover
// calculator to check it.
const inch = (pt) => `${(pt / 72).toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}"`;
function showCoverNote() {
  const pageCount = planBook(opts()).pages.length;
  const g = coverGeometry({ trim: el.trim.value, pageCount, paper: el.paper.value });
  el.coverNote.textContent = `${inch(g.width)} × ${inch(g.height)} with bleed, spine ${inch(g.spine)} for ${pageCount} pages. KDP allows spine text from 79 pages, so the spine is left blank.`;
}

function showPage() {
  showCoverNote();
  el.listing.value = listingText(opts());
  el.listingStatus.textContent = "";
  const { geom, pages } = planBook(opts());
  pageIndex = Math.max(0, Math.min(pageIndex, pages.length - 1));
  const svg = pageSvg(geom, pages[pageIndex], { licensed: !!getLicense(), cursive });
  const { word, belongs, done, copyright, titlePage } = pages[pageIndex];
  const first = pages[pageIndex].rows[0] ?? { letters: [] }; // the copyright page has no rows
  const chars = first.letters.length ? first.letters.map((l) => l.ch) : (first.runs?.[0]?.text.split(/\s+/) ?? []);
  const letters = belongs ? "This book belongs to" : copyright ? "Copyright page" : titlePage ? "Title page" : done ? "Well done!" : word ? `“${word}”` : chars[0].startsWith("~") ? `${SHAPES[chars[0]] ? "shape" : "lines"}: ${chars.map((c) => c.slice(1).replace("-", " ")).join(", ")}` : chars.join(" ");
  const max = wordsMax(el.numbers.checked, el.lines.checked, el.belongs.checked, el.shapes.checked, el.done.checked, el.copyright.checked, el.titled.checked), n = cleanWords(el.words.value, max).length;
  const after = el.numbers.checked ? "after 9" : "after Z";
  el.wordsNote.textContent = n ? `${n} word page${n === 1 ? "" : "s"} ${after}${n === max ? ` (the most: ${max}${el.numbers.checked || el.lines.checked || el.shapes.checked || el.belongs.checked || el.done.checked || el.copyright.checked || el.titled.checked ? ` with ${[el.titled.checked && "the title page", el.belongs.checked && "the name page", el.copyright.checked && "the copyright page", el.lines.checked && "lines", el.shapes.checked && "shapes", el.numbers.checked && "numbers", el.done.checked && "the well-done page"].filter(Boolean).join(" and ")} on` : ""})` : ""}.` : "";
  svg.setAttribute("aria-label", `Page ${pageIndex + 1} of ${pages.length}: tracing practice for ${letters}`);
  el.preview.replaceChildren(svg);
  el.pageNo.textContent = `Page ${pageIndex + 1} of ${pages.length} · ${letters}`;
  el.prev.disabled = pageIndex === 0;
  el.next.disabled = pageIndex === pages.length - 1;
}

el.script.addEventListener("change", (e) => {
  if (e.isTrusted) px("touched");
  if (e.isTrusted && wantsCursive()) px("cursive");
  showScript();
});
// Shows print at once, then cursive when its font has arrived.
function showScript() {
  showPage();
  if (!wantsCursive() || cursive) return;
  el.pageNo.textContent = "Loading the cursive font…";
  loadCursive().then(showPage, (err) => { el.pageNo.textContent = `Could not load the cursive font: ${err.message}. Reload the page to try again.`; });
}

for (const c of [el.trim, el.bleed, el.age, el.cases, el.belongs, el.done, el.copyright, el.titled, el.folios, el.title, el.subtitle, el.author, el.abc, el.numbers, el.lines, el.shapes, el.paper]) c.addEventListener("change", (e) => {
  if (e.isTrusted) px("touched");
  showPage();
});
el.words.addEventListener("input", (e) => {
  if (e.isTrusted) px("touched");
  showPage();
});
el.prev.addEventListener("click", (e) => { if (e.isTrusted) px("pager"); pageIndex--; showPage(); });
el.next.addEventListener("click", (e) => { if (e.isTrusted) px("pager"); pageIndex++; showPage(); });

el.copyListing.addEventListener("click", async (e) => {
  if (e.isTrusted) px("listing");
  try {
    await navigator.clipboard.writeText(el.listing.value);
    el.listingStatus.textContent = "Copied.";
  } catch {
    el.listing.select();
    el.listingStatus.textContent = "Selected: press Ctrl+C (or ⌘C) to copy.";
  }
});

function refreshTier(note = "") {
  const lic = getLicense();
  el.tier.replaceChildren();
  if (lic) {
    el.tier.append(`Unlocked for ${lic.email}: no footer line, no PREVIEW on the cover. `);
    const out = document.createElement("button");
    out.type = "button"; out.className = "linkish"; out.textContent = "Forget this browser";
    out.addEventListener("click", () => { clearLicense(); sessionLicense = null; refreshTier(); showPage(); });
    el.tier.append(out);
    if (note === "storage") el.tier.append(" (This browser won't remember it after you close the tab; enter your email again next time.)");
  } else {
    el.tier.append("Free: every page carries a small Trace Press footer line, and the cover says PREVIEW. ");
    const up = document.createElement("button");
    up.type = "button"; up.className = "linkish"; up.textContent = `Remove them — ${PRICE_LABEL}`;
    up.addEventListener("click", () => openUnlock());
    el.tier.append(up);
  }
}

// The PDF code (pdf-lib and the fonts) is most of the weight; it loads only
// when it's needed, and is warmed while the visitor looks at the preview.
let renderMod = null;
const loadRender = () => (renderMod ??= Promise.all([
  import("../pdf/book.js"),
  fetch("/fonts/LiberationSans-Bold.ttf").then((r) => r.arrayBuffer()),
  fetch("/fonts/LiberationSans-Regular.ttf").then((r) => r.arrayBuffer()),
  import("../pdf/cover.js"),
]).catch((err) => { renderMod = null; throw err; }));

function save(bytes, name) {
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
(window.requestIdleCallback || ((f) => setTimeout(f, 1500)))(() => loadRender().catch(() => {}));

el.download.addEventListener("click", async (e) => {
  if (e.isTrusted) px("download");
  el.download.disabled = true;
  el.status.textContent = "Making your book…";
  try {
    const [{ renderBook }, bold, regular] = await loadRender();
    if (wantsCursive()) { await loadCursive(); showPage(); }
    const o = opts();
    const bytes = await renderBook({ ...o, licensed: !!getLicense() }, { bold, regular, cursive: cursiveBytes });
    save(bytes, `trace-press-${o.trim}${o.bleed ? "-bleed" : ""}-${String(o.guideIn).replace(".", "")}in${o.script === "cursive" ? "-cursive" : ""}.pdf`);
    px("made");
    el.status.textContent = getLicense()
      ? "Downloaded. Upload it to KDP as the paperback manuscript."
      : "Downloaded, with the free footer line on every page.";
  } catch (err) {
    px("failed");
    el.status.textContent = `Could not make the PDF: ${err.message}. Reload the page and try again, or email ${SUPPORT}.`;
  } finally {
    el.download.disabled = false;
  }
});

el.downloadCover.addEventListener("click", async (e) => {
  if (e.isTrusted) px("cover");
  el.downloadCover.disabled = true;
  el.coverStatus.textContent = "Making your cover…";
  try {
    const [, bold, regular, { renderCover }] = await loadRender();
    if (wantsCursive()) await loadCursive();
    const o = opts();
    const bytes = await renderCover({
      title: el.title.value.trim() || "My Letter Tracing Book", subtitle: el.subtitle.value.trim(), author: el.author.value.trim(),
      trim: o.trim, paper: el.paper.value, pageCount: planBook(o).pages.length, licensed: !!getLicense(), script: o.script, abc: o.abc,
    }, { bold, regular, cursive: cursiveBytes });
    save(bytes, `trace-press-cover-${o.trim}-${el.paper.value}${o.script === "cursive" ? "-cursive" : ""}.pdf`);
    px("covermade");
    el.coverStatus.textContent = getLicense()
      ? "Downloaded. Upload it to KDP as the paperback cover."
      : "Downloaded, with PREVIEW across the front. Unlock to remove it.";
  } catch (err) {
    px("failed");
    el.coverStatus.textContent = `Could not make the cover: ${err.message}. Reload the page and try again, or email ${SUPPORT}.`;
  } finally {
    el.downloadCover.disabled = false;
  }
});

// Unlock. Same flow as Puzzle Press: Stripe opens in a new tab, and the email
// used at checkout unlocks this browser. Stripe can take minutes to list a
// completed session (measured ~230s once), so "not found yet" retries by
// itself for five minutes before it gives up.
const AUTO_RETRY_INTERVAL_MS = 10000;
const AUTO_RETRY_CEILING_MS = 5 * 60000;
const SOFT_MENTION_AFTER_MS = 60000;
const RETRYABLE = /No completed payment|Too many tries in a row|Could not reach the payment provider/i;
let autoRetryTimer = null, autoRetryFirstFailAt = 0;
function stopAutoRetry() {
  if (autoRetryTimer) clearTimeout(autoRetryTimer);
  autoRetryTimer = null;
}

function openUnlock({ justPaid = false } = {}) {
  if (!justPaid) px(PAY_URL ? "pay" : "unlock");
  autoRetryFirstFailAt = 0;
  el.unlockErr.textContent = "";
  el.dialogTitle.textContent = justPaid ? "Thanks — one step left" : "Unlock clean books and covers";
  el.dialogLede.textContent = justPaid
    ? "Enter the email you used at checkout and this browser is unlocked."
    : `${PRICE_LABEL}, then every book you make has no Trace Press footer and every cover has no PREVIEW mark. After paying, enter the email you used at checkout here.`;
  el.buyLine.replaceChildren();
  if (!justPaid && PAY_URL) {
    const a = document.createElement("a");
    a.href = PAY_URL; a.target = "_blank"; a.rel = "noopener"; a.className = "buybtn";
    a.textContent = `Pay ${PRICE_LABEL.replace(" one-time", "")} with Stripe`;
    a.addEventListener("click", (e) => { if (e.isTrusted) px("checkout", { keep: true }); });
    el.buyLine.append(a);
  }
  if (typeof el.dialog.showModal === "function") el.dialog.showModal();
  else el.dialog.setAttribute("open", "");
  el.email.focus();
}
function closeUnlock() {
  if (typeof el.dialog.close === "function") el.dialog.close();
  else el.dialog.removeAttribute("open");
}
el.dialog.addEventListener("close", stopAutoRetry);
el.closeDialog.addEventListener("click", closeUnlock);

function showUnlockError(message) {
  const at = message.indexOf(SUPPORT);
  if (at === -1) { el.unlockErr.textContent = message; return; }
  const link = document.createElement("a");
  link.href = `mailto:${SUPPORT}`; link.textContent = SUPPORT;
  el.unlockErr.replaceChildren(message.slice(0, at), link, message.slice(at + SUPPORT.length));
}

async function attemptVerify(email) {
  const rec = await verifyEmail(email);
  sessionLicense = rec;
  const stored = setLicense(rec);
  px("verified");
  closeUnlock();
  refreshTier(stored ? "" : "storage");
  showPage();
}

function handleVerifyFailure(email, err) {
  if (RETRYABLE.test(err.message)) {
    if (!autoRetryFirstFailAt) autoRetryFirstFailAt = Date.now();
    const elapsed = Date.now() - autoRetryFirstFailAt;
    if (elapsed < AUTO_RETRY_CEILING_MS) {
      showUnlockError(elapsed < SOFT_MENTION_AFTER_MS
        ? "Stripe has not finished recording that payment yet — your money is fine. Checking again automatically; you don't need to press anything."
        : `Still checking with Stripe — this can take a few minutes right after paying, and it keeps trying automatically. If you are sure that is not the email on your receipt, email ${SUPPORT} and it will be sorted out by hand.`);
      stopAutoRetry();
      autoRetryTimer = setTimeout(async () => {
        autoRetryTimer = null;
        try { await attemptVerify(email); } catch (err2) { handleVerifyFailure(email, err2); }
      }, AUTO_RETRY_INTERVAL_MS);
      return;
    }
  }
  showUnlockError(err.message);
}

el.verify.addEventListener("click", async () => {
  const email = el.email.value.trim();
  if (!email.includes("@")) { showUnlockError("Enter the email you used at checkout."); return; }
  stopAutoRetry();
  el.verify.disabled = true;
  el.unlockErr.textContent = "";
  try { await attemptVerify(email); } catch (err) { handleVerifyFailure(email, err); } finally { el.verify.disabled = false; }
});
el.email.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); el.verify.click(); } });
for (const b of document.querySelectorAll("[data-unlock]")) b.addEventListener("click", (e) => { e.preventDefault(); openUnlock(); });

px("ran");
refreshTier();
// A link can bring a word list (/?words=the,and,...), e.g. from the sight
// word page. It only fills the box; nothing is sent anywhere.
const linkedWords = new URLSearchParams(location.search).get("words");
if (linkedWords) el.words.value = cleanWords(linkedWords).join(", ");
if (new URLSearchParams(location.search).get("numbers") === "1") el.numbers.checked = true;
if (new URLSearchParams(location.search).get("lines") === "1") el.lines.checked = true;
if (new URLSearchParams(location.search).get("shapes") === "1") el.shapes.checked = true;
if (new URLSearchParams(location.search).get("belongs") === "1") el.belongs.checked = true;
if (new URLSearchParams(location.search).get("done") === "1") el.done.checked = true;
if (new URLSearchParams(location.search).get("copyright") === "1") el.copyright.checked = true;
if (new URLSearchParams(location.search).get("titlepage") === "1") el.titled.checked = true;
if (new URLSearchParams(location.search).get("pagenumbers") === "1") el.folios.checked = true;
if (new URLSearchParams(location.search).get("abc") === "1") el.abc.checked = true;
const linkedCases = new URLSearchParams(location.search).get("letters");
if (CASES[linkedCases]) el.cases.value = linkedCases;
if (new URLSearchParams(location.search).get("script") === "cursive") el.script.value = "cursive";
// ?guide=0.45 opens on that line size, if it is one of the sizes offered.
const linkedGuide = new URLSearchParams(location.search).get("guide");
if (Object.values(GUIDES).map(String).includes(linkedGuide)) el.age.value = linkedGuide;
showScript();
if (new URLSearchParams(location.search).get("paid") === "1" && !getLicense()) {
  history.replaceState(null, "", location.pathname);
  openUnlock({ justPaid: true });
}
