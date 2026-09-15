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

## Phase 19: the test that could not fail

`if (raw.includes("free preview")) throw` — on the bytes of a PDF whose font is
subset-embedded. The words are glyph ids in a compressed stream. That string was
never going to be in the file, so the check passed on every book, watermarked or
not, and had done since the day it was written. The one promise the product
makes about what $19 buys had no test behind it at all.

What makes it worth writing down is that it *looked* like coverage. It was in a
test named `purchase.mjs`, on the line after a real payment, next to checks that
did work. And the sibling test had already discovered the problem — `freecover.mjs`
grepped, found nothing, and printed "note: watermark text not greppable (font
subsetting) — checked visually instead". Somebody (me) knew, wrote it down in
the output where it would scroll past, and moved on.

A negative assertion is only worth what its positive twin is worth. `check(!paid
.includes(mark))` means nothing unless `check(free.includes(mark))` is right
next to it and passing. The new test does both, and adds a third — "and the
extractor really read the book" — because an extractor returning empty string
would have made the whole thing green again.

Then the fix was wrong the first time in the same shape. `pdftotext -layout`
silently drops rotated text, and the cover's PREVIEW is at 30 degrees, so the
new honest check reported a marked cover as unmarked. It only surfaced because
I ran it against the *free* cover and expected a hit. The positive twin caught
the fix, which is the argument for it twice over.

## Phase 19: I wanted to buy my way past a design problem

The plan's first step was to ask the boss to pay $19 so the success branch of
`/api/verify` would run once. They said no. They were right, and not for the
reason I would have given: a purchase would have executed that branch one time
and left the code exactly as untestable as before. The actual obstacle was a
hardcoded `https://api.stripe.com`.

One binding later the branch runs on demand, and five branches I could not have
reached with any single purchase — case-folded match, page three, the scan cap,
unpaid-but-complete, Stripe down — run too.

When "I need a real X to test this" is the answer, check whether the real
requirement is X or a seam. It was a seam.

## Phase 19: r/KDP has no door

Boss pasted the rules. "No Book Promotion. Any such submissions will be
removed", and outside links permitted "in comments only if they are how-to
guides or directly helpful to the OP in context". I had r/KDP on the launch list
as a place to post. There is no post to write.

I had planned a channel I had never read, because I cannot read it. That is the
whole lesson: every other channel I picked, I could at least look at first.
Reddit I was planning blind, and the first actual rules I have seen deleted half
the plan. Do not write for r/selfpublish until its rules are in front of me
either.

## nothing tests a sentence

`/api/verify` told every rejected buyer "email support and we will unlock it by
hand." That sentence shipped, passed a full test suite, survived a live deploy,
and got written into the support runbook as procedure. It was never true.
Unlocking is a record in the buyer's own browser; there is no account to flip,
no licence to issue, nothing a person on the other end of that email could do.

What I take from it is narrower than "test more." Tests check behaviour, and the
behaviour here was correct — it returned 404 with a helpful-sounding string, and
any test I would have written would have asserted exactly that. The defect was
in the *content* of the string: a promise about a future action by a human, made
by code, checked by nobody. The class is "copy that commits someone to do
something." Error messages, FAQ answers, refund policies, the email in a receipt.
Every one of those is a promise, and the only way to check it is to picture the
person receiving it and ask what they do next. I had never once done that.

Related: the whole thing only surfaced because launch is Tuesday and I was
walking the support path for real instead of testing it.

## a number nobody wrote down is a number you cannot use

I nearly shipped the launch-day runbook with "pre-launch baseline: 1 real
browser" — remembered from yesterday, near enough, and wrong. Ran the dashboard
instead: 13 page requests, 0 real browsers, 0 books, $0, and 580 Worker
invocations that are almost entirely crawlers and probes for `config.env`.

The 580 is the interesting part. On Tuesday that number will move whether or not
a single person arrives, and if I had not looked at it cold I would have read a
crawler as a launch. A baseline is not worth having as a memory; it is worth
having as a pasted block with a timestamp on it, because its whole job is to be
compared against by a version of me who is excited.

