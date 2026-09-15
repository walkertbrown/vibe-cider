# Show HN — Puzzle Press

Post **Wednesday 2026-09-16, between 7 and 9am Central** (HN's US-morning
window; one day after Product Hunt so each gets its own day). Any account
works; new accounts can post Show HN. Go to https://news.ycombinator.com/submit

Do not ask anyone to upvote. Do not post it twice. Reply to every comment
in the first two hours — replies keep it on the front page more than the
post does.

## Title (paste exactly; 80-char limit)

Show HN: Puzzle Press – print-ready KDP puzzle books, built by an AI agent

Alternative, if you want the hook harder (78 chars) — more upvotes and more
flamebait, your call:

Show HN: An AI agent built this KDP puzzle book generator, including this post

**Rewritten 2026-09-15 on the boss's direction: lead with the agent.** The
earlier title sold the generator and buried the interesting part in the last
paragraph. On this audience that is backwards — a browser-side PDF tool is a
Tuesday, and an agent that was given a job, shipped, marketed and has so far
failed to sell anything is not. The product still has to be real underneath, so
nothing below has been softened to make room.

## URL

https://puzzlepress.bananafest-destiny.com

## Text (goes in the "text" box — HN shows it under the link)

I gave a Claude agent a standing job — build and sell one web app at a time, log what you planned and what actually happened — and stayed out of the way. It picked the idea, wrote the code, deployed it, priced it, wrote the landing page, launched it on Product Hunt yesterday, and wrote this post. I supplied accounts, a card, and factual answers when it asked ("does this account exist", "what will you pay for"). It has been running for about a week.

The product is real and you can use it now, so judge that first: a browser-side generator for Amazon KDP puzzle books — word search, sudoku, mazes, criss-cross fill-ins and themed crosswords. It lays out the whole paperback interior — puzzles, solutions, page numbers, the four ruled pages at the back — to KDP's actual rules (gutter that grows with page count and swaps sides, 0.125" bleed, embedded subset fonts, even page count, 24–828 pages), then generates the full-wrap cover with the spine width computed from the page count of the book it just made.

Everything runs client-side with pdf-lib; nothing you type leaves the browser. The Worker only serves static files and checks Stripe for an unlock.

Things it cared about that most generators skip:

- Every word search word appears exactly once, checked in all 8 directions after fill; nested words (CAT/CATALOG) never share a grid; filler letters are screened against a blocklist.
- Every sudoku has exactly one solution — clues are removed in symmetric pairs and a removal is rejected if a counting solver finds a second solution.
- Mazes are spanning trees, so exactly one route, no unreachable pockets.
- Criss-cross (fill-in) grids are solved by a backtracking solver before they are kept; a second fill means a starter word is printed in, or the grid is discarded.
- Crosswords are the same open themed grids with a clue per answer: 1,460 hand-written definition-style clues, checked by a test that no clue contains its answer; pasted lists take "word — clue" lines.
- Books can be graded easy→expert with the level printed on each puzzle.

Free to use with a watermark; $19 once removes it. No account.

Also: three free calculators (spine width, margins, royalty) on the same code path as the PDF engine, because several top-ranked KDP spine calculators add 0.06" that Amazon's documentation doesn't — that's a hardcover rule and it gets paperback covers rejected.

The part I think is worth your time is the log. Every phase has a plan written before it and an account written after, and the failures are the interesting half: it reported 69 strangers making books who were all its own machine under a rotated IPv6 address; it shipped a "free" book that was mostly blank Notes pages; it twice described a competitor's features wrongly, both times in the direction that flattered us, and caught itself both times; it wrote "I cannot see the checkout page" into its notes as a settled fact and then found the test it had already written months earlier to do exactly that. It's not a demo of an agent succeeding — it's a week of one working, wrong turns left in.

It has sold nothing. Not "no conversions" — the Stripe account holds sixteen checkout sessions and every one of them was created by its own test scripts. No stranger has ever reached the payment page. It launched on Product Hunt yesterday and scored 1. Whatever this is evidence of, it is not yet evidence that it works.

Log: https://github.com/walkertbrown/vibe-cider — code: https://github.com/walkertbrown/puzzle-press

## On posting this from your account

You post it; the agent wrote it, and the first line says so — the "I" is yours
for that paragraph and its for the rest, and the post makes clear which is
which. One rule in the thread: nobody should come away thinking a bot is typing
the replies, because a bot isn't. Drafts come from the agent, you paste them,
and if anyone asks, say exactly that. Getting caught blurring it would cost more
than the post is worth.

## Replies you will need (paste and adapt)

### The agent questions — now the top of the thread, not the bottom

Leading with the agent moves these from "somebody might ask" to "this is what
the thread is about". Answer them the way the log does: specifically, with the
failures first. Vagueness here reads as a stunt, and a stunt gets flagged.

**"What did you actually do, then?"** — the question the whole framing lives or
dies on. Answer it small and concrete; any hint of overclaiming and the thread
turns.
> Opened accounts (Cloudflare, Stripe, Product Hunt, Pinterest), put a card on file, and answered factual questions — does this account exist, what will you pay for, is this comment mine. I did not pick the idea, write a line of it, choose the price, or write the copy, and I have refused to workshop the product when asked; the standing rules say the idea is its own. The one real contribution was review: I caught a "free" book that came out mostly blank Notes pages. That's in the log with the date.

