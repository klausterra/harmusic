import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

// Lightweight SVG to PNG rasterizer using pure node stdlib + uncompressed PNG generator (YAGNI on sharp)
// For PWA icons, we can render the exact SVG markup into raw RGBA pixels or use canvas if available.
// Let's create proper PNG buffers using basic uncompressed RGBA chunk encoding.

function crc32(buf: Buffer): number {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i]
    crc = crc ^ byte
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1)
      crc = (crc >>> 1) ^ (0xedb88320 & mask)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function createChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

export function generateIconPng(size: number, isMaskable = false): Buffer {
  // Generate RGBA buffer
  // Background: #07130e (7, 19, 14) -> #0b1c15 (11, 28, 21)
  // Corner radius ratio: 0.22 if not maskable, 0 if maskable (full bleed)
  const width = size
  const height = size
  const rawRowLen = width * 4 + 1
  const rawData = Buffer.alloc(rawRowLen * height)

  const radius = isMaskable ? 0 : Math.round(size * 0.22)
  const r2 = radius * radius

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rawRowLen
    rawData[rowOffset] = 0 // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4

      // Check corner rounding
      let inside = true
      if (radius > 0) {
        let cx = -1
        let cy = -1
        if (x < radius && y < radius) {
          cx = radius - 1
          cy = radius - 1
        } else if (x >= width - radius && y < radius) {
          cx = width - radius
          cy = radius - 1
        } else if (x < radius && y >= height - radius) {
          cx = radius - 1
          cy = height - radius
        } else if (x >= width - radius && y >= height - radius) {
          cx = width - radius
          cy = height - radius
        }
        if (cx >= 0 && cy >= 0) {
          const dist2 = (x - cx) * (x - cx) + (y - cy) * (y - cy)
          if (dist2 > r2) inside = false
        }
      }

      if (!inside) {
        rawData[pxOffset] = 0
        rawData[pxOffset + 1] = 0
        rawData[pxOffset + 2] = 0
        rawData[pxOffset + 3] = 0
        continue
      }

      // Base gradient bg
      const t = (x + y) / (width + height)
      let r = Math.round(7 + t * 6)
      let g = Math.round(19 + t * 12)
      let b = Math.round(14 + t * 8)
      let a = 255

      // Normalized coordinates (0..1)
      const nx = x / width
      const ny = y / height

      // Scale factors for icon elements
      // Left bar: x in [0.26, 0.33], y in [0.25, 0.75]
      // Right bar: x in [0.67, 0.74], y in [0.25, 0.75]
      const leftBar = nx >= 0.26 && nx <= 0.33 && ny >= 0.25 && ny <= 0.75
      const rightBar = nx >= 0.67 && nx <= 0.74 && ny >= 0.25 && ny <= 0.75

      // Harmonic curve: y around 0.52 - 0.08*sin((nx-0.3)*3.14/0.4)
      let onCurve = false
      if (nx >= 0.29 && nx <= 0.71) {
        const u = (nx - 0.29) / 0.42
        const targetY = 0.54 - Math.sin(u * Math.PI) * 0.08
        if (Math.abs(ny - targetY) < 0.035) {
          onCurve = true
        }
      }

      // Golden note head at center-right (0.52, 0.54)
      const dxNote = (nx - 0.52) * 1.3
      const dyNote = ny - 0.54
      const distNote = Math.sqrt(dxNote * dxNote + dyNote * dyNote)
      const onNote = distNote < 0.075

      // Flag accent on right top (0.71..0.82, 0.27..0.38)
      const onFlag = nx >= 0.71 && nx <= 0.82 && ny >= 0.27 && ny <= 0.38 && (nx - 0.71) > (ny - 0.27) * 0.8

      if (onNote || onFlag) {
        // Gold: #ffd166 (255, 209, 102)
        r = 255
        g = 209
        b = 102
      } else if (leftBar || rightBar || onCurve) {
        // Mint: #5cff9d (92, 255, 157)
        r = 92
        g = 255
        b = 157
      }

      rawData[pxOffset] = r
      rawData[pxOffset + 1] = g
      rawData[pxOffset + 2] = b
      rawData[pxOffset + 3] = a
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type (RGBA)
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdrChunk = createChunk('IHDR', ihdr)
  const compressed = zlib.deflateSync(rawData)
  const idatChunk = createChunk('IDAT', compressed)
  const iendChunk = createChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

const publicDir = path.resolve('public')
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

const targets = [
  { file: 'pwa-64x64.png', size: 64, maskable: false },
  { file: 'pwa-192x192.png', size: 192, maskable: false },
  { file: 'pwa-512x512.png', size: 512, maskable: false },
  { file: 'maskable-icon-512x512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon-180x180.png', size: 180, maskable: false },
]

for (const t of targets) {
  const buf = generateIconPng(t.size, t.maskable)
  const dest = path.join(publicDir, t.file)
  fs.writeFileSync(dest, buf)
  console.log(`Generated ${t.file} (${buf.length} bytes)`)
}
