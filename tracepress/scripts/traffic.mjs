// Trace Press traffic: who ran the page, how far down the funnel they got,
// where they came from, and whether anyone paid. It's separate from Puzzle
// Press's app/scripts/traffic.mjs, which is built around that site's history.
// The data is the same kind:
//   - the zone log (about a day kept): /px/ beacon hits on this host, counted
//     by distinct address. A beacon only fires from a running page, so a
//     crawler fetching HTML never counts. My own tests are excluded by
//     user agent (trace-press-test/*, puzzle-press-test/*, HeadlessChrome).
//   - Cloudflare Web Analytics (account-wide, 7 days): referrer, landing
//     path and device for requestHost tracepress.*. The page carries the
//     Puzzle Press beacon token; the host is what separates the two.
//   - Stripe: checkout sessions on the Trace Press Payment Link only. The
//     account is shared, and emails aren't printed.
//
// Usage: node scripts/traffic.mjs [hoursBack] [--ips]
//   --ips lists the addresses behind each beacon, to check with
//   `npm run who -- --trail <ip>` in app/ before calling one a person.
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const hours = Number(args.find((a) => /^\d+$/.test(a)) || 24);
const showIps = args.includes("--ips");
const creds = readFileSync(new URL("../../.git-credentials", import.meta.url), "utf8");
const get = (k) => (creds.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim();
const CF = get("CLOUDFLARE_API_TOKEN");
const ACCOUNT = get("CLOUDFLARE_ACCOUNT_ID");
const STRIPE = get("STRIPE_KEY");
const ZONE = "4169ea6b92a0920d72f9ebc5f7653e9d"; // bananafest-destiny.com, as in app/scripts/traffic.mjs
const HOST = "tracepress.bananafest-destiny.com";
const PAY_LINK_ID = "plink_1UL3wZRo6ix1hE5vuzRD7tSY";
const MINE = /trace-press-test|puzzle-press-test|HeadlessChrome/;
// The funnel, in order. Each is a real file in public/px/.
const RUNGS = [
  ["ran", "ran the page"],
  ["touched", "changed a control"],
  ["pager", "paged through the preview"],
  ["download", "pressed Download"],
  ["made", "got a PDF"],
  ["cover", "pressed Download cover"],
  ["covermade", "got a cover"],
  ["paper", "ran /handwriting-paper"],
  ["papertouched", "changed a paper control"],
  ["paperdownload", "pressed Download paper"],
  ["papermade", "got a paper PDF"],
  ["failed", "hit an error making any PDF"],
  ["pay", "opened the pay dialog"],
  ["checkout", "clicked through to Stripe"],
  ["verified", "unlocked"],
];
const iso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, "Z");
const since = iso(Date.now() - hours * 3600e3);

