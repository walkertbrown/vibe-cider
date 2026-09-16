# Facts

Only factual answers the boss has given in conversation. Date it. Use their words. Do not invent a resource, a customer, a number, or an answer they did not give.

They will not help with the idea. Do not file their silence as approval of a product.

When they answer something, append it here, then say so in the conversation.

## Current app

**Puzzle Press** — chosen 2026-09-10. A browser-side generator that turns a word list into a print-ready, KDP-spec word-search puzzle book PDF (puzzles + solution pages, correct trim size, margins, bleed). Free tier is limited and watermarked; one-time payment unlocks full books. Target buyer: people who publish low-content books on Amazon KDP.

The idea is mine. The boss did not suggest it.

## Given

- 2026-09-10 — Cloudflare token: asked whether a workers.dev account and the "cider" token exist now. Answer: "I will create when you ask, but I'd like you to decide the plan first."
- 2026-09-10 — GitHub push credentials (`.git-credentials` missing): "I will get that for you."
- 2026-09-10 — Payments: "I currently have stripe, why do you prefer one of the others?"
- 2026-09-10 — Marketing platforms: "I can create an account for whatever. I have a reddit I can post to, fairly new. and reddit groups generally don't allow advertising your products."
- 2026-09-10 — Cloudflare plan: "yes currently free plan"
- 2026-09-10 — "you have everything you need" (re: GitHub push credentials and the Cloudflare token).
  - Observed, same day: `/home/walker/vibe-cider/.git-credentials` contained a GitHub line `https://walkertbrown:github_pat_…@github.com`. Git authenticated with it but the push was refused: `remote: Permission to walkertbrown/vibe-cider.git denied to walkertbrown` (HTTP 403) — the token lacks Contents/write.
  - Observed, minutes later: that GitHub line is gone; the file now holds only `CLOUDFLARE_API_TOKEN=cfat_…` and `CLOUDFLARE_ACCOUNT_IS=9e429253fcf4a0516d138dd8b4e5be53`. Git has no credential to read at all.
  - Cloudflare token is a valid account-owned token for "Walkertbrown@gmail.com's Account" (9e429253…) but has no Workers permission: `/accounts` returns success, every `/accounts/<id>/workers/*` endpoint returns error 10000 "Authentication error", and `wrangler deploy` exits 1 without uploading.
- 2026-09-10 — Cloudflare token scope: "It is on there scoped to the domain bananafest-destiny.com"
  - Verified: the token lists exactly one zone — `bananafest-destiny.com` (4169ea6b…), status active, plan "Free Website". Zone endpoints succeed (`dns_records`, `workers/routes`, `settings/ssl` all return success:true). Account-level Workers endpoints still return 10000 "Authentication error".
  - Fact recorded: this job's Cloudflare account owns the domain **bananafest-destiny.com**.
- 2026-09-10 — Studio name and domain: "We will use puzzlepress.bananafestdestiny.com.... Bananafest-Destiny is our app development studio name. Everything we make will be under that name"
  - Note: the registered zone is **bananafest-destiny.com** (hyphenated). `bananafestdestiny.com` (no hyphen) has no DNS and is not in this Cloudflare account. Deployed to the hyphenated spelling: `puzzlepress.bananafest-destiny.com`.
- 2026-09-10 — Tokens updated: Cloudflare token now has account Workers permission (`/workers/scripts` returns success). GitHub line restored to `.git-credentials`, but `git push` still fails: `remote: Permission to walkertbrown/vibe-cider.git denied to walkertbrown` (403).
- 2026-09-10 — "I made you your own puzzlepress repo" → `walkertbrown/puzzle-press` (public, default branch `main`, seeded with a README).
  - Verified: the GitHub token can **write** to `walkertbrown/puzzle-press` but still **not** to `walkertbrown/vibe-cider` (403 `Permission to walkertbrown/vibe-cider.git denied to walkertbrown`). The token appears scoped to the app repo only.
- 2026-09-10 — "ok I put in the key": `STRIPE_KEY=rk_test_…` (restricted, TEST mode) and `PAY_URL=https://buy.stripe.com/test_6oU8wR4Z026hf3lgFVeIw00` added to `.git-credentials`.
  - Verified: key reads Checkout Sessions (200). Set as a Worker secret with `wrangler secret put STRIPE_KEY` — it is not in the repo.
  - Verified: the payment link's success URL is already `https://puzzlepress.bananafest-destiny.com/?paid=1`, and the product reads "Puzzle Press — Puzzle Book created for you! — $19.00 per puzzle book". Stripe account display name on checkout: "Walker Brown".
  - Verified by a real test-mode purchase (`cs_test_a1feUnfz7vGt5E`, complete, paid, $19.00 USD): buyer paid, was redirected back, unlocked with the purchase email, downloaded a 30-puzzle/38-page book with no watermark, and the unlock survived a reload.
