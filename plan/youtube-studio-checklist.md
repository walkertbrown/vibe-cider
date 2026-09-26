# YouTube Studio checklist, for one sitting (written 2026-09-26)

Each item is a change on a video that is already live, so it has to be made in YouTube Studio on the boss's account; Buffer cannot edit sent posts. The reason for each is in `actual/2026-09-26.md`. Tick them off here, or just tell me they are done.

## 1. Related video on every Puzzle Press Short

Studio → Content → Shorts → open each one → **Related video** → "How to make a KDP puzzle book in 60 seconds" (`ph6q2ih6cBs`) → Save. This puts a clickable link inside the Short, under the channel name.

- [ ] `W6RQSZvffMY`: royalty calculator (68 views)
- [ ] `uKGoCuyMiJ8`: making a book
- [ ] `ivTWiVtvW3I`: spine
- [ ] `v0-cvmEOcEk`: five kinds
- [ ] `UDwBuUHuz1M`: groundwood
- [ ] the large-print Short, after it posts at 09-27 00:30Z

## 2. Titles: lead with the words people type

YouTube's own autocomplete offers "kdp word search generator", "free word search generator for kdp" and "kdp puzzle generator". We rank for none of them. A Short titled "Free Word Search Puzzle Generator For Amazon KDP Books…" ranks on 251 views. Our calculator Shorts, whose titles lead with "KDP … calculator", do rank (spine #3).

- [ ] `uKGoCuyMiJ8`: "Making a KDP puzzle book in under a minute (free tool) #KDP #wordsearch" → **Free KDP word search generator: a 60-puzzle book and its cover, in real time**
- [ ] `ph6q2ih6cBs`: "How to make a KDP puzzle book in 60 seconds (word search, sudoku, mazes — free tool)" → **Free KDP puzzle book generator: word search, sudoku and mazes, book and cover in 60 seconds**
- [ ] `ivTWiVtvW3I`: "KDP Spine Width Calculator — Most of Them Add 0.06" Too Much" → **KDP Spine Width Calculator: Top-Ranked Ones Add 0.06" Amazon Doesn't** ("most" was never measured; two were)

Each new title describes what that video shows. I checked against `scripts/video.mjs` and the videos' own descriptions.

## 3. `ph6q2ih6cBs` description: tracked links

Replace the four URLs:

| Now | Replace with |
|---|---|
| `https://puzzlepress.bananafest-destiny.com` | `https://puzzlepress.bananafest-destiny.com/go/yt` |
| `…/how-to-make-a-puzzle-book` | `https://puzzlepress.bananafest-destiny.com/go/ytguide` |
| `…/spine-calculator` | `https://puzzlepress.bananafest-destiny.com/go/ytspine` |
| `…/royalty-calculator` | `https://puzzlepress.bananafest-destiny.com/go/ytcalc` |

All four return a 302 to the right page (checked 09-26).

## 4. Channel: a second link

- [ ] Customisation → Basic info → Links → add title `Free KDP royalty calculator`, URL `https://puzzlepress.bananafest-destiny.com/go/ytcalc`
