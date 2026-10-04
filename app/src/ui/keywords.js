// The seven keyword boxes on KDP's Book Details page, filled from what is in
// the book. KDP's own rule (help G201298500): "Use up to seven keywords or
// short phrases", and leave out what is already in the title or subtitle,
// quality claims ("best"), time-sensitive words ("new"), quotation marks,
// brand names and program names. Every phrase here names a puzzle type, a
// theme, a size or a difficulty the book really has — nothing about the
// reader, nothing about how good it is.
export const KEYWORDS = 7;

const KIND = {
  wordsearch: { noun: "word search", base: ["word search puzzle book", "word find book", "word search puzzles with solutions", "find a word puzzles", "hidden word puzzles", "word search activity book", "circle the word puzzles", "letter grid word puzzles", "word hunt puzzles"] },
  sudoku: { noun: "sudoku", base: ["sudoku puzzle book", "sudoku puzzles with solutions", "number puzzle book", "logic puzzle book", "sudoku activity book", "sudoku grids with answers", "number logic puzzles", "pencil and paper number puzzles", "fill the grid number puzzles"] },
  maze: { noun: "maze", base: ["maze book", "mazes with solutions", "maze puzzle book", "labyrinth puzzles", "maze activity book", "pencil maze puzzles", "find the way out mazes", "maze puzzles with answers", "start to finish mazes", "printed maze puzzles"] },
  crisscross: { noun: "criss cross", base: ["criss cross puzzle book", "word fill in puzzles", "word fill in puzzle book", "criss cross word puzzles", "fill in puzzles with solutions", "word placement puzzles", "word grid fill in puzzles", "fit the words puzzles", "no clue word puzzles"] },
  crossword: { noun: "crossword", base: ["crossword puzzle book", "crossword puzzles with answers", "crosswords with clues", "word puzzle book", "crossword activity book", "clue and answer puzzles", "fill the grid crosswords", "crossword puzzles with solutions", "pencil crossword puzzles", "across and down clue puzzles"] },
};

const themeWords = (t) => t.toLowerCase().replace(/\s*&\s*/g, " and ").replace(/\s+/g, " ").trim();

export function keywordsFor(s) {
  const k = KIND[s.kind] || KIND.wordsearch;
  const out = [];
  if (s.largePrint) out.push(`large print ${k.noun}`, `large print ${k.noun} book`);
  if (s.kind === "sudoku" && s.size && s.size !== 9) out.push(`${s.size}x${s.size} sudoku for kids`, `${s.size} by ${s.size} sudoku puzzles`);
  if (s.difficulty === "graded") out.push(`easy to hard ${k.noun} puzzles`);
  else if (s.difficulty && s.difficulty !== "medium") out.push(`${s.difficulty} ${k.noun} puzzles`);
  if (s.kind !== "sudoku" && s.kind !== "maze") {
    for (const p of s.pools || []) {
      if (!p.title || p.title === "My Words") continue;
      out.push(`${themeWords(p.title)} ${k.noun}`);
    }
  }
  out.push(...k.base);
  const have = `${s.title || ""} ${s.subtitle || ""}`.toLowerCase();
  const seen = new Set();
  return out
    .map((p) => p.replace(/["“”]/g, "").slice(0, 50).trim())
    .filter((p) => p && !have.includes(p.toLowerCase()) && !seen.has(p) && seen.add(p))
    .slice(0, KEYWORDS);
}
