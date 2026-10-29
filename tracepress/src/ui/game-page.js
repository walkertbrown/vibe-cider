// The matching game on screen: the same sets, letters and coloured backs as
// the printed game cards (pdf/cards.js), for a child to play with a finger or
// a mouse. Turn two cards; a pair stays up, two different words turn back.
// Each card is read aloud as it turns, if the browser has a voice. Free, no
// licence: nothing here is printed.
import { planCards, cardsInk, LISTS } from "../pdf/cards.js";
import { px } from "./px.js";

const $ = (id) => document.getElementById(id);
const el = { sets: $("sets"), size: $("size"), speak: $("speak"), speakRow: $("speakRow"), board: $("board"), score: $("score"), won: $("won"), wonText: $("wonText"), again: $("again"), print: $("print"), full: $("full"), game: $("game") };
const css = ([r, g, b]) => `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
const BOLD = 1.6;
const CROP = 6; // points off each edge of the printed card: the screen card is all card, no margin to cut in
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Each word as an SVG image, cut from the printed sheet: the card's strokes
// as one path per run of segments, so a card is a few dozen elements, not a
// thousand. The joint dots the PDF draws are the path's round joins here.
function wordImages(words) {
  const plan = planCards({ sheet: "letter-game", words, tag: "" });
  const page = plan.pages[0];
  const shapes = cardsInk(plan, page, { licensed: true }).filter((s) => !(s.kind === "line" && s.dash) && s.kind !== "text");
  const out = new Map();
  for (const card of page.cards) {
    const inside = (x, y) => x >= card.x && x < card.x + card.w && y >= card.y && y < card.y + card.h;
    const X = (x) => (x - card.x).toFixed(1), Y = (y) => (card.y + card.h - y).toFixed(1);
    let d = "", end = null, width = 1, color = [0, 0, 0];
    const dots = [];
    for (const s of shapes) {
      if (s.kind === "line" && inside(s.x1, s.y1)) {
        if (!end || end[0] !== s.x1 || end[1] !== s.y1) d += `M${X(s.x1)} ${Y(s.y1)}`;
        d += `L${X(s.x2)} ${Y(s.y2)}`;
        end = [s.x2, s.y2]; width = s.width; color = s.color;
      } else if (s.kind === "dot" && inside(s.x, s.y)) dots.push(s);
    }
    const marks = dots.filter((s) => s.r > width / 2 + 0.01).map((s) => `<circle cx="${X(s.x)}" cy="${Y(s.y)}" r="${(s.r * BOLD).toFixed(1)}" fill="${css(s.color)}"/>`).join("");
    // A screen is read from further off than a card on the table: a bolder line.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${CROP} ${CROP} ${card.w - 2 * CROP} ${card.h - 2 * CROP}"><path d="${d}" fill="none" stroke="${css(color)}" stroke-width="${width * BOLD}" stroke-linecap="round" stroke-linejoin="round"/>${marks}</svg>`;
    out.set(card.word, `data:image/svg+xml,${encodeURIComponent(svg)}`);
  }
  return out;
}

// The browser's own voice, if it has one. A voice on the device is picked
// over one the browser fetches, when both are offered.
const voiceOk = "speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function";
let voice = null;
function pickVoice() {
  const en = speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
  voice = en.find((v) => v.localService && /^en[-_]US/i.test(v.lang)) ?? en.find((v) => v.localService) ?? en[0] ?? null;
}
if (voiceOk) { pickVoice(); speechSynthesis.addEventListener?.("voiceschanged", pickVoice); } else el.speakRow.hidden = true;
function say(word) {
  if (!voiceOk || !el.speak.checked) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? "en-US";
    u.rate = 0.85;
    speechSynthesis.speak(u);
  } catch {}
}

const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

let set = "short-a", pairs = 6;
let deck = [], up = [], found = 0, turns = 0, busy = false, nodes = [];

