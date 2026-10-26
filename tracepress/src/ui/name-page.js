// The name tracing page: type a name, pick a line size, see the sheet as it
// prints, download it. Free, one page, with a one-line footer.
import { planName, nameInk, cleanName, cleanClass, NAME_MAX } from "../pdf/name.js";
import { GUIDES, SCRIPTS } from "../pdf/plan.js";
import { cursiveWidth } from "../pdf/cursive.js";
import { TRIMS } from "../pdf/kdp.js";
import { pageSvg } from "./preview.js";
import { px } from "./px.js";
import { getLicense as storedLicense, setLicense, verifyEmail, PRICE_LABEL } from "./license.js";
import { payHref } from "./source.js";

const SUPPORT = "support@bananafest-destiny.com";
// The same tool runs on /tracing-worksheet-generator, framed for words: that
// page says so on <body>, for its own page-load beacon and file name.
const PAGE = document.body.dataset.px ?? "name";
const FILE = document.body.dataset.file ?? "name-tracing";
const $ = (id) => document.getElementById(id);
const el = { name: $("name"), trim: $("trim"), age: $("age"), script: $("script"), preview: $("preview"), note: $("nameNote"), download: $("download"), status: $("status"),
  // The whole-class box, on the name pages only (not the words tool).
  cls: $("classList"), unlock: $("unlock"), buyLine: $("buyLine"), email: $("email"), verify: $("verify"), unlockErr: $("unlockErr"), classNote: $("classNote") };
const PAY_URL = window.TRACE_PRESS_PAY_URL || "";
let sessionLicense = null;
const getLicense = () => storedLicense() ?? sessionLicense;
// A class list counts only once licensed; until then it opens the unlock box.
const classNames = () => (el.cls && getLicense() ? cleanClass(el.cls.value) : []);

el.name.maxLength = NAME_MAX + 8; // room for characters cleanName drops
for (const [key, t] of Object.entries(TRIMS)) el.trim.add(new Option(t.label, key, false, key === "8.5x11"));
for (const [label, inches] of Object.entries(GUIDES)) el.age.add(new Option(`${label} — ${inches}" lines`, String(inches), false, inches === 0.75));

for (const [value, label] of Object.entries(SCRIPTS)) el.script.add(new Option(label, value));

// The cursive font (and fontkit, to join its letters) loads only when
// someone picks Cursive, as in the workbook (main.js). Until then: print.
let cursive = null, cursiveBytes = null, cursiveLoading = null;
const loadCursive = () => (cursiveLoading ??= Promise.all([
  import("@pdf-lib/fontkit"),
  fetch("/fonts/PlaywriteUSTrad.ttf").then((r) => { if (!r.ok) throw new Error(`cursive font: ${r.status}`); return r.arrayBuffer(); }),
]).then(([fk, bytes]) => {
  cursiveBytes = bytes;
  cursive = (fk.default ?? fk).create(new Uint8Array(bytes));
}).catch((err) => { cursiveLoading = null; throw err; }));
const wantsCursive = () => el.script.value === "cursive";
const measure = (text, unit) => cursiveWidth(cursive, text, unit);
const PICTURES = document.body.dataset.pictures === "1";
const opts = () => ({ name: el.name.value, trim: el.trim.value, guideIn: Number(el.age.value), script: wantsCursive() && cursive ? "cursive" : "print", pictures: PICTURES });

function show() {
  const o = opts();
  if (el.cls) {
    const typed = cleanClass(el.cls.value);
    el.unlock.hidden = !typed.length || !!getLicense();
    el.classNote.textContent = !typed.length ? ""
      : getLicense() ? `${typed.length} name${typed.length === 1 ? "" : "s"}: the PDF has one sheet for each, with no footer line. The preview shows ${typed[0]}.`
      : `${typed.length} name${typed.length === 1 ? "" : "s"} typed. A whole class in one PDF comes with ${PRICE_LABEL}; until then the download is one sheet, for the name above.`;
    if (getLicense() && typed.length) o.name = typed[0];
  }
  const { geom, name, page } = planName({ ...o, measure: o.script === "cursive" ? measure : undefined });
  const svg = pageSvg(geom, page, { shapes: nameInk(page, { cursive, licensed: !!getLicense() }) });
  svg.setAttribute("aria-label", `A name tracing sheet for ${name}`);
  el.preview.replaceChildren(svg);
  const typed = el.name.value.trim();
  el.note.textContent = typed && cleanName(typed) !== typed.replace(/\s+/g, " ")
    ? `Showing “${name}”: only letters (accented ones too), hyphens, apostrophes and spaces are drawn so far, up to ${NAME_MAX}.`
    : "";
}