- 2026-09-10 — Support address: "you can give them support@bananafest-destiny.com", then "Also support@bananafest-destiny.com totally works" with a screenshot showing a message from a different Gmail account arriving in the inbox, mailed-by porkbun-email.com.
  - My own delivery test was inconclusive because I sent it from the same mailbox the alias forwards to, and Gmail does not deliver you a copy of your own message. The boss's test used a different sender, which is the correct way to check a forward. Address published on the site.
- 2026-09-11 — Boss: "I'm not buying one." (Will not make a live $19 test purchase.)
- 2026-09-11 — Boss: "I'll take care of console." (Search Console indexing requests.)
- 2026-09-11 — Boss: "I can make you a reddit account and post to it if you'd like. I won't use mine. I can make you whatever accounts."
- 2026-09-11 — Boss created accounts and connected them to Buffer (MCP): Pinterest business account `bananafestdestiny` (five boards, named as I suggested) and YouTube channel `Bananafest Destiny`. Buffer free plan: 3 channels, 10 scheduled posts. Buffer account timezone America/Chicago. "I can make you whatever accounts."
- 2026-09-11 — Boss, on queuing the five Pinterest pins and the YouTube Short from Buffer: "do it." Queued.
- 2026-09-11 — Boss uploaded the landscape video to the Bananafest Destiny YouTube channel: https://youtu.be/ph6q2ih6cBs (verified public via oEmbed; title as I supplied; channel handle @BananafestDestinyDev).
- 2026-09-11 — Boss claimed `puzzlepress.bananafest-destiny.com` on the Pinterest account (sent me `<meta name="p:domain_verify" content="69a0b4d0…">`; "it just said success and then unclaim. So we should be good"). Verified by Pinterest at 3:28pm CT.
- 2026-09-11 — Boss, on Search Console indexing for the guide and the three type pages, and the Pinterest blocked-site appeal: "THose things are both already taken care of."
  - 2026-09-12 — Correction from the boss on the Pinterest appeal: "how do I file the appeal. I never did." Search Console stands; the appeal is not filed as of 2026-09-12.
- 2026-09-12 — Boss, creating a pin by hand on pinterest.com with the link `https://puzzlepress.bananafest-destiny.com/`: Pinterest shows "Sorry! We blocked this link because it may lead to spam." (screenshot). Filing the appeal under "A Pin from my website is blocked for Spam".
- 2026-09-12 — Pinterest spam-block appeal: "submitted" (boss, ~1am CT).
- 2026-09-12 — Boss sent a screenshot of bookbolt.io/pricing/ (taken ~1:30am CT): **Pro** "$0.66/day · *$19.99/mo, billed annually" (struck-through $0.79/day), "For your first published books", includes "Puzzle, crossword & sudoku creation tools", "Cover & interior designer (Book Bolt Studio)", "1,000 monthly AI credits"; **Premium** "$0.99/day · *$29.99/mo, billed annually" (struck-through $1.18/day), "Everything in Pro, plus 4,000 monthly AI credits…"; both "Start My Free Trial — Full access for 3 days · cancel in two clicks". Month-to-month prices not shown in the screenshot.
- 2026-09-12 — Boss: "Pinterest denied the site" (the spam-block appeal for puzzlepress.bananafest-destiny.com was refused).

- 2026-09-13 — on the dashboard showing one real (JavaScript-running) visitor
  in 24 hours: "that was probably me as well."
- 2026-09-13 — Asked whether "Successful payments" is switched on under Stripe's
  customer emails on the live account, boss: "it is." So a live buyer does get a
  Stripe receipt, and the address on that receipt is the one the unlock expects.

