# YouTube descriptions that need correcting — for the boss

**Why this file exists.** Four of the five published Puzzle Press videos tell
viewers the free book "carries a watermark". It does not. The free book carries
one small grey line in the page footer (`src/pdf/render.js`, 7pt, centred:
"Made with Puzzle Press — free preview") and a cover marked PREVIEW. What a KDP
seller pictures when they read "watermarked" is a diagonal stamp across the
artwork — a book they could not show anyone. That is a materially worse offer
than the real one, and it is the thing I was publishing at the exact moment
somebody decided whether to try the tool.

Every page on the site was corrected on 2026-09-23 and is guarded by
`npm run test:marks`. The video descriptions are the last place the wrong
sentence survives, and **I cannot reach them.** Buffer cannot edit the text of a
post once it is `sent` (its `allowedActions` do not include it), and I have no
YouTube Data API credential. This needs a person in YouTube Studio.

Each entry below gives the exact line to find and the exact line to replace it
with. Nothing else in the descriptions needs to change.

---

## 1. "Puzzle Press — a KDP puzzle book in under a minute" — published 2026-09-11

**Find:** `Free to use; free books carry a watermark. $19 once removes it. Word search, sudoku and mazes.`

**Replace with:** `Free to use. Free books carry one small line in the page footer and a cover marked PREVIEW; $19 once removes both. Word search, sudoku and mazes.`

---

## 2. "A KDP puzzle book made start to finish, in real time" — published 2026-09-11
(youtube.com/watch?v=ph6q2ih6cBs — this one was posted natively, not through Buffer)

**Find:** `0:55 Pricing: free with a watermark, $19 once to remove it`

**Replace with:** `0:55 Pricing: free with a small footer line and a PREVIEW cover, $19 once to remove both`

---

## 3. "Five kinds of KDP puzzle book, one tool" — published 2026-09-14

**Find:** `Free with a watermark; $19 once removes it. No subscription.`

**Replace with:** `Free books carry one small line in the page footer and a cover marked PREVIEW; $19 once removes both. No subscription.`

---

## 4. "Free KDP royalty calculator that then makes the book" — published 2026-09-22

**Find:** `The calculators are free and always will be. Books are free too and carry a watermark; $19 once removes it. No subscription.`

**Replace with:** `The calculators are free and always will be. Books are free too — they carry one small line in the page footer and a cover marked PREVIEW; $19 once removes both. No subscription.`

---

## 5. "KDP spine width calculator" — published 2026-09-23

Nothing to change. This one was written after the sweep and is already correct.

---

## While you are in there: three of them have untagged links

A second, smaller thing, and entirely optional.

Videos 1, 2 and 3 link to the site with bare URLs
(`https://puzzlepress.bananafest-destiny.com/...`). Videos 4 and 5 use the
tagged `/go/` form. Only the tagged ones are attributable — an untagged arrival
is deliberately not attributed at all, because the alternative is reading the
referer, which I will not do.

All seven redirects were verified working on 2026-09-23:

    /go/yt        -> /
    /go/ytcalc    -> /royalty-calculator
    /go/ytspine   -> /spine-calculator
    /go/ytmargin  -> /margin-calculator
    /go/ytguide   -> /how-to-make-a-puzzle-book
    /go/pin       -> /
    /go/reddit    -> /

So if you are already editing a description, swapping the bare links for the
`/go/` form costs nothing and makes the click visible on the dashboard. The
mapping is one-for-one: the generator is `/go/yt`, the guide is `/go/ytguide`,
and each calculator has its own slug above.

This matters more than it sounds. "Nothing has ever arrived through a `/go/`
link" has been on the dashboard for days and I had been reading it as *nobody
clicks*. Three of the five videos could not have produced a tagged click no
matter who clicked. That does not make the channel healthy — 28 views is 28
views — but it does mean the number was never a fair test.
