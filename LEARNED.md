# Learned

What you took from factual answers the boss gave, for the **current** app.

- Their words in quotes, dated.
- Your inference labeled as inference, dated.
- Do not file a guess as a fact. If you need something confirmed, ask a factual question and then write the answer under Facts.
- The idea itself is yours. Do not attribute it to the boss.

Next-app thoughts go in `scratch/`, not here.

## Notes

- 2026-09-10 — "I will create when you ask, but I'd like you to decide the plan first."
  - Inference (2026-09-10): the Cloudflare token is not a blocker for building. Build locally first; ask for the token at the deploy phase, with the plan already written. Do not ask for resources before the phase that needs them.
  - Inference (2026-09-10): the boss wants the plan before provisioning anything. So each resource request should point at the phase in `plan/` that needs it.
- 2026-09-10 — "I currently have stripe"
  - Decision (2026-09-10): use Stripe. Sell via a Stripe Payment Link. Unlock: buyer enters the email they paid with; a Worker route checks Stripe's Checkout Sessions for a paid session with that email (`customer_details[email]` filter) and the client stores the unlock. Needs a Stripe **restricted** key (read-only on Checkout Sessions) as a Worker secret at phase 5 — the boss creates it, I do not mint it. No license keys, no database.
- 2026-09-10 — "I have a reddit I can post to, fairly new. and reddit groups generally don't allow advertising your products."
  - Inference (2026-09-10): Reddit is not the channel for a launch post. It is a channel for being useful: answer "how do I make puzzle books" threads, share a free sample book PDF, mention the tool only where rules allow. Primary channels instead: a landing page built for search ("KDP word search book generator"), a YouTube walkthrough (boss can create an account), Product Hunt launch, and a free downloadable sample book as the demo of worth.
- 2026-09-10 — "yes currently free plan"
  - Inference (2026-09-10): Worker script ≤ 3 MB compressed, 100k requests/day. Static assets + one small verify route fit easily. Keep the PDF library client-side; the Worker serves assets and does the Stripe check only.
- 2026-09-10 — "you have everything you need"
  - Inference (2026-09-10): the boss believes both resources are provisioned. They are present but under-scoped: the Cloudflare token has no Workers permission, and the GitHub line was overwritten by the Cloudflare vars in the same file. Report the exact error strings rather than re-asking for "a token" — the fix is a permission checkbox, not a new secret.
  - Inference (2026-09-10): `.git-credentials` is read by git's store helper and must contain only `https://user:token@github.com` lines. Cloudflare vars belong somewhere else (e.g. `.cloudflare-env`, already covered by `.gitignore`'s bot-runtime block if named accordingly).
- 2026-09-10 — "It is on there scoped to the domain bananafest-destiny.com"
  - Inference (2026-09-10): a zone-scoped token cannot deploy a Worker. Uploading a script is an account operation (`PUT /accounts/{id}/workers/scripts/{name}`); zone-level "Workers Routes" only points a URL pattern at a script that already exists. The token needs Account → Workers Scripts → Edit added; the zone scope it already has is not a substitute and does not need removing.
  - Inference (2026-09-10): a real domain exists, so `workers.dev` is not the only option for launch. That is the boss's call to make — asked. For SEO and for a buyer's trust, a domain the buyer can read matters; `bananafest-destiny.com` does not say "puzzle books", so I would still launch on workers.dev unless they want otherwise.
- 2026-09-10 — "Bananafest-Destiny is our app development studio name. Everything we make will be under that name"
  - Decision (2026-09-10): Puzzle Press is a product *of* the studio, not a standalone brand. The footer and PDF metadata should say so, and the next app gets its own subdomain on the same zone. This also settles the earlier open question — the custom domain wins over workers.dev because the studio name is the brand, not a placeholder.
  - Inference (2026-09-10): the boss types the studio name without the hyphen. The zone is hyphenated. Use the hyphenated spelling everywhere in code and say so once, rather than silently deploying to a name they did not type.
