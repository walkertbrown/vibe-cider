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
