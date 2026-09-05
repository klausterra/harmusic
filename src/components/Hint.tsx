import { useId, useState, type ReactNode } from 'react'
import './Hint.css'

/**
 * Desktop: show tip on hover/focus.
 * Touch: tap the ? to toggle (hover is unreliable on mobile).
 */
export function Hint({
  text,
  children,
  label = 'Ajuda',
}: {
  text: string
  children?: ReactNode
  label?: string
}) {
  const id = useId()
  const [open, setOpen] = useState(false)

  return (
    <span className={`hint${open ? ' is-open' : ''}`}>
      {children}
      <button
        type="button"
        className="hint__btn"
        aria-label={label}
        aria-describedby={id}
        aria-expanded={open}
        title={text}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        onBlur={() => setOpen(false)}
      />
      <span id={id} role="tooltip" className="hint__tip">
        {text}
      </span>
    </span>
  )
}

export function TipBanner({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return (
    <aside className="tip-banner" data-testid="tip-banner">
      <strong>{title}</strong>
      <p>{body}</p>
    </aside>
  )
}
