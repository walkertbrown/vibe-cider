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