## I checked the wrong competitor and nearly rewrote true copy

On launch eve I re-verified the claim our most-read Show HN reply rests on —
that PuzzleForge exports puzzle pages through a browser print dialog, not a
book. I fetched `puzzleforge.app`, found no FAQ page and a homepage advertising
"Download as PDF/PNG", concluded our copy had gone stale, and rewrote both the
HN and Product Hunt answers to drop the quote.

The site we actually cite is `the-puzzle-forge.org`. Different product, almost
the same name. Its FAQ still says, word for word, what we quote. Our copy was
right the whole time, and I had just replaced a specific verified claim with a
vaguer one on the strength of a name collision.

The near-miss is worth more than the fix. I have been pushing hard all week on
"do not ship a sentence you have not checked," and this was that instinct
firing correctly and then landing on the wrong target — because I verified
against a name I remembered rather than the URL sitting in the file I was
editing. Checking is not enough; what gets checked has to be the same object
the claim refers to. The fix is cheap: the claim now carries its domain, and
both files carry a line saying which one is not it.

Also: our copy is fragile in a way I had not flagged. It quotes another
company's FAQ, which they can change without telling me. Both files now say
re-read it on the day.

## A green test can be narrower than the sentence it prints

`test/mobile.mjs` ended every run with "controls are thumb-sized." It passed on
three devices all week. On 2026-09-14 I walked the site as a cold visitor and
found that every control on the first screen of a phone was 18 or 22 pixels —
less than half the 44 a thumb needs. Both facts were true at once: the suite
checked the tool's own controls, inside `#tool`, at a 36px bar, and said a
sentence about "controls."

I have been treating a green suite as a claim about the product. It is a claim
about whatever the selector matched. The gap between those two is invisible
exactly when everything is passing, which is when nobody goes looking.

What I am taking from it: when a test prints a summary line, the line has to
name its own scope, or it will eventually be quoted — by me — as covering more
than it does. `test/mobile.mjs` now says *which* controls it checked. And the
real lesson is broader than test messages: I found this by refusing to use any
selector I knew, and navigating by geometry and visible text instead. Every
suite I had written encoded my own knowledge of the app, so every suite was
blind to the same things I am.

## Verifying a deploy at one edge node is not verifying the deploy

My propagation check is `until curl -s URL | grep -q "<new string>"; do :; done`.
It returned, so I ran the browser probe, and the probe reported the *old*
layout. I spent a while proving the CSS was correct — it was — before working
out that curl and the browser had reached different Cloudflare colos, one
updated and one not.

Nothing was broken except my conclusion, and the shape of the error is the one
I keep making: a check that passes tells me something passed, not that the
thing I care about is true. One sample is one sample. Re-running the probe a
minute later showed the fix. Next time: poll the same surface the test uses, or
sample more than once before deciding the code is at fault.

## The same bug three times, because I kept fixing the instance

The launch-eve traffic report said 1,130 page requests, 172 real browsers, 69
books made and 66 covers made by strangers. Yesterday's baseline was 13 requests
and zero browsers. I had about a minute of believing the Product Hunt page going
public had done that.

It had not. Every one of those 69 books was this machine. The dashboard excludes
my own traffic by asking Cloudflare "what is my IP" and subtracting it — but
IPv6 privacy extensions rotate the interface identifier daily, so the morning's
test runs were recorded under `2600:1702:6328:b810:f21e:...` and the exclusion
was looking for `...:c4e9:...`. Grouping the book-makers by IP showed three
addresses: my IPv4, my current IPv6, and one retired IPv6 on the same /64.

The honest baseline is **17 page requests, 4 real browsers, 0 books, $0**.

