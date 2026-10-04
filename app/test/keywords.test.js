// The seven KDP keyword phrases (src/ui/keywords.js): seven, no repeats,
// nothing already in the title or subtitle, nothing KDP asks you to leave out,
// and only what the book has (help G201298500).
import { test } from "node:test";
import assert from "node:assert/strict";
import { keywordsFor, KEYWORDS } from "../src/ui/keywords.js";
import { THEMES } from "../src/generator/wordlists.js";

const BANNED = /\b(best|bestseller|new|free|top|amazon|kindle|kdp|sale|award|#1)\b|["“”]/i;

test("seven phrases, no repeats, none in the title, nothing KDP asks you to avoid", () => {
  const titles = ["Word Search", "Crossword Puzzle Book", "Sudoku Puzzle Book", "Large Print Word Search", "Maze Book", "Criss Cross Puzzle Book"];
  for (const kind of ["wordsearch", "sudoku", "maze", "crisscross", "crossword"])
    for (const title of titles) for (const largePrint of [false, true]) for (const difficulty of ["easy", "medium", "hard", "graded"])
      for (const pools of [[], [THEMES.animals || Object.values(THEMES)[0]], Object.values(THEMES).slice(0, 3)]) for (const size of [4, 6, 9]) {
        const s = { kind, title, subtitle: "Puzzles with Solutions", largePrint, difficulty, pools, size };
        const k = keywordsFor(s), at = JSON.stringify({ kind, title, largePrint, difficulty, size, pools: pools.length });
        assert.equal(k.length, KEYWORDS, at);
        assert.equal(new Set(k).size, k.length, at);
        for (const p of k) {
          assert.ok(!`${title} ${s.subtitle}`.toLowerCase().includes(p.toLowerCase()), `${at}: "${p}" is in the title`);
          assert.doesNotMatch(p, BANNED, at);
          assert.ok(p.length <= 50, at);
          if (!largePrint) assert.doesNotMatch(p, /large print/, at);
          if (difficulty !== "graded") assert.doesNotMatch(p, /easy to hard/, at);
          if (kind !== "sudoku") assert.doesNotMatch(p, /sudoku/, at);
        }
      }
});

test("a theme in the book is named; a sudoku or maze book gets no word theme", () => {
  const pools = [{ title: "Bible & Scripture" }, { title: "My Words" }];
  assert.ok(keywordsFor({ kind: "wordsearch", pools }).includes("bible and scripture word search"));
  assert.ok(!keywordsFor({ kind: "wordsearch", pools }).some((p) => /my words/.test(p)));
  assert.ok(!keywordsFor({ kind: "maze", pools }).some((p) => /bible/.test(p)));
  assert.ok(keywordsFor({ kind: "sudoku", size: 6 }).includes("6x6 sudoku for kids"));
  assert.ok(!keywordsFor({ kind: "sudoku", size: 9 }).some((p) => /kids/.test(p)));
});