- 2026-09-10 — the boss created `walkertbrown/puzzle-press` for the app.
  - Decision (2026-09-10): the app repo is the product's public face; `vibe-cider` stays the build log. Code keeps living in `app/` per RULES §2, and each phase is mirrored with history by:
    `git subtree split --prefix=app -b app-export` then pushing `app-export` to the app repo's `main`.
    First import was a `--allow-unrelated-histories` merge so the boss's two seed commits survive; after that it is a fast-forward.
  - Inference (2026-09-10): the app repo README is marketing, not just docs — a KDP seller who lands there should see the live link, what the PDF contains, and why the puzzles are correct. Written that way.
- 2026-09-10 — Stripe test key + link in place; full purchase proven end to end.
  - Inference (2026-09-10): the checkout's product line reads "$19.00 **per puzzle book**", but the app grants unlimited books for one payment. That is a promise mismatch a buyer could fairly complain about. Asked the boss to reword the Stripe product (my copy says pay once, unlimited) — the wording is in their dashboard, not my code.
  - Inference (2026-09-10): Stripe Checkout requires a phone number only while "Save my information" (Link) is ticked, and the address field's Google suggestion overlay hides the city/ZIP inputs. `test/purchase.mjs` unticks Link and dismisses the overlay; without both, the Pay button silently fails validation and the session stays `open`.
  - Inference (2026-09-10): everything is TEST mode. A stranger cannot yet pay for real. Going live needs the live payment link and a live restricted key — one var and one secret, no code change.
- 2026-09-11 — "I can make you a reddit account and post to it if you'd like. I won't use mine."
  - Decision (2026-09-11): decline a fresh Reddit account. A day-old account posting a link to its own product is the exact pattern every KDP/puzzle subreddit filters and their communities downvote; the likely result is a removed post and a shadowban, which costs the domain its one chance there. The right move is the boss's own established account posting the *guide* (not the tool) when a genuine question comes up — and he has declined that. So Reddit is off the table for launch, and I will not pretend otherwise.
  - Decision (2026-09-11): accept the offer for accounts where a new account is not penalised and the content is the product: **Pinterest** (KDP sellers live there; a pin of a finished cover linking the guide is normal), and **YouTube** (a 90-second screen recording of a book being made, unlisted-or-public, gives the launch a video and gives search a second surface). Product Hunt already exists. Ask for those two.
- 2026-09-11 — Buffer connected to YouTube (observed while posting).
  - Observed (2026-09-11): Buffer's YouTube integration publishes **Shorts only** — a landscape upload is rejected with "Video must be vertical (portrait orientation) for YouTube Shorts." WebM (VP8) is accepted. Regular landscape videos have to be uploaded in YouTube Studio by hand.
  - Inference (2026-09-11): make two cuts of any video — a vertical one Buffer can post, a landscape one for Product Hunt's gallery and the channel proper — from the same script, so they cannot disagree about the product.
  - Observed (2026-09-11): Pinterest (via Buffer) rejects WebM outright — "Pinterest does not support .webm files." Playwright's bundled ffmpeg only writes VP8/WebM. `ffmpeg-static` from npm gives a full static build with libx264; kept in the scratchpad so the app repo carries no 80 MB binary. Ship MP4 for anything that leaves YouTube.
  - Observed (2026-09-11): Pinterest blocks links to a brand-new domain from a brand-new account at the spam layer — the pin fails with "snags with the 'Source URL'" and Pinterest never fetches the page. Claiming the site does not lift it (tested: claim verified, retry failed). Same image with a YouTube link posts fine. The route is Pinterest's blocked-site appeal, then retry; meanwhile pins can link to the YouTube video, which links to the site.
  - Observed (2026-09-11): Buffer `edit_post` on a post carrying a video asset times out (30 s) and does not apply; image-asset edits are instant. Create a fresh post for video changes and read back after any edit.
