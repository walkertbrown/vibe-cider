// The sight word flash card page: pick a list (or type words, once
// licensed), a card size, and whether each card has a copy to trace; see the
// sheets as they print, download the PDF. Dolch's two lists are free with a
// footer line; your own words and no footer come with the $19 licence.
import { planCards, cardsInk, cleanWords, LISTS, PICTURE_SET, SHEETS, WORDS_MAX, OWN_BACK } from "../pdf/cards.js";
import { getLicense as storedLicense, setLicense, verifyEmail, PRICE_LABEL } from "./license.js";
import { pageSvg } from "./preview.js";
import { px } from "./px.js";
import { payHref } from "./source.js";

const SUPPORT = "support@bananafest-destiny.com";
const PAY_URL = window.TRACE_PRESS_PAY_URL || "";
const $ = (id) => document.getElementById(id);
const el = {
  list: $("list"), words: $("words"), wordsBox: $("wordsBox"), sheet: $("sheet"), trace: $("trace"), pairs: $("pairs"), backs: $("backs"), preview: $("preview"),
  prev: $("prev"), next: $("next"), pageNo: $("pageNo"), download: $("download"), status: $("status"),
  unlock: $("unlock"), ownPlay: $("ownPlay"), buyLine: $("buyLine"), email: $("email"), verify: $("verify"), unlockErr: $("unlockErr"), tier: $("tier"),
};

let sessionLicense = null;
const getLicense = () => storedLicense() ?? sessionLicense;

for (const [key, l] of Object.entries(LISTS)) el.list.add(new Option(`${l.label} (${l.words.length} words)`, key));
el.list.add(new Option(`${PICTURE_SET.label} (${PICTURE_SET.words.length} words)`, "pictures"));
el.list.add(new Option(`Your own words (${PRICE_LABEL})`, "own"));
for (const [key, s] of Object.entries(SHEETS)) el.sheet.add(new Option(s.label, key));

const own = () => el.list.value === "own";
const opts = () => {
  if (own() && getLicense()) {
    const words = cleanWords(el.words.value);
    return { sheet: el.sheet.value, trace: el.trace.checked, pairs: el.pairs.checked, back: el.backs.checked ? OWN_BACK : null, words: words.length ? words : LISTS["pre-primer"].words, tag: "", licensed: true };
  }
  const pictures = el.list.value === "pictures";
  const l = pictures ? PICTURE_SET : LISTS[own() ? "pre-primer" : el.list.value];
  return { sheet: el.sheet.value, trace: el.trace.checked, pairs: el.pairs.checked, back: el.backs.checked ? l.back : null, words: l.words, tag: l.label, pictures, licensed: !!getLicense() };
};

let pageIndex = 0;
function show() {
  const o = opts();
  const plan = planCards(o);
  pageIndex = Math.min(pageIndex, plan.pages.length - 1);
  const svg = pageSvg(plan.geom, null, { shapes: cardsInk(plan, plan.pages[pageIndex], { licensed: o.licensed }) });
  svg.setAttribute("aria-label", `Sheet ${pageIndex + 1} of the flash cards: ${plan.pages[pageIndex].cards.map((c) => c.word).join(", ")}`);
  el.preview.replaceChildren(svg);
  const fronts = plan.pages.filter((p) => !p.back);
  const cards = fronts.reduce((n, p) => n + p.cards.length, 0);
  el.pageNo.textContent = o.back
    ? `Page ${pageIndex + 1} of ${plan.pages.length} (${plan.pages[pageIndex].back ? "back" : "front"}) · ${cards} cards`
    : `Sheet ${pageIndex + 1} of ${plan.pages.length} · ${cards} cards`;
  el.prev.disabled = pageIndex === 0;
  el.next.disabled = pageIndex >= plan.pages.length - 1;
  el.wordsBox.hidden = !own();
  el.unlock.hidden = !own() || !!getLicense();
  // The words typed so far, played free on screen: the game takes up to 8.
  const typed = cleanWords(el.words.value).slice(0, 8);
  el.ownPlay.href = `/sight-word-matching-game${typed.length >= 2 ? `?words=${encodeURIComponent(typed.join(","))}` : ""}`;
  el.tier.textContent = getLicense()
    ? `Unlocked for ${getLicense().email}: your own words, and no footer line.`
    : `Free: Dolch's two lists, with one footer line on each sheet. ${PRICE_LABEL} (the same Trace Press licence as the workbooks) adds your own words, up to ${WORDS_MAX}, and takes the footer off.`;
}

