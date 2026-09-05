import { useMemo } from 'react'
import { NOTE_NAMES, noteToMidi, type NoteName } from '../music/theory'
import './PianoKeyboard.css'

interface PianoKeyboardProps {
  startMidi?: number
  keyCount?: number
  highlighted?: ReadonlySet<number>
  pressed?: ReadonlySet<number>
  showLabels?: boolean
  interactive?: boolean
  onToggle?: (midi: number) => void
}

function isBlack(midi: number): boolean {
  const pc = midi % 12
  return [1, 3, 6, 8, 10].includes(pc)
}

function labelFor(midi: number): string {
  const name = NOTE_NAMES[midi % 12] as NoteName
  const octave = Math.floor(midi / 12) - 1
  return `${name}${octave}`
}

export function PianoKeyboard({
  startMidi = noteToMidi('C', 4),
  keyCount = 15,
  highlighted = new Set(),
  pressed = new Set(),
  showLabels = true,
  interactive = false,
  onToggle,
}: PianoKeyboardProps) {
  const keys = useMemo(
    () => Array.from({ length: keyCount }, (_, i) => startMidi + i),
    [startMidi, keyCount],
  )

  const whites = keys.filter((m) => !isBlack(m))
  const blacks = keys.filter((m) => isBlack(m))

  return (
    <div
      className={`piano ${interactive ? 'piano--interactive' : ''}`}
      role="group"
      aria-label="Teclado de piano"
    >
      <div className="piano__whites">
        {whites.map((midi) => {
          const active = pressed.has(midi)
          const glow = highlighted.has(midi)
          return (
            <button
              key={midi}
              type="button"
              className={[
                'piano__key',
                'piano__key--white',
                active ? 'is-pressed' : '',
                glow ? 'is-lit' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={!interactive}
              aria-pressed={active}
              aria-label={labelFor(midi)}
              onClick={() => onToggle?.(midi)}
            >
              {showLabels ? <span>{labelFor(midi)}</span> : null}
            </button>
          )
        })}
      </div>
      <div className="piano__blacks">
        {blacks.map((midi) => {
          const whiteIndex = whites.findIndex((w) => w > midi) - 1
          const left = whiteIndex < 0 ? 0 : ((whiteIndex + 0.72) / whites.length) * 100
          const active = pressed.has(midi)
          const glow = highlighted.has(midi)
          return (
            <button
              key={midi}
              type="button"
              className={[
                'piano__key',
                'piano__key--black',
                active ? 'is-pressed' : '',
                glow ? 'is-lit' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ left: `${left}%` }}
              disabled={!interactive}
              aria-pressed={active}
              aria-label={labelFor(midi)}
              onClick={() => onToggle?.(midi)}
            />
          )
        })}
      </div>
    </div>
  )
}
