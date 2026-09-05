/**
 * Generates a didactic public-domain MIDI library + catalog.json.
 * Run: node scripts/generate-midi-library.mjs
 */
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'midi', 'library')
const CATALOG_PATH = join(ROOT, 'public', 'midi', 'catalog.json')
const SRC_CATALOG = join(ROOT, 'src', 'midi', 'catalog.generated.ts')

const PPQ = 480
const KEYS = [
  { id: 'C', label: 'Dó', pc: 0 },
  { id: 'Db', label: 'Réb', pc: 1 },
  { id: 'D', label: 'Ré', pc: 2 },
  { id: 'Eb', label: 'Mib', pc: 3 },
  { id: 'E', label: 'Mi', pc: 4 },
  { id: 'F', label: 'Fá', pc: 5 },
  { id: 'Gb', label: 'Solb', pc: 6 },
  { id: 'G', label: 'Sol', pc: 7 },
  { id: 'Ab', label: 'Láb', pc: 8 },
  { id: 'A', label: 'Lá', pc: 9 },
  { id: 'Bb', label: 'Sib', pc: 10 },
  { id: 'B', label: 'Si', pc: 11 },
]

const FOLK_KEYS = KEYS.filter((k) =>
  ['C', 'D', 'E', 'F', 'G', 'A', 'Bb'].includes(k.id),
)

/** @typedef {'easy'|'medium'|'hard'} Difficulty */
/** @typedef {{ midi: number, start: number, duration: number, velocity?: number }} NoteEvent */
/** @typedef {{ id: string, title: string, subtitle?: string, tags: string[], difficulty: Difficulty, key: string, category: string, url: string, beats: number }} CatalogEntry */

function vlq(value) {
  const bytes = []
  let buffer = value & 0x7f
  while ((value >>= 7)) {
    buffer <<= 8
    buffer |= (value & 0x7f) | 0x80
  }
  // eslint-disable-next-line no-constant-condition
  while (true) {
    bytes.push(buffer & 0xff)
    if (buffer & 0x80) buffer >>= 8
    else break
  }
  return bytes
}

function encodeMidi(notes, { bpm = 100 } = {}) {
  /** @type {{ tick: number, bytes: number[] }[]} */
  const events = []
  const tempo = Math.round(60_000_000 / bpm)
  events.push({
    tick: 0,
    bytes: [0xff, 0x51, 0x03, (tempo >> 16) & 0xff, (tempo >> 8) & 0xff, tempo & 0xff],
  })
  events.push({ tick: 0, bytes: [0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08] })

  for (const n of notes) {
    const start = Math.round(n.start * PPQ)
    const end = Math.round((n.start + n.duration) * PPQ)
    const vel = n.velocity ?? 90
    events.push({ tick: start, bytes: [0x90, n.midi & 0x7f, vel & 0x7f] })
    events.push({ tick: end, bytes: [0x80, n.midi & 0x7f, 0x40] })
  }

  events.sort((a, b) => a.tick - b.tick || a.bytes[0] - b.bytes[0])

  const track = []
  let last = 0
  for (const ev of events) {
    track.push(...vlq(ev.tick - last), ...ev.bytes)
    last = ev.tick
  }
  track.push(...vlq(0), 0xff, 0x2f, 0x00)

  const header = [
    0x4d, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x01,
    (PPQ >> 8) & 0xff, PPQ & 0xff,
  ]
  const trackHeader = [
    0x4d, 0x54, 0x72, 0x6b,
    (track.length >> 24) & 0xff,
    (track.length >> 16) & 0xff,
    (track.length >> 8) & 0xff,
    track.length & 0xff,
  ]
  return Uint8Array.from([...header, ...trackHeader, ...track])
}

function melodicNotes(intervals, { rootMidi = 60, step = 0.5, upDown = true } = {}) {
  /** @type {NoteEvent[]} */
  const notes = []
  let t = 0
  const asc = intervals.map((semi) => rootMidi + semi)
  for (const midi of asc) {
    notes.push({ midi, start: t, duration: step * 0.9 })
    t += step
  }
  if (upDown) {
    for (let i = asc.length - 2; i >= 0; i--) {
      notes.push({ midi: asc[i], start: t, duration: step * 0.9 })
      t += step
    }
  }
  return { notes, beats: t }
}

function chordBlock(midis, start, duration) {
  return midis.map((midi) => ({ midi, start, duration, velocity: 88 }))
}

function progression(chords, { beat = 1 } = {}) {
  /** @type {NoteEvent[]} */
  const notes = []
  let t = 0
  for (const midis of chords) {
    notes.push(...chordBlock(midis, t, beat * 0.95))
    t += beat
  }
  return { notes, beats: t }
}

