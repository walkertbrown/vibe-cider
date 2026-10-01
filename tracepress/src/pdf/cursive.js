// Cursive, as joined letter outlines for tracing over. The letters come from
// Playwrite US Trad (OFL, public/fonts/PlaywriteUSTrad-OFL.txt), a school
// cursive whose proportions are the four-line guide's: the lowercase body is
// half the height of a capital, tails drop the same half below the baseline.
// So at a font size of 2 guide units it sits exactly on Trace Press's lines.
//
// A cursive font joins by swapping letter shapes for their neighbours and
// adding connector strokes between them. pdf-lib's drawText doesn't do that
// (2026-10-01: none of the 676 lowercase pairs joined), so the text is shaped
// here with fontkit and each shape becomes a plain path mark. The font object
// is passed in, so this file needs no pdf-lib and the web preview can use it.

const EM = 1000; // the font's units per em; checked in test/cursive.test.js

// The shaped glyphs of `text` as ink shapes ({ kind: "path" } in ink.js),
// starting at x with the baseline at baseY, plus how wide the run is.
export function cursiveRun(font, text, { x, baseY, unit, color }) {
  const scale = (2 * unit) / EM;
  const run = font.layout(text);
  const shapes = [];
  let pen = 0;
  run.glyphs.forEach((g, i) => {
    const p = run.positions[i];
    if (g.path.commands.length) {
      // SVG paths run y-down; drawSvgPath and the preview both flip them back.
      shapes.push({ kind: "path", d: g.path.scale(1, -1).toSVG(), x: x + (pen + p.xOffset) * scale, y: baseY + p.yOffset * scale, scale, color });
    }
    pen += p.xAdvance;
  });
  return { shapes, width: pen * scale };
}

// Width of `text` in points at this guide unit, without making any shapes.
export const cursiveWidth = (font, text, unit) => font.layout(text).advanceWidth * (2 * unit) / EM;
