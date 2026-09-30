# Trace Press: stroke order for the print alphabet (notes, 2026-09-29)

This is the reference for the single-stroke print alphabet in the build plan
(item 2). It is notes, not code.

**Source:** "Zaner-Bloser Handwriting: Manuscript Stroke Descriptions", a
5-page handout hosted by a school district (sharpschool.com). I read each page
as an image as well as text, because the columns interleave when extracted as
text. The Zaner-Bloser website also has a kindergarten teacher-edition
sample. Zaner-Bloser's own "Basic Strokes Form the Foundation" page
(zaner-bloser.com, RG0123N_download_strokes.pdf) confirms the model builds
every manuscript letter and numeral from four strokes: vertical, horizontal,
circle, diagonal. Directions: pull down, push up, slide right or left, circle
back or forward, slant left, right or up. That's the whole segment vocabulary
the glyph table needs.

**What I take and what I don't:**
- **Taken:** the *order and direction* of strokes: where the pencil starts,
  which way it goes, and when it lifts. That's the fact a parent needs.
- **Not taken:** Zaner-Bloser's wording, their letter drawings, or their name.
  The product won't say "Zaner-Bloser" (it's their trademark) or claim to
  match any school's model. Pages say "vertical print, stroke order shown".
  D'Nealian (slanted, with tails) and other models differ. A second model
  would be a later option, not a version 1 feature.

## Notation

| Mark | Meaning |
|---|---|
| ↓ ↑ | pull down / push up, straight. ↑ after ↓ **retraces the same line** |
| → ← | slide right / left |
| ↘ ↙ ↗ | slant |
| ⟲ | circle back: counter-clockwise, starting at about 2 o'clock |
| ⟳ | circle forward: clockwise |
| ( | curve back, part of a circle; ) curve forward |
| `|` | lift the pencil; the next stroke gets the next number |

## Lowercase

| | Strokes | Starts |
|---|---|---|
| a | ⟲ full; ↑; ↓ | 1 |
| b | ↓; ↑; ⟳ | 1 |
| c | ⟲ part | 1 |
| d | ⟲ full; ↑; ↓ | 1 |
| e | →; ⟲ | 1 |
| f | **the handout is wrong here:** its lowercase f text copies uppercase F. Check another source before drawing it | ? |
| g | ⟲ full; ↑; ↓ then ( below the baseline | 1 |
| h | ↓; ↑ ) ↓ | 1 |
| i | ↓ \| dot | 2 |
| j | ↓ ( \| dot | 2 |
| k | ↓ \| ↙ ↘ | 2 |
| l | ↓ | 1 |
| m | ↓; ↑ ) ↓; ↑ ) ↓ | 1 |
| n | ↓; ↑ ) ↓ | 1 |
| o | ⟲ full | 1 |
| p | ↓; ↑; ⟳ full | 1 |
| q | ⟲ full; ↑; ↓ ) | 1 |
| r | ↓; ↑ ) | 1 |
| s | ( ) | 1 |
| t | ↓ \| → | 2 |
| u | ↓ ) ↑; ↓ | 1 |
| v | ↘ ↗ | 1 |
| w | ↘ ↗ ↘ ↗ | 1 |
| x | ↘ \| ↙ | 2 |
| y | ↘ \| ↙ (the long stroke goes below the baseline) | 2 |
| z | → ↙ → | 1 |

## Uppercase

| | Strokes | Starts |
|---|---|---|
| A | ↙ \| ↘ \| → | 3 |
| B | ↓ \| → ) ← → ) ← | 2 |
| C | ⟲ part | 1 |
| D | ↓ \| → ) ← | 2 |
| E | ↓ \| → \| → short \| → | 4 |
| F | ↓ \| → \| → short | 3 |
| G | ⟲ part; ← | 1 |
| H | ↓ \| ↓ \| → | 3 |
| I | ↓ \| → \| → | 3 |
| J | ↓ ( \| → | 2 |
| K | ↓ \| ↙ ↘ | 2 |
| L | ↓ → | 1 |
| M | ↓ \| ↘ ↗ ↓ | 2 |
| N | ↓ \| ↘ ↑ | 2 |
| O | ⟲ full | 1 |
| P | ↓ \| → ) ← | 2 |
| Q | ⟲ full \| ↘ | 2 |
| R | ↓ \| → ) ← ↘ | 2 |
| S | ( ) | 1 |
| T | ↓ \| → | 2 |
| U | ↓ ) ↑ | 1 |
| V | ↘ ↗ | 1 |
| W | ↘ ↗ ↘ ↗ | 1 |
| X | ↘ \| ↙ | 2 |
| Y | ↘ \| ↙ ↓ (no lift before the ↓) | 2 |
| Z | → ↙ → | 1 |

The handout also covers ? and !, not digits. Digits need another source.

## What this changes in the build plan