- 2026-09-13 — the boss believes the single JS-running visitor on 2026-09-13 was himself.
  - Inference (2026-09-13): treat the true count of strangers who have ever run this product as **zero**, not one. Everything before Tuesday is therefore untested against a real user's judgement, only against my own and the boss's. The corrected funnel (crawlers separated from browsers, this machine subtracted) is the only instrument I have, and it has never yet recorded a stranger.
  - Inference (2026-09-13): with zero strangers reached, no amount of further product hardening changes the outcome. Between now and Tuesday the work with any expected value is whatever raises the chance that a Product Hunt visitor understands the product in the first five seconds and that Show HN is posted at all.

## 2026-09-13 — Phase 14: the failure modes only a payer can reach

Four defects in the pay path, and three of them were invisible to me for weeks
because reaching them requires having paid. The pattern behind all three: a
message written for the *good* case that is also the only message the *stuck*
case ever sees. "Stripe has not finished recording that payment yet" is correct
for a buyer three seconds back from checkout and a permanent trap for a buyer
who typed the wrong address, and the same words serve both. The rule I am
taking from it: for every reassuring message, ask who else lands here, and how
long the reassurance stays true for them. If it can be true forever without
being useful, it needs an exit.

The fourth, the title page claiming 50 puzzles in a 12-puzzle book, came from
a default that tracked one input and not another. A default that states a fact
about the output has to be derived from the output, not from a table.

## 2026-09-13 — Phase 15: a workaround can hide that a channel is dead

Pinterest blocked links to the domain, so I worked around it: put the address
in the pin description as text and point the pin's destination at the YouTube
channel. Five pins then sent with no error, and for two days my own logs read
like a marketing channel that was working.

It was not. Plain text is not clickable on Pinterest, so those five pins send
Puzzle Press nothing. The workaround made the *posting* succeed, which is not
the thing I wanted; the thing I wanted was a visitor. Because the error went
away, so did my attention.

The rule: when a block forces a workaround, write down which part of the
outcome the workaround does not restore, and count that part as zero until it
is. A green status from the tool that carries the work is not evidence about
the work. And test the block itself cheaply and on a schedule — one API call
answered "is Pinterest still blocking us" tonight, after two days of assuming.

## 2026-09-13 — Phase 16: a device profile is not an engine

`test/mobile.mjs` had been printing "MOBILE OK — iPhone 13" for weeks. It was
Chromium with an iPhone's viewport and user-agent. Nothing about Safari was
ever exercised: not the PDF rendering, not the font embedding, not the
download, not the `<dialog>` element the unlock lives in. The test named a
device, so I read it as covering that device, and never re-read the first line
of the file.

Two rules out of it. First: when a test names a *thing in the world* — an
iPhone, a slow connection, a blind user — go and check which part of that thing
it actually reproduces, because the name will be more generous than the code.
Second: before accepting that a tool needs something I cannot give it, find out
what is truly missing. WebKit asked for sudo and two packages; the real gap was
one symlink, and the difference between those two answers was the difference
between testing Safari before a launch and not.

Related: [[2026-09-13-phase-15-a-workaround-can-hide-that-a-channel-is-dead]] —
both are the same mistake, a green signal standing in for the thing I wanted.

## 2026-09-13 — Phase 17: I had never looked at the competition

Two weeks of building and a comparison page with four columns, and I had never
once searched for what else exists. When I finally did — looking for something
unrelated — the field was crowded with free, ad-supported, well-ranked tools,
one of which had quietly outgrown the description I had written of it. My
`/compare` page and my prepared Hacker News reply both said free generators
make one puzzle at a time. That stopped being true at some point I never
noticed, because I was checking my own claims against my own code and never
against the world.

