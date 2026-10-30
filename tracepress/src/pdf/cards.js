// Sight word flash cards: each word large on a 3" × 5" (or 4" × 6") card,
// several cards to a sheet with dashed lines to cut along, or one card a page
// for printers that feed index cards. Optionally a dotted copy of the word on
// guide lines under it, to trace. Pure, like name.js: the page previews it
// without pdf-lib.
import { GLYPHS } from "../glyphs/lines.js";
import { sample } from "../glyphs/print.js";
import { LETTERS } from "../glyphs/accents.js";
import { PT } from "./kdp.js";
import { pageInk, GREY, BASE, PICTURE_W } from "./ink.js";
import { pictureFor } from "./pictures.js";
import { LABEL_PT, LINE_W, LETTER_GAP } from "./page.js";

// Dolch's lists, as on /sight-word-tracing-workbook, then a dozen CVC words
// for each short vowel, the sets a teacher sorts a matching game by.
// `back`: the colour of the set's card backs, so a mixed pile sorts by set.
export const LISTS = {
  "pre-primer": { label: "Dolch pre-primer", back: [0.16, 0.42, 0.72], words: "a and away big blue can come down find for funny go help here I in is it jump little look make me my not one play red run said see the three to two up we where yellow you".split(" ") },
  primer: { label: "Dolch primer", back: [0.45, 0.3, 0.65], words: "all am are at ate be black brown but came did do eat four get good have he into like must new no now on our out please pretty ran ride saw say she so soon that there they this too under want was well went what white who will with yes".split(" ") },
  "short-a": { label: "Short a", back: [0.18, 0.55, 0.35], words: "cat bat hat map cap can fan van bag jam ram pan".split(" ") },
  "short-e": { label: "Short e", back: [0.6, 0.3, 0.2], words: "bed red pen hen ten net jet wet leg peg web vet".split(" ") },
  "short-i": { label: "Short i", back: [0.78, 0.22, 0.3], words: "pig dig wig pin fin bin tip lip sit hit kit lid".split(" ") },
  "short-o": { label: "Short o", back: [0.1, 0.5, 0.55], words: "dog log hog pot hot dot mop top box fox cot rod".split(" ") },
  "short-u": { label: "Short u", back: [0.85, 0.5, 0.12], words: "bug rug mug hug cup pup sun run bun nut hut tub".split(" ") },
};

// Short vowel words with a clear outline picture, for matching a word to its
// picture: on screen in the game, and printed as cards. As pairs, each word's
// second card is its picture; as single cards, the picture sits above the word.
export const PICTURE_SET = { label: "Word and picture", back: [0.55, 0.2, 0.5], words: "cat bat map van bag rat bed pen egg tent bell pig pin fish gift ship milk dog box mop sock clock lock bug cup sun bus truck mug".split(" ") };
// The share of a card the picture takes above its word.
const PIC_SHARE = 0.55;

// Page and card sizes in points. The cards on a sheet touch, so each cut line
// runs straight across the sheet, the way a paper trimmer cuts.
export const SHEETS = {
  "letter-3x5": { label: '3" × 5" cards, 4 on a US Letter sheet', page: [11 * PT, 8.5 * PT], card: [5 * PT, 3 * PT], cols: 2, rows: 2 },
  "a4-3x5": { label: '3" × 5" cards, 4 on an A4 sheet', page: [841.89, 595.28], card: [5 * PT, 3 * PT], cols: 2, rows: 2 },
  "letter-4x6": { label: '4" × 6" cards, 2 on a US Letter sheet', page: [8.5 * PT, 11 * PT], card: [6 * PT, 4 * PT], cols: 1, rows: 2 },
  "letter-game": { label: '2.5" game cards, 12 on a US Letter sheet', page: [8.5 * PT, 11 * PT], card: [2.5 * PT, 2.5 * PT], cols: 3, rows: 4 },
  "a4-game": { label: '2.5" game cards, 12 on an A4 sheet', page: [595.28, 841.89], card: [2.5 * PT, 2.5 * PT], cols: 3, rows: 4 },
  "card-3x5": { label: 'One 3" × 5" card a page, for index cards', page: [5 * PT, 3 * PT], card: [5 * PT, 3 * PT], cols: 1, rows: 1 },
};

export const OWN_BACK = [0.25, 0.25, 0.45]; // your own words' backs

export const WORD_MAX = 12; // characters on one card
export const WORDS_MAX = 240; // 60 sheets of four
const PAD = 0.25 * PT; // clear space inside a card's edge
const GAP = 0.3; // between solid letters, in units, before the stroke's own width
const SOLID = 0.11; // a solid letter's stroke, as a share of its unit
const CUT = { width: LINE_W, color: GREY, dash: [6, 4] };

// Words typed or pasted, one per line or split by commas or spaces. Only the
// letters there are strokes for are kept; a word with none is dropped.
export function cleanWords(s) {
  return String(s ?? "").replace(/[‘’ʼ]/g, "'").split(/[\s,;]+/)
    .map((w) => [...w].filter((ch) => LETTERS[ch] && GLYPHS[ch]).join("").slice(0, WORD_MAX))
    .filter((w) => /\p{L}/u.test(w)).slice(0, WORDS_MAX);
}

