# Show HN day — what I do, hour by hour

Written the day before, on the quiet afternoon of the Product Hunt launch,
because `launch-day.md` covers Tuesday and gives Wednesday one row in a table.
That row says "boss posts Show HN" and then stops, and the hours after a post
are the wrong time to work out what to look at.

Same job as `launch-day.md`, different platform, and the differences are the
whole point of a separate file: **on Hacker News I can read the thread myself,
and the thread is the event.** On Product Hunt the score is the event and the
comments were invisible. Here it is the other way round.

## The clock

| When | What | Who |
|---|---|---|
| Wed 2026-09-16, **7–9am CT** | Post from `show-hn.md` — title, URL and text are ready to paste | **boss** |
| Immediately after | Paste me the `news.ycombinator.com/item?id=` link | **boss** |
| First 2 hours | Read the thread every ~15 min, draft a reply to every comment | me → boss pastes |
| All day | Funnel, and the two numbers below | me |
| End of day | `actual/2026-09-16.md` with the real numbers, zeros included | me |

Post at https://news.ycombinator.com/submit — title, URL and text box. The text
box is the "Text (goes in the text box)" section of `show-hn.md`, which includes
the AI-disclosure paragraph. **Keep it.** HN will ask, and finding out later
reads worse than saying it first.

**Do not ask anyone to upvote. Do not post it twice.** Both are the fastest ways
to have the submission killed, and neither is recoverable.

## What I can see for myself — all of it

```
npm run hnwatch <item-id or url>     # the thread, the points, the true rank
npm run hnwatch                      # finds our submission by URL, then the same
```

Written 2026-09-15 for exactly this day. It reads two public, key-less APIs:

- `hn.algolia.com/api/v1/items/<id>` — the entire thread, every comment, nested,
  in one request. It prints them oldest-first with indentation for depth and a
  `*` next to anything new since the last run (remembered per thread in
  `scripts/.hnseen.json`, so re-running says what changed instead of reprinting
  forty comments).
- `hacker-news.firebaseio.com/v0/topstories.json` — this **is** the front-page
  ranking, in order. Index 0–29 is page one. That is the number that predicts
  the day, and it is a fact rather than an inference.

Both must be **https**; the http forms 301 and a `curl` without `-L` comes back
empty, which is how the first version of the script cheerfully "found no
comments". Tested against a real 320-comment Show HN before trusting it.

So Wednesday needs **nothing relayed** except the link itself. The moment the
boss pastes the `item?id=`, I stop being blind. Contrast Tuesday: I spent the
whole of Product Hunt day able to see a comment *count* and not one word.

The no-argument form searches by URL, not title — HN dedupes on URL and titles
get edited. The search index lags a few minutes behind a fresh post, so for the
first half hour, pass the id.

## The hourly loop

Same order as Tuesday, because each line only means something given the one
above it, plus the two HN numbers on top:

```
npm run hnwatch <id>     # 1. new comments  2. points  3. front-page rank
npm run traffic 2        # the funnel, tight window
```

1. **New comments first, always.** An unanswered question on a Show HN is the
   one failure that is entirely mine to prevent and entirely visible to
   everyone. Replies keep a post on the front page more reliably than the post
   does.
2. **Points and rank.** Rank is the useful one. Points without rank is a number
   in a vacuum — thirty points can be page one at 8am or page four at 8pm.
3. **The funnel**, read exactly as `launch-day.md` describes it: requests →
   ran the app → did not bounce → made a book → checkout → paid.

**Baseline to beat.** Against the corrected launch-eve numbers: 13 requests /
5 real browsers / ~3 actual humans / 1 book / $0 in 24 hours. Tuesday's Product
Hunt launch did not move that — the whole day produced a single-figure number of
real browsers. So on Wednesday, **five real browsers is not a change. Fifty is.**
If HN works at all it will not be subtle; a front-page Show HN is hundreds of
sessions an hour, not a nudge.

## Thresholds — when a number means act

- **Any comment, any hour.** Draft a reply within the hour. `show-hn.md` has a
  reply bank for the seven questions that will actually come, and `answers.md`
  has fifteen more. Take the paragraph that fits and cut it down — a reply that
  reads as a prepared block is worse than two honest sentences.
- **Rank inside the top 30.** Stay at the terminal. Check every 15 minutes, keep
  drafting, and do not deploy anything.
- **Rank never appears and points stall at 1–3 after two hours.** It did not
  catch. This is the ordinary outcome for most Show HNs and it is not a verdict
  on the product. Do nothing dramatic: no repost, no second submission, no
  asking anyone to vote. HN has a second-chance pool that re-surfaces
  submissions on its own; the post stays up and keeps its URL either way.
- **Somebody is wrong about us, or right about a rival.** Correct once, with a
  fact, and stop. `show-hn.md` records that I got PuzzleForge's features wrong
  twice in two days, both times flattering to us. On HN somebody checks.
- **Worker errors above zero.** Look immediately.
- **`ran the app` high and `did not bounce` near zero** — the page is failing for
  real people arriving in a burst. Check against a local server, not production.

## The thing most likely to actually go wrong

**No payment has ever completed end to end in live mode.** As of tonight there
are 16 Checkout Sessions in the account and `payment_status=paid` on **none** of
them. The unlock path was proven once, on 2026-09-10, in **test** mode — and the
verify function has been rewritten twice since. I have de-risked what can be
de-risked for free: the Worker's exact live Stripe queries, replayed read-only,
all return 200, including the `starting_after` paging branch that has never run
in anger. What remains unknown is whether the matching logic handles a genuine
live *paid* session object.

So if HN sends a buyer, the first real purchase in this product's life happens
in front of an audience. **If anyone says they paid and cannot unlock, that is
the top priority over every number on this page.**

```
npm run unlock -- their@email.com     # or the cs_live_... from their receipt
```

It prints the reply to send. There is no licence to issue — the fix is always
"use the exact address Stripe has". If it fails, refund first and diagnose
second: `support.md` has the wording, and a refund costs $19 while a public
"I paid and got nothing" costs the launch.

The standing offer to the boss remains: a Stripe **test-mode** payment link and
a read-only `rk_test_…` key let me run `test/purchase.mjs` against a local
`wrangler dev` and prove the whole path for $0, production untouched. That is
still the highest-value ten minutes available before tomorrow morning.

## What I do not do on Wednesday

- **No deploys** unless something is broken. The live version is the one the
  thread is looking at, and a rollback id is only useful if I wrote it down
  before the change — which on Tuesday I twice did not, and had to reconstruct
  from `wrangler deployments list` in the afternoon. Live now: `e6dbd261`
  (the footer line on all 44 pages). Roll back **one rung at a time** —
  `02dc55e3` (unlock-dialog wording), then `eaeedff1` (pin images), then
  `b8068dc0`, which is the last version with a full green suite behind it and
  therefore the floor, not the first stop. The ladder with dates is in
  `launch-day.md`; if I deploy on Wednesday, the new id goes in **both** files
  before I leave the terminal.
- **No browser suites against production.** They pollute the only dashboard I
  have on the one day its numbers mean something. Local server or nothing.
- **Never open the Buy link directly** — loading it creates a real Checkout
  Session, and an untagged one looks exactly like a stranger who reached the
  card form and walked away. `node test/livecheckout.mjs` tags itself.
- **No second post, no cross-post to Reddit the same day, no "we're on HN"
  campaign.** One post, answered well.

## End of day

`actual/2026-09-16.md`: points, peak rank, comment count, every funnel line, and
what was said in the thread that I did not expect. The unexpected comment is
worth more than the score — it is the only free user research this product has
ever had.
