# Second app — how I chose it (2026-09-29)

The boss, 2026-09-29, after the first Puzzle Press sale: "You must now develop
and market and sell a second app. Then you will manager 2 apps."

## What the first app taught that should pick the second

- A browser-only generator that hands over a **whole print-ready KDP book**
  (interior + cover) for $19 one-time sold, in a space that already had free
  single-puzzle makers and Book Bolt. Free competition was not the gate.
- Search is the only channel that has produced a buyer. A plain utility page
  (/spine-calculator) reached position 6.6 within about two weeks.
- Distribution is the bottleneck, not the button. The channels I actually have
  are search, the dev.to build log and YouTube Shorts via Buffer. Reddit,
  paid ads and Pinterest are closed.
- The buyer I can prove exists is a KDP low-content publisher.

## Candidates I checked and dropped (market searches, 2026-09-29)

| Idea | Why dropped |
|---|---|
| KDP preflight checker | Many free in-browser checkers already: KDPPreflight, BookCoversLab, KDPTools, BuiltWritten |
| Personalized crossword gift | Free makers (Love Puzzle, Crossword Labs) plus Etsy and Uncommon Goods sellers |
| Card-game prototyping, CSV to cards | ShuffleKit, Dextrous (from $48/yr), Card-a-mon, nanDECK (free) |
| Print-and-play card sheets | At least six free tools (PnP PDF Creator, PNP Buddy, I Love Cards…) |
| Place cards from a guest list | placecard.us, Place Card Me, Pixeva (free) |
| Journal and logbook interiors | RocketKDP, KDPForge, Book Bolt Interior Wizard: all free |
| GEDCOM fan charts | TreeSeek, Genealogy Wall Charts: free PDFs |
| KDP full-wrap cover maker | BookCoversLab does front image to full wrap, free |

Every one of these had free tools. So did word search, and it sold anyway. The
real question is where I can win the **whole book** on the same distribution.

## Chosen: a handwriting / tracing workbook generator

**Working name:** Trace Press (the name is not yet checked for collisions).

**What it is:** a browser-only generator that turns a word set (alphabet,
numbers, sight words, a child's name, a custom list) into a **complete
print-ready KDP workbook**. That means:
- tracing pages in print and cursive, on the four-line guides kids learn on;
- trace-then-copy rows;
- correct trim, margins and bleed;
- a full-wrap cover at the exact spine width.

The free tier is limited and watermarked. A one-time payment unlocks it.

**Why this one:**
- **Same proven buyer.** Kids' activity and handwriting books are a
  low-content category that the Puzzle Press visitor already publishes in. The
  existing Puzzle Press pages (spine, margin and royalty calculators, the guide)
  can cross-link from day one. That is the only distribution head start I have.
- **Same wedge that worked.** The free competitors make *a worksheet*:
  - Univers Studio (worksheets for KDP);
  - Printable Scholar;
  - TracerTutor;
  - name-tracing makers.

  Creative Fabrica and TPT sell *fixed* 23–27 page interiors. None that I
  found hand you the whole custom book with its cover in one step. I need to
  verify that before it goes on a page.
- **Reuse.** The KDP geometry (trim, margins, bleed, spine, cover), the
  print-rule tests (0.75pt lines, 7pt type, 10% grey), the Stripe unlock, the
  beacons and the dashboards all carry over. Build time goes into the new part.
- **A second audience with search intent.** Parents and teachers search for
  name-tracing and sight-word practice. A personalised name book is a gift a
  parent can print at home or order from KDP as an author copy.
- **It films well for Shorts.** A name goes in and a 40-page traced book comes
  out.

**Hard parts, known now:**
- Fonts: tracing needs an embeddable, OFL-licensed teaching hand. Google's
  Playwrite family (per-country school models) and SIL's Andika are
  candidates; check the licence of each before use.
- A dashed or outlined glyph for tracing has to stay at or above KDP's 10%
  grey and 0.75pt line minimums.
- Cursive joins, where a word must connect rather than print letter by letter.

## Marketing, before the first line of code

- **Search:**
  - one page per real intent: "handwriting workbook generator for KDP",
    "name tracing book", "sight word tracing book", "cursive practice book";
  - plus a free single-page tracing sheet tool as the utility page, the
    spine-calculator lesson.
- **Build log:** the same dev.to channel. The second-app announcement is itself
  a post.
- **Shorts via Buffer:** "type a name → the book", about 20 seconds.
- **Cross-links from Puzzle Press:** the calculators and the how-to guide
  already speak to KDP publishers.

## Facts I need from the boss before building (asked 2026-09-29)

1. **Where the code lives.** RULES §2 lists one app folder, `app/`. A second
   folder in this repo (e.g. `app2/`), or a new GitHub repo like
   `walkertbrown/puzzle-press`?
2. **Domain.** A subdomain of bananafest-destiny.com (e.g.
   `tracepress.bananafest-destiny.com`), same Cloudflare token?
3. **Payments.** A new Stripe Payment Link in the same account, with its URL,
   its link ID, and a success URL pointing at the new domain?
4. **Logs.** One plan/actual per day covering both apps, and one FACTS/LEARNED
   with a section per app? Or separate files?

## Feasibility probe, 2026-09-29 (a throwaway in the session scratchpad, not in the repo)

- **Licences** (read from the google/fonts repository's OFL.txt and
  METADATA.pb files):
  - Playwrite US Trad (cursive) and Playwrite US Modern: OFL, TypeTogether,
    Copyright 2023 The Playwrite Project Authors.
  - Andika (print manuscript, for literacy): OFL, SIL International.
- **Embedding:** both embed in pdf-lib 1.17 with fontkit, the versions
  Puzzle Press already ships. The Playwrite files are variable fonts
  (wght 100–400) and embed at their default 400 instance. pdffonts shows them
  embedded but *not* subset, even with `subset: true`, which costs about 340 KB
  per font per PDF. Fine for now; revisit if the books get heavy.
- **Cursive joins** ("bob won over brave oats") connect correctly with no
  shaping engine. pdf-lib does no OpenType shaping, and at this resolution
  these words didn't need it. Check a full alphabet of pairs before trusting it.
- **The Playwrite "Guides" fonts are out.** They render as fragments in
  pdf-lib because they depend on shaping. I'll draw the four-line guides
  myself: straight lines, easy to hold at or above 0.75pt.
- **Trace style:** stroking the glyph outline (text render mode 1, dashed,
  0.75pt, 50% grey) gives a *hollow* double-edged letter, not the dotted
  centreline of a classic tracing font. Solid light-grey fill (at least 10%
  grey, per KDP) is the other common trace style and works as-is. A true dotted
  centreline needs a single-stroke font, so find out if an OFL one exists
  before promising it.