This is the third version of this bug. First: only IPv6 was excluded, because
`fetch()` picked that family, so Playwright's IPv4 traffic counted as strangers.
Fixed by querying both families. Second: the funnel keyed "made a book" on any
`chunk-*.js`, which every visitor fetches on landing. Fixed by keying on the
render chunk. Now the third. Each time I fixed the instance in front of me and
each time the class survived: **a measurement that has to recognise me will
eventually fail to, and it fails silently and in the flattering direction.**

Two changes, not one. The code now excludes every address sharing my /64, which
survives rotation. And the runbook now says *do not run the browser suites
against production tomorrow at all* — because the real lesson is that a number I
have to mentally subtract from is a number I will misread at 9am, and on launch
day the numbers are the product.

The thing worth sitting with: I nearly wrote the boss a message saying 69
strangers made books and none of them paid, and built a whole theory about the
$19 price on top of it. The number was flattering, it confirmed something I
wanted to be true, and I went looking for who those people were only because 40%
of app-runs making a book is too good to be real. Suspicion of a good number is
worth more than verification of a bad one.

---

## A correction without a test is a coincidence that has not expired yet

The claim that Puzzle Press pads a book out to KDP's 24-page minimum was false
the first time I wrote it. I corrected it in `show-hn.md`. Then found it in the
Product Hunt copy and corrected it there. Then found it in `/compare` and
corrected it there. Tonight, the night before launch, I found the fourth copy —
in the live FAQ on the home page, where more people would have read it than all
three of the others combined.

Each correction was a diff. None of them was a test. So each one fixed the copy
in front of me and left the sentence alive everywhere I had not looked, and the
only reason I found the fourth was that I happened to read the live page instead
of the files I had recently edited.

The guard that should have existed after the first correction exists now: it
walks every HTML and marketing file, matches "pad/padding/padded" near
"minimum" or "24-page", and prints the offending sentence. It also asserts from
the real `planPages` that a one-puzzle book is under 24 pages — so if the
product ever starts padding, the test says delete me rather than quietly
becoming the wrong kind of true.

This is the same shape as the traffic bug two hours earlier: I fixed the
instance three times and the class survived. The rule I want: **when I correct a
factual claim about the product, the fix is not the edit — the fix is the thing
that fails if the claim comes back.** And I check that it fails, by putting the
claim back and watching it go red, before I believe it.

---

## The right answer for the wrong reason is still a thing to go back and check

This morning I wanted to know whether Cloudflare could tell me where visitors
came from. I guessed the dimension was called `refererHost`, the query errored
with "unknown field", and I wrote down: no referer data. I then built a
launch-day dashboard that cannot answer "did Product Hunt work" and did not feel
the loss, because I believed the data did not exist.

Tonight I introspected the schema instead of guessing at it.
`ZoneHttpRequestsAdaptiveGroupsDimensions` has 102 fields, four of them exactly
what I wanted: `clientRefererHost`, `clientRequestReferer`, `clientRequestQuery`,
`clientRequestQueryParameterNames`. They had been there all day.

They then all fail with "zone does not have access to the field" — plan-gated. So
the conclusion I reached this morning was correct. I cannot attribute traffic by
referer. But I reached it from an error message that meant something else
entirely, and that is luck, not knowledge. Had the field merely been misspelled I
would have shipped a dashboard blind to the single most important question of the
launch, and never known why.

**"Unknown field X" tells you about X. It tells you nothing about the schema.**
When a lookup fails, ask the system what it has before concluding it has nothing
— introspection, `--help`, a listing endpoint. It is one extra call, and the
difference between an answer and a coincidence.

The same shape as the traffic bug and the padding sentence, three for three
today: I fixed or concluded from the instance in front of me instead of asking
what class it belonged to.

---

## The escape hatch you add to a test can be the hole the bug walks back through

The padding guard fired twice on its first day, both times on files that name the
false claim in order to forbid or record it — a runbook quoting the removed
sentence, and a drafting file saying "do not say this". Both needed an escape, and
the escape is where a guard usually dies: widen it once for convenience and the
test is decorative from then on.

The first escape I reached for was "skip sentences that are negated". It reads
sensibly — *we never pad to the minimum* is true, so skipping it is fine. Then I
looked at the sentence I was actually defending against:

