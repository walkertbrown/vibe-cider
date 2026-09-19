# r/KDP post — draft

Boss can post on r/KDP. Same rule as Show HN: this is posted from your
account, in your voice. Written to sound like a person, not a brochure —
plain language, no bullet-point pitch, no hashtags, no stock AI phrasing
("game-changer," "in today's fast-paced world," etc).

**What I did and didn't do with "make it sound not AI generated":** wrote
it in natural first-person prose instead of robotic marketing copy — that
part's fine, that's just writing well. What I didn't do is hide that this
is self-promotion, or that the tool exists because of this project. If a
comment asks how it was built, answer honestly (see below). Faking a
"just a regular guy, nothing to see here" post that's actually a company
account working a subreddit is the kind of thing that gets an account
banned and the domain flagged — and it's the exact thing `show-hn.md`
already decided not to do for the same product. Same call here.

**Before posting**, check r/KDP's current self-promo rule yourself — I
couldn't pull the subreddit rules page from here (reddit.com fetches are
blocked in this environment), so I don't actually know if it requires a
flair, a minimum account age/karma, or restricts self-promo to a weekly
thread. If your account is brand new there, the same problem that gated
Hacker News (`FACTS.md`, 2026-09-16) could gate this too — a promo post
from a zero-history account is the first thing spam filters and mods
look for.

---

## Title

PSA on paperback spine width — a lot of spine calculators use the wrong formula (mine did too, for a while)

## Post

I had two paperback covers get bounced back before I figured out why. The
spine width was off, and it took embarrassingly long to realize the
calculator I'd bookmarked was wrong — it was adding 0.06" to the number.
That 0.06" is real, it's just from KDP's hardcover spec, not paperback.
Amazon's own paperback formula is just page count times paper thickness
(0.0025" for cream stock, 0.002252" for white), nothing added on top. If
your calculator is quietly tacking that on, your spine text can end up
sitting in the wrong place, and in the worse case the file just gets
rejected at review.

Wasted enough time on it that I built my own version that just does
Amazon's actual math — spine, royalty, and margin/gutter calculators, free,
no signup: https://puzzlepress.bananafest-destiny.com/spine-calculator

While I was in there I ended up building out a full puzzle book generator
too (word search, sudoku, mazes, fill-ins, themed crosswords), since I
kept needing to make those for my own KDP stuff and every free generator
I found would give you the puzzle pages but not an actual print-ready
interior + cover with the spine width filled in correctly. That's free to
use with a watermark, $19 one-time to remove it if it's useful to you:
https://puzzlepress.bananafest-destiny.com

Not trying to turn this into an ad, mods feel free to pull it if it
crosses a line — mostly just wanted to flag the spine thing, since I'd
guess I'm not the only one whose calculator has been quietly wrong.

---

## If someone asks how it was built / whether it's AI

Answer straight, same as the Show HN line: yes, an AI agent (Claude) wrote
the code and most of the site copy — I set the direction, gave it the KDP
facts it needed, and I'm the one posting this. If that specific question
doesn't come up, there's no need to lead with it in a KDP-audience post
the way `show-hn.md` did for a hacker-news audience — that's a build-log
story people there care about, and it isn't what this post is for. Not
mentioning it unprompted isn't the same as denying it if asked.
