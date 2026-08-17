/**
 * Writes the app icons as PNGs.
 *
 * Home-screen icons have to be PNG — iOS ignores an SVG apple-touch-icon — so they are
 * generated here rather than hand-drawn, and committed. Run `npm run icons` after
 * changing the mark. PNG is written directly: the alternative was a build-time image
 * dependency for three small files.
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const OUT = new URL('../public/', import.meta.url)

/** Noir, the default theme: near-black with a faint lift at the top. */
const BACKDROP = [
  { stop: 0, rgb: [13, 13, 17] },
  { stop: 1, rgb: [8, 8, 11] },
]

/** The soft colour pools the theme paints over that backdrop. */
const GLOWS = [
  { x: 0.5, y: 0.12, r: 0.66, rgb: [42, 42, 53] },
  { x: 0.14, y: 0.9, r: 0.6, rgb: [29, 43, 58] },
  { x: 0.9, y: 0.82, r: 0.6, rgb: [51, 32, 58] },
]

const INK = [236, 234, 242]

/**
 * A top hat, in two rounded rectangles: the crown, and the brim across it. Kept as a
 * plain silhouette so it still reads at 16px in a browser tab.
 */
const CROWN = { x: 0.5, y: 0.455, hw: 0.17, hh: 0.245, r: 0.062 }
const BRIM = { x: 0.5, y: 0.685, hw: 0.375, hh: 0.052, r: 0.052 }
/** The ribbon, cut back out of the crown so the hat is not one solid block. */
const BAND = { x: 0.5, y: 0.575, hw: 0.17, hh: 0.022, r: 0 }

/** Signed distance to a rounded rectangle: negative inside, positive outside. */
function roundRect(u, v, box) {
  const dx = Math.abs(u - box.x) - (box.hw - box.r)
  const dy = Math.abs(v - box.y) - (box.hh - box.r)
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0))
  return outside + Math.min(Math.max(dx, dy), 0) - box.r
}

const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n)

function crc32(buf) {
  let c
  const table = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function png(size, pixels) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // truecolour, no alpha: an icon is opaque
  // Each scanline carries a leading filter byte; 0 means "store as is".
  const raw = Buffer.alloc(size * (size * 3 + 1))
  let at = 0
  for (let y = 0; y < size; y++) {
    raw[at++] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixels[y * size + x]
      raw[at++] = r
      raw[at++] = g
      raw[at++] = b
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function render(size) {
  const pixels = new Array(size * size)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / (size - 1)
      const v = y / (size - 1)

      // Backdrop, then each glow blended over it by its falloff.
      let rgb = BACKDROP[0].rgb.map((c, i) => lerp(c, BACKDROP[1].rgb[i], v))
      for (const glow of GLOWS) {
        const d = Math.hypot(u - glow.x, v - glow.y) / glow.r
        const strength = clamp01(1 - d) ** 2
        rgb = rgb.map((c, i) => lerp(c, glow.rgb[i], strength))
      }

      // The hat, with a soft edge so it does not look jagged at small sizes.
      const edge = 1.2 / size
      const d = Math.min(roundRect(u, v, CROWN), roundRect(u, v, BRIM))
      let cover = clamp01(-d / edge)
      cover = Math.min(cover, clamp01(roundRect(u, v, BAND) / edge))
      if (cover > 0) rgb = rgb.map((c, i) => lerp(c, INK[i], cover))

      pixels[y * size + x] = rgb.map((c) => Math.round(clamp01(c / 255) * 255))
    }
  }

  return png(size, pixels)
}

// 180 is what iOS asks for; 192 and 512 are what a manifest wants.
for (const size of [180, 192, 512]) {
  writeFileSync(new URL(`icon-${size}.png`, OUT), render(size))
  console.log(`wrote public/icon-${size}.png`)
}
