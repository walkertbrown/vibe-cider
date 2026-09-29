# Trace Press: the build plan, ready for when the boss answers

Written 2026-09-29 so day one is building, not deciding. Nothing here has
been built.

## What carries over from Puzzle Press (read from `app/src`, 2026-09-29)

| Piece | File | How it carries |
|---|---|---|
| Trim, margins, gutter by page count | `src/pdf/kdp.js` (`TRIMS`, `pageGeometry`, `marginsForPage`, `gutterInches`) | Copy as-is |
| Cover: bleed, spine width, spine text, barcode box | `src/pdf/cover-geometry.js` | Copy as-is. White paper is the default here (KDPEasy says white for pencil) |
| Cover rendering | `src/pdf/cover.js` | Adapt: new title and palette, same geometry |
| Font subsetting check, missing glyphs | `src/pdf/tofu.js` | Copy |
| Paid unlock | `src/worker.js` `/api/verify` | Copy. It matches `PAY_LINK_ID`, so a **new Payment Link** keeps the two products apart, and the same restricted Stripe key works, same account |
| Local unlock, beacons | `src/ui/license.js`, `src/ui/px.js` | Copy; the beacon names stay the same, so `traffic.mjs` and `who.mjs` can be pointed at the new host |
| Print-rule tests (0.75pt, 7pt, 10% grey, embedded fonts), cover-safe | `test/*` | Copy and point at the new renderer |
| Spine, margin and royalty calculators | `public/*-calculator.html` | **Do not copy.** Link to the Puzzle Press ones; duplicates would compete with each other in search |

## What is new

1. **The four-line guide** (top, dashed midline, baseline, descender) at the
   age presets:
   - ages 3–5: 1";
   - ages 5–7: 0.75";
   - ages 7–9: 0.6";
   - ages 10+: 0.45".

   Lines are at least 0.75pt and at least 10% grey. The presets are vendor
   figures (KDPEasy); check them against a school spec before calling them
   standard.
2. **A print alphabet drawn as single strokes:** 26 + 26 + 10 glyphs as
   line and arc segments on the guide grid. It gets a dotted centreline (dash
   `[0.1, 4]`, round cap) and **stroke order** (a numbered start dot, a
   direction arrow). This is the part a font can't do, and the reason to buy.
3. **Cursive,** as a grey-fill trace in Playwrite US Trad (OFL). Joins render
   without shaping in the probe. Test every lowercase pair before shipping.
4. **Page types:**
   - one letter per page (large model, then trace rows, then free rows);
   - words: the word, then trace, then copy;
   - a name page repeated;
   - numbers.
5. **Book assembly:**
   - input: a word set, one of
     - A–Z;
     - numbers;
     - **not Dolch or Fry in version 1:** see "Word lists" below;
     - a name;
     - custom words, run through the same blocklist as Puzzle Press;
   - output: the interior plus the cover, 8.5 × 11 by default.
6. **Free tier:** the whole book is watermarked, as in Puzzle Press, and $19
   once removes it.

## Tests before launch

- The existing print-rule suites against the new renderer.
- Every glyph path stays inside the guide lines: a test over all 62 glyphs,
  derived from the glyph table, not a typed list.
- Cursive pairs: render all 26 × 26 lowercase pairs and check that no glyph is
  missing.
- A test-mode purchase through the new link: unlock, then reload, then unlock
  on another device.

## Launch pages (search), one per intent

- `/` — handwriting workbook generator for KDP;
- `/name-tracing-book` — the parent's page: a personalised name book;
- `/cursive-practice-book`;
- `/sight-word-tracing-book`: **not at launch.** It waits on the Dolch
  check below; a custom word list covers it until then;
- `/tracing-worksheet` — the free single page, the utility-page lesson from
  the spine calculator;
- links **from** Puzzle Press's guide and calculators, and back.

## The answers that unblock it, with the default I'd take

1. **Code location:** the default would be a second folder in this repo,
   `tracepress/`, with a public mirror repo like `walkertbrown/puzzle-press`.
   The boss's call, because RULES lists only `app/`.
2. **Domain:** `tracepress.bananafest-destiny.com`, same zone, same Cloudflare
   token.
3. **Stripe:** a new Payment Link in the same account at $19 one-time, success
   URL `https://tracepress.bananafest-destiny.com/?paid=1`. I need the URL and
   the link ID; the existing restricted key already reads sessions account-wide.
4. **Logs:** one plan/actual per day with a section per app, and one FACTS
   and LEARNED with a section per app.

## Word lists: checked 11:20Z, 2026-09-29

- **Dolch:** first published in a journal article in 1936 and in *Problems in
  Reading* in 1948 (Wikipedia). The only "out of copyright" claim I found is
  one editor's unsourced line on the Wikipedia talk page, with no renewal
  record. I'm leaving it **unverified** and not shipping a list labelled
  "Dolch" until a renewal check (the 1948 book falls in the Stanford
  renewal database's range) says it's clear.
- **Fry:** prepared in 1979 (Wikipedia). Too recent to assume anything, so
  it's out.
- **Version 1 needs neither:** A–Z, numbers, a name, and custom words (the
  buyer's own list) carry no licence question. Sight-word pages can come
  later.
- **Line heights:** Zaner-Bloser's paper specs aren't in any public page I
  found. The presets stay labelled in inches ("1-inch lines, ages 3–5"), never
  as "standard" or "school".
