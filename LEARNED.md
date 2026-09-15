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