function layout() {
  const n = pairs * 2;
  const narrow = innerWidth < 560;
  const cols = n === 12 ? (narrow ? 3 : 4) : 4;
  el.board.style.setProperty("--cols", cols);
  el.board.style.setProperty("--rows", n / cols);
}

function score() {
  el.score.textContent = `Pairs found: ${found} of ${pairs} · Turns: ${turns}`;
}

function deal() {
  const words = shuffle([...LISTS[set].words]).slice(0, pairs);
  const img = wordImages(words);
  deck = shuffle(words.flatMap((w) => [w, w]));
  up = []; found = 0; turns = 0; busy = false;
  el.won.hidden = true;
  el.board.style.setProperty("--back", css(LISTS[set].back));
  nodes = deck.map((word, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "card";
    b.setAttribute("aria-label", `Card ${i + 1}, face down`);
    b.innerHTML = `<span class="inner"><span class="back"></span><span class="face"><img alt="" draggable="false"></span></span>`;
    b.querySelector("img").src = img.get(word);
    b.addEventListener("click", (e) => turn(i, e));
    return b;
  });
  el.board.replaceChildren(...nodes);
  layout();
  score();
  el.print.href = `/sight-word-flash-cards?list=${set}&sheet=letter-game&pairs=1&backs=1`;
  for (const b of el.sets.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.set === set));
}

function show(i, on) {
  nodes[i].classList.toggle("up", on);
  nodes[i].setAttribute("aria-label", on ? `Card ${i + 1}: ${deck[i]}` : `Card ${i + 1}, face down`);
}

function turn(i, e) {
  const b = nodes[i];
  if (busy || b.classList.contains("up")) return;
  if (e.isTrusted) px("gameflip");
  // The board is sized to fit the screen; bring all of it into view on the first turn.
  if (!turns && !up.length && el.board.getBoundingClientRect().bottom > innerHeight) el.board.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "end" });
  show(i, true);
  say(deck[i]);
  up.push(i);
  if (up.length < 2) return;
  turns++;
  const [a, c] = up;
  up = [];
  if (deck[a] === deck[c]) {
    found++;
    for (const k of [a, c]) { nodes[k].classList.add("got"); nodes[k].disabled = true; }
    score();
    if (found === pairs) setTimeout(win, reduced ? 0 : 700);
    return;
  }
  score();
  busy = true;
  setTimeout(() => { show(a, false); show(c, false); busy = false; }, 1300);
}

function win() {
  px("gamewon");
  el.wonText.textContent = `You found all ${pairs} pairs in ${turns} turns!`;
  el.won.hidden = false;
  say(`Well done! ${pairs} pairs.`);
  el.won.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
  el.again.focus({ preventScroll: true });
}

for (const [key, l] of Object.entries(LISTS)) {
  const b = document.createElement("button");
  b.type = "button";
  b.dataset.set = key;
  b.textContent = l.label;
  b.style.setProperty("--chip", css(l.back));
  b.addEventListener("click", () => { set = key; deal(); });
  el.sets.append(b);
}
el.size.addEventListener("change", () => { pairs = Number(el.size.value); deal(); });
el.again.addEventListener("click", deal);
addEventListener("resize", layout);

// Full screen, for the board at the front of the room. Phones that can't put
// a part of the page full screen (iPhone Safari) don't get the button.
if (document.fullscreenEnabled && el.game.requestFullscreen) {
  el.full.hidden = false;
  el.full.addEventListener("click", (e) => {
    if (document.fullscreenElement) return void document.exitFullscreen();
    if (e.isTrusted) px("gamefull");
    el.game.requestFullscreen().catch(() => {});
  });
  document.addEventListener("fullscreenchange", () => {
    el.full.textContent = document.fullscreenElement ? "Exit full screen" : "Full screen";
  });
}

px("game");
const q = new URLSearchParams(location.search);
if (q.get("set") in LISTS) set = q.get("set");
if (["4", "6", "8"].includes(q.get("pairs"))) { pairs = Number(q.get("pairs")); el.size.value = q.get("pairs"); }
deal();
