// Where a buyer came from, carried to Stripe on the Buy link.
//
// Until 2026-10-24 the Buy button was the bare Payment Link, so a sale said
// nothing about its source: the first one was traced to Google only by reading
// the analytics referrer at the minute it happened. Now the link carries
// client_reference_id=src-<where>, and the Stripe session records it.
//
// <where> is decided once per browser and kept in local storage; main.js
// and first-touch.js (every other page) call source() as they start. It is ?ref=<name> on the
// address if a link we posted has one, else the site that linked here
// (www.google.com → google_com), else the page of this site that sent them to
// the tool (via-spine-calculator), else "direct". Only a site name or a page name:
// never a search, a path past the first segment, or anything typed.
// "selftest-" is the test scripts' prefix and can never be produced here,
// since every tag starts with "src-".
const KEY = "puzzlepress.src";

const clean = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);

export function firstSource(loc = location, referrer = document.referrer) {
  const ref = new URLSearchParams(loc.search).get("ref");
  if (ref && clean(ref)) return clean(ref);
  try {
    const r = new URL(referrer);
    if (r.host !== loc.host) return clean(r.host.replace(/^www\./, "")) || "direct";
    const page = r.pathname.split("/")[1];
    return page ? `via-${clean(page)}` : "via-home";
  } catch {
    return "direct";
  }
}

let memo;
export function source() {
  if (memo) return memo;
  try {
    memo = localStorage.getItem(KEY);
    if (!memo) localStorage.setItem(KEY, (memo = firstSource()));
  } catch {
    memo = firstSource();
  }
  return memo;
}

export function payHref(url) {
  return `${url}${url.includes("?") ? "&" : "?"}client_reference_id=src-${source()}`;
}
