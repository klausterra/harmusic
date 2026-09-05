/** Chromatic pitch classes; C = 0. */
export const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const

export type NoteName = (typeof NOTE_NAMES)[number]
export type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type ChordQuality = 'maj' | 'min' | 'dim'
export type ModeId = 'major' | 'minor'

export interface ScaleDegree {
  degree: Degree
  roman: string
  root: NoteName
  quality: ChordQuality
  label: string
}

export interface ChordVoicing {
  degree: Degree
  root: NoteName
  midi: number[]
  label: string
}

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11] as const
const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10] as const

const MAJOR_QUALITIES: ChordQuality[] = [
  'maj',
  'min',
  'min',
  'maj',
  'maj',
  'min',
  'dim',
]
/** Harmonic-minor flavored: V is major for resolution practice. */
const MINOR_QUALITIES: ChordQuality[] = [
  'min',
  'dim',
  'maj',
  'min',
  'maj',
  'maj',
  'dim',
]

const MAJOR_ROMANS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'] as const
const MINOR_ROMANS = ['i', 'ii°', 'III', 'iv', 'V', 'VI', 'vii°'] as const

export function noteIndex(name: NoteName): number {
  return NOTE_NAMES.indexOf(name)
}

export function noteFromIndex(index: number): NoteName {
  const normalized = ((index % 12) + 12) % 12
  return NOTE_NAMES[normalized]
}

export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

export function noteToMidi(name: NoteName, octave: number): number {
  return (octave + 1) * 12 + noteIndex(name)
}

export function buildScale(tonic: NoteName, mode: ModeId = 'major'): NoteName[] {
  const root = noteIndex(tonic)
  const intervals = mode === 'major' ? MAJOR_INTERVALS : MINOR_INTERVALS
  return intervals.map((interval) => noteFromIndex(root + interval))
}

/** @deprecated use buildScale */
export function buildMajorScale(tonic: NoteName): NoteName[] {
  return buildScale(tonic, 'major')
}

export function getScaleDegrees(
  tonic: NoteName,
  mode: ModeId = 'major',
): ScaleDegree[] {
  const scale = buildScale(tonic, mode)
  const qualities = mode === 'major' ? MAJOR_QUALITIES : MINOR_QUALITIES
  const romans = mode === 'major' ? MAJOR_ROMANS : MINOR_ROMANS
  return scale.map((root, i) => {
    const degree = (i + 1) as Degree
    const quality = qualities[i]
    const roman = romans[i]
    const suffix =
      quality === 'maj' ? '' : quality === 'min' ? 'm' : '°'
    return {
      degree,
      roman,
      root,
      quality,
      label: `${roman} (${root}${suffix})`,
    }
  })
}

export function triadForDegree(
  tonic: NoteName,
  degree: Degree,
  octave = 4,
  mode: ModeId = 'major',
): ChordVoicing {
  const degrees = getScaleDegrees(tonic, mode)
  const info = degrees[degree - 1]
  const rootMidi = noteToMidi(info.root, octave)
  const third = info.quality === 'min' || info.quality === 'dim' ? 3 : 4
  const fifth = info.quality === 'dim' ? 6 : 7
  return {
    degree,
    root: info.root,
    midi: [rootMidi, rootMidi + third, rootMidi + fifth],
    label: info.label,
  }
}

export function buildProgression(
  tonic: NoteName,
  sequence: Degree[],
  mode: ModeId = 'major',
  octave = 4,
): ChordVoicing[] {
  return sequence.map((d) => triadForDegree(tonic, d, octave, mode))
}

/** Scale tones as single-note midi targets (one octave). */
export function scaleMidiNotes(
  tonic: NoteName,
  mode: ModeId = 'major',
  octave = 4,
): number[] {
  return buildScale(tonic, mode).map((n) => noteToMidi(n, octave))
}

export function progressionIVVI(tonic: NoteName, octave = 4): ChordVoicing[] {
  return buildProgression(tonic, [1, 4, 5, 1], 'major', octave)
}

export function midiMatchesChord(
  pressed: ReadonlySet<number>,
  chordMidi: number[],
): boolean {
  if (pressed.size !== chordMidi.length) return false
  return chordMidi.every((m) => pressed.has(m))
}

export function pitchClassesMatch(
  pressed: ReadonlySet<number>,
  chordMidi: number[],
): boolean {
  if (pressed.size < chordMidi.length) return false
  const needed = new Set(chordMidi.map((m) => m % 12))
  const got = new Set([...pressed].map((m) => m % 12))
  for (const pc of needed) {
    if (!got.has(pc)) return false
  }
  return true
}

/** Guitar standard tuning open-string MIDI (E2 A2 D3 G3 B3 E4). */
export const GUITAR_OPEN: number[] = [40, 45, 50, 55, 59, 64]

/** Bass standard tuning (E1 A1 D2 G2). */
export const BASS_OPEN: number[] = [28, 33, 38, 43]

export function fretboardMidi(
  openStrings: number[],
  stringIndex: number,
  fret: number,
): number {
  return openStrings[stringIndex] + fret
}

/** Find playable positions for pitch classes within fret range. */
export function positionsForPitchClasses(
  openStrings: number[],
  pitchClasses: number[],
  maxFret = 5,
): { string: number; fret: number; midi: number }[] {
  const needed = new Set(pitchClasses.map((p) => ((p % 12) + 12) % 12))
  const found: { string: number; fret: number; midi: number }[] = []
  const covered = new Set<number>()
  for (let s = 0; s < openStrings.length; s++) {
    for (let f = 0; f <= maxFret; f++) {
      const midi = fretboardMidi(openStrings, s, f)
      const pc = midi % 12
      if (needed.has(pc) && !covered.has(pc)) {
        found.push({ string: s, fret: f, midi })
        covered.add(pc)
      }
    }
  }
  return found
}
