// Free tier: the whole book, interior unmarked; the cover carries PREVIEW.
// Licensed: the cover without PREVIEW. The licence is a record in localStorage
// written after /api/verify confirms a paid Stripe checkout for an email.

// There is no longer a puzzle-count cap. Capping length meant the free tier
// could only produce something nobody would publish, so it demonstrated the
// opposite of what it needed to. The PREVIEW mark across the cover is the gate.
// Until 2026-10-20 a footer line on every interior page was too; it came off
// so a free visitor can upload and proof the interior they actually made.
// FREE_LIMIT is kept as the UI's maximum, not a tier limit.
export const FREE_LIMIT = 200;

export const PRICE_LABEL = "$19 one-time";
const KEY = "puzzlepress.license";

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
