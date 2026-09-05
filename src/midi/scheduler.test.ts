import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createMidiScheduler } from './scheduler'
import type { MidiNoteEvent } from './types'

const notes: MidiNoteEvent[] = [
  { id: 'a', midi: 60, time: 0, duration: 0.2, velocity: 1 },
  { id: 'b', midi: 62, time: 1, duration: 0.2, velocity: 1 },
  { id: 'c', midi: 64, time: 2, duration: 0.2, velocity: 1 },
]

describe('scheduler', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (_cb: FrameRequestCallback) => 1)
    vi.stubGlobal('cancelAnimationFrame', (_id: number) => undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('advances songTime with rate', () => {
    let wall = 100
    const scheduled: number[] = []
    const sched = createMidiScheduler({
      now: () => wall,
      duration: 3,
      notes,
      lookaheadSec: 3,
      onScheduleNote: (midi) => scheduled.push(midi),
    })

    sched.seek(0)
    expect(sched.getSongTime()).toBe(0)

    sched.play()
    expect(scheduled).toEqual([60, 62, 64])
    wall = 100 + 1
    sched.pause()
    expect(sched.getSongTime()).toBeCloseTo(1, 5)

    scheduled.length = 0
    sched.setRate(1.5)
    sched.play()
    wall = wall + 1
    sched.pause()
    expect(sched.getSongTime()).toBeCloseTo(2.5, 5)
  })

  it('seek mid-note uses remaining duration', () => {
    let wall = 0
    const calls: { midi: number; dur: number; when: number }[] = []
    const long: MidiNoteEvent[] = [
      { id: 'hold', midi: 60, time: 0, duration: 2, velocity: 1 },
      { id: 'late', midi: 64, time: 1.5, duration: 0.3, velocity: 1 },
    ]
    const sched = createMidiScheduler({
      now: () => wall,
      duration: 3,
      notes: long,
      lookaheadSec: 2,
      onScheduleNote: (midi, dur, when) => calls.push({ midi, dur, when }),
    })
    sched.play()
    calls.length = 0
    sched.seek(0.5)
    const hold = calls.find((c) => c.midi === 60)
    expect(hold).toBeTruthy()
    expect(hold!.when).toBeCloseTo(0, 5)
    expect(hold!.dur).toBeCloseTo(1.5, 5) // 2 - 0.5 remaining
  })

  it('lookahead limits eager schedule', () => {
    let wall = 0
    const midis: number[] = []
    const sched = createMidiScheduler({
      now: () => wall,
      duration: 10,
      notes,
      lookaheadSec: 0.5,
      onScheduleNote: (midi) => midis.push(midi),
    })
    sched.play()
    // only note at t=0 is within 0.5s horizon
    expect(midis).toEqual([60])
  })
})
