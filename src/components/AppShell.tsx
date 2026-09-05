import { useState } from 'react'
import { INSTRUMENTS, type InstrumentId } from '../catalog/lessons'
import { useAuth } from '../auth/useAuth'
import { Hint } from './Hint'
import './AppShell.css'

export type AppRoute =
  | { name: 'home' }
  | { name: 'voice' }
  | { name: 'lessons' }
  | { name: 'practice' }
  | { name: 'progress' }
  | { name: 'theory' }
  | { name: 'midi' }
  | { name: 'admin' }
  | { name: 'play'; lessonId: string; instrument: InstrumentId }
  | { name: 'voice-tune'; nodeId: string }
  | { name: 'voice-karaoke'; nodeId: string; lessonId: string }

interface AppShellProps {
  route: AppRoute
  instrument: InstrumentId
  cleared: string[]
  pathTotal: number
  onNavigate: (route: AppRoute) => void
  onInstrument: (id: InstrumentId) => void
  children: React.ReactNode
}

const PRIMARY_NAV = [
  { id: 'home' as const, label: 'Início', title: 'Propósito, próxima lição e trilha' },
  { id: 'voice' as const, label: 'Canto', title: 'Afinador e karaoke de voz' },
  { id: 'midi' as const, label: 'MIDI', title: 'Treinar com arquivos MIDI' },
  { id: 'progress' as const, label: 'Progresso', title: 'XP e unidades' },
]

const MORE_NAV = [
  { id: 'practice' as const, label: 'Praticar' },
  { id: 'lessons' as const, label: 'Catálogo' },
  { id: 'theory' as const, label: 'Como funciona' },
]

export function AppShell({
  route,
  instrument,
  cleared,
  pathTotal,
  onNavigate,
  onInstrument,
  children,
}: AppShellProps) {
  const { user, isAdmin, signInWithGoogle, signOut, loading } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)
  const focusMode =
    route.name === 'play' ||
    route.name === 'voice-tune' ||
    route.name === 'voice-karaoke'

  const moreActive = MORE_NAV.some((n) => n.id === route.name)

  return (
    <div className={`shell${focusMode ? ' shell--focus' : ''}`}>
      <header className="shell__top">
        <button
          type="button"
          className="shell__brand"
          onClick={() => onNavigate({ name: 'home' })}
        >
          Harmusic
        </button>
        {focusMode ? (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => onNavigate({ name: 'home' })}
          >
            Voltar ao início
          </button>
        ) : (
          <>
            <nav className="shell__nav" aria-label="Principal">
              {PRIMARY_NAV.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={route.name === item.id ? 'is-active' : ''}
                  title={item.title}
                  onClick={() => {
                    setMoreOpen(false)
                    onNavigate({ name: item.id })
                  }}
                >
                  {item.label}
                </button>
              ))}
              <div className="shell__more">
                <button
                  type="button"
                  className={moreActive || moreOpen ? 'is-active' : ''}
                  aria-expanded={moreOpen}
                  onClick={() => setMoreOpen((v) => !v)}
                >
                  Mais
                </button>
                {moreOpen ? (
                  <div className="shell__more-panel" role="menu">
                    {MORE_NAV.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        className={route.name === item.id ? 'is-active' : ''}
                        onClick={() => {
                          setMoreOpen(false)
                          onNavigate({ name: item.id })
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              {isAdmin ? (
                <button
                  type="button"
                  className={route.name === 'admin' ? 'is-active' : ''}
                  onClick={() => onNavigate({ name: 'admin' })}
                >
                  Admin
                </button>
              ) : null}
            </nav>
            <div className="shell__auth">
              {loading ? (
                <span className="shell__muted">…</span>
              ) : user ? (
                <>
                  <span className="shell__user" title={user.email ?? ''}>
                    {user.displayName ?? user.email}
                    {isAdmin ? <em>admin</em> : null}
                  </span>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => void signOut()}
                  >
                    Sair
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn--sm"
                  data-testid="login-google"
                  onClick={() => void signInWithGoogle()}
                >
                  Entrar com Google
                </button>
              )}
            </div>
          </>
        )}
      </header>

      {!focusMode ? (
        <div className="shell__instruments" role="group" aria-label="Instrumento">
          <div className="shell__instruments-label">
            <span>Seu instrumento</span>
            <Hint text="Vale para lições e MIDI. Canto usa o microfone, não este seletor." />
          </div>
          {INSTRUMENTS.map((ins) => (
            <button
              key={ins.id}
              type="button"
              className={instrument === ins.id ? 'is-active' : ''}
              data-testid={`instrument-${ins.id}`}
              title={`Treinar no ${ins.label}`}
              onClick={() => onInstrument(ins.id)}
            >
              {ins.label}
            </button>
          ))}
        </div>
      ) : null}

      <main className="shell__main">{children}</main>

      {!focusMode ? (
        <footer className="shell__foot">
          <span>
            {cleared.length}/{pathTotal} concluídos
          </span>
          <span>uma lição por vez</span>
        </footer>
      ) : null}
    </div>
  )
}
