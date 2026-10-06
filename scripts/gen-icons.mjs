// Generates AIOTools PWA icons: indigo-600 rounded square, white bolt, dark border.
// Run once: node scripts/gen-icons.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "public", "icons");
const rootPublic = join(here, "..", "public");

const INDIGO = { r: 0x4f, g: 0x46, b: 0xe5 }; // indigo-600
const BORDER = { r: 0x31, g: 0x2e, b: 0x81 }; // indigo-900-ish, subtle darker edge
const WHITE = { r: 255, g: 255, b: 255 };

// Lightning bolt polygon, normalized coords (x right, y down).
const BOLT = [
  [0.56, 0.14],
  [0.31, 0.56],
  [0.45, 0.56],
  [0.42, 0.86],
  [0.69, 0.41],
  [0.55, 0.41],
];

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function roundedDist(x, y, size, radius) {
  // Negative inside, positive outside: distance to rounded-rect edge.
  const cx = Math.min(Math.max(x, radius), size - radius);
  const cy = Math.min(Math.max(y, radius), size - radius);
  const dx = x - cx;
  const dy = y - cy;
  const dCenter = Math.hypot(dx, dy);
  const insideBox = x >= radius && x <= size - radius && y >= radius && y <= size - radius;
  if (insideBox) return -Math.min(x - radius, size - radius - x, y - radius, size - radius - y) - 0;
  // corner region
  if ((x < radius || x > size - radius) && (y < radius || y > size - radius)) {
    return dCenter - radius;
  }
  return -1; // edge band, inside
}

function render(size) {
  const png = new PNG({ width: size, height: size });
  const radius = Math.round(size * 0.22);
  const borderPx = Math.max(2, Math.round(size * 0.012));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const d = roundedDist(x + 0.5, y + 0.5, size, radius);
      if (d > 0.5) continue; // transparent outside
      const nx = (x + 0.5) / size;
      const ny = (y + 0.5) / size;
      let c = INDIGO;
      if (d > -borderPx) c = BORDER; // subtle darker border ring
      if (pointInPoly(nx, ny, BOLT)) c = WHITE;
      png.data[idx] = c.r;
      png.data[idx + 1] = c.g;
      png.data[idx + 2] = c.b;
      png.data[idx + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "icon-512.png"), render(512));
writeFileSync(join(outDir, "icon-192.png"), render(192));
writeFileSync(join(rootPublic, "apple-touch-icon.png"), render(180));
console.log("icons written: icon-512.png, icon-192.png, apple-touch-icon.png");
