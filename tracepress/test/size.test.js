// Tracing dots are drawn once per document and reused (draw.js), which took
// a 26-page book from 2.1 MB to about 0.2 MB. Two ways that can go wrong
// quietly: the size creeps back (a change that bypasses the shared dot), or
// the shared dot stops painting, which no text-based test would notice. So:
// a size ceiling, and the pixels under dot centres read back from a raster.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderBook, planBook } from "../src/pdf/book.js";
import { pageInk } from "../src/pdf/ink.js";

const fonts = {
  bold: readFileSync(new URL("../fonts/LiberationSans-Bold.ttf", import.meta.url)),
  regular: readFileSync(new URL("../fonts/LiberationSans-Regular.ttf", import.meta.url)),
};

// The smallest guide on the largest trim has the most rows, so the most dots.
const OPTS = { trim: "8.5x11", guideIn: 0.45 };

test("a whole book stays small", async () => {
  const bytes = await renderBook(OPTS, fonts);
  assert.ok(bytes.length < 600_000, `${bytes.length} bytes`);
});

test("the shared dots actually paint: dark pixels under dot centres", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tp-size-"));
  const pdf = join(dir, "b.pdf");
  writeFileSync(pdf, await renderBook(OPTS, fonts));
  const DPI = 144;
  execFileSync("pdftoppm", ["-gray", "-r", String(DPI), "-f", "1", "-l", "1", pdf, join(dir, "p")]);
  const raw = readFileSync(join(dir, "p-01.pgm"));
  rmSync(dir, { recursive: true, force: true });
  const [, w, h] = raw.subarray(0, 20).toString("latin1").match(/P5\s+(\d+)\s+(\d+)/).map(Number);
  const px = raw.subarray(raw.length - w * h);
  const { pages } = planBook(OPTS);
  const dots = pageInk(pages[0]).filter((s) => s.kind === "dot");
  assert.ok(dots.length > 100, `${dots.length} dots`);
  const k = DPI / 72;
  const dark = dots.filter((d) => px[Math.round(h - d.y * k) * w + Math.round(d.x * k)] < 160);
  assert.ok(dark.length / dots.length > 0.95, `${dark.length} of ${dots.length} dot centres are dark`);
});
