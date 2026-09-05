import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseMidiArrayBuffer, pickDefaultTrack, pianoRangeForNotes } from './parseMidi'

const dir = dirname(fileURLToPath(import.meta.url))

function loadFixture(name: string): ArrayBuffer {
  const buf = readFileSync(join(dir, 'fixtures', name))
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
}

describe('parseMidi', () => {
  it('parses c-major-scale fixture', async () => {
    const parsed = await parseMidiArrayBuffer(loadFixture('c-major-scale.mid'), 'scale')
    expect(parsed.tracks.length).toBeGreaterThanOrEqual(1)
    expect(parsed.tracks[0].notes.length).toBe(8)
    expect(parsed.tracks[0].notes[0].midi).toBe(60)
    expect(parsed.duration).toBeGreaterThan(2)
  })

  it('parses dense chord track', async () => {
    const parsed = await parseMidiArrayBuffer(loadFixture('dense-chord.mid'))
    expect(parsed.tracks[0].notes.length).toBe(8)
  })

  it('picks track with most notes', async () => {
    const parsed = await parseMidiArrayBuffer(loadFixture('c-major-scale.mid'))
    expect(pickDefaultTrack(parsed)).toBe(0)
  })

  it('computes piano range covering notes', () => {
    const range = pianoRangeForNotes([
      { id: '1', midi: 55, time: 0, duration: 0.2, velocity: 1 },
      { id: '2', midi: 72, time: 1, duration: 0.2, velocity: 1 },
    ])
    expect(range.startMidi).toBeLessThanOrEqual(55)
    expect(range.startMidi + range.keyCount).toBeGreaterThan(72)
  })
})
