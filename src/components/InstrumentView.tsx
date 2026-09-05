import type { InstrumentId } from '../catalog/lessons'
import {
  BASS_FRET_OPTIONS,
  type BassFrets,
  type InstrumentPrefs,
  type PlayStyle,
} from '../instrument/prefs'
import { Fretboard } from './Fretboard'
import { PianoKeyboard } from './PianoKeyboard'
import { Hint } from './Hint'
import './InstrumentView.css'

interface InstrumentViewProps {
  instrument: InstrumentId
  prefs: InstrumentPrefs
  onPrefsChange: (next: InstrumentPrefs) => void
  highlighted?: ReadonlySet<number>
  pressed?: ReadonlySet<number>
  showLabels?: boolean
  interactive?: boolean
  onToggle?: (midi: number) => void
  pianoRange?: { startMidi: number; keyCount: number }
}

function StyleToggle({
  value,
  onChange,
}: {
  value: PlayStyle
  onChange: (v: PlayStyle) => void
}) {
  return (
    <div className="inst-toggle" role="group" aria-label="Modo de toque">
      <button
        type="button"
        className={value === 'chord' ? 'is-on' : ''}
        title="Toca e exige a tríade completa"
        onClick={() => onChange('chord')}
      >
        Acorde
      </button>
      <button
        type="button"
        className={value === 'solo' ? 'is-on' : ''}
        title="Toca e exige só a nota / root"
        onClick={() => onChange('solo')}
      >
        Solo
      </button>
    </div>
  )
}

export function InstrumentView({
  instrument,
  prefs,
  onPrefsChange,
  highlighted,
  pressed,
  showLabels,
  interactive,
  onToggle,
  pianoRange,
}: InstrumentViewProps) {
  return (
    <div className="inst-view" data-testid={`inst-view-${instrument}`}>
      <div className="inst-toolbar">
        {instrument === 'piano' ? (
          <>
            <span className="inst-toolbar__label">
              Teclado
              <Hint text="Acorde = tríade. Solo = uma nota (root do grau)." />
            </span>
            <StyleToggle
              value={prefs.pianoStyle}
              onChange={(pianoStyle) =>
                onPrefsChange({ ...prefs, pianoStyle })
              }
            />
          </>
        ) : null}

        {instrument === 'guitar' ? (
          <>
            <span className="inst-toolbar__label">
              Violão
              <Hint text="Acorde destaca a tríade no braço. Solo foca a root." />
            </span>
            <StyleToggle
              value={prefs.guitarStyle}
              onChange={(guitarStyle) =>
                onPrefsChange({ ...prefs, guitarStyle })
              }
            />
          </>
        ) : null}

        {instrument === 'bass' ? (
          <>
            <span className="inst-toolbar__label">
              Baixo
              <Hint text="Som grave dedicado. Mais trastes = mais casas no braço." />
            </span>
            <div className="inst-toggle" role="group" aria-label="Número de trastes">
              {BASS_FRET_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={prefs.bassFrets === n ? 'is-on' : ''}
                  title={`${n} trastes`}
                  onClick={() =>
                    onPrefsChange({ ...prefs, bassFrets: n as BassFrets })
                  }
                >
                  {n}f
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {instrument === 'guitar' || instrument === 'bass' ? (
        <Fretboard
          kind={instrument}
          frets={instrument === 'bass' ? prefs.bassFrets : 12}
          highlighted={highlighted}
          pressed={pressed}
          interactive={interactive}
          onToggle={onToggle}
        />
      ) : (
        <PianoKeyboard
          startMidi={pianoRange?.startMidi}
          keyCount={pianoRange?.keyCount}
          highlighted={highlighted}
          pressed={pressed}
          showLabels={showLabels}
          interactive={interactive}
          onToggle={onToggle}
        />
      )}
    </div>
  )
}