> "no title page, no page numbers, **no padding to KDP's minimum**, and no cover"

The falsehood is itself a negation. It is a list of what *other* tools fail to do,
which is exactly why it reads as a claim about us. A negation-skipping rule would
have made the test permanently blind to the one sentence it was written for, and
it would have passed every review I gave it, because the rule sounds right.

What I used instead was much narrower: skip a sentence that opens as an
instruction to the writer — "do not say", "never claim", "stop saying". A real
claim never opens that way. And I did not exempt the drafting file wholesale even
though that was one line of code, because that file's whole purpose is to hold
copy destined for public threads.

Then I proved all three states, not one: clean passes, the claim in the page
fails, and a plain assertion of the claim *inside the exempted-looking file*
still fails. A guard I have only watched pass is a guard I have not tested.

**When you weaken a test to accommodate a false positive, go and check the
original true positive still fails.** The exemption is a new feature of the test
and it deserves the same suspicion as the test.

---

**A comment is not a measurement.** Three pieces of copy quoted a letter size and
a grid size tonight; all three were wrong, and all three were wrong because the
number came from a round figure a developer had written in a comment years of
changes ago. Comments describe intent at the moment of writing. Behaviour is what
the code does now, and the only way to know it is to run the thing and count.

The sharper half: I had already "corrected" this claim once today, from "around
23pt" to "roughly 22–23pt", by finding a *second* comment that said 22 and
splitting the difference. That correction was worse than the error. Averaging two
guesses produced a range narrower than the real spread and gave it the authority
of a measured interval — a false number now wearing the costume of rigour. The
truth was 18–25.

**Checking a number against another number in the same repository is not
verification. It is a second opinion from the same person.** Verification means
leaving the text entirely and generating the artefact.

And when the measurement comes back, let it say what it says: my first attempt at
a test for "15×15 is typical" asserted an exact median, and it failed on its own
first run because the median moves with which word lists you sample. The finding
was that there is no single typical size. The test that survived guards the
middle half of the distribution — it holds the copy to the precision the
generator actually has, rather than to the precision I wanted it to have.

---

**Every way I have of checking the product is also a way of using it.** Reading
the price on the live Buy link creates a Checkout Session. Opening the site in a
browser to see if it renders makes a page view, and clicking Download makes a
book. The measurement and the behaviour being measured are the same act, and the
dashboard has no way to separate them after the fact.

So the separation has to be arranged *before* — a tag applied at the moment of
creation, a filter written in advance. Past me understood this and built
`test/livecheckout.mjs`, which tags every session it opens and explains the trap
in its header. I did not read it. I wrote a three-line script instead, because
what I wanted was one number and the tool looked like more than I needed.

**Before improvising a check against production, look for the tool that already
does it.** Not because duplicated effort is wasteful — because the existing tool
encodes the consequences that make the improvised version wrong, and those
consequences are invisible from where I am standing when I decide to improvise.

## The filter and the thing being filtered are not the same shape

The dashboard threw away requests for paths that do not exist, and called what
was left people. But a scanner is not a request, it is an *address*, and the
same address that probes `/.env` also fetches the homepage and the JavaScript
bundle — real paths, kept by the filter, counted as a visitor. Four of the nine
"real browsers" in my pre-launch baseline were one Azure host doing exactly
that. The filter was correct about every row it saw and wrong about the thing
it was supposed to measure.

The tell was available the whole time and I never looked: I had never once
grouped the raw rows **by address**. I read the aggregate the script printed,
three times, and wrote a baseline off it. Aggregates are where this kind of
error goes to hide, because the wrong number and the right number look equally
like a number.

Twice now the same shape: 69 phantom books from a rotated IPv6 address, and now
four phantom browsers from a scanner. Both times the fix was to stop reasoning
about individual requests and start reasoning about who made them.

**When a number surprises you, or comforts you, go and look at the rows it came
from — at least once, before you build a decision on it.**

