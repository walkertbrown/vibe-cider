// Free: every page carries a footer line naming Trace Press, which makes the
// book unsellable but shows the whole product working. Licensed: no footer.
// The licence is a record in localStorage written after /api/verify confirms
// a paid Stripe checkout on the Trace Press Payment Link for an email.
// Copied from Puzzle Press (app/src/ui/license.js) with its own storage key.

export const PRICE_LABEL = "$19 one-time";
const KEY = "tracepress.license";

export function getLicense() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const rec = JSON.parse(raw);
    return rec && rec.email && rec.token ? rec : null;
  } catch {
    return null;
  }
}

// Returns false when the browser refused to store it — private windows and
// "block all cookies" both throw here. The unlock still works for this tab;
// the caller has to say so, because a buyer who pays, unlocks, reloads and is
// locked out again with no explanation is a refund and a bad review.
export function setLicense(rec) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rec));
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

export function clearLicense() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export async function verifyEmail(email) {
  const res = await fetch("/api/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) throw new Error(body.error || "Could not verify that email.");
  return { email: body.email, token: body.token, verifiedAt: Date.now() };
}
