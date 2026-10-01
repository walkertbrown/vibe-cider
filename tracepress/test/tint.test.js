// KDP's print floor for fills and lines is a 10% tint: anything paler may not
// print. The guide tells sellers that, so every mark Trace Press puts on an
// interior page, free or paid, has to be at least that dark. White is allowed
// only as the numbers inside the start discs, which sit on a dark disc.
import { test } from "node:test";
import assert from "node:assert/strict";
import { planBook } from "../src/pdf/plan.js";
import { pageInk, WHITE } from "../src/pdf/ink.js";
import { readFileSync } from "node:fs";
import fontkit from "@pdf-lib/fontkit";
import { cursiveWidth } from "../src/pdf/cursive.js";

const cursive = fontkit.create(readFileSync(new URL("../public/fonts/PlaywriteUSTrad.ttf", import.meta.url)));
const measure = (text, unit) => cursiveWidth(cursive, text, unit);

// Tint as print sees it: 0 is paper, 1 is solid black.
const tint = ([r, g, b]) => 1 - (0.299 * r + 0.587 * g + 0.114 * b);

test("every mark on every interior page is at least a 10% tint", () => {
  const opts = { lines: true, numbers: true, words: "the,and,go", belongs: true };
  const pages = [...planBook(opts).pages, ...planBook({ ...opts, script: "cursive", measure }).pages];
  for (const licensed of [false, true]) for (const [i, page] of pages.entries()) {
    for (const s of pageInk(page, { licensed, cursive })) {
      if (s.kind === "text" && s.color === WHITE) continue;
      assert.ok(tint(s.color) >= 0.1, `page ${i + 1} ${s.kind} ${s.color} is ${(tint(s.color) * 100).toFixed(0)}%`);
    }
  }
});
