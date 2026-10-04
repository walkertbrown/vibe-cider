// A description for the book's Amazon listing, written from the book itself,
// for KDP's Description box (4,000 characters, help topic G201189630). Plain
// text, so it pastes as it is. Every sentence is something on the pages:
// the generators' own rules (one solution per sudoku, a single path through
// each maze, the word search directions per difficulty), the page plan, and
// what the person ticked. Nothing about the reader and nothing about quality.
export const LISTING_MAX = 4000;

const NOUN = { wordsearch: "word search", sudoku: "sudoku", maze: "maze", crisscross: "criss-cross fill-in", crossword: "crossword" };
const HARDEST = { wordsearch: "hard", sudoku: "expert", maze: "expert", crisscross: "expert", crossword: "expert" };
const WS_DIRS = {
  easy: "Words run across and down only.",
  medium: "Words run across, down and diagonally, never backwards.",
  hard: "Words run in all eight directions, backwards too.",
};
const list = (a) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a.at(-1));

// s: settings(); b: { puzzles, pages, perPage, notes, trimLabel }
export function listingText(s, b) {
  const kind = NOUN[s.kind] ? s.kind : "wordsearch";
  const n = b.puzzles;
  const themes = kind === "sudoku" || kind === "maze" ? [] : (s.pools || []).map((p) => p.title).filter(Boolean);
  const inside = [];
  if (kind === "wordsearch") inside.push(`Each puzzle prints its word list on the page, up to ${s.wordsPerPuzzle} words.`);
  if (kind === "sudoku") inside.push(`${s.size || 9} × ${s.size || 9} grids. Every puzzle has exactly one solution.`);
  if (kind === "maze") inside.push("Each maze is marked start and end, with exactly one path between them.");
  if (kind === "crisscross") inside.push("Each grid comes with the words that fill it, grouped by length. No clues: the puzzle is working out where each word goes.");
  if (kind === "crossword") inside.push("Each grid has numbered Across and Down clues.");
  if (themes.length) inside.push(`Theme${themes.length === 1 ? "" : "s"}: ${list(themes)}.`);
  if (s.difficulty === "graded") inside.push(`Graded: the easiest puzzles at the front, ${HARDEST[kind]} at the back.`);
  else if (s.difficulty) inside.push(`Difficulty: ${s.difficulty}.`);
  if (kind === "wordsearch" && WS_DIRS[s.difficulty]) inside.push(WS_DIRS[s.difficulty]);
  if (s.largePrint) inside.push("Large print: 16 point and up, the answers too.");
  inside.push(`Solutions to every puzzle at the back, ${b.perPage === 1 ? "one" : b.perPage} to a page.`);
  if (b.notes) inside.push(`${b.notes} ruled Notes pages at the end.`);
  const lines = [
    s.subtitle ? `${s.title}: ${s.subtitle}` : s.title,
    `${n} ${NOUN[kind]} puzzle${n === 1 ? "" : "s"}, one to a page. ${b.pages} pages, ${b.trimLabel}.`,
    "Inside:",
    ...inside.map((t) => `- ${t}`),
  ];
  return lines.filter(Boolean).join("\n").slice(0, LISTING_MAX);
}
