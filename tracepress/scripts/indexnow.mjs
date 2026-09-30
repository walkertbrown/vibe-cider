// Tell Bing/Yandex/Seznam/Naver about every URL in the sitemap right away,
// instead of waiting for them to crawl and discover it on their own schedule.
// No account needed — IndexNow verifies ownership by fetching a key file we
// host at the domain root, then treats the submission as authoritative.
// Google does not participate in IndexNow, so this does not touch Google;
// that needs the Search Console sitemap (the boss has it). It is a
// real, zero-cost channel for the engines that do.
//
// Copied from app/scripts/indexnow.mjs, with its own key file in public/.
// Usage: npm run indexnow (after a deploy that changed the sitemap)
import { readFileSync } from "node:fs";

const HOST = "tracepress.bananafest-destiny.com";
const KEY = "26d018fea595f59cb6527a6af8de79a6";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

// Verify our own key file is actually live before telling anyone to fetch it.
const keyCheck = await fetch(KEY_LOCATION);
const keyBody = (await keyCheck.text()).trim();
if (!keyCheck.ok || keyBody !== KEY) {
  console.error(`Key file not verifiable at ${KEY_LOCATION} (status ${keyCheck.status}, body "${keyBody}") — deploy it before submitting.`);
  process.exit(1);
}

const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const urlList = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
if (!urlList.length) {
  console.error("No <loc> entries found in sitemap.xml.");
  process.exit(1);
}

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
});
const body = await res.text();
console.log(`Submitted ${urlList.length} URLs — HTTP ${res.status} ${res.statusText}${body ? `: ${body}` : ""}`);
// 200/202 = accepted. IndexNow gives no per-URL confirmation of when or
// whether each engine actually crawls it — this only proves the submission
// itself was accepted.
