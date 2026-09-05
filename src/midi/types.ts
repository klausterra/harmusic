export interface MidiNoteEvent {
  id: string
  midi: number
  time: number
  duration: number
  velocity: number
}

export interface MidiTrackInfo {
  index: number
  name: string
  notes: MidiNoteEvent[]
  duration: number
}

export interface ParsedMidi {
  name: string
  duration: number
  tracks: MidiTrackInfo[]
}

export type MidiPlayMode = 'listen' | 'rhythm' | 'follow-along' | 'karaoke'

export type PlaybackRate = 0.5 | 1 | 1.5
