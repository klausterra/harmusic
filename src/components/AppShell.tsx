import { INSTRUMENTS, type InstrumentId } from '../catalog/lessons'
import { useAuth } from '../auth/useAuth'
import { Hint } from './Hint'
import './AppShell.css'

export type AppRoute =
  | { name: 'home' }
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
  const focusMode =
    route.name === 'play' ||
    route.name === 'voice-tune' ||
    route.name === 'voice-karaoke'

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
            Sair da lição
          </button>
        ) : (
          <>
            <nav className="shell__nav" aria-label="Principal">
              {(
                [
                  ['home', 'Trilha'],
                  ['theory', 'Teoria'],
                  ['practice', 'Praticar'],
                  ['midi', 'MIDI'],
                  ['progress', 'Progresso'],
                  ['lessons', 'Catálogo'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={route.name === id ? 'is-active' : ''}
                  title={
                    id === 'home'
                      ? 'Sua sequência de lições — toque Continuar'
                      : id === 'theory'
                        ? 'Teoria musical e tutorial do sistema'
                        : id === 'practice'
                          ? 'Revisar lições já liberadas'
                          : id === 'midi'
                            ? 'Enviar MIDI, ouvir no instrumento e jogar'
                            : id === 'progress'
                              ? 'XP, streak e unidades concluídas'
                              : 'Todas as lições (bloqueadas até liberar na trilha)'
                  }
                  onClick={() => onNavigate({ name: id })}
                >
                  {label}
                </button>
              ))}
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
            <span>Instrumento</span>
            <Hint text="Escolhe piano, violão ou baixo para as lições de instrumento. Não muda as lições de voz." />
          </div>
          {INSTRUMENTS.map((ins) => (
            <button
              key={ins.id}
              type="button"
              className={instrument === ins.id ? 'is-active' : ''}
              data-testid={`instrument-${ins.id}`}
              title={`Treinar no ${ins.label} (${ins.short})`}
              onClick={() => onInstrument(ins.id)}
            >
              {ins.label}
              <small>{ins.short}</small>
            </button>
          ))}
        </div>
      ) : null}

      <main className="shell__main">{children}</main>

      {!focusMode ? (
        <footer className="shell__foot">
          <span>
            {cleared.length}/{pathTotal} na trilha · {instrument}
          </span>
          <span>uma lição por vez</span>
        </footer>
      ) : null}
    </div>
  )
}