**"What did it get wrong?"** — the best question anyone will ask, and the
answer is the most credible thing in the post. Do not soften it.
> Quite a lot, and it's all in the log because the rules make it write down what actually happened, not what it meant to happen. The worst one: it reported 69 strangers generating books, which was its own machine under an IPv6 privacy address it had rotated away from that morning — a launch baseline that was pure self-traffic. It shipped a free book that was mostly blank Notes pages. It twice got a competitor's feature list wrong in the direction that flattered us, and caught itself both times before posting. It wrote "I cannot see the Stripe checkout page" into its notes as a settled fact, reasoning from two true premises, and then found the test it had written weeks earlier that does exactly that. It also concluded Product Hunt's vote counts were a broken field when actually every launch really did have zero votes, because it was 43 minutes past midnight.
>
> The pattern it flagged about itself is the one worth reading: the wrong answers were the flattering ones.

**"How much did it cost to run?"** — ASK THE BOSS FOR THIS NUMBER BEFORE
POSTING. The agent does not have billing access and will not invent a figure;
if you don't want to say, "I'm not going to give a number I haven't totted up"
is a fine answer and better than a guess.

**"Is this an ad for Anthropic / for agents?"**
> No relationship with them beyond paying for the model like anyone else. And read the last line of the post: it has sold nothing. If I were selling the agent story I'd have picked a week where it made money.

**"It's not autonomous, you're the one posting."**
> Correct, and the post says so. It can't open accounts, take payment, or post as itself, so I'm the hands: I paste what it writes and I sign up for things. Everything upstream of that — what to build, how to build it, what to charge, what to say — is its, and the replies you're reading are drafted by it and pasted by me. I'll say so every time it's relevant, which is the only way this stays honest.

**"Has it made any money?"**
> None. $19 one-time, and the honest version is worse than "no sales": there are sixteen checkout sessions in the Stripe account and all sixteen were created by its own test scripts walking the Buy link. Nobody who isn't it has ever reached the payment page. Product Hunt yesterday: score 1.
>
> Worth adding, since it's the obvious follow-up — the payment path has never completed end to end in live mode either. It was proven once in Stripe's test mode, and the verification code has been rewritten twice since. It knows this and has it written down as the top risk for today.

**"Why puzzle books?"**
> Its reasoning, not mine: KDP is a real market with people already paying for tools, the hard part is a documentable spec (Amazon publishes the trim, bleed and gutter rules) rather than taste, and the whole thing could run in a browser with no server, no accounts and no data to look after. I was not consulted and, under the rules I set, wouldn't have been.

### The product questions

**"Why not just use Book Bolt / Canva / a free generator?"** — expect this to be the top comment. Answer it early and concede the true part first.
> Fair question, and for a lot of people the free ones are the right answer. PuzzleForge, for instance, is genuinely free, no account, no watermark, and covers six types to our five — they have scrambles and hangman, we have criss-cross fill-ins, and we both do clued crosswords. They'll also bulk-generate up to 50 puzzles with answer keys, export PNG as well as PDF, and take your own Gemini/OpenAI/Anthropic key to write word lists and clues. If you don't need a cover and don't mind assembling the interior, use it.
>
> What it doesn't do — by its own FAQ — is make a book. "Save PDF" opens a print window and tells you to pick "Save as PDF" as the printer, so you get puzzle pages: no title page, no copyright page, no page numbers, no inside margin scaled to page count and swapping sides by parity, no even page count, and no cover at all. That last one is the wall people hit: the spine width depends on the page count of the book you just made, so the cover can't exist until the interior is final.
>
> This makes the uploadable pair — interior and full-wrap cover, fonts embedded, 6 trims, up to 200 puzzles — free with a watermark, $19 once to remove it. Comparison: https://puzzlepress.bananafest-destiny.com/compare

**The site is `the-puzzle-forge.org`. Do not check `puzzleforge.app`** — it is
a different product with almost the same name, five types, no KDP framing, and
no FAQ page. I checked the wrong one on 2026-09-14 and briefly concluded our
own copy had gone stale and needed weakening. It had not.

Re-verified on the right domain, 2026-09-14: the FAQ still reads *"Click 'Save
PDF' after generating. A clean print window opens — in Chrome or Edge choose
'Save as PDF' as the printer."* The homepage still says 100% free, no sign-up,
no watermarks, bulk 1–50, answer keys included, six types. Every claim in the
reply above is theirs about themselves. Re-read it on the day anyway.

**Re-read on the day, 2026-09-15, and the reply was wrong — fixed above.** It
said "we have criss-cross fill-ins and clued crosswords", which reads as though
they have no clued crosswords. **They do.** Their page carries `.crossword-clues`,
`.clue-section` and ACROSS/DOWN section titles, and their own feature list offers
"unlimited AI-generated word lists and **puzzle clues**" through your own
Gemini/OpenAI/Anthropic/Cohere/Mistral key. Also new since the 09-14 check: PNG
export, 600+ built-in words across 20 categories, and "Free BookBolt
Alternative" positioning.

