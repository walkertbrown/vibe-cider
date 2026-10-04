// Writes src/pdf/pictures.js: the outline pictures a word page can carry,
// copied out of Tabler Icons (MIT, in node_modules/@tabler/icons), and, for
// animals Tabler doesn't draw, Lucide (ISC, node_modules/lucide-static), which
// uses the same grid and stroke. Only the
// words listed here ship, so the browser bundle stays small. Every Tabler
// outline icon is a 24 × 24 grid of <path> elements with a 2-unit round
// stroke; the paths are kept as they are.
// Usage: node scripts/pictures.mjs (after changing WORDS)
import { readFileSync, writeFileSync } from "node:fs";

// word -> Tabler outline icon name
const WORDS = {
  // Halloween
  bat: "bat", cat: "cat", moon: "moon", mask: "mask", leaf: "leaf", bone: "bone", star: "star", wand: "wand",
  skull: "skull", candy: "candy", ghost: "ghost-2", grave: "grave-2", apple: "apple", acorn: "acorn", spider: "spider",
  candle: "candle", cookie: "cookie", pumpkin: "pumpkin-scary", lollipop: "lollipop", mushroom: "mushroom",
  // Thanksgiving
  mug: "mug", cake: "cake", bowl: "bowl", home: "home", bread: "bread", wheat: "wheat", maple: "leaf-maple",
  glass: "glass", carrot: "carrot", cherry: "cherry", teapot: "teapot", pepper: "pepper", feather: "feather", seedling: "seedling",
  // Christmas
  ball: "ball-basketball", gift: "gift", bell: "bell", sock: "sock", book: "book", train: "train", robot: "robot",
  sleigh: "sleigh", snowman: "snowman", reindeer: "deer", deer: "deer", ornament: "christmas-ball", snowflake: "snowflake",
  gingerbread: "cookie-man", tree: "tree",
  // Everyday words a buyer may type
  dog: "dog", fish: "fish", sun: "sun", car: "car", key: "key", cup: "cup", umbrella: "umbrella", heart: "heart",
  boat: "sailboat", bus: "bus", bike: "bike", plane: "plane", rocket: "rocket", flower: "flower", lemon: "lemon",
  cloud: "cloud", rain: "cloud-rain", butterfly: "butterfly", bug: "bug", paw: "paw", crown: "crown", shirt: "shirt",
  shoe: "shoe", glasses: "eyeglass", clock: "clock", lamp: "lamp", chair: "armchair", bed: "bed", door: "door",
  window: "window", pencil: "pencil", scissors: "cut", pizza: "pizza", milk: "milk", horse: "horse", pig: "pig",
  egg: "egg", balloon: "balloon", piano: "piano", tent: "tent", anchor: "anchor", flag: "flag", cactus: "cactus",
  plant: "plant", tractor: "tractor", truck: "truck", helicopter: "helicopter", scooter: "scooter", rainbow: "rainbow",
  camera: "camera", phone: "phone", backpack: "backpack", school: "school", globe: "globe", map: "map", dice: "dice",
  bucket: "bucket", shovel: "shovel", hammer: "hammer", ladder: "ladder", bottle: "bottle", flame: "flame", fire: "flame",
  // Transportation
  ship: "ship", kayak: "kayak", caravan: "caravan", forklift: "forklift", ambulance: "ambulance", motorbike: "motorbike",
  submarine: "submarine", bulldozer: "bulldozer", firetruck: "firetruck", skateboard: "skateboard", parachute: "parachute",
  dragon: "dragon",
  // Animals from Lucide
  bird: "lucide:bird", rabbit: "lucide:rabbit", bunny: "lucide:rabbit", turtle: "lucide:turtle", snail: "lucide:snail",
  squirrel: "lucide:squirrel", rat: "lucide:rat", mouse: "lucide:rat", worm: "lucide:worm", panda: "lucide:panda",
  shrimp: "lucide:shrimp",
  // Food
  nut: "lucide:nut", soup: "soup", grape: "grape", cheese: "cheese", banana: "banana", burger: "burger", hamburger: "burger",
  melon: "melon", avocado: "avocado", sausage: "sausage", coffee: "coffee", salad: "salad",
  bean: "lucide:bean", donut: "lucide:donut", cupcake: "lucide:cupcake", broccoli: "lucide:broccoli",
  popcorn: "lucide:popcorn", croissant: "lucide:croissant",
  // A–Z letter pages ("A is for apple"): words for the letters nothing above starts
  "ice cream": "ice-cream", jacket: "jacket", octagon: "octagon", van: "lucide:van", watch: "lucide:watch",
  box: "box", yarn: "yarn", zeppelin: "zeppelin", volcano: "volcano",
};

// Paths taken out of an icon. The word is "pumpkin", and Tabler's only pumpkin
// is a carved jack-o'-lantern, which put a Halloween face on the Thanksgiving
// page and on any autumn book. Without its eyes and mouth it looked like an
// apple, so it gets two ribs, drawn from where its lobes meet at the top to
// where they meet at the bottom.
const WITHOUT = {
  pumpkin: ["M9 15l1.5 1l1.5 -1l1.5 1l1.5 -1", "M10 11h.01", "M14 11h.01"],
};
const WITH = {
  pumpkin: ["M9.585 6.869c-1.2 3.5 -1.2 9.3 .825 12.769", "M14.415 6.87c1.2 3.5 1.2 9.3 -.825 12.768"],
};

