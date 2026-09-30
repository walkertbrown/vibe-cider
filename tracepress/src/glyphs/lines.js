// Pre-writing strokes: the lines, slants, zigzags, waves and circles a child
// traces before letters. Same format and units as the alphabet (print.js):
// baseline 0, midline 1, headline 2, y up, and each stroke a list of segments
// in the order the pencil goes. Kept out of PRINT so the alphabet's own
// checks (glyphs.test.js) stay about letters.
//
// `gap` (guide units) overrides the space between copies in a trace row: 0
// joins the zigzags and waves into one line across the row.
//
// Keys start with "~" so no shape can be mistaken for a character.
import { PRINT } from "./print.js";

const line = (x0, y0, x1, y1) => ({ type: "line", x0, y0, x1, y1 });
const arc = (cx, cy, rx, ry, from, to) => ({ type: "arc", cx, cy, rx, ry, from, to });

export const LINES = {
  "~down": { width: 0.6, strokes: [[line(0.3, 2, 0.3, 0)]] },
  // Above the midline, so the dots aren't lost in its dashes.
  "~across": { width: 2, gap: 0.6, strokes: [[line(0, 1.5, 2, 1.5)]] },
  "~slant-right": { width: 1, strokes: [[line(0, 2, 1, 0)]] },
  "~slant-left": { width: 1, strokes: [[line(1, 2, 0, 0)]] },
  "~zigzag": { width: 1.6, gap: 0, strokes: [[line(0, 2, 0.4, 0), line(0.4, 0, 0.8, 2), line(0.8, 2, 1.2, 0), line(1.2, 0, 1.6, 2)]] },
  // Narrower than 2 each so the pair fits a 5x8 model row with bleed at
  // 1" lines. Over the top, then under: a hump from the midline up to the headline and
  // back, then a dip to the baseline and back.
  "~wave": { width: 1.6, gap: 0, strokes: [[arc(0.4, 1, 0.4, 1, 180, 0), arc(1.2, 1, 0.4, 1, 180, 360)]] },
  // Starts at 2 o'clock and circles back, like o.
  "~circle": { width: 2, strokes: [[arc(1, 1, 1, 1, 60, 420)]] },
  "~cross": { width: 1.5, strokes: [[line(0.75, 2, 0.75, 0)], [line(0, 1, 1.5, 1)]] },
};

// The pages, two shapes each, easiest first.
export const LINE_PAGES = [["~down", "~across"], ["~slant-right", "~slant-left"], ["~zigzag", "~wave"], ["~circle", "~cross"]];

// Everything a page can draw: the alphabet and digits, and these shapes.
export const GLYPHS = { ...PRINT, ...LINES };