The rule: a claim about somebody else's product is a claim with an expiry date,
and it expires without telling you. Re-check every competitive claim
immediately before saying it in public, and date it on the page the way the
Book Bolt price is dated. Then concede the true part first — the free tools
really are the right answer for someone, and saying so is what makes the rest
of the comparison believable.

Related: [[2026-09-13-phase-16-a-device-profile-is-not-an-engine]] — same shape
again. A thing I wrote down once and then stopped looking at.

## Phase 18: I was about to optimise the wrong thing, again

I opened this phase certain the launch-day risk was `/api/verify`. It scans the
Stripe account when the exact-email filter misses, phase 14 had recorded two
calls over thirty seconds, and the test file still carries a ninety second
timeout because of it. The whole story was coherent. Before writing it into a
plan I timed it against production: **0.33 seconds**, three times running. The
scan is fast because the account is nearly empty, and it slows by one round
trip per hundred sales. I would have spent the evening making a fast thing
faster on the strength of a number I measured once and never re-measured.

Measure the thing tonight, not the memory of the thing. This is the same shape
as [[phase-16-a-device-profile-is-not-an-engine]]: a number I trusted because I
had once observed it, applied to a system that had changed underneath it.

The real cost was somewhere I had never looked. The landing is cheap — 124 KiB
and a usable preview grid in 1.1 seconds on a throttled phone at slow-4G. The
first press of the button pulls **2.1 MB** that the page has not touched yet:
pdf-lib and fontkit in a 1.3 MB chunk, and two 400 KB fonts. Eleven seconds of
downloading at the exact moment somebody has decided they want it. Lazy-loading
the heavy code was the right call and it moved the whole cost onto the click.

Fetching it during idle time after the first render cut click-to-PDF from 13.5
to 8.7 seconds for a visitor who read the page for twenty seconds first.

Two things that only showed up because the funnel is built out of request
paths: warming through `render.js` would have made every visitor look like
somebody who made a book, on launch day, on the one number that matters — so
the warm-up goes through its own module. And starting the fonts in parallel
with generation, which I was sure would help, measured as **exactly a wash**
(20.1s either way): most of what looks like "generating" is laying out pages,
which needs the fonts anyway. I kept it for the 200-sudoku case and wrote the
measurement into the comment rather than the claim I assumed.

## Phase 18b: the correction that did not finish

In phase 17 I found that "free generators make one puzzle at a time" was false
and fixed it — on `/compare` and in the queued Show HN reply. I did not grep.
Tonight, doing a pre-flight on tomorrow's launch assets, I found it still sitting
in two places: the landing page's own FAQ, live, and **the first comment the
boss posts on Product Hunt on Tuesday morning**.

A wrong claim is not a page, it is a string. Correcting where I remember writing
it is not the same as correcting it, and the copy that survives is the one in
the file I was not looking at — which here was the one that gets read aloud to
the largest audience this product will ever have. The fix takes thirty seconds:
grep the phrase across the repo before calling the correction done. Related:
[[phase-17-i-had-never-looked-at-the-competition]].

## Phase 19: the dashboard was counting me as the customers

The pre-launch baseline read: 4 real browsers, 2 made a book, 3 made a cover.
A day before launch, that is a number you want to believe.

It was me. `scripts/traffic.mjs` asks Cloudflare which address it sees this
machine as, and subtracts it — but node reached that endpoint over IPv6, while
Playwright's browsers went out over IPv4, so only half of this machine was ever
excluded. The three "real browsers" were WebKit and two iPhone profiles from the
test suite an hour earlier. The honest baseline is **one** person who landed and
left, no books, no covers.

An exclusion that silently covers half of what it names is worse than no
exclusion, because it reads as rigour. The tell was there to be noticed: "made a
cover 3" against "made a book 2" is the shape of a test sweep, not of people —
strangers do not make more covers than books. I noticed it because I went
looking at user agents, not because the number looked wrong, and it should have
looked wrong. Related: [[phase-18-i-was-about-to-optimise-the-wrong-thing-again]].
