import { describe, expect, it } from 'vitest'
import {
  buildMajorScale,
  getScaleDegrees,
  midiMatchesChord,
  pitchClassesMatch,
  progressionIVVI,
  triadForDegree,
} from './theory'

describe('major scale', () => {
  it('builds C major', () => {
    expect(buildMajorScale('C')).toEqual([
      'C',
      'D',
      'E',
      'F',
      'G',
      'A',
      'B',
    ])
  })

  it('builds G major with F#', () => {
    expect(buildMajorScale('G')).toEqual([
      'G',
      'A',
      'B',
      'C',
      'D',
      'E',
      'F#',
    ])
  })
})

describe('degrees and triads', () => {
  it('labels I IV V in C', () => {
    const degrees = getScaleDegrees('C')
    expect(degrees[0].roman).toBe('I')
    expect(degrees[3].roman).toBe('IV')
    expect(degrees[4].roman).toBe('V')
  })

  it('builds C major triad', () => {
    expect(triadForDegree('C', 1).midi).toEqual([60, 64, 67])
  })

  it('builds I-IV-V-I progression', () => {
    const prog = progressionIVVI('C')
    expect(prog.map((c) => c.root)).toEqual(['C', 'F', 'G', 'C'])
  })
})

describe('matching', () => {
  it('matches exact midi set', () => {
    expect(midiMatchesChord(new Set([60, 64, 67]), [60, 64, 67])).toBe(true)
    expect(midiMatchesChord(new Set([60, 64]), [60, 64, 67])).toBe(false)
  })

  it('matches pitch classes across octaves', () => {
    expect(pitchClassesMatch(new Set([48, 52, 55]), [60, 64, 67])).toBe(true)
  })
})
