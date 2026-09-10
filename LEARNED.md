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
