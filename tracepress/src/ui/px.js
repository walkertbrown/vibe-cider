// Beacons: a fixed set of empty 1x1 GIFs under /px/, one per act, each fired
// at most once per page load. No id, no cookie, nothing anybody typed: the
// path is the whole message. Each name is a real file in public/px/, so a
// visitor's beacon is never a 404. Copied from Puzzle Press (app/src/ui/px.js).
const sent = new Set();

export function px(name, { keep = false } = {}) {
  if (sent.has(name)) return;
  sent.add(name);
  // Cloudflare logs clientRequestPath without the query string, so the cache
  // buster costs nothing in the dashboard: it only stops the browser serving a
  // later page view's beacon out of its own cache.
  const url = `/px/${name}.gif?${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  try {
    if (keep && typeof fetch === "function") {
      fetch(url, { method: "GET", keepalive: true, mode: "no-cors", cache: "no-store" }).catch(() => {});
      return;
    }
  } catch {}
  try {
    new Image().src = url;
  } catch {}
}
