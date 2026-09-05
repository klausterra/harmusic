import type { InstrumentId } from '../catalog/lessons'
import { Fretboard } from './Fretboard'
import { PianoKeyboard } from './PianoKeyboard'

interface InstrumentViewProps {
  instrument: InstrumentId
  highlighted?: ReadonlySet<number>
  pressed?: ReadonlySet<number>
  showLabels?: boolean
  interactive?: boolean
  onToggle?: (midi: number) => void
}

export function InstrumentView({
  instrument,
  highlighted,
  pressed,
  showLabels,
  interactive,
  onToggle,
}: InstrumentViewProps) {
  if (instrument === 'guitar' || instrument === 'bass') {
    return (
      <Fretboard
        kind={instrument}
        highlighted={highlighted}
        pressed={pressed}
        interactive={interactive}
        onToggle={onToggle}
      />
    )
  }

  return (
    <PianoKeyboard
      highlighted={highlighted}
      pressed={pressed}
      showLabels={showLabels}
      interactive={interactive}
      onToggle={onToggle}
    />
  )
}
