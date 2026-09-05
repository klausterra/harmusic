import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MIDI_FILTERS,
  filterMidiCatalog,
  matchesMidiEntry,
  MIDI_CATALOG,
} from './catalog'

describe('midi catalog', () => {
  it('ships a large searchable library', () => {
    expect(MIDI_CATALOG.count).toBeGreaterThanOrEqual(200)
    expect(MIDI_CATALOG.entries).toHaveLength(MIDI_CATALOG.count)
  })

  it('filters by free-text across title and tags', () => {
    const { items, total } = filterMidiCatalog({
      ...DEFAULT_MIDI_FILTERS,
      query: 'blues sol',
    })
    expect(total).toBeGreaterThan(0)
    expect(items.every((e) => matchesMidiEntry(e, { ...DEFAULT_MIDI_FILTERS, query: 'blues sol' }))).toBe(
      true,
    )
  })

  it('filters by category and key', () => {
    const { items, total } = filterMidiCatalog({
      ...DEFAULT_MIDI_FILTERS,
      category: 'progressão',
      key: 'C',
    })
    expect(total).toBeGreaterThan(0)
    expect(items.every((e) => e.category === 'progressão' && e.key === 'C')).toBe(
      true,
    )
  })

  it('normalizes accents in search', () => {
    const { total } = filterMidiCatalog({
      ...DEFAULT_MIDI_FILTERS,
      query: 'progressao',
    })
    expect(total).toBeGreaterThan(0)
  })
})
