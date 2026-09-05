import { useMemo } from 'react'
import {
  BASS_OPEN,
  GUITAR_OPEN,
  fretboardMidi,
  type NoteName,
  NOTE_NAMES,
} from '../music/theory'
import './Fretboard.css'

interface FretboardProps {
  kind: 'guitar' | 'bass'
  frets?: number
  highlighted?: ReadonlySet<number>
  pressed?: ReadonlySet<number>
  interactive?: boolean
  onToggle?: (midi: number) => void
}

const GUITAR_LABELS = ['E', 'A', 'D', 'G', 'B', 'E']
const BASS_LABELS = ['E', 'A', 'D', 'G']

export function Fretboard({
  kind,
  frets = 8,
  highlighted = new Set(),
  pressed = new Set(),
  interactive = false,
  onToggle,
}: FretboardProps) {
  const open = kind === 'guitar' ? GUITAR_OPEN : BASS_OPEN
  const labels = kind === 'guitar' ? GUITAR_LABELS : BASS_LABELS
  const strings = useMemo(
    () =>
      open.map((_, stringIndex) =>
        Array.from({ length: frets + 1 }, (_, fret) => ({
          stringIndex,
          fret,
          midi: fretboardMidi(open, stringIndex, fret),
        })),
      ),
    [open, frets],
  )

  return (
    <div
      className={`fretboard fretboard--${kind} ${interactive ? 'is-interactive' : ''}`}
      role="group"
      aria-label={kind === 'guitar' ? 'Braço do violão' : 'Braço do baixo'}
    >
      <div className="fretboard__nut">
        {labels.map((l, i) => (
          <span key={`${l}-${i}`}>{l}</span>
        ))}
      </div>
      <div
        className="fretboard__grid"
        style={{
          gridTemplateColumns: `repeat(${frets}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${open.length}, 28px)`,
        }}
      >
        {strings.map((row, s) =>
          row.slice(1).map((cell) => {
            const lit = highlighted.has(cell.midi) || [...highlighted].some((m) => m % 12 === cell.midi % 12)
            const active =
              pressed.has(cell.midi) ||
              [...pressed].some((m) => m % 12 === cell.midi % 12 && Math.abs(m - cell.midi) < 12)
            const name = NOTE_NAMES[cell.midi % 12] as NoteName
            return (
              <button
                key={`${s}-${cell.fret}`}
                type="button"
                className={[
                  'fretboard__cell',
                  lit ? 'is-lit' : '',
                  active ? 'is-pressed' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ gridColumn: cell.fret, gridRow: s + 1 }}
                disabled={!interactive}
                aria-label={`${name} corda ${s + 1} casa ${cell.fret}`}
                onClick={() => onToggle?.(cell.midi)}
              >
                {lit || active ? name.replace('#', '♯') : ''}
              </button>
            )
          }),
        )}
      </div>
      <div className="fretboard__frets" aria-hidden>
        {Array.from({ length: frets }, (_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
    </div>
  )
}
