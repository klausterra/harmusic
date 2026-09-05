import type { ChordQuality, Degree, NoteName } from '../music/theory'

export type InstrumentId = 'piano' | 'guitar' | 'bass'
export type LessonKind = 'progression' | 'scale' | 'degrees'
export type ModeId = 'major' | 'minor'

export interface LessonDef {
  id: string
  title: string
  blurb: string
  kind: LessonKind
  mode: ModeId
  tonic: NoteName
  /** Scale degrees in play order for progression lessons. */
  sequence: Degree[]
  instruments: InstrumentId[]
  xpReward: number
  tags: string[]
}

export const INSTRUMENTS: {
  id: InstrumentId
  label: string
  short: string
}[] = [
  { id: 'piano', label: 'Piano', short: 'Teclado' },
  { id: 'guitar', label: 'Violão', short: 'Braço' },
  { id: 'bass', label: 'Baixo', short: '4 cordas' },
]

export const TONICS: NoteName[] = ['C', 'G', 'D', 'F', 'A', 'E', 'A#']

/** Bb shown as A# in NOTE_NAMES — label map for UI. */
export function displayNote(n: NoteName): string {
  if (n === 'A#') return 'Bb'
  if (n === 'D#') return 'Eb'
  if (n === 'G#') return 'Ab'
  return n
}

export const LESSONS: LessonDef[] = [
  {
    id: 'c-maj-1451',
    title: 'I–IV–V–I em C',
    blurb: 'A progressão clássica do rock e da MPB. Base de tudo.',
    kind: 'progression',
    mode: 'major',
    tonic: 'C',
    sequence: [1, 4, 5, 1],
    instruments: ['piano', 'guitar', 'bass'],
    xpReward: 80,
    tags: ['iniciante', 'progressão'],
  },
  {
    id: 'c-maj-251',
    title: 'ii–V–I em C',
    blurb: 'O motor do jazz. Resolve com elegância.',
    kind: 'progression',
    mode: 'major',
    tonic: 'C',
    sequence: [2, 5, 1],
    instruments: ['piano', 'guitar', 'bass'],
    xpReward: 90,
    tags: ['jazz', 'progressão'],
  },
  {
    id: 'c-maj-1645',
    title: 'I–vi–IV–V em C',
    blurb: 'A sequência do pop. Ouvido viciante.',
    kind: 'progression',
    mode: 'major',
    tonic: 'C',
    sequence: [1, 6, 4, 5],
    instruments: ['piano', 'guitar', 'bass'],
    xpReward: 85,
    tags: ['pop', 'progressão'],
  },
  {
    id: 'g-maj-1451',
    title: 'I–IV–V–I em G',
    blurb: 'Mesma forma, novo tom. Transposição na prática.',
    kind: 'progression',
    mode: 'major',
    tonic: 'G',
    sequence: [1, 4, 5, 1],
    instruments: ['piano', 'guitar', 'bass'],
    xpReward: 90,
    tags: ['transposição'],
  },
  {
    id: 'a-min-1451',
    title: 'i–iv–V–i em Am',
    blurb: 'Menor natural com V maior — tensão e resolução.',
    kind: 'progression',
    mode: 'minor',
    tonic: 'A',
    sequence: [1, 4, 5, 1],
    instruments: ['piano', 'guitar', 'bass'],
    xpReward: 95,
    tags: ['menor', 'progressão'],
  },
  {
    id: 'c-maj-degrees',
    title: 'Graus de C maior',
    blurb: 'Conheça I a vii° — o mapa da tonalidade.',
    kind: 'degrees',
    mode: 'major',
    tonic: 'C',
    sequence: [1, 2, 3, 4, 5, 6, 7],
    instruments: ['piano', 'guitar', 'bass'],
    xpReward: 70,
    tags: ['teoria', 'graus'],
  },
  {
    id: 'c-maj-scale',
    title: 'Escala de C maior',
    blurb: 'Suba e desça a escala. Ouvido + dedo sincronizados.',
    kind: 'scale',
    mode: 'major',
    tonic: 'C',
    sequence: [1, 2, 3, 4, 5, 6, 7],
    instruments: ['piano', 'guitar', 'bass'],
    xpReward: 75,
    tags: ['escala'],
  },
  {
    id: 'a-min-scale',
    title: 'Escala de A menor',
    blurb: 'Relativa de C. Mesmas notas, outro centro.',
    kind: 'scale',
    mode: 'minor',
    tonic: 'A',
    sequence: [1, 2, 3, 4, 5, 6, 7],
    instruments: ['piano', 'guitar', 'bass'],
    xpReward: 80,
    tags: ['escala', 'menor'],
  },
  {
    id: 'f-maj-1451',
    title: 'I–IV–V–I em F',
    blurb: 'Tom confortável no violão e no baixo.',
    kind: 'progression',
    mode: 'major',
    tonic: 'F',
    sequence: [1, 4, 5, 1],
    instruments: ['piano', 'guitar', 'bass'],
    xpReward: 90,
    tags: ['transposição'],
  },
  {
    id: 'd-maj-251',
    title: 'ii–V–I em D',
    blurb: 'Jazz em D — prepare o ouvido para turns.',
    kind: 'progression',
    mode: 'major',
    tonic: 'D',
    sequence: [2, 5, 1],
    instruments: ['piano', 'guitar', 'bass'],
    xpReward: 100,
    tags: ['jazz', 'transposição'],
  },
]

export function getLesson(id: string): LessonDef | undefined {
  return LESSONS.find((l) => l.id === id)
}

export function lessonsForInstrument(instrument: InstrumentId): LessonDef[] {
  return LESSONS.filter((l) => l.instruments.includes(instrument))
}

export type { ChordQuality, Degree, NoteName }