2026-09-13 — Reddit. Boss has an account and can hand it over: **u/wubbydubbybubby22**.
Their words: "I have never really used the account, but it is old." So: aged, but
effectively no posting history. Karma and cake day not yet known — asked.
Boss then sent the profile numbers: **23 karma, 22 contributions, 6 years old,
0 followers, 0 gold, active in 4 communities.** Six years clears every
account-age filter. 23 karma clears the low minimums (10) and fails the higher
ones (50, 100).
Boss then created a Reddit-only password for that account and sent it, because I
had asked whether they could hand me the login. Not recorded here and not stored
anywhere on disk. It is unusable from this machine in any case: reddit.com
returns 403 to every request from here — curl with a browser user-agent, the
public `about.json` and `rules.json` endpoints, and the fetch tool alike. I
cannot read a subreddit, check the account, or verify a rule. Reddit is a
channel I can write for and never see.

2026-09-13 — r/KDP rules, pasted by the boss (I cannot reach Reddit to read them
myself). Two that decide everything:
- **Rule 1, "No Book Promotion."** "r/KDP no longer allows book promotions. Any
  such submissions will be removed." The sidebar then names where to promote
  instead: Facebook, Instagram, YouTube, Pinterest, TikTok, Amazon Ads, Google
  Ads, Pinterest Ads, Facebook Ads.
- **Rule 2, "No Amazon Product Links."** No Amazon book links of any kind.
  "Links outside the Amazon ecosystem are allowed **in comments only** if they
  are how-to guides or directly helpful to the OP in context."
Moderators listed: u/Awkward_Blueberry_48, u/FirefighterLocal7592,
u/Fun-Attitude-2546, u/ricardofayet. The last of those is Reedsy's — the sidebar
links Reedsy's KDP guide as the resource, which says who is watching for
self-promotion.
So r/KDP has no post shaped like a launch. The only thing that is permitted
there is a comment on somebody else's question, and a link only when it is a
how-to and answers what they actually asked.

2026-09-14 — Product Hunt launch scheduled, link pasted by the boss:
https://www.producthunt.com/products/puzzle-press/puzzle-press/prelaunch
That prelaunch URL is 404 to anyone signed out — it is the boss's editing view.
The public page is **https://www.producthunt.com/products/puzzle-press** (200,
readable by me unauthenticated), and the discussion forum path is `/p/puzzle-press`.

Read out of that page's own HTML, not a summary of it:
- **Post id 1250478, `createdAt` 2026-09-15T00:01:00-07:00** — scheduled
  correctly for 12:01am PT Tuesday, which is 2:01am CT.
- `og:description` is our description, exactly as written.
- Eight images uploaded (7 PNG + 1 GIF on ph-files.imgix.net), which matches the
  thumbnail plus the seven gallery files.
- **`og:title` and `<title>` read "Puzzle Press: Print-ready word search books
  for Amazon KDP".** The tagline field says *word search*, not *puzzle*. Flagged
  to the boss the same morning; the packet's tagline is "Print-ready puzzle books
  for Amazon KDP".

2026-09-14 19:55 — the boss pasted the launch URL:
**https://www.producthunt.com/products/puzzle-press?launch=puzzle-press**

Verified from the page's own HTML, unauthenticated, from this machine:
- `/posts/puzzle-press` **404s.** Product Hunt no longer uses the `/posts/<slug>`
  form I had guessed at in the runbook; a launch lives at the product page with
  a `?launch=` parameter. The guessed URL in `launch-day.md` was wrong.
- The tagline is now **"Print-ready puzzle books for Amazon KDP"** in `<title>`,
  `og:title` and the embedded JSON. The boss's fix landed; the "word search"
  version recorded above is gone.
- `firstPost` is id **1250478**, `createdAt` **2026-09-15T00:01:00-07:00**.
- `"latestLaunch":null` and `"postsCount":0` — which is what an unlaunched
  product looks like. **This is the tell for "has it gone live yet":** after
  2:01am CT `latestLaunch` becomes non-null and `postsCount` becomes 1. One
  cheap check, no login, no hammering.
- `discussionForum` id 738670 at `/p/puzzle-press`, with no threads yet.
- Outbound website link is `https://puzzlepress.bananafest-destiny.com/?ref=producthunt`.
- This machine's IP is **no longer bot-challenged** by Product Hunt — the block
  from this morning's 401-request loop has expired. 200, 225KB of real HTML.

2026-09-14 — Cloudflare zone analytics cannot attribute traffic by referer on
this plan. `clientRefererHost`, `clientRequestReferer`, `clientRequestQuery` and
`clientRequestQueryParameterNames` all exist in the schema (introspected
`ZoneHttpRequestsAdaptiveGroupsDimensions`, 102 dimensions) and all four return
"zone ... does not have access to the field". Readable dimensions are
`clientRequestPath`, `clientIP`, `userAgent`, `clientCountryName`. So the
`?ref=producthunt` on the outbound link is invisible to me, and Product Hunt
traffic is identifiable only by timing.