async function graphql(query) {
  const r = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { authorization: `Bearer ${CF}`, "content-type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const d = await r.json();
  if (d.errors) throw new Error(d.errors.map((e) => e.message).join("; "));
  return d.data;
}

console.log(`Trace Press, last ${hours}h (since ${since})`);

try {
  const z = await graphql(`query { viewer { zones(filter: {zoneTag: "${ZONE}"}) {
    httpRequestsAdaptiveGroups(limit: 5000, filter: {datetime_geq: "${since}", clientRequestHTTPHost: "${HOST}", clientRequestPath_like: "/px/%"}) {
      count dimensions { clientIP userAgent clientRequestPath }
    } } } }`);
  const rows = z.viewer.zones[0].httpRequestsAdaptiveGroups;
  const byRung = new Map();
  let tests = 0;
  for (const { dimensions: d } of rows) {
    if (MINE.test(d.userAgent || "")) { tests++; continue; }
    const name = d.clientRequestPath.replace(/^\/px\/|\.gif$/g, "");
    if (!byRung.has(name)) byRung.set(name, new Set());
    byRung.get(name).add(d.clientIP);
  }
  console.log(`\n  Funnel (distinct addresses; ${tests} beacon rows from my own tests left out):`);
  for (const [name, label] of RUNGS) {
    const ips = byRung.get(name) ?? new Set();
    console.log(`    ${String(ips.size).padStart(4)}  ${label}${showIps && ips.size ? `  — ${[...ips].join(", ")}` : ""}`);
  }
  const unknown = [...byRung.keys()].filter((k) => !RUNGS.some(([n]) => n === k));
  if (unknown.length) console.log(`    (unlisted beacon paths: ${unknown.join(", ")})`);
} catch (e) {
  console.log(`\n  (zone log unavailable: ${e.message.slice(0, 100)})`);
}

// The sample PDFs are fetched, not run, so no beacon: a crawler counts the
// same as a person here. Read the user agents (--ips) before calling it people.
try {
  const z = await graphql(`query { viewer { zones(filter: {zoneTag: "${ZONE}"}) {
    httpRequestsAdaptiveGroups(limit: 2000, filter: {datetime_geq: "${since}", clientRequestHTTPHost: "${HOST}", clientRequestPath_like: "/samples/%"}) {
      count dimensions { clientIP userAgent clientRequestPath }
    } } } }`);
  const rows = z.viewer.zones[0].httpRequestsAdaptiveGroups.filter((r) => !MINE.test(r.dimensions.userAgent || ""));
  const byFile = new Map();
  for (const { dimensions: d } of rows) {
    if (!byFile.has(d.clientRequestPath)) byFile.set(d.clientRequestPath, new Map());
    byFile.get(d.clientRequestPath).set(d.clientIP, d.userAgent);
  }
  console.log(`\n  Sample PDFs fetched (distinct addresses, crawlers included):${byFile.size ? "" : " none"}`);
  for (const [path, ips] of byFile) {
    console.log(`    ${String(ips.size).padStart(4)}  ${path}`);
    if (showIps) for (const [ip, ua] of ips) console.log(`          ${ip}  ${(ua || "").slice(0, 90)}`);
  }
} catch (e) {
  console.log(`\n  (sample log unavailable: ${e.message.slice(0, 100)})`);
}

try {
  const rumSince = iso(Date.now() - 7 * 86400e3);
  const r = await graphql(`query { viewer { accounts(filter: {accountTag: "${ACCOUNT}"}) {
    rumPageloadEventsAdaptiveGroups(limit: 500, filter: {datetime_geq: "${rumSince}", bot: 0, requestHost: "${HOST}"}) {
      count avg { sampleInterval } dimensions { requestPath refererHost deviceType countryName }
    } } } }`);
  const rows = r.viewer.accounts[0].rumPageloadEventsAdaptiveGroups;
  const total = rows.reduce((a, x) => a + x.count, 0);
  const tally = (pick) => {
    const m = new Map();
    for (const x of rows) m.set(pick(x.dimensions) || "(none)", (m.get(pick(x.dimensions) || "(none)") ?? 0) + x.count);
    return [...m].sort((a, b) => b[1] - a[1]);
  };
  console.log(`\n  Last 7 days by the page beacon: ${total} page loads (Cloudflare's bot filter; my headless tests are NOT excluded here)`);
  if (rows.some((x) => (x.avg?.sampleInterval ?? 1) !== 1)) console.log("    (SAMPLED: estimates, not counts. Run again.)");
  console.log("    Referred by:");
  for (const [h, n] of tally((d) => d.refererHost).slice(0, 10)) console.log(`      ${String(n).padStart(4)}  ${h === "(none)" ? "(no referer: typed, bookmarked, or opened in an app)" : h}`);
  console.log(`    Landed on: ${tally((d) => d.requestPath).slice(0, 6).map(([k, n]) => `${k} ${n}`).join(", ")}`);
  console.log(`    Device: ${tally((d) => d.deviceType).map(([k, n]) => `${k} ${n}`).join(", ")}`);
} catch (e) {
  console.log(`\n  (web analytics unavailable: ${e.message.slice(0, 100)})`);
}

try {
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions?payment_link=${PAY_LINK_ID}&limit=100`, {
    headers: { authorization: `Bearer ${STRIPE}` },
  });
  const j = await res.json();
  if (j.error) throw new Error(j.error.message);
  const paid = j.data.filter((s) => s.payment_status === "paid");
  console.log(`\n  Stripe, Trace Press link, all time: ${j.data.length} checkout session(s), ${paid.length} paid${j.has_more ? " (more than 100; first page only)" : ""}`);
  for (const s of j.data.slice(0, 10)) {
    console.log(`    ${iso(s.created * 1000)}  ${s.status}/${s.payment_status}  ${(s.amount_total / 100).toFixed(2)} ${s.currency.toUpperCase()}`);
  }
} catch (e) {
  console.log(`\n  (Stripe unavailable: ${e.message.slice(0, 100)})`);
}
