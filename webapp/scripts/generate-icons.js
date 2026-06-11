/**
 * generate-icons.js — Pure Node.js PNG icon generator (no dependencies)
 * Creates icon-192.png and icon-512.png for Prixlo PWA
 * Run: node webapp/scripts/generate-icons.js
 */
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── CRC32 ────────────────────────────────────────────────────────────────────
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return (buf) => {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) crc = t[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  };
})();

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(CRC(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

// ── Drawing helpers ───────────────────────────────────────────────────────────
function setPixel(pixels, size, x, y, r, g, b) {
  if (x < 0 || x >= size || y < 0 || y >= size) return;
  const i = (y * size + x) * 4;
  pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = 255;
}

function fillRect(pixels, size, x, y, w, h, r, g, b) {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      setPixel(pixels, size, x + dx, y + dy, r, g, b);
}

function drawLine(pixels, size, x1, y1, x2, y2, thick, r, g, b) {
  const dx = x2 - x1, dy = y2 - y1;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  for (let s = 0; s <= steps; s++) {
    const px = Math.round(x1 + dx * s / steps);
    const py = Math.round(y1 + dy * s / steps);
    for (let ty = -thick; ty <= thick; ty++)
      for (let tx = -thick; tx <= thick; tx++)
        if (tx*tx + ty*ty <= thick*thick)
          setPixel(pixels, size, px+tx, py+ty, r, g, b);
  }
}

// ── "P" letter using scaled bitmap ───────────────────────────────────────────
// 5×9 source grid for letter P
const P_BITMAP = [
  [1,1,1,1,0],
  [1,0,0,1,1],
  [1,0,0,0,1],
  [1,0,0,1,1],
  [1,1,1,1,0],
  [1,0,0,0,0],
  [1,0,0,0,0],
  [1,0,0,0,0],
  [1,0,0,0,0],
];

function drawP(pixels, size) {
  const cellH = Math.floor(size * 0.55 / P_BITMAP.length);
  const cellW = Math.floor(size * 0.38 / 5);
  const totalH = cellH * P_BITMAP.length;
  const totalW = cellW * 5;
  const startX = Math.floor((size - totalW) / 2);
  const startY = Math.floor((size - totalH) / 2);
  for (let row = 0; row < P_BITMAP.length; row++) {
    for (let col = 0; col < 5; col++) {
      if (P_BITMAP[row][col]) {
        fillRect(pixels, size,
          startX + col * cellW,
          startY + row * cellH,
          cellW - 1, cellH - 1,
          255, 255, 255);
      }
    }
  }
}

// ── Build PNG buffer ──────────────────────────────────────────────────────────
function buildIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);

  // Background #0f172a
  for (let i = 0; i < size * size; i++) {
    pixels[i*4] = 15; pixels[i*4+1] = 23; pixels[i*4+2] = 42; pixels[i*4+3] = 255;
  }

  // Diagonal blue line — descending (Logo A style)
  const margin = Math.floor(size * 0.13);
  const thick  = Math.max(1, Math.floor(size * 0.024));
  drawLine(pixels, size,
    margin,        Math.floor(size * 0.16),
    size - margin, Math.floor(size * 0.84),
    thick, 26, 115, 232);

  // White P
  drawP(pixels, size);

  // Pack rows with filter byte
  const rows = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    rows[y * (1 + size * 4)] = 0;
    pixels.copy(rows, y * (1 + size * 4) + 1, y * size * 4, (y+1) * size * 4);
  }

  const compressed = zlib.deflateSync(rows, { level: 6 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // RGBA

  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Main ──────────────────────────────────────────────────────────────────────
const outDir = path.join(__dirname, '..', 'public');

for (const size of [192, 512]) {
  const buf  = buildIcon(size);
  const dest = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(dest, buf);
  console.log(`✓ icon-${size}.png  (${(buf.length/1024).toFixed(1)} KB)`);
}
console.log('Done — icons saved to webapp/public/');