el.script.addEventListener("change", (e) => {
  if (e.isTrusted) { px("nametouched"); if (wantsCursive()) px("namecursive"); }
  show();
  if (!wantsCursive() || cursive) return;
  el.note.textContent = "Loading the cursive font…";
  loadCursive().then(show, (err) => { el.note.textContent = `Could not load the cursive font: ${err.message}. Reload the page to try again.`; });
});
for (const c of [el.trim, el.age]) c.addEventListener("change", (e) => { if (e.isTrusted) px("nametouched"); show(); });
el.name.addEventListener("input", (e) => { if (e.isTrusted) px("nametouched"); show(); });

let renderMod = null;
const loadRender = () => (renderMod ??= Promise.all([
  import("../pdf/book.js"),
  fetch("/fonts/LiberationSans-Bold.ttf").then((r) => r.arrayBuffer()),
  fetch("/fonts/LiberationSans-Regular.ttf").then((r) => r.arrayBuffer()),
]).catch((err) => { renderMod = null; throw err; }));

el.download.addEventListener("click", async () => {
  px("namedownload");
  el.download.disabled = true;
  el.status.textContent = "Making your PDF…";
  try {
    const [{ renderName }, bold, regular] = await loadRender();
    if (wantsCursive()) await loadCursive();
    const o = { ...opts(), names: classNames(), licensed: !!getLicense() };
    if (o.names.length) o.name = o.names[0];
    const { name } = planName({ ...o, measure: o.script === "cursive" ? measure : undefined });
    const bytes = await renderName(o, { bold: new Uint8Array(bold), regular: new Uint8Array(regular), cursive: cursiveBytes });
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = o.names.length > 1 ? `${FILE}-class-${o.names.length}-names-${o.trim}${o.script === "cursive" && !FILE.includes("cursive") ? "-cursive" : ""}.pdf` : `${FILE}-${name.replace(/'/g, "").replace(/ /g, "-").toLowerCase()}-${o.trim}${o.script === "cursive" && !FILE.includes("cursive") ? "-cursive" : ""}.pdf`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    px("namemade");
    el.status.textContent = o.names.length > 1 ? `Downloaded: ${o.names.length} tracing sheets, one for each name.` : `Downloaded: a tracing sheet for ${name}.`;
  } catch (err) {
    px("failed");
    el.status.textContent = `Could not make the PDF: ${err.message}. Reload the page and try again, or email ${SUPPORT}.`;
  } finally {
    el.download.disabled = false;
  }
});

if (el.cls) {
  let asked = false;
  el.cls.addEventListener("input", (e) => {
    if (e.isTrusted) px("nametouched");
    if (e.isTrusted && !asked && !getLicense() && cleanClass(el.cls.value).length) {
      asked = true;
      px(PAY_URL ? "classpay" : "unlock");
      if (PAY_URL) {
        const a = document.createElement("a");
        a.href = payHref(PAY_URL); a.target = "_blank"; a.rel = "noopener"; a.className = "buybtn";
        a.textContent = `Pay ${PRICE_LABEL.replace(" one-time", "")} with Stripe`;
        a.addEventListener("click", (ev) => { if (ev.isTrusted) px("checkout", { keep: true }); });
        el.buyLine.replaceChildren(a);
      }
    }
    show();
  });
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
}

px(PAGE);
const START = new URLSearchParams(location.search).get("script") ?? document.body.dataset.script;
if (START in SCRIPTS) el.script.value = START;
show();
if (wantsCursive()) loadCursive().then(show, () => {});
