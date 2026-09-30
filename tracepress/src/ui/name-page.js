// The name tracing page: type a name, pick a line size, see the sheet as it
// prints, download it. Free, one page, with a one-line footer.
import { planName, nameInk, cleanName, NAME_MAX } from "../pdf/name.js";
import { GUIDES } from "../pdf/plan.js";
import { TRIMS } from "../pdf/kdp.js";
import { pageSvg } from "./preview.js";
import { px } from "./px.js";

const SUPPORT = "support@bananafest-destiny.com";
const $ = (id) => document.getElementById(id);
const el = { name: $("name"), trim: $("trim"), age: $("age"), preview: $("preview"), note: $("nameNote"), download: $("download"), status: $("status") };

el.name.maxLength = NAME_MAX + 8; // room for characters cleanName drops
for (const [key, t] of Object.entries(TRIMS)) el.trim.add(new Option(t.label, key, false, key === "8.5x11"));
for (const [label, inches] of Object.entries(GUIDES)) el.age.add(new Option(`${label} — ${inches}" lines`, String(inches), false, inches === 0.75));

const opts = () => ({ name: el.name.value, trim: el.trim.value, guideIn: Number(el.age.value) });

function show() {
  const { geom, name, page } = planName(opts());
  const svg = pageSvg(geom, page, { shapes: nameInk(page) });
  svg.setAttribute("aria-label", `A name tracing sheet for ${name}`);
  el.preview.replaceChildren(svg);
  const typed = el.name.value.trim();
  el.note.textContent = typed && cleanName(typed) !== typed.replace(/\s+/g, " ")
    ? `Showing “${name}”: only the letters A–Z and spaces are drawn so far, up to ${NAME_MAX}.`
    : "";
}

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
    const o = opts();
    const { name } = planName(o);
    const bytes = await renderName(o, { bold: new Uint8Array(bold), regular: new Uint8Array(regular) });
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `name-tracing-${name.replace(/ /g, "-").toLowerCase()}-${o.trim}.pdf`;
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

px("name");
show();
