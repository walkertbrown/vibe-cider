// The name tracing page: type a name, pick a line size, see the sheet as it
// prints, download it. Free, one page, with a one-line footer.
import { planName, nameInk, cleanName, NAME_MAX } from "../pdf/name.js";
import { GUIDES, SCRIPTS } from "../pdf/plan.js";
import { cursiveWidth } from "../pdf/cursive.js";
import { TRIMS } from "../pdf/kdp.js";
import { pageSvg } from "./preview.js";
import { px } from "./px.js";

const SUPPORT = "support@bananafest-destiny.com";
// The same tool runs on /tracing-worksheet-generator, framed for words: that
// page says so on <body>, for its own page-load beacon and file name.
const PAGE = document.body.dataset.px ?? "name";
const FILE = document.body.dataset.file ?? "name-tracing";
const $ = (id) => document.getElementById(id);
const el = { name: $("name"), trim: $("trim"), age: $("age"), script: $("script"), preview: $("preview"), note: $("nameNote"), download: $("download"), status: $("status") };

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
  const { geom, name, page } = planName({ ...o, measure: o.script === "cursive" ? measure : undefined });
  const svg = pageSvg(geom, page, { shapes: nameInk(page, { cursive }) });
  svg.setAttribute("aria-label", `A name tracing sheet for ${name}`);
  el.preview.replaceChildren(svg);
  const typed = el.name.value.trim();
  el.note.textContent = typed && cleanName(typed) !== typed.replace(/\s+/g, " ")
    ? `Showing “${name}”: only the letters A–Z and spaces are drawn so far, up to ${NAME_MAX}.`
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
    const o = opts();
    const { name } = planName({ ...o, measure: o.script === "cursive" ? measure : undefined });
    const bytes = await renderName(o, { bold: new Uint8Array(bold), regular: new Uint8Array(regular), cursive: cursiveBytes });
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${FILE}-${name.replace(/ /g, "-").toLowerCase()}-${o.trim}${o.script === "cursive" && !FILE.includes("cursive") ? "-cursive" : ""}.pdf`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    px("namemade");
    el.status.textContent = `Downloaded: a tracing sheet for ${name}.`;
  } catch (err) {
    px("failed");
    el.status.textContent = `Could not make the PDF: ${err.message}. Reload the page and try again, or email ${SUPPORT}.`;
  } finally {
    el.download.disabled = false;
  }
});

px(PAGE);
const START = new URLSearchParams(location.search).get("script") ?? document.body.dataset.script;
if (START in SCRIPTS) el.script.value = START;
show();
if (wantsCursive()) loadCursive().then(show, () => {});
