// A page that says "submit by Tuesday 27 October" is advice until that day and
// wrong after it. Every "Weekday D Month" date on a page must name the right
// weekday, and must not be in the past (Central time), so a passed deadline
// stops the next deploy until the sentence is rewritten.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";

const root = new URL("../public/", import.meta.url);
const files = (dir) => readdirSync(dir).flatMap((f) => {
  const u = new URL(f, dir);
  return statSync(u).isDirectory() ? files(new URL(f + "/", dir)) : f.endsWith(".html") ? [u] : [];
});
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const RE = new RegExp(`(${DAYS.join("|")}),? (\\d{1,2}) (${MONTHS.join("|")})(?: (\\d{4}))?`, "g");
// No year written: October to December is this season (2026), January to September the next.
const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });

test("every weekday-dated deadline on a page is right and not yet past", () => {
  for (const u of files(root)) {
    const text = readFileSync(u, "utf8");
    for (const [phrase, day, d, month, y] of text.matchAll(RE)) {
      const m = MONTHS.indexOf(month);
      const year = y ? +y : m >= 9 ? 2026 : 2027;
      const date = new Date(Date.UTC(year, m, +d));
      const where = `${u.pathname.split("/public/")[1]}: "${phrase}"`;
      assert.equal(DAYS[date.getUTCDay()], day, `${where} is not a ${day}`);
      assert.ok(date.toISOString().slice(0, 10) >= today, `${where} has passed; rewrite the sentence`);
    }
  }
});
