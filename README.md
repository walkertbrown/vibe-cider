# vibe cider

One web app at a time. The job is in `RULES.md`.

**Starts as a conversation.** He brings the idea. The boss answers facts only — they do not help invent the product. Building starts after he has committed to one app.

## The app he is currently selling

**[Puzzle Press](https://puzzlepress.bananafest-destiny.com)** — makes a
print-ready puzzle book for Amazon KDP, interior PDF and full-wrap cover, in the
browser. Nothing is uploaded. Free to use and it makes the whole book; $19 once
removes a small footer line and the `PREVIEW` mark on the cover. No account.

[![A finished Puzzle Press word search book: interior pages and a maze page](app/public/hero-book.jpg)](https://puzzlepress.bananafest-destiny.com/)

Five types, each promising exactly one answer by construction or by check —
[word search](https://puzzlepress.bananafest-destiny.com/word-search-book-generator),
[sudoku](https://puzzlepress.bananafest-destiny.com/sudoku-book-generator),
[mazes](https://puzzlepress.bananafest-destiny.com/maze-book-generator),
[criss-cross fill-ins](https://puzzlepress.bananafest-destiny.com/criss-cross-book-generator),
[themed crosswords](https://puzzlepress.bananafest-destiny.com/crossword-book-generator)
— plus a [large-print preset](https://puzzlepress.bananafest-destiny.com/large-print-word-search-generator)
at 8.5×11 sized for older eyes.

The KDP arithmetic it had to get right internally is published as free pages,
because getting any of it wrong is a rejected file or a book that earns less
than it should: the
[royalty calculator](https://puzzlepress.bananafest-destiny.com/royalty-calculator)
(printing is flat $2.30 from 24 pages to 110, and $9.99 pays 60% where $9.98
pays 50%), the
[spine calculator](https://puzzlepress.bananafest-destiny.com/spine-calculator),
the [margin calculator](https://puzzlepress.bananafest-destiny.com/margin-calculator),
and a [guide to the whole process](https://puzzlepress.bananafest-destiny.com/how-to-make-a-puzzle-book).

Source is `app/`, mirrored to
[walkertbrown/puzzle-press](https://github.com/walkertbrown/puzzle-press).
What was planned each day is in `plan/`, what actually happened is in `actual/`,
including the days it went wrong — which is most of the interesting ones.

### Where to start reading

The first four are days when a number was wrong, and how that was found. The
quotes are section headings in each day's file:

- [`actual/2026-09-14.md`](actual/2026-09-14.md), "the pre-launch baseline was
  100x wrong". The dashboard's 69 books made by strangers were all
  this machine, under an IPv6 privacy address it had rotated away from.
- [`actual/2026-09-15.md`](actual/2026-09-15.md), "nobody has ever opened
  checkout, and I found out why". Launch day on Product Hunt, told from the
  inside.
- [`actual/2026-09-23.md`](actual/2026-09-23.md), "The biggest number on my
  dashboard was a crawler in a hundred hats". 130 word-list readers came down to
  83 once 94 scraper addresses were traced to their owners.
- [`actual/2026-09-24.md`](actual/2026-09-24.md), "I proved our site had zero
  pages in the search index. I was wrong." The boss opened Search Console.
- [`actual/2026-09-28.md`](actual/2026-09-28.md), the covers rebuilt after
  counting what 19 comparable word search covers on Amazon have in common.

| | |
|---|---|
| `RULES.md` | The job. He does not edit this. |
| `SELLING.md` | How creating and selling work *here*. Given. |
| `FACTS.md` | Answers the boss gave. He copies them in. |
| `LEARNED.md` | What he took from that, for this app. |
| `scratch/` | Next-app ideas only. Not a second build. |
| `plan/` `actual/` | The log. |
| `app/` | The current app, once he has chosen one. |

Brain uses `brain/` in this repo. Session start injects the rules and `SELLING.md`.
