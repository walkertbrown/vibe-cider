// The KDP description (src/ui/listing.js): it says only what the book has,
// fits KDP's 4,000-character box, and says nothing about quality.
import { test } from "node:test";
import assert from "node:assert/strict";
import { listingText, LISTING_MAX } from "../src/ui/listing.js";
import { THEMES } from "../src/generator/wordlists.js";

const b = { puzzles: 50, pages: 70, perPage: 4, notes: 4, trimLabel: "8.5 × 11 in" };
const CLAIMS = /\b(best|perfect|fun|great|ideal|relaxing|challenging|hours|brain|amazing|new)\b/i;

test("the description names what is in the book and nothing else", () => {
  for (const kind of ["wordsearch", "sudoku", "maze", "crisscross", "crossword"])
    for (const difficulty of ["easy", "medium", "hard", "graded"]) for (const largePrint of [false, true]) {
      const s = { kind, title: "T", subtitle: "", difficulty, largePrint, wordsPerPuzzle: 15, size: 9, pools: [THEMES.animals ?? Object.values(THEMES)[0]] };
      const t = listingText(s, b), at = `${kind} ${difficulty} ${largePrint}`;
      assert.ok(t.length <= LISTING_MAX, at);
      assert.doesNotMatch(t, CLAIMS, at);
      assert.match(t, /^T\n50 /, at);
      assert.match(t, /70 pages, 8\.5 × 11 in/, at);
      assert.match(t, /Solutions to every puzzle at the back, 4 to a page/, at);
      assert.equal(/Large print/.test(t), largePrint, at);
      assert.equal(/easiest puzzles at the front/.test(t), difficulty === "graded", at);
      assert.equal(/Theme/.test(t), !["sudoku", "maze"].includes(kind), at);
      assert.equal(/backwards too/.test(t), kind === "wordsearch" && difficulty === "hard", at);
      assert.equal(/exactly one solution/.test(t), kind === "sudoku", at);
      assert.equal(/Across and Down/.test(t), kind === "crossword", at);
    }
  assert.match(listingText({ kind: "sudoku", title: "S", subtitle: "Kids", size: 6, pools: [] }, b), /^S: Kids\n[\s\S]*6 × 6 grids/);
  assert.match(listingText({ kind: "maze", title: "M", pools: [] }, { ...b, puzzles: 1, perPage: 1 }), /1 maze puzzle, one to a page[\s\S]*one to a page\./);
});