2026-09-15 00:5x — **Both repositories are public, and the boss confirms that is
intended.** Checked signed-out: `github.com/walkertbrown/puzzle-press` 200,
`github.com/walkertbrown/vibe-cider` 200, and
`raw.githubusercontent.com/walkertbrown/vibe-cider/main/marketing/launch-day.md`
200. Asked whether the build log should be made private now that `marketing/`
lives in it — the launch runbook, the prepared answers, the Pinterest
spam-block note. Answer: **"public is fine."**

So nothing written anywhere in either repository is unpublished. `marketing/`
stays where it is and the split is about what belongs where, not secrecy. Do not
propose privatising either repo again, and do not write anything into them on
the assumption a stranger will not read it.

2026-09-15 — **The Stripe checkout page shows the boss's personal name, not a
business name.** Asked whether the merchant display name on the card form reads
Bananafest Destiny or a personal name. Answer: **"its just mine."**

I cannot see this myself and cannot fix it: the key is `rk_live_…` and read-only,
`GET /v1/account` returns 403 (needs `connected_account_read`), and loading the
payment link to look at the page would create a real Checkout Session. The
statement descriptor is already "PuzzlePress" — that part is right; it is the
public business name on the account that is the personal one.

2026-09-15 11:1x — **The single Product Hunt comment is the boss's own maker
comment**, posted in the first minutes per §8 of `ph-schedule-packet.md`. Asked
because the count read 1 and I had read 0. Answer: **"that's what the comment
is. it is mine."**

So the thread has had no comment from a stranger all day. `ACCOUNTED = 1` in
`app/scripts/phwatch.mjs` now carries this, and the script says "nothing unread"
below 2 and names the number above it. Raise the constant when a comment is
pasted.

2026-09-15 11:23 CT — **The business name change did not take.** The boss said
Stripe was done; the product half was (image renders, description reads
"Unlimited print-ready KDP puzzle books — no watermark, one-time payment", price
$19.00, no sandbox badge). The name half was not. `npm run test:livecheckout`
screenshots the live card form, and the personal name appears three times on it:

    Walker Brown                     (top left, beside the icon)
    Pay Walker Brown                 (the heading, above $19.00)
    ...provided by Walker Brown      (the terms line under the Pay button)

The field is the account's **public business name**, not anything on the product
or the payment link. Stripe falls back to the individual's name when the account
has no business name set.

Also visible on that page, and not previously known: checkout is **Link-first**.
The right panel is Link-branded, the card fields sit behind a "Card" accordion,
and the footer says "Sold through Link".

2026-09-15 11:3x — **The Stripe public business name is the boss's own name, and
always has been.** Told, after I reported the card form reading "Pay Walker
Brown" three times: *"the business public detail is and has always been my
name."* So that field is not unset and did not fail to save — it is set to their
name, which is why checkout says what it says.

Do not report this as a bug again. If it is ever to change it is the boss's
decision and not a defect, and the field is Settings -> Business -> Public
details -> Public business name.

2026-09-16 — Boss pasted a Cloudflare Web Analytics beacon snippet with a
token (`b7be686eebf64639b0e60d43860bbd54`) and said "Use this for cloudflare
analytics." Added to all 44 public HTML pages (the two generator scripts,
`scripts/type-pages.mjs` and `scripts/word-list-pages.mjs`, plus the 6
hand-written pages), rebuilt, deployed. Verified live on the homepage and a
sample theme page. This is Cloudflare's separate client-side Web Analytics
product — cookieless, no PII, pageview/referrer/country only — distinct from
the zone-level GraphQL analytics already used in `scripts/traffic.mjs`, which
cannot see referrers on this plan. This finally makes "was that visitor from
Product Hunt" answerable instead of inferred from timing.

2026-09-16 09:4x CT — **No prior Hacker News account.** Asked whether the
account used to attempt the Show HN post is old or new (HN's own gate blocked
the post, citing "users who aren't yet familiar with the site"). Answer:
**"I didn't have one before."** So there is no older, more-established account
to fall back on — Show HN via this route is blocked until the account has some
genuine history on it. `marketing/show-hn.md` corrected; it previously said
any account, including new ones, could post.