function triad(rootMidi, quality) {
  const third = quality === 'min' ? 3 : quality === 'dim' ? 3 : 4
  const fifth = quality === 'dim' ? 6 : 7
  return [rootMidi, rootMidi + third, rootMidi + fifth]
}

function seventh(rootMidi, kind) {
  if (kind === 'dom') return [...triad(rootMidi, 'maj'), rootMidi + 10]
  if (kind === 'maj7') return [...triad(rootMidi, 'maj'), rootMidi + 11]
  if (kind === 'min7') return [...triad(rootMidi, 'min'), rootMidi + 10]
  return triad(rootMidi, 'maj')
}

function brokenArpeggio(midis, { repeats = 2, step = 0.35 } = {}) {
  /** @type {NoteEvent[]} */
  const notes = []
  let t = 0
  const pattern = [...midis, midis[midis.length - 1] + 12, ...[...midis].reverse()]
  for (let r = 0; r < repeats; r++) {
    for (const midi of pattern) {
      notes.push({ midi, start: t, duration: step * 0.85 })
      t += step
    }
  }
  return { notes, beats: t }
}

/** Degree sequence relative to major scale (0=tonic). Rhythm in beats. */
function melodyFromDegrees(degrees, rhythm, tonicMidi) {
  const major = [0, 2, 4, 5, 7, 9, 11]
  /** @type {NoteEvent[]} */
  const notes = []
  let t = 0
  let octave = 0
  let prevPc = null
  for (let i = 0; i < degrees.length; i++) {
    const d = degrees[i]
    const pc = major[((d % 7) + 7) % 7]
    let midi = tonicMidi + pc + octave * 12
    if (d >= 7) midi += 12 * Math.floor(d / 7)
    if (d < 0) midi -= 12 * Math.ceil(-d / 7)
    // smooth voice leading
    if (prevPc !== null && midi - (tonicMidi + prevPc) > 8) midi -= 12
    if (prevPc !== null && (tonicMidi + prevPc) - midi > 8) midi += 12
    const dur = rhythm[i] ?? 0.5
    notes.push({ midi, start: t, duration: dur * 0.9 })
    t += dur
    prevPc = pc
  }
  return { notes, beats: t }
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11]
const MINOR_NAT = [0, 2, 3, 5, 7, 8, 10]
const MINOR_HARM = [0, 2, 3, 5, 7, 8, 11]
const PENTA_MAJ = [0, 2, 4, 7, 9]
const BLUES = [0, 3, 5, 6, 7, 10]
const DORIAN = [0, 2, 3, 5, 7, 9, 10]
const MIXOLYDIAN = [0, 2, 4, 5, 7, 9, 10]
const PHRYGIAN = [0, 1, 3, 5, 7, 8, 10]

