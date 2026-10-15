// Trace Press quotes printing costs from its own copy of Puzzle Press's rate
// table, so it builds as a standalone repository. In the monorepo, the two
// copies must match, or the two apps would quote different prices.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { printingCost } from "../src/pdf/kdp-cost.js";

const mine = new URL("../src/pdf/kdp-cost.js", import.meta.url);
const theirs = new URL("../../app/src/pdf/kdp-cost.js", import.meta.url);

test("the rate table matches Puzzle Press's", { skip: !existsSync(theirs) && "not in the monorepo" }, () => {
  assert.equal(readFileSync(mine, "utf8"), readFileSync(theirs, "utf8"));
});

test("an 8.5 x 11 black-ink book prints flat to 110 pages", () => {
  assert.deepEqual([24, 110, 112].map((pages) => printingCost({ trim: "8.5x11", pages, ink: "black" }).cost), [2.84, 2.84, 2.9]);
  assert.equal(printingCost({ trim: "8.5x11", pages: 60, ink: "black" }).flatMax, 110);
});
