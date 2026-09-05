import {
  MIDI_CATALOG,
  type MidiCatalogEntry,
  type MidiDifficulty,
} from './catalog.generated'

export type { MidiCatalogEntry, MidiDifficulty }
export { MIDI_CATALOG }

export const DIFFICULTY_LABEL: Record<MidiDifficulty, string> = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil',
}

export const CATEGORY_LABEL: Record<string, string> = {
  escala: 'Escalas',
  modo: 'Modos',
  arpejo: 'Arpejos',
  progressão: 'Progressões',
  intervalo: 'Intervalos',
  melodia: 'Melodias',
}

export interface MidiLibraryFilters {
  query: string
  category: string | 'all'
  difficulty: MidiDifficulty | 'all'
  key: string | 'all'
}

export const DEFAULT_MIDI_FILTERS: MidiLibraryFilters = {
  query: '',
  category: 'all',
  difficulty: 'all',
  key: 'all',
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

/** Token search across title, subtitle, tags, key, category. */
export function matchesMidiEntry(
  entry: MidiCatalogEntry,
  filters: MidiLibraryFilters,
): boolean {
  if (filters.category !== 'all' && entry.category !== filters.category) {
    return false
  }
  if (filters.difficulty !== 'all' && entry.difficulty !== filters.difficulty) {
    return false
  }
  if (filters.key !== 'all' && entry.key !== filters.key) {
    return false
  }

  const q = normalize(filters.query)
  if (!q) return true

  const haystack = normalize(
    [
      entry.title,
      entry.subtitle ?? '',
      entry.key,
      entry.category,
      entry.difficulty,
      ...entry.tags,
    ].join(' '),
  )

  return q.split(/\s+/).every((token) => haystack.includes(token))
}

export function filterMidiCatalog(
  filters: MidiLibraryFilters,
  limit = 80,
): { items: MidiCatalogEntry[]; total: number } {
  const matched = MIDI_CATALOG.entries.filter((entry) =>
    matchesMidiEntry(entry, filters),
  )
  return { items: matched.slice(0, limit), total: matched.length }
}

export function featuredMidiEntries(limit = 6): MidiCatalogEntry[] {
  const preferred = [
    'major-scale-c',
    'prog-1451-c',
    'twinkle-c',
    'ode-joy-g',
    'arp-maj-c',
    'prog-251-c',
  ]
  const byId = new Map(MIDI_CATALOG.entries.map((e) => [e.id, e]))
  const picked = preferred
    .map((id) => byId.get(id))
    .filter((e): e is MidiCatalogEntry => Boolean(e))
  if (picked.length >= limit) return picked.slice(0, limit)
  for (const entry of MIDI_CATALOG.entries) {
    if (picked.length >= limit) break
    if (!picked.some((p) => p.id === entry.id)) picked.push(entry)
  }
  return picked
}