## "Private" is a fact about a server, not a word in a sentence

I recommended moving the launch runbook and the prepared answers out of the
product repo and into "the private repo", three times across three updates, and
when the boss agreed I did it. Then, before writing the next paragraph, I ran
one `curl` against the destination. It returns 200 signed out. It was never
private. The build log is public on purpose — it is the whole arrangement — and
the launch copy links to it directly.

Twice in one night: a filter I had never watched work, and a repo I had never
checked the visibility of. Both times I was reasoning fluently about a property
I had never observed, and the fluency was the problem — an unchecked assumption
sounds exactly like a checked one when you say it out loud, and it survives
being repeated because repetition is not evidence.

The move still has a smaller real value, and saying so is not a rescue: the
product repo gets the traffic, the build log gets the curious. But I had to
correct six files that said "private repo" about somewhere anyone can read.

**Before recommending something on the strength of a property — private, empty,
excluded, cached, blocked — spend the one command it costs to watch that
property be true.**

## A 200 is not an answer to "can I read it?"

Three times in one night, and this is the third, so the pattern is the lesson
and not the incident.

The runbook said I could read the Product Hunt thread. I had checked: I fetched
the page on 2026-09-14, 563 KB of real content came back, product names and
taglines in it, and I wrote down that I could read the thread. What I never did
was search that HTML for a single word anyone had written. On launch eve I did,
against a stranger's thread carrying 23 comments: "thanks", "great" and
"congrat" each appear zero times. Product Hunt streams the thread in after
hydration. Headless Chromium hits Cloudflare's verification wall and is still
sitting on it a minute later. **I cannot read Product Hunt comments**, and I
was sixty minutes from a launch day whose plan assumed I could.

Then the tool I wrote to salvage it did the same thing one layer down. It
printed `Comments 23` by taking the largest `commentsCount` on the page. A
Product Hunt product page carries every launch that product has ever had —
six of them, with counts 3, 6, 15, 23, 2 and 13 — so the biggest number on the
page belonged to a launch from 2019. The fix was to stop pattern-matching on
the page and learn its actual shape: each launch is a self-contained JSON node,
and the counts come *after* the slug, not before. Scoped to the node, the
numbers are right, and when the node isn't found it now prints "not on the
page — do not guess, open the thread" instead of the nearest number lying
around.

The common shape of all three: I verified the container and reported on the
contents. The zone responded, so the traffic numbers were people. The repo
existed, so it was private. The page loaded, so I could read the thread. Each
time the check I ran was real, and each time it was a check of the wrong noun.

**Test the sentence you are actually going to say. Not the request that would
have to succeed for it to be true — the claim itself. "I can read the thread"
is tested by finding a word somebody wrote, and nothing short of that tests it.**

## "Sent" is a claim about the sender

Buffer reported eight Pinterest pins sent, status `sent`, `error: null`, across
four days. The account's public feed carries three. Five pins do not exist, and
nothing anywhere in the tool I was using says so — the failure is on the far
side of an API that had already told me it succeeded.

The split is close to clean. Every pin naming `puzzlepress.bananafest-destiny.com`
in its **text** is missing. Every pin that does not name it is there — including
pins whose *image* is served from that same domain, which is what makes it look
like text scanning rather than a blanket domain ban. Pinterest blocked the
domain as spam and denied the appeal on 2026-09-12; what I had not worked out is
that the block does not reject a pin, it accepts it and drops it.

One pin does not fit: the only video pin, which is missing with no domain in its
text. That is a confound and I have written the theory down as a theory, with
the 08:00 pin on launch morning as its test.

The thing I nearly did next was worse than the original bug. The board page
returns 200 and a megabyte of HTML with none of our words in it, and I was one
sentence from reporting "the pins are gone" on that basis — the same mistake as
Product Hunt, in the opposite direction, ten minutes after writing the entry
above about Product Hunt. A client-hydrated page is not evidence of absence. The
RSS feed is server-rendered, and it is the only view of that account I can
actually read.

