export interface MidiExample {
  id: string
  title: string
  url: string
}

/** Legacy smoke fixtures in /public/midi (kept for regression). */
export const MIDI_EXAMPLES: MidiExample[] = [
  {
    id: 'c-major-scale',
    title: 'Escala de Dó',
    url: '/midi/c-major-scale.mid',
  },
  {
    id: 'twinkle',
    title: 'Twinkle (melodia)',
    url: '/midi/twinkle-melody.mid',
  },
]
