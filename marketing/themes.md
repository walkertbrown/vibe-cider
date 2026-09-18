# Hyper-specific themes — spec

Prompted by the boss, 2026-09-16, after the funnel review: "have we considered
more themes? Like hyper specific stuff?" Researched before writing anything —
sources at the bottom.

## What we have now

32 word-list themes in `app/src/generator/wordlists.js`, each with its own
landing page under `public/word-lists/`: Animals, Food & Cooking, Travel &
Places, Garden & Nature, Under the Sea, Space, Christmas, Sports, Music, In
the Kitchen, Halloween, Thanksgiving, Easter, Valentine's Day, Birthdays,
Weddings, American States, On the Farm, Dinosaurs, Camping, Fishing, Cars &
Driving, Weather, Jobs & Careers, School Days, New Baby, Coffee & Tea,
Birdwatching, Flowers, Desserts, Games Night, At the Beach.

These are broad categories. A few (Birdwatching, New Baby, Weddings) are
already reasonably specific; most (Animals, Food, Sports, Space) are the kind
of generic theme every competing generator also has.

## What the research says

Consistent across every source: **generic themes are saturated; the theme has
to describe a specific buyer in one sentence, or it isn't a niche yet.**
"Word search for seniors" is a theme. "Large-print word search for a retired
gardener whose adult kids are buying her a gift" is a niche — and that
audience does not compete with the generic listing at all.

Recurring winning patterns across every article:

1. **Profession-specific** — nurses, teachers, truckers, retail, trades.
   Vocabulary the audience uses at work; they buy because it names them.
2. **Faith-based** — Bible/Scripture word search, sold through church
   communities and Bible-study gift-giving, not general search.
3. **Nostalgia by decade** — 1970s/80s/90s slang and pop culture, sold to an
   older buyer remembering their own decade, not a kid's.
4. **Large print for seniors** — cited in every source as the single most
   dependable puzzle-book category on KDP. Buyers are usually adult children
   buying a gift. **Corrected 2026-09-16: we already have this.** `main.js`
   ships a one-click "Large print" checkbox (`el.largePrint`, added
   2026-09-14, commit `485ac7f`) that presets 8.5×11 trim, automatic grid
   size, and 14 words/puzzle — measured at 18–25pt letters. It's referenced
   throughout the guide, royalty calculator, and index copy already. I first
   wrote this section claiming it didn't exist; that was a bad grep (I
   searched for `fontSize`/`cellSize` variable names and it's implemented as
   grid-density + trim instead, so I missed it). What's actually still
   missing, confirmed by reading the code:
   - The preset only applies to word search — `el.largePrint` is force-
     unchecked and disabled the moment `kind !== "wordsearch"` (`main.js`
     line 156), even though the sudoku page's own copy talks about large
     print at 8.5×11 as if it's available there too. A buyer can still pick
     8.5×11 manually for sudoku/crossword/maze, just not via the preset.
   - No cover treatment. `src/pdf/cover.js` has no "LARGE PRINT" badge or
     auto-text — the one convention every KDP guide names as the actual
     keyword-and-click driver on the thumbnail. A user can type "Large
     Print" into their own title, but nothing does it for them.
   - No dedicated landing page. We have type pages (`/word-search-book-
     generator`) and theme pages (`/word-lists/*`), but nothing at, say,
     `/large-print-word-search-generator` to catch that exact search term —
     which our own guide quotes as *the* example of a good hyper-specific
     title ("Large Print Word Search for Seniors").
5. **Hobby micro-niches** — birdwatching (already have it), fishing (already
   have it), gardening (already have it, but generic — "Garden & Nature" vs.
   a rose-gardener specifically), quilting, knitting, golf, RVing.
6. **State-specific, not "American States"** — the existing theme is one word
   list naming all 50 states. The niche version is 50 separate books, each
   with that one state's cities, landmarks, and nicknames — a Texan buys
   "Texas Word Search," not "all 50 states." Different product, same effort
   pattern as any other theme, just multiplied by 50.
7. **Recovery / memory-care puzzles** — simpler grids, larger print, sold to
   caregivers rather than the puzzle-doer. A positioning and difficulty
   choice more than a word-list one.
8. **Age-banded kids** — not a new theme, a labeling fix: "Ages 4-6" instead
   of "Kids," on themes we already have (Animals, Space, Farm, Dinosaurs).

## Gap analysis — what's cheap vs. what's real product work