// A glyph's ink, top and bottom, in units from the baseline.
const tall = new Map();
function extent(ch) {
  if (!tall.has(ch)) {
    const ys = GLYPHS[ch].strokes.flat().flatMap((seg) => sample(seg, 12).map(([, y]) => y));
    tall.set(ch, { minY: Math.min(...ys), maxY: Math.max(...ys) });
  }
  return tall.get(ch);
}

// A word's width in units, with `gap` units between letters.
const span = (word, gap) => [...word].reduce((w, ch) => w + LETTERS[ch].width, 0) + gap * (word.length - 1);

// Letters of `word` centred on cx, `gap` units apart.
function lineUp(word, cx, unit, gap) {
  let x = cx - (span(word, gap) * unit) / 2;
  return [...word].map((ch) => { const l = { ch, x }; x += (LETTERS[ch].width + gap) * unit; return l; });
}

// `words`: the cards, in order. `trace`: add the dotted copy. `tag`: a small
// grey label in each card's corner (the list's name), or none. `pairs`: each
// word twice, for a matching game, with every sheet holding whole pairs so
// one sheet is one game. `back`: a colour to print on the back of every card,
// as a page after each sheet, for printing double-sided.
// `pictures`: draw each word's picture too (see PICTURE_SET).
export function planCards({ sheet = "letter-3x5", words = LISTS["pre-primer"].words, trace = false, tag = "", pairs = false, back = null, pictures = false } = {}) {
  const s = SHEETS[sheet] ?? SHEETS["letter-3x5"];
  const [W, H] = s.page, [cw, ch] = s.card;
  const geom = { width: W, height: H };
  const x0 = (W - s.cols * cw) / 2, y0 = (H - s.rows * ch) / 2; // the grid's bottom left
  const inW = cw - 2 * PAD, inH = ch - 2 * PAD;
  const given = words.length ? words : LISTS["pre-primer"].words;
  const half = Math.max(1, Math.floor((s.cols * s.rows) / 2));
  const list = !pairs ? given : given.flatMap((w, i) => (i % half ? [] : [...given.slice(i, i + half), ...given.slice(i, i + half)]));
  // Which cards are a word's second copy: the picture card, in a picture pair.
  const second = !pairs ? [] : given.flatMap((w, i) => (i % half ? [] : [...given.slice(i, i + half).map(() => false), ...given.slice(i, i + half).map(() => true)]));

  // One letter size for the whole set, so "a" and "yellow" match as printed
  // cards do: as big as the widest word allows, and no taller than its share
  // of the card. The trace copy gets the rest of the card under it.
  const wordH = pictures && !pairs ? inH * (1 - PIC_SHARE) : inH;
  const solidH = trace ? wordH * 0.55 : wordH;
  let unit = solidH / 3.2;
  for (const w of list) unit = Math.min(unit, inW / (span(w, GAP + SOLID) + SOLID));
  let tUnit = (wordH - solidH) / 3.4;
  for (const w of list) tUnit = Math.min(tUnit, inW / (span(w, LETTER_GAP) + 1));

  const pages = [];
  const per = s.cols * s.rows;
  for (let i = 0; i < list.length; i += per) {
    const cards = list.slice(i, i + per).map((word, k) => {
      const j = i + k;
      const col = k % s.cols, row = Math.floor(k / s.cols);
      const x = x0 + col * cw, y = y0 + (s.rows - 1 - row) * ch; // reading order: across, then down
      // In a pair, the second of each word's two cards is its picture.
      const pic = !pictures ? null : !pairs ? "above" : second[j] ? "only" : null;
      return { word, x, y, w: cw, h: ch, pic };
    });
    pages.push({ cards });
    if (back) pages.push({ cards, back });
  }
  return { geom, sheet: s, unit, tUnit, trace, tag, pages, grid: { x0, y0, x1: x0 + s.cols * cw, y1: y0 + s.rows * ch } };
}

// The line of text on a free sheet: under the cards, or at the foot of a
// card printed alone.
export const CARDS_FOOTER = "Free sight word cards from tracepress.bananafest-destiny.com";

// A back is one block of colour over the whole grid and BLEED past it, so a
// printer that shifts the second side by a few millimetres still covers every
// card. Every card's back is the same and the grid is centred, so the back
// lines up whichever edge the printer flips on.
export const BLEED = 0.25 * PT;
function backInk({ geom, sheet, grid, tag }, page) {
  const alone = sheet.cols * sheet.rows === 1;
  const b = alone ? 0 : Math.max(0, Math.min(BLEED, grid.x0 - 0.125 * PT, grid.y0 - 0.125 * PT));
  const out = alone
    ? [{ kind: "rect", x: 0, y: 0, w: geom.width, h: geom.height, color: page.back }]
    : [{ kind: "rect", x: grid.x0 - b, y: grid.y0 - b, w: grid.x1 - grid.x0 + 2 * b, h: grid.y1 - grid.y0 + 2 * b, color: page.back }];
  if (tag) for (const c of page.cards) out.push({ kind: "text", text: tag, x: c.x + c.w / 2, y: c.y + c.h / 2 - 5, size: 14, font: "bold", color: [1, 1, 1] });
  return out;
}

