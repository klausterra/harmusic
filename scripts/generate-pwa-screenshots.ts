import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

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

function generateScreenshotPng(width: number, height: number): Buffer {
  const rawRowLen = width * 4 + 1
  const rawData = Buffer.alloc(rawRowLen * height)

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rawRowLen
    rawData[rowOffset] = 0

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4
      const t = (x + y) / (width + height)
      const r = Math.round(8 + t * 4)
      const g = Math.round(18 + t * 10)
      const b = Math.round(14 + t * 8)

      rawData[pxOffset] = r
      rawData[pxOffset + 1] = g
      rawData[pxOffset + 2] = b
      rawData[pxOffset + 3] = 255
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdrChunk = createChunk('IHDR', ihdr)
  const compressed = zlib.deflateSync(rawData)
  const idatChunk = createChunk('IDAT', compressed)
  const iendChunk = createChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

const publicDir = path.resolve('public')

const wide = generateScreenshotPng(1280, 720)
fs.writeFileSync(path.join(publicDir, 'screenshot-wide.png'), wide)
console.log('Generated screenshot-wide.png')

const narrow = generateScreenshotPng(720, 1280)
fs.writeFileSync(path.join(publicDir, 'screenshot-narrow.png'), narrow)
console.log('Generated screenshot-narrow.png')
