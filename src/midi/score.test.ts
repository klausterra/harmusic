import { describe, expect, it } from 'vitest'
import {
  bonusXpForScore,
  judgeHit,
  karaokeCoverage,
  scorePercent,
  soundingMidis,
} from './score'
import type { MidiNoteEvent } from './types'

const notes: MidiNoteEvent[] = [
  { id: '0-0', midi: 60, time: 1, duration: 0.3, velocity: 1 },
  { id: '0-1', midi: 64, time: 2, duration: 0.3, velocity: 1 },
]

describe('score', () => {
  it('judges rhythm hit within window', () => {
    const hit = judgeHit(notes, 72, 1.05, 0.15, new Set())
    expect(hit.hit).toBe(true)
    expect(hit.noteId).toBe('0-0')
  })

  it('misses when outside window', () => {
    const hit = judgeHit(notes, 60, 1.5, 0.15, new Set())
    expect(hit.hit).toBe(false)
  })

  it('scores karaoke coverage by pitch class', () => {
    expect(karaokeCoverage(notes, new Set([0]))).toBe(50)
    expect(karaokeCoverage(notes, new Set([0, 4]))).toBe(100)
  })

  it('computes percent and bonuses', () => {
    expect(scorePercent(7, 10)).toBe(70)
    expect(bonusXpForScore('rhythm', 70)).toBe(40)
    expect(bonusXpForScore('follow-along', 50)).toBe(0)
    expect(bonusXpForScore('karaoke', 80)).toBe(40)
  })

  it('lists sounding midis', () => {
    expect([...soundingMidis(notes, 1.1)]).toEqual([60])
  })
})