1. **The glyph table is a list of strokes, and each stroke is a list of
   segments.** A stroke is `{ start, segments: [line | arc(cw/ccw)] }`. The
   start dots and numbers come from the stroke index, and the arrows from each
   segment's direction. So one table gives the model letter, the dotted trace
   and the stroke-order overlay. The "all 62 glyphs inside the guides" test
   walks the same table.
2. **Retraces are the hard case:** a, b, d, g, h, m, n, p, q, r, u. The ↑
   runs back up the ↓ just drawn. Dotted, the two overlap and look like one
   line, and an arrow on each would sit on top of the other. Draw the dots
   once and put the ↑ arrow beside the line, not on it. A test should check
   that no two arrows land within one arrow-width of each other.
3. **Nineteen lowercase letters take one stroke.** Only i, j, k, t, x and y
   lift (f is unknown). So the numbered start dot matters most for the
   uppercase, where A, E, F, H and I take 3 or 4 strokes. (Corrected 13:50Z: Y is 2. The handout has no "Lift" between the slant and the pull down.)
4. **Still to source:** the digits 0–9. Lowercase f was sourced 2026-09-29: Zaner-Bloser manuscript stroke descriptions (sharpschool.com PDF) and primarylearning.org, "Start below the headline. Curve back. Pull down to the baseline. Start at the midline. Slide right."

## Digits 0–9: sourcing so far (2026-09-30 06:40Z)

Not drawn yet. One source has per-digit directions, and I want two that
agree before a child copies them.

- **Source 1: school "Letter and Number Formation" page**
  (app.oncoursesystems.com/school/webpage/11411880/1429955). These are
  rhymes, and the page names no handwriting program. Read as strokes:
  - 0: start at the top, curve (direction not stated), close the loop.
  - 1: top to bottom.
  - 2: half a moon, then slide right along the bottom.
  - 3: two backward c's, top then bottom.
  - 4: down and over, *back at the top* and down: 2 strokes.
  - 5: down, big belly, *hat on top* last: 2 strokes, hat after.
  - 6: from the top, down and around, close the loop.
  - 7: across the top, then down.
  - 8: an S, then "shut the gate" back up: 1 stroke.
  - 9: a magic c (counter-clockwise), up, then down the line.
- **Not usable:**
  - Zaner-Bloser's K teacher sample stops before its numerals unit
    (pp. 105ff).
  - The media.zaner-bloser.com practice pack fails certificate checks.
    Don't fetch it unverified.
  - The OT Toolbox says only "all of the numbers start at the top".
  - Tools To Grow lists worksheet titles only.
- **Still open:**
  - 0's direction. My guess is counter-clockwise from the top, like the
    letter o, but it needs a source.
  - Whether 5's hat is the second stroke.
  - Whether 8 starts like S at the top right.
  - Next to try: the tes.com "number formation 0-9" resource, or a
    state education department handout.

## Digits 0–9: sourced (2026-09-30 07:35Z)

**Source 2, the authority:** Handwriting Without Tears, "Number Formation
Chart" (© 2013), a free PDF linked from lwtears.com/resources/letter-number-formation-charts.
I read the text and the rendered page, including the arrows and the
stroke numbers on 4 and 5. It agrees with source 1 (the school rhymes)
on every digit.

| Digit | Start | Path | Strokes |
|---|---|---|---|
| 1 | top | ↓ big line down | 1 |
| 2 | top left | big curve forward (clockwise) over the top and down to the bottom-left corner, then → along the bottom | 1 |
| 3 | top left | little curve forward to the middle, then a second little curve forward to the bottom-left | 1 |
| 4 | top left | ↓ to the middle, then → across \| lift, top right ↓ big line down | 2 |
| 5 | top left | ↓ to the middle, then a little curve forward around \| lift, → little line on top | 2 |
| 6 | top | down and curve back (counter-clockwise) into a closed loop at the bottom | 1 |
| 7 | top left | → across the top, then slant down-left | 1 |
| 8 | top centre | curve back (↙) into an S, then straight up across the waist, closing the top loop back to the start (drawn as ⟲⟳↗⟲) | 1 |
| 9 | top right, below the headline | little curve back (↙, counter-clockwise), closed at its corner, ↑ up to the top corner, then ↓ big line down (retracing) | 1 |
| 0 | top centre | ↙ counter-clockwise all the way round | 1 |

- **4 is open:** a vertical first stroke, not a diagonal. The chart
  shows stroke 1 as ↓ and stroke 2 as ↓. Source 1 agrees: "back at the
  top and down some more".
- Digits are full height, headline to baseline, like capitals.
- **Rejected:** classweekly.com's number formation post. The page still
  contains a chat model's leftover ("All 5 posts are complete. Here is a
  summary of what was delivered"). Its 2 and 3 "start at the upper
  right, curve left", which draws them backwards. Don't cite it.
- As with the letters, I take the order and direction and nothing else.
  No HWT wording, drawings or name on the product.