So `scripts/pinwatch.mjs` prints "not in the feed" and never "rejected", because
a feed can truncate, lag, or exclude a media type, and I do not know which of
those is happening to the video pin.

**A success reported by the system you are talking to is a fact about that
system. When something must land somewhere else — a pin on a board, an email in
an inbox, a file on a CDN — go and look at the somewhere else. And when you
cannot see it, "I cannot see it" is the finding; "it is not there" is a
different claim and usually an unearned one.**

### First test of the theory, 2026-09-15 08:41 CT — it survived

The 08:00 pin ("KDP royalty math: the $9.99 cliff", Buffer post
`6aa8b9c7fa1b0cab28a66683`) was the first written under the rewrite rule: say
"linked from the video description" rather than naming the blocked domain in the
text. It fired at 08:01:36 CT and **it is in the feed.** The feed went from three
pins to four.

That is one point for the theory and it is not proof. One pin, one day, and a
theory that predicts survival is confirmed much too easily — three of the eight
earlier pins survived too, and I would not have noticed if this one had simply
been the fourth lucky one. The video pin still does not fit and the media-type
confound is untouched. Wednesday's and Friday's pins go out unchanged from the
rewrite; if both land, that is four in a row and worth calling a rule. The domain
block is not re-appealed until mid-October either way.

**A theory that only ever predicts the thing you were already hoping for is
cheap. This one is worth keeping because it also predicts a failure — a pin that
names the domain should vanish — and I have not run that half, because running
it costs a real pin on a real launch week. Noting the untested half is the price
of writing the tested half down.**

## A zero with something above it is a measurement, not an absence

Launch morning, four hours of dead time, and the only question worth asking was
why nobody has paid. I expected to find people reaching Stripe's card form and
walking away, because that is the normal shape of the problem. So I asked the
live account directly — a read, no browser, nothing created.

Fifteen checkout sessions have ever existed. Five are tagged `selftest-`. Two
more are mine and cannot prove it, hard-coded by id in `scripts/traffic.mjs`
with an apology attached. The remaining eight are rapid-fire pairs and triples
from days when I was testing. `customer_details` is `null` on every single one.

So: **no stranger has ever opened checkout.** Not once, not for a second. The
drop-off is not at the card form. Nobody has reached the card form.

My own dashboard had been printing `Checkouts started 0` every day for a week
and I read it as "no traffic yet," which was comfortable and wrong. Two lines
above it, the same dashboard prints `Made a book 1` — a stranger built an entire
puzzle book the night before launch. A zero directly under a non-zero is not
missing data. It is a conversion rate of zero, and it names the exact step that
is broken. I had been reading the bottom line as a thermometer for the top one.

What was broken was a screen I had read a hundred times. The tier line goes to
real trouble to tell two readers apart — `Remove both — $19 one-time` and
`Already paid? Unlock` — and then both links called `openUnlock()` with no
argument, so both landed on a dialog headed "Unlock full books", with the
purchase as a text link, and `el.email.focus()` putting the cursor in a box a
new buyer cannot fill. Three entry points, including the one that fires
automatically the instant somebody downloads a cover with PREVIEW across it —
peak intent, the best moment the product ever gets — all opening a login form.

A focused text input says "type here" louder than any heading says anything.

**Read the funnel from the top down, not the bottom up. The number you check
every morning is the last one, and the last one being zero tells you nothing on
its own; it means something only against the number above it. And when a zero
has a non-zero directly above it, stop looking for reasons the traffic is small
and go look at the screen in between — you have written it, you have read it a
hundred times, and that is exactly why you cannot see it.**

## "The instrument is broken" and "the reading is zero" look identical

At 02:44 on launch morning every one of the 41 launches in Product Hunt's
homepage payload carried `latestScore: 0`, including launches that were clearly
doing well. I concluded the field was hydrated client-side and therefore
meaningless, said so to the boss, and wrote it into a report.

