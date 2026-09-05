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
const MAJOR_QUALITIES: ChordQuality[] = [
  'maj',
  'min',
  'min',
  'maj',
  'maj',
  'min',
  'dim',
]
const ROMANS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'] as const

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

export function buildMajorScale(tonic: NoteName): NoteName[] {
  const root = noteIndex(tonic)
  return MAJOR_INTERVALS.map((interval) => noteFromIndex(root + interval))
}

export function getScaleDegrees(tonic: NoteName): ScaleDegree[] {
  const scale = buildMajorScale(tonic)
  return scale.map((root, i) => {
    const degree = (i + 1) as Degree
    const quality = MAJOR_QUALITIES[i]
    const roman = ROMANS[i]
    return {
      degree,
      roman,
      root,
      quality,
      label: `${roman} (${root}${quality === 'maj' ? '' : quality === 'min' ? 'm' : '°'})`,
    }
  })
}

/** Triad in close position from a scale degree. */
export function triadForDegree(
  tonic: NoteName,
  degree: Degree,
  octave = 4,
): ChordVoicing {
  const degrees = getScaleDegrees(tonic)
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

/** Classic beginner progression in any major key. */
export function progressionIVVI(tonic: NoteName, octave = 4): ChordVoicing[] {
  return ([1, 4, 5, 1] as Degree[]).map((d) => triadForDegree(tonic, d, octave))
}

export function midiMatchesChord(
  pressed: ReadonlySet<number>,
  chordMidi: number[],
): boolean {
  if (pressed.size !== chordMidi.length) return false
  return chordMidi.every((m) => pressed.has(m))
}

/** Accept same pitch class in nearby octaves for find-on-instrument. */
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
