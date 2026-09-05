import {
  LESSONS,
  displayNote,
  type InstrumentId,
  type LessonDef,
} from '../catalog/lessons'
import './pages.css'

export function HomePage({
  instrument,
  onOpenLessons,
  onContinue,
}: {
  instrument: InstrumentId
  onOpenLessons: () => void
  onContinue: (lesson: LessonDef) => void
}) {
  const first = LESSONS.find((l) => l.instruments.includes(instrument)) ?? LESSONS[0]
  return (
    <section className="page page--home">
      <p className="page__kicker">sistema harmônico interativo</p>
      <h1 className="page__hero">Ouça. Monte. Toque.</h1>
      <p className="page__lead">
        Escalas, graus e progressões em piano, violão e baixo — com o fluxo
        ver → ouvir → montar → encontrar → tocar.
      </p>
      <div className="page__cta">
        <button type="button" className="btn" onClick={onOpenLessons} data-testid="cta-lessons">
          Ver catálogo
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          data-testid="cta-continue"
          onClick={() => onContinue(first)}
        >
          Continuar: {first.title}
        </button>
      </div>
    </section>
  )
}

export function LessonsPage({
  instrument,
  cleared,
  onPlay,
}: {
  instrument: InstrumentId
  cleared: string[]
  onPlay: (lesson: LessonDef) => void
}) {
  const list = LESSONS.filter((l) => l.instruments.includes(instrument))
  return (
    <section className="page">
      <h1>Lições</h1>
      <p className="page__lead">
        Instrumento atual: <strong>{instrument}</strong>
      </p>
      <ul className="lesson-grid" data-testid="lesson-grid">
        {list.map((lesson) => (
          <li key={lesson.id}>
            <button
              type="button"
              className="lesson-card"
              data-testid={`lesson-${lesson.id}`}
              onClick={() => onPlay(lesson)}
            >
              <span className="lesson-card__kind">{lesson.kind}</span>
              <strong>{lesson.title}</strong>
              <p>{lesson.blurb}</p>
              <div className="lesson-card__meta">
                <span>
                  {displayNote(lesson.tonic)} · {lesson.mode}
                </span>
                <span>{cleared.includes(lesson.id) ? '✓ clear' : `+${lesson.xpReward} XP`}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function PracticePage({
  instrument,
  onPick,
}: {
  instrument: InstrumentId
  onPick: (lesson: LessonDef) => void
}) {
  const drills = LESSONS.filter(
    (l) =>
      l.instruments.includes(instrument) &&
      (l.kind === 'scale' || l.kind === 'degrees'),
  )
  return (
    <section className="page">
      <h1>Praticar</h1>
      <p className="page__lead">Drills rápidos de escala e graus.</p>
      <ul className="lesson-grid">
        {drills.map((lesson) => (
          <li key={lesson.id}>
            <button
              type="button"
              className="lesson-card"
              onClick={() => onPick(lesson)}
            >
              <strong>{lesson.title}</strong>
              <p>{lesson.blurb}</p>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ProgressPage({ cleared }: { cleared: string[] }) {
  return (
    <section className="page">
      <h1>Progresso</h1>
      <p className="page__lead" data-testid="progress-count">
        {cleared.length} lição(ões) concluída(s).
      </p>
      <ul className="cleared-list">
        {cleared.length === 0 ? (
          <li className="shell__muted">Nenhuma clear ainda — comece pelo I–IV–V–I.</li>
        ) : (
          cleared.map((id) => {
            const lesson = LESSONS.find((l) => l.id === id)
            return <li key={id}>{lesson?.title ?? id}</li>
          })
        )}
      </ul>
    </section>
  )
}

export function AdminPage() {
  return (
    <section className="page" data-testid="admin-page">
      <h1>Admin</h1>
      <p className="page__lead">
        Área restrita a <code>klausqterra@gmail.com</code>.
      </p>
      <ul className="admin-list">
        <li>Projeto Firebase: <code>empreenderia</code> (app Harmusic)</li>
        <li>Auth: Google apenas</li>
        <li>Lições no catálogo: {LESSONS.length}</li>
        <li>Domínios: localhost, harmusic.pages.dev, harmusic.hipercube.ia.br</li>
      </ul>
    </section>
  )
}

export function LoginGate({
  onLogin,
  error,
}: {
  onLogin: () => void
  error: string | null
}) {
  return (
    <section className="page page--login" data-testid="login-gate">
      <p className="page__kicker">Harmusic</p>
      <h1>Entre para treinar</h1>
      <p className="page__lead">
        Login com Google. Progresso e conquistas ficam na sua sessão.
      </p>
      <button
        type="button"
        className="btn"
        data-testid="login-google-gate"
        onClick={onLogin}
      >
        Continuar com Google
      </button>
      {error ? <p className="feedback feedback--bad">{error}</p> : null}
    </section>
  )
}