/** Folk / public-domain style melodies as scale degrees (0–7). */
const FOLK = [
  {
    slug: 'twinkle',
    title: 'Twinkle',
    tags: ['folk', 'melodia', 'clássico'],
    difficulty: /** @type {Difficulty} */ ('easy'),
    degrees: [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0],
    rhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
  },
  {
    slug: 'ode-joy',
    title: 'Hino à Alegria',
    tags: ['folk', 'melodia', 'beethoven'],
    difficulty: /** @type {Difficulty} */ ('easy'),
    degrees: [2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 2, 1, 1],
    rhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.75, 0.25, 1],
  },
  {
    slug: 'frere-jacques',
    title: 'Frère Jacques',
    tags: ['folk', 'melodia', 'cânone'],
    difficulty: /** @type {Difficulty} */ ('easy'),
    degrees: [0, 1, 2, 0, 0, 1, 2, 0, 2, 3, 4, 2, 3, 4],
    rhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1],
  },
  {
    slug: 'mary-lamb',
    title: 'Mary Had a Little Lamb',
    tags: ['folk', 'melodia'],
    difficulty: /** @type {Difficulty} */ ('easy'),
    degrees: [2, 1, 0, 1, 2, 2, 2, 1, 1, 1, 2, 4, 4],
    rhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1],
  },
  {
    slug: 'london-bridge',
    title: 'London Bridge',
    tags: ['folk', 'melodia'],
    difficulty: /** @type {Difficulty} */ ('easy'),
    degrees: [4, 3, 2, 3, 4, 4, 4, 3, 3, 3, 4, 4, 4],
    rhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1],
  },
  {
    slug: 'saints',
    title: 'When the Saints',
    tags: ['folk', 'melodia', 'jazz'],
    difficulty: /** @type {Difficulty} */ ('medium'),
    degrees: [0, 2, 3, 4, 0, 2, 3, 4, 0, 2, 3, 4, 2, 0, 2, 1],
    rhythm: [0.5, 0.5, 0.5, 1.5, 0.5, 0.5, 0.5, 1.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
  },
  {
    slug: 'aura-lee',
    title: 'Aura Lee',
    tags: ['folk', 'melodia'],
    difficulty: /** @type {Difficulty} */ ('medium'),
    degrees: [0, 2, 4, 4, 3, 2, 3, 4, 0, 2, 4, 4, 3, 2, 1, 0],
    rhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
  },
  {
    slug: 'camptown',
    title: 'Camptown Races',
    tags: ['folk', 'melodia'],
    difficulty: /** @type {Difficulty} */ ('medium'),
    degrees: [4, 4, 4, 2, 0, 2, 4, 3, 2, 1, 0],
    rhythm: [0.5, 0.25, 0.25, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
  },
  {
    slug: 'amazing-grace',
    title: 'Amazing Grace',
    tags: ['folk', 'melodia', 'gospel'],
    difficulty: /** @type {Difficulty} */ ('medium'),
    degrees: [0, 3, 4, 7, 4, 3, 0, 3, 4, 7, 4],
    rhythm: [0.75, 0.25, 1, 1.5, 0.5, 1, 0.75, 0.25, 1, 1.5, 0.5],
  },
  {
    slug: 'scarborough',
    title: 'Scarborough Fair',
    tags: ['folk', 'melodia', 'modal'],
    difficulty: /** @type {Difficulty} */ ('hard'),
    degrees: [0, 0, 3, 4, 5, 5, 4, 3, 0, 1, 3, 1, 0],
    rhythm: [1, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
  },
]

/** @type {CatalogEntry[]} */
const catalog = []

function addEntry(meta, notes, beats, bpm = 100) {
  const bytes = encodeMidi(notes, { bpm })
  const file = `${meta.id}.mid`
  writeFileSync(join(OUT_DIR, file), bytes)
  catalog.push({
    ...meta,
    url: `/midi/library/${file}`,
    beats: Math.round(beats * 10) / 10,
  })
}

function rootMidiFor(pc) {
  return 60 + pc // around C4+
}

rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(OUT_DIR, { recursive: true })

// Scales & modes in all keys
for (const key of KEYS) {
  const root = rootMidiFor(key.pc)
  const packs = [
    {
      slug: 'major-scale',
      title: `Escala maior — ${key.label}`,
      tags: ['escala', 'maior', 'técnica'],
      difficulty: /** @type {Difficulty} */ ('easy'),
      category: 'escala',
      intervals: MAJOR,
      bpm: 96,
    },
    {
      slug: 'minor-natural',
      title: `Escala menor natural — ${key.label}`,
      tags: ['escala', 'menor', 'técnica'],
      difficulty: /** @type {Difficulty} */ ('easy'),
      category: 'escala',
      intervals: MINOR_NAT,
      bpm: 96,
    },
    {
      slug: 'minor-harmonic',
      title: `Escala menor harmônica — ${key.label}`,
      tags: ['escala', 'menor', 'harmônica'],
      difficulty: /** @type {Difficulty} */ ('medium'),
      category: 'escala',
      intervals: MINOR_HARM,
      bpm: 92,
    },
    {
      slug: 'pentatonic',
      title: `Pentatônica maior — ${key.label}`,
      tags: ['escala', 'pentatônica', 'improvisação'],
      difficulty: /** @type {Difficulty} */ ('easy'),
      category: 'escala',
      intervals: PENTA_MAJ,
      bpm: 100,
    },
    {
      slug: 'blues',
      title: `Escala blues — ${key.label}`,
      tags: ['escala', 'blues', 'improvisação'],
      difficulty: /** @type {Difficulty} */ ('medium'),
      category: 'escala',
      intervals: BLUES,
      bpm: 88,
    },
    {
      slug: 'dorian',
      title: `Modo dórico — ${key.label}`,
      tags: ['modo', 'dórico', 'escala'],
      difficulty: /** @type {Difficulty} */ ('medium'),
      category: 'modo',
      intervals: DORIAN,
      bpm: 92,
    },
    {
      slug: 'mixolydian',
      title: `Modo mixolídio — ${key.label}`,
      tags: ['modo', 'mixolídio', 'escala'],
      difficulty: /** @type {Difficulty} */ ('medium'),
      category: 'modo',
      intervals: MIXOLYDIAN,
      bpm: 92,
    },
    {
      slug: 'phrygian',
      title: `Modo frígio — ${key.label}`,
      tags: ['modo', 'frígio', 'escala'],
      difficulty: /** @type {Difficulty} */ ('hard'),
      category: 'modo',
      intervals: PHRYGIAN,
      bpm: 88,
    },
  ]

  for (const p of packs) {
    const rebuilt = melodicNotes(p.intervals, {
      rootMidi: root,
      step: 0.45,
      upDown: true,
    })
    addEntry(
      {
        id: `${p.slug}-${key.id.toLowerCase()}`,
        title: p.title,
        subtitle: `Tônica ${key.label}`,
        tags: [...p.tags, key.id, key.label.toLowerCase()],
        difficulty: p.difficulty,
        key: key.id,
        category: p.category,
      },
      rebuilt.notes,
      rebuilt.beats,
      p.bpm,
    )
  }

  // Arpeggios
  const arpPacks = [
    {
      slug: 'arp-maj',
      title: `Arpejo maior — ${key.label}`,
      tags: ['arpejo', 'tríade', 'maior'],
      difficulty: /** @type {Difficulty} */ ('easy'),
      midis: triad(root, 'maj'),
    },
    {
      slug: 'arp-min',
      title: `Arpejo menor — ${key.label}`,
      tags: ['arpejo', 'tríade', 'menor'],
      difficulty: /** @type {Difficulty} */ ('easy'),
      midis: triad(root, 'min'),
    },
    {
      slug: 'arp-dom7',
      title: `Arpejo V7 — ${key.label}`,
      tags: ['arpejo', 'sétima', 'dominante'],
      difficulty: /** @type {Difficulty} */ ('medium'),
      midis: seventh(root, 'dom'),
    },
  ]
  for (const p of arpPacks) {
    const { notes, beats } = brokenArpeggio(p.midis)
    addEntry(
      {
        id: `${p.slug}-${key.id.toLowerCase()}`,
        title: p.title,
        subtitle: `Tônica ${key.label}`,
        tags: [...p.tags, key.id],
        difficulty: p.difficulty,
        key: key.id,
        category: 'arpejo',
      },
      notes,
      beats,
      100,
    )
  }

  // Progressions
  const I = triad(root, 'maj')
  const ii = triad(root + 2, 'min')
  const IV = triad(root + 5, 'maj')
  const V = triad(root + 7, 'maj')
  const V7 = seventh(root + 7, 'dom')
  const vi = triad(root + 9, 'min')

  const progs = [
    {
      slug: 'prog-1451',
      title: `I–IV–V–I — ${key.label}`,
      tags: ['progressão', 'I-IV-V-I', 'harmonia'],
      difficulty: /** @type {Difficulty} */ ('medium'),
      chords: [I, IV, V, I],
    },
    {
      slug: 'prog-251',
      title: `ii–V–I — ${key.label}`,
      tags: ['progressão', 'ii-V-I', 'jazz'],
      difficulty: /** @type {Difficulty} */ ('medium'),
      chords: [ii, V7, I, I],
    },
    {
      slug: 'prog-1645',
      title: `I–vi–IV–V — ${key.label}`,
      tags: ['progressão', 'I-vi-IV-V', 'pop'],
      difficulty: /** @type {Difficulty} */ ('medium'),
      chords: [I, vi, IV, V],
    },
  ]
  for (const p of progs) {
    const { notes, beats } = progression(p.chords, { beat: 1.2 })
    addEntry(
      {
        id: `${p.slug}-${key.id.toLowerCase()}`,
        title: p.title,
        subtitle: `Tom ${key.label}`,
        tags: [...p.tags, key.id],
        difficulty: p.difficulty,
        key: key.id,
        category: 'progressão',
      },
      notes,
      beats,
      84,
    )
  }
}

// Interval drills (fixed keys subset to avoid bloat, still searchable)
const INTERVALS = [
  { slug: 'int-3min', title: 'Intervalo 3ª menor', semitones: 3, difficulty: /** @type {Difficulty} */ ('easy') },
  { slug: 'int-3maj', title: 'Intervalo 3ª maior', semitones: 4, difficulty: /** @type {Difficulty} */ ('easy') },
  { slug: 'int-5', title: 'Intervalo 5ª justa', semitones: 7, difficulty: /** @type {Difficulty} */ ('easy') },
  { slug: 'int-8', title: 'Intervalo oitava', semitones: 12, difficulty: /** @type {Difficulty} */ ('easy') },
  { slug: 'int-4', title: 'Intervalo 4ª justa', semitones: 5, difficulty: /** @type {Difficulty} */ ('medium') },
  { slug: 'int-6maj', title: 'Intervalo 6ª maior', semitones: 9, difficulty: /** @type {Difficulty} */ ('medium') },
  { slug: 'int-tritone', title: 'Intervalo trítono', semitones: 6, difficulty: /** @type {Difficulty} */ ('hard') },
]
for (const key of FOLK_KEYS) {
  const root = rootMidiFor(key.pc)
  for (const iv of INTERVALS) {
    /** @type {NoteEvent[]} */
    const notes = []
    let t = 0
    for (let i = 0; i < 4; i++) {
      const base = root + i
      notes.push({ midi: base, start: t, duration: 0.4 })
      t += 0.5
      notes.push({ midi: base + iv.semitones, start: t, duration: 0.4 })
      t += 0.7
    }
    addEntry(
      {
        id: `${iv.slug}-${key.id.toLowerCase()}`,
        title: `${iv.title} — ${key.label}`,
        subtitle: 'Exercício de ouvido/técnica',
        tags: ['intervalo', 'técnica', key.id],
        difficulty: iv.difficulty,
        key: key.id,
        category: 'intervalo',
      },
      notes,
      t,
      90,
    )
  }
}

// Folk melodies in common keys
for (const folk of FOLK) {
  for (const key of FOLK_KEYS) {
    const root = rootMidiFor(key.pc)
    const { notes, beats } = melodyFromDegrees(folk.degrees, folk.rhythm, root)
    addEntry(
      {
        id: `${folk.slug}-${key.id.toLowerCase()}`,
        title: `${folk.title} — ${key.label}`,
        subtitle: 'Melodia domínio público / tradicional',
        tags: [...folk.tags, key.id, 'domínio-público'],
        difficulty: folk.difficulty,
        key: key.id,
        category: 'melodia',
      },
      notes,
      beats,
      100,
    )
  }
}

// Chromatic + whole tone (C-rooted family, a few tonics)
for (const key of KEYS.filter((k) => ['C', 'G', 'D', 'A', 'F', 'Bb'].includes(k.id))) {
  const root = rootMidiFor(key.pc)
  /** @type {NoteEvent[]} */
  const notes = []
  let t = 0
  for (let i = 0; i <= 12; i++) {
    notes.push({ midi: root + i, start: t, duration: 0.28 })
    t += 0.32
  }
  for (let i = 11; i >= 0; i--) {
    notes.push({ midi: root + i, start: t, duration: 0.28 })
    t += 0.32
  }
  addEntry(
    {
      id: `chromatic-${key.id.toLowerCase()}`,
      title: `Cromática — ${key.label}`,
      subtitle: 'Sobe e desce',
      tags: ['cromática', 'técnica', key.id],
      difficulty: 'hard',
      key: key.id,
      category: 'escala',
    },
    notes,
    t,
    110,
  )

  /** @type {NoteEvent[]} */
  const wt = []
  let tw = 0
  for (let i = 0; i < 7; i++) {
    wt.push({ midi: root + i * 2, start: tw, duration: 0.4 })
    tw += 0.45
  }
  addEntry(
    {
      id: `wholetone-${key.id.toLowerCase()}`,
      title: `Tom por tom — ${key.label}`,
      tags: ['escala', 'tom-por-tom', key.id],
      difficulty: 'hard',
      key: key.id,
      category: 'escala',
    },
    wt,
    tw,
    96,
  )
}

catalog.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))