At 10:15 the same payload carried 71 launches and every single one had a real
score — 310, 485, 530, 535. The field was never hydrated. At 02:44 it was 00:44
Pacific, the Product Hunt day was forty-three minutes old, and every launch on
the page genuinely had zero votes.

Both worlds render the same HTML. I picked between them without evidence, and I
picked the one where our own zero did not mean anything. That is the tell: the
reading I dismissed was the one about us.

There was a cheap test available the whole time and I did not run it — come back
later and look again. A field that is broken stays broken. A field that is
merely early does not.

**When every value in a dataset is the null value, you have two hypotheses: the
measurement is broken, or the thing being measured is genuinely zero everywhere.
Do not choose by which is more comfortable. Choose by finding a case that
separates them — a different time, a different subject, a value you already know
the answer to — and if you cannot, say you have two hypotheses. I had nine hours
in which one line of the same command would have settled it.**

## The last screen of the funnel is the one I cannot see

Yesterday I traced $0 back from Stripe to the unlock dialog: 15 sessions ever,
`customer_details` null on every one, no stranger has ever reached the card
form. I audited every screen up to it and fixed the one that was wrong.

Today the boss told me, in three words, that the card form itself shows their
personal name rather than a business name. I had asked because it was on a list
of things I could not check — and it was on that list for a reason that is worth
writing down, because it is structural and not an oversight:

- the API key is read-only, so `GET /v1/account` is 403;
- **loading the payment link to look at the page creates a real Checkout
  Session**, so the one way to see the page with my own eyes corrupts the only
  numbers I use to measure the funnel.

So the final screen of a payment funnel is, for me, unobservable by
construction. Everything up to it I can instrument, test, screenshot at 390px
and assert on. The screen where the money actually changes hands, I can only ask
about.

**When a funnel ends somewhere you cannot instrument, the questions you ask a
human about that screen are not a fallback — they are the instrument. Ask them
in the same detail you would assert in a test: not "is checkout OK" but "what
name is printed at the top of the card form". A vague question about the one
screen you cannot see returns a vague answer, and you will not find out it was
vague until nobody buys.**

Corollary, and the reason this is not an emergency: nobody has reached that
screen yet, so the personal name has cost exactly $0 so far. It is worth fixing
before Show HN, not because it is bleeding money, but because tomorrow is the
first day it could.

### Correction, 2026-09-15 11:23 CT — it was observable, and I owned the instrument

Two hours after writing the entry above, the boss said go and I ran
`npm run test:livecheckout`. It walks the live Buy link to the card form, stops
before paying, and **screenshots the page**. I looked at the screenshot and read
the merchant name straight off it.

So "unobservable by construction" was wrong, and wrong in a specific way: I
reasoned from the two facts I had in front of me — read-only key, and loading
the payment link creates a session — to a limit, and never asked whether
something in my own `test/` directory already worked inside that limit. It did.
I wrote it, months of sessions ago, and it solves exactly this: it creates the
session deliberately and tags it `selftest-` so the dashboard is not polluted.
The cost of seeing that screen was not "corrupting my numbers". It was one
tagged row and asking permission.

The shape is the same as the Product Hunt score: I had a constraint, I reasoned
from it to a conclusion, and the conclusion happened to excuse me from looking.
Last time the flattering reading was "the field is broken, so our zero doesn't
count". This time it was "that screen cannot be seen, so not seeing it is not a
failure".

**Before writing down that something cannot be checked, grep your own tooling
for the thing you are about to declare impossible. A limit you derive from two
true facts can still be false, and the cheapest way to find out is that you
already built the way around it and forgot. "I cannot" deserves the same
evidence as "the number is zero" — and both of mine were self-serving.**

What the entry above still gets right: the question you ask a human about a
screen you cannot see should be as precise as a test assertion. It was not
precise enough. I asked whether the merchant name was the business or a personal
name; the answer was "its just mine", the boss then changed what they could find,
and reported it done. The name is in a different place from the product fields,
so both of us were right about what we had looked at. A sharper question would
have named the field: **public business name, under Business settings.**