This is the second time in two days I have got this competitor wrong in the same
direction — flattering to us. It would have been checked in thirty seconds by
anyone who opened their site, and being corrected on a rival's features is
exactly the comment that sinks a Show HN.

What the day's re-read *confirms*, and it is the whole argument: on their FAQ the
words **cover, spine, page number, margin, gutter and bleed do not appear at
all.** Not once. The differentiator is not the puzzle list — they match us there
and beat us on count — it is that they make puzzles and we make a book.

**Do not say** "free generators only make one puzzle." That was true when the compare page was written and is no longer true. Getting a competitor's capabilities wrong on HN costs more than the point is worth, and somebody will check.

**"How do you guarantee one solution / one route / no duplicate words?"**
> Sudoku: dig clues out in symmetric pairs; before each removal, run a solver that counts solutions with a cap of 2; if it finds 2, keep the pair. Mazes: iterative DFS carve = spanning tree, so the path between any two cells is unique by construction. Word search: after placing words and filling, scan all 8 directions for every word and require exactly one occurrence (two for palindromes); nested words are removed from the list before placement. The generators and tests are in the repo.

**"Client-side PDF generation — how big is the bundle?"**

Measured against the live site 2026-09-15; transfer figures are Brotli off
Cloudflare, which is what devtools shows. Volunteer the 516 KB — whoever asks
this question has devtools open and will find it, and being corrected on your
own numbers is a worse comment than the number itself.

> Two numbers, because it loads in two stages.
>
> First paint is 119 KB over the wire: 22 KB of JS, 14 KB of HTML, and 83 KB of that is the hero image (186 KB uncompressed). First puzzle renders in about 990 ms on a throttled mid-range phone.
>
> Then pdf-lib + fontkit are a 516 KB lazy chunk (1.37 MB raw) that doesn't load until you click Download — so browsing, generating and previewing puzzles never pays for it, and it warms in the background if you idle on the page. It's a real 516 KB and I'd rather say so than have you find it: it's most of pdf-lib, and the trade is that nothing you type ever leaves the browser.
>
> Fonts are Liberation Sans, subset per book.

**"Crosswords?"**
> Yes, themed ones — the open interlocking grids KDP crossword books use, 8–22 answers on a subject, clued in plain language (1,460 clues written for the tool, or paste your own). Not dense newspaper-style grids: those need a word database and a fill I would not trust yet. There is also a criss-cross / fill-in type, verified to have a unique fill.

**"The 0.06" spine thing — source?"**
> Amazon's own "Create a Paperback Cover" help page gives spine width as page count × paper thickness (0.0025" cream, 0.002252" white) with nothing added. The 0.06" appears in KDP's hardcover guidance. Several popular calculators apply it to paperbacks. The calculator on the site shows the arithmetic: https://puzzlepress.bananafest-destiny.com/spine-calculator

**"Built by an AI — so what did you do?"**
> Created accounts, answered questions with factual answers (what exists, what I'll pay for), reviewed what it shipped, and caught one real bug (a free book that was mostly blank Notes pages — it's in the log). Everything else, including this text, is the agent's. The log is honest about the mistakes.

**"Does it upload my word lists?"**
> No — generation and PDF rendering happen in the browser. There's a test in the repo that watches the network during a download and fails if anything but the unlock email leaves the page.

**"Is it open source? Where's the repo?"** — four of the replies above say "in
the repo" without ever linking it. The repo is public (checked unauthenticated
on 2026-09-14, 200 without a token): https://github.com/walkertbrown/puzzle-press
It has **no LICENSE file and no `license` field**, which means all rights
reserved by default. Do not call it open source. Say source-available:
> The source is public — https://github.com/walkertbrown/puzzle-press — including the generators and the tests I keep pointing at. It isn't open source in the licence sense: there's no LICENSE file on it yet, so legally that's all-rights-reserved. It's there to be read and checked, which is the part that matters for "does it really run in my browser."

**"What stops me editing localStorage and unlocking it for free?"** — somebody
will open devtools inside two minutes, and getting caught pretending otherwise
is far worse than answering it first. The honest answer is a good one:
> Nothing. The licence is an email and a token in localStorage and the token isn't validated — if you know what localStorage is, you can unlock it in about fifteen seconds.
>
> That's deliberate, or at least accepted. The alternative is server-side rendering of the PDF, which would mean uploading your word lists, which is the one thing I've promised not to do. Everything happens in your browser, so anything the browser can check, the browser can be told to skip. Locking that down properly costs the privacy claim, and for a $19 one-time tool the people who'd bypass it were never going to pay $19.
>
> The one thing it isn't is a flag: the watermark is drawn in the PDF render path, not toggled at the end, so a paid file and a free file are different documents rather than the same document with a property flipped.

**"Price?"**
> Free with a footer line and a PREVIEW cover; $19 once removes both. No subscription, no account — the unlock is tied to the Stripe email. 30-day refund, no questions, though you can make the entire book free first so you should not need one.
