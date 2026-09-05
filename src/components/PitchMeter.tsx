import './PitchMeter.css'

export function PitchMeter({
  cents,
  inTune,
  label,
}: {
  cents: number | null
  inTune: boolean
  label: string
}) {
  const clamped = cents == null ? 0 : Math.max(-50, Math.min(50, cents))
  const pct = ((clamped + 50) / 100) * 100

  return (
    <div
      className={`pitch-meter${inTune ? ' is-tune' : ''}`}
      data-testid="pitch-meter"
    >
      <div className="pitch-meter__label">
        <span>Grave</span>
        <strong>{label}</strong>
        <span>Agudo</span>
      </div>
      <div className="pitch-meter__track" aria-hidden>
        <i className="pitch-meter__center" />
        <b
          className="pitch-meter__needle"
          style={{ left: `${pct}%` }}
        />
      </div>
      <p className="pitch-meter__status" role="status">
        {cents == null
          ? 'Cante a nota…'
          : inTune
            ? 'No tom ✓'
            : cents < 0
              ? 'Mais agudo'
              : 'Mais grave'}
      </p>
    </div>
  )
}
