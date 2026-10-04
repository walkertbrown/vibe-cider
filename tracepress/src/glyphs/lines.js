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
import { ACCENTED } from "./accents.js";

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

// Shapes, for the pages after the lines: each from the baseline to the
// headline, starting at the top and, where it's one stroke, going round
// anticlockwise like the circle. The heart is two strokes, a half each, from
// the dip at the top down to the point.
const path = (pts) => pts.slice(1).map((p, i) => line(...pts[i], ...p));
// The star's top point is on the headline and its two bottom points on the
// baseline, so its radius is 2 / (1 + sin 54°).
const STAR_R = 2 / (1 + Math.sin((54 * Math.PI) / 180));
const STAR_W = 2 * STAR_R * Math.cos((18 * Math.PI) / 180);
const star = (() => {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const a = ((90 + 36 * i) * Math.PI) / 180, r = (i % 2 ? 0.42 : 1) * STAR_R;
    pts.push([+(STAR_W / 2 + r * Math.cos(a)).toFixed(4), +(2 - STAR_R + r * Math.sin(a)).toFixed(4)]);
  }
  return pts;
})();
export const SHAPES = {
  "~square": { width: 2, strokes: [path([[0, 2], [0, 0], [2, 0], [2, 2], [0, 2]])] },
  "~triangle": { width: 2.2, strokes: [path([[1.1, 2], [0, 0], [2.2, 0], [1.1, 2]])] },
  "~rectangle": { width: 3.2, strokes: [path([[0, 2], [0, 0], [3.2, 0], [3.2, 2], [0, 2]])] },
  "~diamond": { width: 1.6, strokes: [path([[0.8, 2], [0, 1], [0.8, 0], [1.6, 1], [0.8, 2]])] },
  "~star": { width: +STAR_W.toFixed(4), strokes: [path(star)] },
  "~heart": { width: 2, strokes: [[arc(0.5, 1.5, 0.5, 0.5, 0, 200), line(0.0302, 1.329, 1, 0)], [arc(1.5, 1.5, 0.5, 0.5, 180, -20), line(1.9698, 1.329, 1, 0)]] },
};

// The pages, after the lines and before A: one shape each, since two side by
// side (4.1 to 4.8 units) are wider than the widest letter pair, W w (3.6),
// and leave a 5x8 page at 1" lines.
export const SHAPE_PAGES = [["~square"], ["~triangle"], ["~rectangle"], ["~diamond"], ["~star"], ["~heart"]];

// Everything a page can draw: the alphabet and digits, the accented letters
// (accents.js), and these shapes.
export const GLYPHS = { ...PRINT, ...ACCENTED, ...LINES, ...SHAPES };
