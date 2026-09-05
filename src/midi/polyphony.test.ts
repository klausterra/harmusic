import { describe, expect, it } from 'vitest'
import {
  analyzePolyphony,
  shouldWarnPolyphony,
} from './polyphony'
import type { MidiNoteEvent } from './types'

function note(midi: number, time: number, duration = 0.5): MidiNoteEvent {
  return { id: `${midi}-${time}`, midi, time, duration, velocity: 0.8 }
}

describe('polyphony', () => {
  it('detects dense chords', () => {
    const notes = [
      note(60, 0),
      note(64, 0.01),
      note(67, 0.02),
      note(71, 0.03),
      note(62, 1),
    ]
    const stats = analyzePolyphony(notes)
    expect(stats.maxPolyphony).toBeGreaterThanOrEqual(4)
    expect(shouldWarnPolyphony('guitar', stats)).toBe(true)
    expect(shouldWarnPolyphony('piano', stats)).toBe(false)
  })

  it('does not warn for monophonic melody', () => {
    const notes = [note(60, 0), note(62, 0.4), note(64, 0.8)]
    const stats = analyzePolyphony(notes)
    expect(stats.maxPolyphony).toBe(1)
    expect(shouldWarnPolyphony('bass', stats)).toBe(false)
  })
})