export function cardsInk(plan, page, { licensed = false } = {}) {
  if (page.back) return backInk(plan, page);
  const { geom, sheet, unit, tUnit, trace, tag, grid } = plan;
  const out = [];
  const alone = sheet.cols * sheet.rows === 1;
  if (!alone) {
    for (let c = 0; c <= sheet.cols; c++) {
      const x = grid.x0 + c * sheet.card[0];
      out.push({ kind: "line", x1: x, y1: 0, x2: x, y2: geom.height, ...CUT });
    }
    for (let r = 0; r <= sheet.rows; r++) {
      const y = grid.y0 + r * sheet.card[1];
      out.push({ kind: "line", x1: 0, y1: y, x2: geom.width, y2: y, ...CUT });
    }
  }
  const sw = Math.max(1.5, unit * SOLID);
  for (const card of page.cards) {
    const cx = card.x + card.w / 2;
    let inTop = card.y + card.h - PAD;
    const inBottom = card.y + PAD;
    if (card.pic) {
      // The picture: the whole card on its own, or the top of the card above its word.
      const boxH = card.pic === "only" ? inTop - inBottom : (inTop - inBottom) * PIC_SHARE;
      const size = Math.min(card.w - 2 * PAD, boxH) * (card.pic === "only" ? 0.8 : 0.9);
      const midY = inTop - boxH / 2;
      out.push({ kind: "outline", paths: pictureFor(card.word), x: cx - size / 2, y: midY + size / 2, scale: size / 24, width: Math.max(PICTURE_W, size / 16), color: BASE });
      if (card.pic === "only") {
        if (tag) out.push({ kind: "text", text: tag, x: card.x + PAD + tag.length * 1.9, y: card.y + card.h - PAD / 2 - LABEL_PT / 2, size: LABEL_PT, font: "regular", color: GREY });
        if (!licensed && alone) out.push({ kind: "text", text: CARDS_FOOTER, x: cx, y: card.y + 5, size: LABEL_PT, font: "regular", color: GREY });
        continue;
      }
      inTop -= boxH;
    }
    const solidBottom = trace ? inBottom + (inTop - inBottom) * 0.45 : inBottom;
    // The solid word, its ink centred in its share of the card.
    const ext = [...card.word].map(extent);
    const top = Math.max(...ext.map((e) => e.maxY)), bottom = Math.min(...ext.map((e) => e.minY));
    const baseY = (inTop + solidBottom) / 2 - ((top + bottom) / 2) * unit;
    for (const { ch, x } of lineUp(card.word, cx, unit, GAP + SOLID)) {
      for (const seg of GLYPHS[ch].strokes.flat()) {
        const pts = sample(seg, 32).map(([gx, gy]) => [x + gx * unit, baseY + gy * unit]);
        if (seg.type === "dot") { out.push({ kind: "dot", x: pts[0][0], y: pts[0][1], r: sw * 0.75, color: BASE }); continue; }
        for (let i = 1; i < pts.length; i++) out.push({ kind: "line", x1: pts[i - 1][0], y1: pts[i - 1][1], x2: pts[i][0], y2: pts[i][1], width: sw, color: BASE });
        for (const [px, py] of pts) out.push({ kind: "dot", x: px, y: py, r: sw / 2, color: BASE });
      }
    }
    if (trace) {
      const half = (span(card.word, LETTER_GAP) + 1) * tUnit / 2;
      const row = { kind: "trace", unit: tUnit, baseY: inBottom + 1.2 * tUnit, left: cx - Math.max(half, (card.w - 2 * PAD) / 2), right: cx + Math.max(half, (card.w - 2 * PAD) / 2),
        letters: lineUp(card.word, cx, tUnit, LETTER_GAP).map((l) => ({ ...l, marks: false })) };
      out.push(...pageInk({ box: null, rows: [row] }, { licensed: true }));
    }
    if (tag) out.push({ kind: "text", text: tag, x: card.x + PAD + tag.length * 1.9, y: card.y + card.h - PAD / 2 - LABEL_PT / 2, size: LABEL_PT, font: "regular", color: GREY });
    if (!licensed && alone) out.push({ kind: "text", text: CARDS_FOOTER, x: cx, y: card.y + 5, size: LABEL_PT, font: "regular", color: GREY });
  }
  if (!licensed && !alone) out.push({ kind: "text", text: CARDS_FOOTER, x: geom.width / 2, y: grid.y0 / 2 - LABEL_PT / 2, size: LABEL_PT + 1, font: "regular", color: GREY });
  return out;
}
