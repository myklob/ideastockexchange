#!/usr/bin/env node
/**
 * Generate placeholder PNG icons for the PWA manifest.
 * Solid-color squares at 192x192 and 512x512. Replace with real artwork
 * before launch — these only exist so Android's "Install app" prompt fires.
 *
 * Usage: node tools/generate-icons.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "..", "public", "icons");

const COLOR = [10, 10, 10]; // #0a0a0a, matches manifest theme_color

function crc32(buf) {
  let c;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(size, [r, g, b]) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);     // width
  ihdr.writeUInt32BE(size, 4);     // height
  ihdr[8] = 8;                     // bit depth
  ihdr[9] = 2;                     // color type: RGB
  ihdr[10] = 0;                    // compression
  ihdr[11] = 0;                    // filter
  ihdr[12] = 0;                    // interlace

  // Each scanline = 1 filter byte (0 = None) + size * 3 RGB bytes
  const row = Buffer.alloc(1 + size * 3);
  row[0] = 0;
  for (let x = 0; x < size; x++) {
    row[1 + x * 3] = r;
    row[2 + x * 3] = g;
    row[3 + x * 3] = b;
  }
  const raw = Buffer.alloc(row.length * size);
  for (let y = 0; y < size; y++) row.copy(raw, y * row.length);

  const idat = deflateSync(raw);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  const path = resolve(outDir, `icon-${size}.png`);
  writeFileSync(path, makePng(size, COLOR));
  console.log(`wrote ${path}`);
}