// Drawn for Trace Press, in the same 24 × 24 grid and 2-unit stroke, for a
// letter no icon set has a child's picture for. Q: a patchwork quilt, a square
// of nine patches with a triangle in each corner and a diamond in the middle.
const DRAWN = {
  quilt: [
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2z",
    "M3 9h18", "M3 15h18", "M9 3v18", "M15 3v18",
    "M9 3l-6 6", "M15 3l6 6", "M3 15l6 6", "M21 15l-6 6",
    "M12 9l3 3l-3 3l-3 -3z",
  ],
};

const dir = new URL("../node_modules/@tabler/icons/icons/outline/", import.meta.url);
const lucideDir = new URL("../node_modules/lucide-static/icons/", import.meta.url);
const pkg = JSON.parse(readFileSync(new URL("../node_modules/@tabler/icons/package.json", import.meta.url), "utf8"));
const lucidePkg = JSON.parse(readFileSync(new URL("../node_modules/lucide-static/package.json", import.meta.url), "utf8"));
// A <circle> as a path: two half-circle arcs.
const circle = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
// Lucide packs arc flags against the next number ("a3 3 0 003.2 1.8"), which
// pdf-lib's path parser can't read. Rewrite a path with every argument
// spaced and every command letter written out.
const ARGS = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };
function spaced(d) {
  const out = [];
  let i = 0, cmd = null;
  const ws = () => { while (i < d.length && /[\s,]/.test(d[i])) i++; };
  const num = () => { ws(); const m = /^[-+]?(\d*\.\d+|\d+\.?)(e[-+]?\d+)?/i.exec(d.slice(i)); if (!m) throw new Error(`bad path ${d} at ${i}`); i += m[0].length; return +m[0]; };
  const flag = () => { ws(); const f = d[i++]; if (f !== "0" && f !== "1") throw new Error(`bad arc flag in ${d}`); return +f; };
  for (ws(); i < d.length; ws()) {
    if (/[a-z]/i.test(d[i])) cmd = d[i++];
    else if (!cmd) throw new Error(`bad path ${d}`);
    const n = ARGS[cmd.toLowerCase()];
    const args = cmd.toLowerCase() === "a" ? [num(), num(), num(), flag(), flag(), num(), num()] : Array.from({ length: n }, num);
    out.push(cmd + args.join(" "));
    if (cmd === "m") cmd = "l"; else if (cmd === "M") cmd = "L";
  }
  return out.join("");
}

const out = {};
for (const [word, icon] of Object.entries(WORDS)) {
  const lucide = icon.startsWith("lucide:");
  let svg = readFileSync(lucide ? new URL(`${icon.slice(7)}.svg`, lucideDir) : new URL(`${icon}.svg`, dir), "utf8");
  if (lucide) svg = svg.replace(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"\s*\/>/g, (_, cx, cy, r) => `<path d="${circle(+cx, +cy, +r)}" />`);
  const paths = [...svg.matchAll(/<path d="([^"]+)"/g)].map((m) => (lucide ? spaced(m[1]) : m[1]));
  if (!paths.length || /<(circle|rect|line|polyline|ellipse|polygon)\b/.test(svg)) throw new Error(`${icon}: not plain paths`);
  const drop = WITHOUT[word] ?? [];
  for (const d of drop) if (!paths.includes(d)) throw new Error(`${word}: no path ${d} in ${icon}`);
  out[word] = [...paths.filter((d) => !drop.includes(d)), ...(WITH[word] ?? [])];
}
Object.assign(out, DRAWN);
const lines = Object.entries(out).map(([w, p]) => `  ${JSON.stringify(w)}: ${JSON.stringify(p)},`);
writeFileSync(new URL("../src/pdf/pictures.js", import.meta.url), `// Generated by scripts/pictures.mjs from Tabler Icons ${pkg.version} — do not edit.
// Outline pictures for word pages: each is SVG paths on a 24 × 24 grid, y down,
// drawn as a round 2-unit stroke.
//
// Tabler Icons, https://tabler.io/icons
// MIT License. Copyright (c) 2020-2026 Paweł Kuna.
// The full licence text is public/licenses/tabler-icons.txt.
// Animals Tabler lacks are from Lucide ${lucidePkg.version}, https://lucide.dev
// ISC License. Copyright (c) 2026 Lucide Icons and Contributors.
// The full licence text is public/licenses/lucide.txt.
// ${Object.keys(DRAWN).join(", ")}: drawn for Trace Press (scripts/pictures.mjs).
// ${Object.keys(WITHOUT).join(", ")}: the Tabler icon without its face, with two ribs (scripts/pictures.mjs WITHOUT, WITH).
export const PICTURES = {
${lines.join("\n")}
};

// The picture for a word page, if there is one: the word itself, any case,
// or the word without a final "s" (bats, apples).
export function pictureFor(word) {
  const w = String(word ?? "").trim().toLowerCase();
  return PICTURES[w] ?? (w.endsWith("s") ? PICTURES[w.slice(0, -1)] : undefined) ?? null;
}
`);
console.log(`wrote src/pdf/pictures.js: ${Object.keys(out).length} words`);