function showUnlock() {
  px(PAY_URL ? "cardspay" : "unlock");
  el.buyLine.replaceChildren();
  if (PAY_URL) {
    const a = document.createElement("a");
    a.href = payHref(PAY_URL); a.target = "_blank"; a.rel = "noopener"; a.className = "buybtn";
    a.textContent = `Pay ${PRICE_LABEL.replace(" one-time", "")} with Stripe`;
    a.addEventListener("click", (e) => { if (e.isTrusted) px("checkout", { keep: true }); });
    el.buyLine.append(a);
  }
}

el.list.addEventListener("change", (e) => {
  if (e.isTrusted) px("cardstouched");
  pageIndex = 0;
  if (own() && !getLicense()) showUnlock();
  show();
});
for (const c of [el.sheet, el.trace]) c.addEventListener("change", (e) => { if (e.isTrusted) px("cardstouched"); pageIndex = 0; show(); });
el.backs.addEventListener("change", (e) => { if (e.isTrusted) px(el.backs.checked ? "cardsbacks" : "cardstouched"); pageIndex = 0; show(); });
el.pairs.addEventListener("change", (e) => { if (e.isTrusted) px(el.pairs.checked ? "cardspairs" : "cardstouched"); pageIndex = 0; show(); });
el.words.addEventListener("input", (e) => { if (e.isTrusted) px("cardstouched"); show(); });
el.prev.addEventListener("click", () => { pageIndex--; show(); });
el.next.addEventListener("click", () => { pageIndex++; show(); });

el.verify.addEventListener("click", async () => {
  const email = el.email.value.trim();
  if (!email) { el.unlockErr.textContent = "Enter the email you used at checkout."; return; }
  el.verify.disabled = true;
  el.unlockErr.textContent = "Checking with Stripe…";
  try {
    const rec = await verifyEmail(email);
    sessionLicense = rec;
    const stored = setLicense(rec);
    px("verified");
    el.unlockErr.textContent = stored ? "" : "Unlocked for this tab. This browser would not store it, so enter your email again after a reload.";
    show();
  } catch (err) {
    el.unlockErr.textContent = `${err.message} If you paid and this keeps failing, email ${SUPPORT}.`;
  } finally {
    el.verify.disabled = false;
  }
});

let renderMod = null;
const loadRender = () => (renderMod ??= Promise.all([
  import("../pdf/book.js"),
  fetch("/fonts/LiberationSans-Bold.ttf").then((r) => r.arrayBuffer()),
  fetch("/fonts/LiberationSans-Regular.ttf").then((r) => r.arrayBuffer()),
]).catch((err) => { renderMod = null; throw err; }));

el.download.addEventListener("click", async () => {
  px("cardsdownload");
  el.download.disabled = true;
  el.status.textContent = "Making your PDF…";
  try {
    const [{ renderCards }, bold, regular] = await loadRender();
    const o = opts();
    const bytes = await renderCards(o, { bold: new Uint8Array(bold), regular: new Uint8Array(regular) });
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `sight-word-flash-cards-${own() ? (o.licensed ? "my-words" : "pre-primer") : el.list.value}-${el.sheet.value}${o.pairs ? "-pairs" : ""}${o.back ? "-backs" : ""}${o.trace ? "-trace" : ""}.pdf`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    px("cardsmade");
    el.status.textContent = `Downloaded: ${o.words.length * (o.pairs ? 2 : 1)} cards. Print at 100% ("Actual size"), not "Fit to page", so the cards come out at their size.`
      + (o.back ? " Print double-sided, flipping on either edge." : "")
      + (o.licensed ? "" : ` Your own words, up to ${WORDS_MAX}, come with the ${PRICE_LABEL} licence: pick "Your own words" in the list.`);
  } catch (err) {
    px("failed");
    el.status.textContent = `Could not make the PDF: ${err.message}. Reload the page and try again, or email ${SUPPORT}.`;
  } finally {
    el.download.disabled = false;
  }
});

px("cards");
const q = new URLSearchParams(location.search);
const start = q.get("list");
if (start in LISTS || start === "own" || start === "pictures") el.list.value = start;
if (q.get("words")) el.words.value = cleanWords(q.get("words")).join("\n");
if (q.get("sheet") in SHEETS) el.sheet.value = q.get("sheet");
if (q.get("pairs") === "1") el.pairs.checked = true;
if (q.get("backs") === "1") el.backs.checked = true;
show();
