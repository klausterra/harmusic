import { Midi } from '@tonejs/midi'
import type { MidiNoteEvent, MidiTrackInfo, ParsedMidi } from './types'

export async function parseMidiArrayBuffer(
  buffer: ArrayBuffer,
  fallbackName = 'MIDI',
): Promise<ParsedMidi> {
  const midi = new Midi(buffer)
  const tracks: MidiTrackInfo[] = []

  midi.tracks.forEach((track, index) => {
    if (track.notes.length === 0) return
    const notes: MidiNoteEvent[] = track.notes.map((note, i) => ({
      id: `${index}-${i}`,
      midi: note.midi,
      time: note.time,
      duration: Math.max(note.duration, 0.05),
      velocity: note.velocity,
    }))
    const duration = notes.reduce(
      (max, n) => Math.max(max, n.time + n.duration),
      0,
    )
    tracks.push({
      index,
      name: track.name?.trim() || `Faixa ${index + 1}`,
      notes,
      duration,
    })
  })

  const duration = tracks.reduce((max, t) => Math.max(max, t.duration), 0)
  return {
    name: midi.name?.trim() || fallbackName,
    duration,
    tracks,
  }
}

export function pickDefaultTrack(parsed: ParsedMidi): number {
  if (parsed.tracks.length === 0) return 0
  let best = 0
  let bestCount = -1
  parsed.tracks.forEach((t, i) => {
    if (t.notes.length > bestCount) {
      bestCount = t.notes.length
      best = i
    }
  })
  return best
}

export function pianoRangeForNotes(
  notes: readonly MidiNoteEvent[],
): { startMidi: number; keyCount: number } {
  if (notes.length === 0) return { startMidi: 60, keyCount: 15 }
  let min = 127
  let max = 0
  for (const n of notes) {
    min = Math.min(min, n.midi)
    max = Math.max(max, n.midi)
  }
  // Align to nearest C below min
  const startMidi = Math.max(21, min - ((min - 0) % 12))
  const end = Math.min(108, max + 2)
  const keyCount = Math.max(15, end - startMidi + 1)
  return { startMidi, keyCount: Math.min(keyCount, 48) }
}
