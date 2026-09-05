import type { MidiNoteEvent, MidiPlayMode } from './types'

export const RHYTHM_WINDOW_SEC = 0.15
export const FOLLOW_WINDOW_SEC = 0.4
export const FOLLOW_LOOKAHEAD_SEC = 0.4

export interface HitResult {
  hit: boolean
  noteId: string | null
}

function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12
}

/** Find nearest unmatched note by pitch class within ±window of songTime. */
export function judgeHit(
  notes: readonly MidiNoteEvent[],
  pressedMidi: number,
  songTime: number,
  windowSec: number,
  alreadyHit: ReadonlySet<string>,
): HitResult {
  const pc = pitchClass(pressedMidi)
  let best: MidiNoteEvent | null = null
  let bestDist = Infinity

  for (const note of notes) {
    if (alreadyHit.has(note.id)) continue
    if (pitchClass(note.midi) !== pc) continue
    const dist = Math.abs(note.time - songTime)
    if (dist <= windowSec && dist < bestDist) {
      best = note
      bestDist = dist
    }
  }

  return best ? { hit: true, noteId: best.id } : { hit: false, noteId: null }
}

export function windowForMode(mode: MidiPlayMode): number {
  if (mode === 'rhythm') return RHYTHM_WINDOW_SEC
  if (mode === 'follow-along') return FOLLOW_WINDOW_SEC
  return Infinity
}

export function scorePercent(hits: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((hits / total) * 100)
}

/** Karaoke: % of piece notes whose pitch class was played at least once. */
export function karaokeCoverage(
  notes: readonly MidiNoteEvent[],
  playedPcs: ReadonlySet<number>,
): number {
  if (notes.length === 0) return 0
  const needed = new Set(notes.map((n) => pitchClass(n.midi)))
  let covered = 0
  for (const pc of needed) {
    if (playedPcs.has(pc)) covered += 1
  }
  return scorePercent(covered, needed.size)
}

export function bonusXpForScore(mode: MidiPlayMode, score: number): number {
  if (mode === 'rhythm' && score >= 70) return 40
  if (mode === 'follow-along' && score >= 60) return 30
  if (mode === 'karaoke' && score >= 50) return Math.round(score / 2)
  return 0
}

export function perHitXp(mode: MidiPlayMode): number {
  if (mode === 'rhythm') return 15
  if (mode === 'follow-along') return 10
  return 0
}

/** Notes that should glow for follow-along (upcoming within lookahead). */
export function followHighlightNotes(
  notes: readonly MidiNoteEvent[],
  songTime: number,
  lookahead = FOLLOW_LOOKAHEAD_SEC,
  alreadyHit: ReadonlySet<string>,
): Set<number> {
  const set = new Set<number>()
  for (const note of notes) {
    if (alreadyHit.has(note.id)) continue
    if (note.time >= songTime && note.time <= songTime + lookahead) {
      set.add(note.midi)
    }
  }
  return set
}

export function soundingMidis(
  notes: readonly MidiNoteEvent[],
  songTime: number,
): Set<number> {
  const set = new Set<number>()
  for (const note of notes) {
    if (songTime >= note.time && songTime < note.time + note.duration) {
      set.add(note.midi)
    }
  }
  return set
}
