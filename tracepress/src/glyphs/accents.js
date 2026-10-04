// Accented letters, so a name like Sofía, José, Zoë, Noël or François traces as it is
// spelled. Before these, the name tool dropped any letter it had no strokes
// for: "Sofía" came out "Sofa".
//
// Each one is its base letter from print.js, written first, then the accent
// as one more stroke, started at the top like every other stroke in the
// manuscript model (print.js). Lowercase accents sit between the midline and
// the headline, where the dot of i and j sits; capital accents sit just
// above the headline, inside the clear space every page keeps between rows
// (GAP_UNITS in page.js). An i or j loses its dot under an accent.
import { PRINT } from "./print.js";

const line = (x0, y0, x1, y1) => ({ type: "line", x0, y0, x1, y1 });
const arc = (cx, cy, rx, ry, from, to) => ({ type: "arc", cx, cy, rx, ry, from, to });
const dot = (x, y) => ({ type: "dot", x, y });

// Each accent drawn over x = c, in the band y0..y0 + h. `half` is how far it
// reaches either side of c, so a narrow letter can be widened to hold it.
const ACCENT = {
  acute: { half: 0.15, draw: (c, y0, h) => [[line(c + 0.15, y0 + h, c - 0.15, y0)]] },
  grave: { half: 0.15, draw: (c, y0, h) => [[line(c - 0.15, y0 + h, c + 0.15, y0)]] },
  circumflex: { half: 0.25, draw: (c, y0, h) => [[line(c - 0.25, y0, c, y0 + h), line(c, y0 + h, c + 0.25, y0)]] },
  diaeresis: { half: 0.25, draw: (c, y0, h) => [[dot(c - 0.2, y0 + h / 2)], [dot(c + 0.2, y0 + h / 2)]] },
  tilde: { half: 0.3, draw: (c, y0, h) => [[arc(c - 0.15, y0 + h / 2, 0.15, h / 2, 180, 0), arc(c + 0.15, y0 + h / 2, 0.15, h / 2, 180, 360)]] },
  ring: { half: 0.18, draw: (c, y0, h) => [[arc(c, y0 + h / 2, 0.18, h / 2, 90, 450)]] },
};

const MARKS = {
  acute: "áéíóúýÁÉÍÓÚÝ",
  grave: "àèìòùÀÈÌÒÙ",
  circumflex: "âêîôûÂÊÎÔÛ",
  diaeresis: "äëïöüÿÄËÏÖÜ",
  tilde: "ãõñÃÕÑ",
  ring: "åÅ",
};

const shift = (seg, dx) =>
  seg.type === "line" ? { ...seg, x0: seg.x0 + dx, x1: seg.x1 + dx }
  : seg.type === "arc" ? { ...seg, cx: seg.cx + dx }
  : { ...seg, x: seg.x + dx };

function compose(ch, accent) {
  const base = ch.normalize("NFD")[0];
  const g = PRINT[base];
  const upper = base !== base.toLowerCase();
  // i and j drop their dot: it is the stroke that is only a dot.
  const strokes = g.strokes.filter((s) => !(s.length === 1 && s[0].type === "dot"));
  const { half, draw } = ACCENT[accent];
  const dx = Math.max(0, half - g.width / 2);
  const width = g.width + 2 * dx;
  const [y0, h] = upper ? [2.12, 0.33] : [1.3, 0.4];
  return { width, strokes: [...strokes.map((s) => s.map((seg) => shift(seg, dx))), ...draw(width / 2, y0, h)] };
}

// The cedilla hangs from the bottom of the c, written after it, top down:
// a short drop, then a hook curling back to the left. The c's bowl bottoms
// out at its centre, so the drop starts on the letter, as a cedilla does.
function cedilla(ch) {
  const g = PRINT[ch.normalize("NFD")[0]];
  const c = g.width / 2;
  const [cx, cy, rx, ry, from] = [c - 0.1, -0.45, 0.26, 0.18, 70];
  const start = [cx + rx * Math.cos((from * Math.PI) / 180), cy + ry * Math.sin((from * Math.PI) / 180)];
  return { width: g.width, strokes: [...g.strokes, [line(c, 0, start[0], start[1]), arc(cx, cy, rx, ry, from, -180)]] };
}

export const ACCENTED = Object.fromEntries([
  ...Object.entries(MARKS).flatMap(([accent, chars]) => [...chars].map((ch) => [ch, compose(ch, accent)])),
  ...[..."çÇ"].map((ch) => [ch, cedilla(ch)]),
]);

// The two marks inside names: Mary-Kate, O'Brien. A hyphen is one stroke
// left to right across the middle of the lowercase letters; an apostrophe one
// short stroke down from the headline.
export const NAME_MARKS = {
  "-": { width: 0.5, strokes: [[line(0, 0.5, 0.5, 0.5)]] },
  "'": { width: 0, strokes: [[line(0, 2, 0, 1.6)]] },
};

// Every letter a name or word can be traced in: A–Z, a–z, these and the two
// marks.
export const LETTERS = { ...PRINT, ...ACCENTED, ...NAME_MARKS };
