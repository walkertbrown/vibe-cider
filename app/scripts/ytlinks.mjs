// Which of the channel's Shorts carry a Related video link, and to which long
// video. A Short's description can't hold a clickable link; the Related video
// bar under its title can, and only the boss can set it, in YouTube Studio.
// This reads the public pages, so it checks that work without asking.
//
// The Shorts list comes from the channel's Shorts tab, not a typed-out list, so
// a new Short shows up here the day it posts. A linked Short's page names its
// long video's ID; an unlinked one names neither (checked 10-15 both ways:
// Qb3LZ-1aG1s linked to Puzzle Press, s3yeFA88v-E to Trace Press,
// W6RQSZvffMY not yet).
//
//   node scripts/ytlinks.mjs
const CHANNEL = "https://www.youtube.com/@BananafestDestinyDev/shorts";
const LONG = { ph6q2ih6cBs: "Puzzle Press", lnrBt6qFtw8: "Trace Press" };
// Shorts on the channel that belong to neither app.
const NOT_OURS = /Bulkhead|starship|Hector/i;
// Which long video each Short should point at, from words in its title.
const APP_BY_TITLE = (t) => (/tracing|cursive|handwriting|alphabet|letter|sight word|strokes|capitals|lowercase|pencil|print minimums/i.test(t) ? "Trace Press" : "Puzzle Press");

const get = (url) => fetch(url, { headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/145 Safari/537.36", "accept-language": "en" } }).then((r) => r.text());

const tab = await get(CHANNEL);
const shorts = new Map();
for (const m of tab.matchAll(/"accessibilityText":"((?:[^"\\]|\\.)*?), [\d,.]+[KM]? views? - play Short".{0,4000}?"videoId":"([A-Za-z0-9_-]{11})"/g)) {
  if (!shorts.has(m[2])) shorts.set(m[2], JSON.parse(`"${m[1]}"`));
}
if (!shorts.size) { console.error("Read no Shorts from the channel tab: YouTube changed its page, so this check is blind."); process.exit(1); }

let linked = 0, wrong = 0, missing = [];
const rows = [];
for (const [id, title] of shorts) {
  if (NOT_OURS.test(title)) continue;
  const page = await get(`https://www.youtube.com/shorts/${id}`);
  const to = Object.keys(LONG).filter((v) => page.includes(v)).map((v) => LONG[v]);
  const want = APP_BY_TITLE(title);
  const mark = !to.length ? "  not linked" : to.includes(want) ? "  linked    " : "  WRONG     ";
  if (!to.length) missing.push(id); else if (to.includes(want)) linked++; else wrong++;
  rows.push(`${mark}  ${id}  ${want.padEnd(12)}  ${to.length && !to.includes(want) ? `(points at ${to.join(", ")})  ` : ""}${title.slice(0, 70)}`);
}
console.log(rows.sort().join("\n"));
// The tab's first page holds about 30 Shorts; past that the oldest drop off.
if (shorts.size >= 30) console.log("\nThe Shorts tab may be showing only its first page; older Shorts can be missing from this list.");
console.log(`\n${linked} linked, ${missing.length} not linked${wrong ? `, ${wrong} linked to the other app's video` : ""}, of ${rows.length} Shorts of ours.`);