**Cheap (word list + landing page only, same pattern as the 32 we have):**
nursing/medical, teaching, trucking, Bible/Scripture, decade nostalgia
(70s/80s/90s separately), quilting, knitting, golf, wine, RVing, individual
state pages (reusing the 50-state data we'd need to source once).

**Real product work, not just content:**
- **Large print, finishing it** — the core preset exists; what's left is
  extending it to the other puzzle kinds, adding a cover badge, and giving
  it a landing page of its own. Smaller than "build large print from
  scratch," but still not just a word list.
- **State-specific done right** — a generic "Texas" word list of city names
  is weak; a good one needs real per-state content (landmarks, nicknames,
  local terms), which is 50x the research of one normal theme, not free.
- **Recovery/memory-care** — needs an easier difficulty preset and probably
  its own grid-density ceiling; the word list itself is the easy part.

## Recommendation (not yet built — spec only, per the boss's ask)

1. **Finish large print, don't rebuild it.** The preset already exists for
   word search; the gap is a cover badge, a dedicated landing page (the
   exact phrase our own guide already recommends: "Large Print Word Search
   for Seniors"), and — lower priority — extending the preset to sudoku,
   since large-print sudoku is named in the research too. Small, and closes
   out the one niche every source ranks above all others. **Done 2026-09-18**:
   cover badge (`drawLargePrintBadge` in `src/pdf/cover.js`) and the
   dedicated landing page at `/large-print-word-search-generator` are both
   built and tested. Sudoku extension not started — still lower priority,
   and doing it right means measuring actual rendered digit size the same
   way the word-search figures were measured, not assuming a bigger trim
   is automatically "large print."
2. **Add profession + faith themes next** — cheapest tier, matches the
   research's most-cited winners, and directly reachable: nurses, teachers,
   truckers, and Bible/Scripture are all named repeatedly and none of them
   need new product capability, only word lists and a landing page.
   **Done 2026-09-18**: four new themes added — `nursing` (59 words),
   `teaching` (57 words), `trucking` (59 words), `faith` (53 words, titled
   "Bible & Scripture") — each with genuine domain vocabulary, not the
   generic existing "jobs" theme, plus hand-written non-leaking clues for
   every word not already covered by an existing theme's clue. Theme count
   32 → 36, clue table 1,460 → 1,638. Landing pages, sitemap entries, and
   share cards generated for all four; all copy with hardcoded counts
   (index.html, marketing docs, word-list-pages.mjs) updated to match, and
   `test/copy.test.js`'s dynamic count check confirms no stale numbers
   remain. 93/93 tests pass.
3. **State-specific is high-effort, high-count (50 pages)** — worth doing,
   but only after item 1, since "Large Print Texas Word Search" is a
   stronger listing than either piece alone. **First batch done 2026-09-18**:
   15 of 50 states shipped — the 15 most populous (California, Texas,
   Florida, New York, Pennsylvania, Illinois, Ohio, Georgia, North Carolina,
   Michigan, New Jersey, Virginia, Washington, Arizona, Massachusetts).
   Each list is genuine per-state content — capital, largest city, nickname,
   state bird/flower/tree, and iconic single-word landmarks/symbols — fact-
   checked (not vibed) via parallel research, with two real corrections
   caught in verification: Pennsylvania's state tree is Eastern Hemlock, not
   white pine (a search engine's own AI summary got this wrong first);
   Florida's largest city is Jacksonville, not Miami. Every shared word
   across states (liberty, hemlock, amish, oak, dogwood, tobacco) got one
   state-neutral clue rather than a duplicate key. Theme count 36 → 51,
   clue table 1,638 → 1,797, word count 1,888 → 2,095. Landing pages,
   sitemap entries, and share cards generated for all 15; all copy with
   hardcoded counts updated to match. 93/93 tests pass. Remaining ~35 states
   are a future batch, same pattern.
4. Decade nostalgia and hobby micro-niches (quilting, knitting, golf, wine)
   are good filler additions once the above are done — same cheap pattern,
   lower individual priority than profession/faith. **Decade lists need a
   verification pass before publishing, not just generation.** Boss caught
   the risk directly: "the last thing you want to talk about is Nirvana in
   an 80s puzzle" — Nirvana broke mainstream in 1991, not the 80s. A
   nostalgia buyer knows their decade specifically; one wrong entry reads as
   the whole list being AI-guessed rather than real, which is the opposite
   of what this niche is selling. Every word/name/reference in a decade list
   has to be checked against an actual date (chart date, release date, event
   date), not pattern-matched by "feels like that decade." This is a
   real per-word verification step, not free the way a themed word list
   normally is — factor it into the effort estimate for this item.

## Sources

- [Best Puzzle Book Niches for Amazon KDP — KDP Builder](https://kdpbuilder.com/blog/best-puzzle-book-niches)
- [Word Search Puzzle Books on KDP: 2026 Market Data — KDP Easy](https://www.kdpeasy.com/niches/word-search-puzzles)
- [24 Best KDP Niches for 2026 — KDP Builder](https://kdpbuilder.com/blog/best-kdp-niches-2026)
- [9 Highly Profitable Amazon KDP Niche Ideas 2026 — Low Content Profits](https://lowcontentprofits.com/low-content-book-niches-kdp/)
- [20 Most Profitable Niches for Low-Content Books — Automateed](https://www.automateed.com/profitable-niches-for-low-content-books)
