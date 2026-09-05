import type { MidiNoteEvent } from './types'

/** Onset window for clustering simultaneous notes (ms → seconds). */
export const POLYPHONY_WINDOW_SEC = 0.05

/**
 * Guitar/bass warning when max concurrent notes ≥ 4 or ≥25% of onsets
 * are dense chords (≥3 notes in the window).
 */
export const POLYPHONY_MAX_WARN = 4
export const POLYPHONY_DENSE_RATIO_WARN = 0.25
export const POLYPHONY_DENSE_COUNT = 3

export interface PolyphonyStats {
  maxPolyphony: number
  denseChordRatio: number
  onsetCount: number
}

export function analyzePolyphony(
  notes: readonly MidiNoteEvent[],
  windowSec = POLYPHONY_WINDOW_SEC,
): PolyphonyStats {
  if (notes.length === 0) {
    return { maxPolyphony: 0, denseChordRatio: 0, onsetCount: 0 }
  }

  const sorted = [...notes].sort((a, b) => a.time - b.time)
  let maxPolyphony = 1
  let denseOnsets = 0
  let onsetCount = 0

  let i = 0
  while (i < sorted.length) {
    const t0 = sorted[i].time
    let j = i
    while (j < sorted.length && sorted[j].time - t0 <= windowSec) j += 1
    const count = j - i
    maxPolyphony = Math.max(maxPolyphony, count)
    onsetCount += 1
    if (count >= POLYPHONY_DENSE_COUNT) denseOnsets += 1
    i = j
  }

  return {
    maxPolyphony,
    denseChordRatio: onsetCount === 0 ? 0 : denseOnsets / onsetCount,
    onsetCount,
  }
}

export function shouldWarnPolyphony(
  instrument: 'piano' | 'guitar' | 'bass',
  stats: PolyphonyStats,
): boolean {
  if (instrument === 'piano') return false
  return (
    stats.maxPolyphony >= POLYPHONY_MAX_WARN ||
    stats.denseChordRatio >= POLYPHONY_DENSE_RATIO_WARN
  )
}
