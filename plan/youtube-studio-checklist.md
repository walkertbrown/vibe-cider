# YouTube Studio checklist, for one sitting (written 2026-09-26)

(Everything else I need from you is at the bottom, under "Not YouTube". The fastest item there takes a minute.)

**State checked from outside, 2026-09-27 23:55Z: nothing below is done yet.** Titles read via YouTube oEmbed are all still the old ones. The long-form description still links the site directly, not through /go/. No Short's page mentions `ph6q2ih6cBs` (that check has no positive control, so treat it as likely rather than proven). Meanwhile the Shorts are being watched: large print 69 views, royalty calculator 68, groundwood 47, spine 26 (Buffer). /go/ has recorded no arrivals at all since 09-25, because a Short has no clickable link until item 1 is done. **Item 1 is the one that matters most.**

Each item is a change on a video that is already live, so it has to be made in YouTube Studio on the boss's account; Buffer cannot edit sent posts. The reason for each is in `actual/2026-09-26.md`. Tick them off here, or just tell me they are done.

## 1. Related video on every Puzzle Press Short

Studio → Content → Shorts → open each one → **Related video** → "How to make a KDP puzzle book in 60 seconds" (`ph6q2ih6cBs`) → Save. This puts a clickable link inside the Short, under the channel name.

- [ ] `W6RQSZvffMY`: royalty calculator (68 views)
- [ ] `uKGoCuyMiJ8`: making a book
- [ ] `ivTWiVtvW3I`: spine
- [ ] `v0-cvmEOcEk`: five kinds
- [ ] `UDwBuUHuz1M`: groundwood
- [ ] `9nZrH4AK2yg`: large print (posted 09-27 00:30Z)

## 2. Titles: lead with the words people type

YouTube's own autocomplete offers "kdp word search generator", "free word search generator for kdp" and "kdp puzzle generator". We rank for none of them. A Short titled "Free Word Search Puzzle Generator For Amazon KDP Books…" ranks on 251 views. Our calculator Shorts, whose titles lead with "KDP … calculator", do rank (spine #3).

- [ ] `uKGoCuyMiJ8`: "Making a KDP puzzle book in under a minute (free tool) #KDP #wordsearch" → **Free KDP word search generator: a 60-puzzle book and its cover, in real time**
- [ ] `ph6q2ih6cBs`: "How to make a KDP puzzle book in 60 seconds (word search, sudoku, mazes — free tool)" → **Free KDP puzzle book generator: word search, sudoku and mazes, book and cover in 60 seconds**
- [ ] `ivTWiVtvW3I`: "KDP Spine Width Calculator — Most of Them Add 0.06" Too Much" → **KDP Spine Width Calculator: Top-Ranked Ones Add 0.06" Amazon Doesn't** ("most" was never measured; two were)

Each new title describes what that video shows. I checked against `scripts/video.mjs` and the videos' own descriptions.

## 3. `ph6q2ih6cBs` description: tracked links

Replace the four URLs:

| Now | Replace with |
|---|---|
| `https://puzzlepress.bananafest-destiny.com` | `https://puzzlepress.bananafest-destiny.com/go/yt` |
| `…/how-to-make-a-puzzle-book` | `https://puzzlepress.bananafest-destiny.com/go/ytguide` |
| `…/spine-calculator` | `https://puzzlepress.bananafest-destiny.com/go/ytspine` |
| `…/royalty-calculator` | `https://puzzlepress.bananafest-destiny.com/go/ytcalc` |

All four return a 302 to the right page (checked 09-26).

## 4. Channel: a second link

- [ ] Customisation → Basic info → Links → add title `Free KDP royalty calculator`, URL `https://puzzlepress.bananafest-destiny.com/go/ytcalc`

## Not YouTube: everything else waiting on you (added 2026-09-28)

Ordered by minutes to do. Each one is either something only your account can do or a fact only you have. None is a product decision.

- [ ] **GitHub repo description (1 min).** github.com/walkertbrown/puzzle-press → gear next to **About** → replace the description with:
  > Free KDP puzzle book generator: print-ready word search, sudoku, maze, criss-cross and crossword books in the browser — interior PDF and full-wrap cover. $19 once removes the footer line.

  Why: GitHub search matches whole words, and the current text never says "generator", so the repo is missing from the 13 results for "puzzle book generator". The README has sent a real visitor (09-26), which dev.to and the zoo never have. My push token gets 403 on repo settings.
- [ ] **GitHub traffic numbers (2 min).** Same repo → Insights → Traffic. Tell me the 14-day views, unique visitors and the referring-sites table. Why: that tells me whether the README needs fixing or whether nobody reaches it.
- [ ] **Delete two spam comments on dev.to (2 min):**
  - "devsupport" ("verify your account", a bit.ly link) on https://dev.to/bananafestdestiny/we-built-thirty-pages-for-queries-we-hadnt-searched-then-a-stranger-told-us-how-to-check-31n1
  - "grok_survivor…" ("Replies dead? Drop niche…") on https://dev.to/bananafestdestiny/pinterest-blocked-our-new-domain-as-spam-the-appeal-was-denied-lii

  Why: a phishing link under our name, on a post that links the product.
- [ ] **Stripe: is ShelfCall meant to share this account? (yes/no).** On 09-27 a ShelfCall checkout turned up in it. The code is already safe either way: only our Payment Link unlocks Puzzle Press. I need the answer for FACTS.md.
- [ ] **Search Console: the two query rows.** The 09-25 dev.to reply mentioned 22 impressions across 2 queries. Which two phrases? Why: my search work stays on hold until I know what Google is actually showing us for.
