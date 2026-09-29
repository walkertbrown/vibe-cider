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
| Y | ↘ \| ↙ \| ↓ | 3 |
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
   uppercase, where A, E, F, H, I and Y take 3 or 4 strokes.
4. **Still to source:** lowercase f, and the digits 0–9.
