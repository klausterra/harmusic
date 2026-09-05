import { useDeferredValue, useMemo, useState } from 'react'
import {
  CATEGORY_LABEL,
  DEFAULT_MIDI_FILTERS,
  DIFFICULTY_LABEL,
  filterMidiCatalog,
  featuredMidiEntries,
  MIDI_CATALOG,
  type MidiCatalogEntry,
  type MidiLibraryFilters,
} from '../midi/catalog'
import './MidiLibrary.css'

interface MidiLibraryProps {
  onSelect: (entry: MidiCatalogEntry) => void
  onUpload: (file: File | null) => void
  loading?: boolean
}

export function MidiLibrary({ onSelect, onUpload, loading }: MidiLibraryProps) {
  const [filters, setFilters] = useState<MidiLibraryFilters>(DEFAULT_MIDI_FILTERS)
  const deferredQuery = useDeferredValue(filters.query)

  const { items, total } = useMemo(
    () =>
      filterMidiCatalog(
        {
          query: deferredQuery,
          category: filters.category,
          difficulty: filters.difficulty,
          key: filters.key,
        },
        100,
      ),
    [deferredQuery, filters.category, filters.difficulty, filters.key],
  )

  const featured = useMemo(() => featuredMidiEntries(6), [])
  const searching = Boolean(normalizeQuick(filters.query)) ||
    filters.category !== 'all' ||
    filters.difficulty !== 'all' ||
    filters.key !== 'all'

  function patch(partial: Partial<MidiLibraryFilters>) {
    setFilters((prev) => ({ ...prev, ...partial }))
  }

  return (
    <div className="midi-lib" data-testid="midi-library">
      <div className="midi-lib__intro">
        <div>
          <p className="midi-lib__title">Biblioteca MIDI</p>
          <p className="midi-lib__lead">
            {MIDI_CATALOG.count} peças didáticas · domínio público / exercício —
            busque por nome, tom, tag ou categoria.
          </p>
        </div>
        <label className="midi-lib__upload">
          Enviar meu MIDI
          <input
            type="file"
            accept=".mid,.midi,audio/midi,audio/x-midi"
            data-testid="midi-upload"
            onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <div className="midi-lib__search">
        <input
          type="search"
          value={filters.query}
          onChange={(e) => patch({ query: e.target.value })}
          placeholder="Buscar: blues, Sol, ii-V-I, twinkle…"
          aria-label="Buscar na biblioteca MIDI"
          data-testid="midi-library-search"
          autoComplete="off"
        />
        <p className="midi-lib__count" data-testid="midi-library-count">
          {loading ? 'Carregando…' : `${total} resultado${total === 1 ? '' : 's'}`}
        </p>
      </div>

      <div className="midi-lib__filters" role="group" aria-label="Filtros">
        <label>
          Categoria
          <select
            value={filters.category}
            onChange={(e) => patch({ category: e.target.value })}
            data-testid="midi-filter-category"
          >
            <option value="all">Todas</option>
            {MIDI_CATALOG.categories.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c] ?? c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Nível
          <select
            value={filters.difficulty}
            onChange={(e) =>
              patch({
                difficulty: e.target.value as MidiLibraryFilters['difficulty'],
              })
            }
            data-testid="midi-filter-difficulty"
          >
            <option value="all">Todos</option>
            {MIDI_CATALOG.difficulties.map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_LABEL[d]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tom
          <select
            value={filters.key}
            onChange={(e) => patch({ key: e.target.value })}
            data-testid="midi-filter-key"
          >
            <option value="all">Todos</option>
            {MIDI_CATALOG.keys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        {searching ? (
          <button
            type="button"
            className="midi-lib__clear"
            onClick={() => setFilters(DEFAULT_MIDI_FILTERS)}
          >
            Limpar
          </button>
        ) : null}
      </div>

      {!searching ? (
        <div className="midi-lib__featured">
          <p className="midi-lib__section-label">Sugestões</p>
          <div className="midi-lib__grid">
            {featured.map((entry) => (
              <LibraryCard
                key={entry.id}
                entry={entry}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="midi-lib__results">
        <p className="midi-lib__section-label">
          {searching ? 'Resultados' : 'Explorar'}
        </p>
        {items.length === 0 ? (
          <p className="midi-lib__empty">Nada encontrado — tente outro termo.</p>
        ) : (
          <ul className="midi-lib__list">
            {items.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className="midi-lib__row"
                  data-testid={`midi-lib-item-${entry.id}`}
                  onClick={() => onSelect(entry)}
                >
                  <span className="midi-lib__row-main">
                    <strong>{entry.title}</strong>
                    <span>
                      {CATEGORY_LABEL[entry.category] ?? entry.category}
                      {' · '}
                      {DIFFICULTY_LABEL[entry.difficulty]}
                      {' · '}
                      {entry.key}
                    </span>
                  </span>
                  <span className="midi-lib__row-cta">Abrir</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {total > items.length ? (
          <p className="midi-lib__more">
            Mostrando {items.length} de {total} — refine a busca para ver o resto.
          </p>
        ) : null}
      </div>
    </div>
  )
}

function LibraryCard({
  entry,
  onSelect,
}: {
  entry: MidiCatalogEntry
  onSelect: (entry: MidiCatalogEntry) => void
}) {
  return (
    <button
      type="button"
      className="midi-lib__card"
      data-testid={`midi-example-${entry.id}`}
      onClick={() => onSelect(entry)}
    >
      <strong>{entry.title}</strong>
      <span>
        {DIFFICULTY_LABEL[entry.difficulty]} · {entry.key}
      </span>
    </button>
  )
}

function normalizeQuick(text: string): string {
  return text.trim()
}