const payload = {
  version: 1,
  generatedAt: new Date().toISOString(),
  count: catalog.length,
  categories: [...new Set(catalog.map((c) => c.category))].sort(),
  difficulties: ['easy', 'medium', 'hard'],
  keys: KEYS.map((k) => k.id),
  entries: catalog,
}

writeFileSync(CATALOG_PATH, JSON.stringify(payload, null, 2))

const ts = `/* Auto-generated by scripts/generate-midi-library.mjs — do not edit */
export type MidiDifficulty = 'easy' | 'medium' | 'hard'

export interface MidiCatalogEntry {
  id: string
  title: string
  subtitle?: string
  tags: string[]
  difficulty: MidiDifficulty
  key: string
  category: string
  url: string
  beats: number
}

export interface MidiCatalog {
  version: number
  generatedAt: string
  count: number
  categories: string[]
  difficulties: MidiDifficulty[]
  keys: string[]
  entries: MidiCatalogEntry[]
}

export const MIDI_CATALOG: MidiCatalog = ${JSON.stringify(payload, null, 2)} as const
`

writeFileSync(SRC_CATALOG, ts)

console.log(`Generated ${catalog.length} MIDI files → ${OUT_DIR}`)
console.log(`Catalog → ${CATALOG_PATH}`)
console.log(`TS module → ${SRC_CATALOG}`)
