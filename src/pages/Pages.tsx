import {
  LESSONS,
  displayNote,
  type InstrumentId,
  type LessonDef,
} from '../catalog/lessons'
import {
  PATH_UNITS,
  nextAvailableNode,
  nodeStatus,
  unitProgress,
  unlockedLessons,
  type PathNode,
} from '../catalog/path'
import { loadGame, levelFromXp, xpIntoLevel } from '../game/progress'
import { InstallPwaButton } from '../components/InstallPwa'
import { TipBanner } from '../components/Hint'
import './pages.css'
import './path.css'

export function HomePage({
  instrument,
  cleared,
  onOpenNode,
}: {
  instrument: InstrumentId
  cleared: string[]
  onOpenNode: (node: PathNode) => void
}) {
  const next = nextAvailableNode(cleared)
  const game = loadGame()

  return (
    <section className="page page--path" data-testid="home-path">
      <div className="path-hero">
        <p className="page__kicker">sua trilha</p>
        <h1 className="page__hero">Continue de onde parou</h1>
        <p className="page__lead">
          Streak {game.streakDays}d · nível {levelFromXp(game.xp)} ·{' '}
          {xpIntoLevel(game.xp)}/100 XP
        </p>
        <TipBanner
          title="Como usar"
          body="Toque Continuar para a próxima lição. Em Teoria você lê os conceitos. Em cada instrumento escolha acorde/solo (teclado e violão) ou trastes (baixo)."
        />
        {next ? (
          <button
            type="button"
            className="btn"
            data-testid="cta-continue"
            title="Abre a próxima lição liberada na trilha"
            onClick={() => onOpenNode(next)}
          >
            Continuar: {next.title}
          </button>
        ) : (
          <p className="page__lead">Trilha completa — revise em Praticar.</p>
        )}
        <InstallPwaButton className="btn btn--ghost" label="Instalar app" />
      </div>

      <div className="path" data-testid="learning-path">
        {PATH_UNITS.map((unit) => {
          const { done, total } = unitProgress(unit, cleared)
          return (
            <section key={unit.id} className="path-unit">
              <header className="path-unit__head">
                <h2>{unit.title}</h2>
                <p>
                  {unit.blurb} · {done}/{total}
                </p>
              </header>
              <ol className="path-nodes">
                {unit.nodes.map((node) => {
                  const status = nodeStatus(node.id, cleared)
                  return (
                    <li key={node.id}>
                      <button
                        type="button"
                        className={`path-node path-node--${status}`}
                        data-testid={`path-node-${node.id}`}
                        disabled={status === 'locked'}
                        onClick={() => {
                          if (status === 'locked') return
                          onOpenNode(node)
                        }}
                      >
                        <span className="path-node__mark" aria-hidden>
                          {status === 'cleared'
                            ? '✓'
                            : status === 'available'
                              ? '▶'
                              : '🔒'}
                        </span>
                        <span className="path-node__body">
                          <strong>{node.title}</strong>
                          <em>
                            {node.kind === 'lesson'
                              ? instrument
                              : node.kind === 'voice-tune'
                                ? 'voz · afinador'
                                : 'voz · karaoke'}
                          </em>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </section>
          )
        })}
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
  const unlocked = new Set(
    unlockedLessons(cleared)
      .filter((l) => l.instruments.includes(instrument))
      .map((l) => l.id),
  )
  const list = LESSONS.filter((l) => l.instruments.includes(instrument))
  return (
    <section className="page">
      <h1>Catálogo</h1>
      <p className="page__lead">
        Lições liberadas pela trilha · instrumento{' '}
        <strong>{instrument}</strong>
      </p>
      <ul className="lesson-grid" data-testid="lesson-grid">
        {list.map((lesson) => {
          const open = unlocked.has(lesson.id) || cleared.includes(lesson.id)
          return (
            <li key={lesson.id}>
              <button
                type="button"
                className={`lesson-card${open ? '' : ' is-locked'}`}
                data-testid={`lesson-${lesson.id}`}
                disabled={!open}
                onClick={() => open && onPlay(lesson)}
              >
                <span className="lesson-card__kind">{lesson.kind}</span>
                <strong>{lesson.title}</strong>
                <p>{open ? lesson.blurb : 'Bloqueada — avance na trilha.'}</p>
                <div className="lesson-card__meta">
                  <span>
                    {displayNote(lesson.tonic)} · {lesson.mode}
                  </span>
                  <span>
                    {cleared.includes(lesson.id)
                      ? '✓ clear'
                      : open
                        ? `+${lesson.xpReward} XP`
                        : '🔒'}
                  </span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function PracticePage({
  instrument,
  cleared,
  onPick,
}: {
  instrument: InstrumentId
  cleared: string[]
  onPick: (lesson: LessonDef) => void
}) {
  const drills = unlockedLessons(cleared).filter(
    (l) =>
      l.instruments.includes(instrument) &&
      (l.kind === 'scale' || l.kind === 'degrees' || cleared.includes(l.id)),
  )
  return (
    <section className="page">
      <h1>Praticar</h1>
      <p className="page__lead">
        Só drills já liberados na trilha — sem pular conteúdo.
      </p>
      {drills.length === 0 ? (
        <p className="shell__muted">Complete a primeira lição para liberar drills.</p>
      ) : (
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
      )}
    </section>
  )
}

export function ProgressPage({ cleared }: { cleared: string[] }) {
  const game = loadGame()
  return (
    <section className="page">
      <h1>Progresso</h1>
      <p className="page__lead" data-testid="progress-count">
        {cleared.length} nó(s) na trilha · streak {game.streakDays}d · nível{' '}
        {levelFromXp(game.xp)}
      </p>
      <ul className="progress-stats">
        <li>
          <strong>{game.xp}</strong>
          <span>XP total</span>
        </li>
        <li>
          <strong>{game.bestCombo}</strong>
          <span>melhor combo</span>
        </li>
        <li>
          <strong>{game.lessonsCleared}</strong>
          <span>clears</span>
        </li>
      </ul>
      <h2 className="path-unit__sub">Unidades</h2>
      <ul className="cleared-list">
        {PATH_UNITS.map((unit) => {
          const { done, total } = unitProgress(unit, cleared)
          return (
            <li key={unit.id}>
              {unit.title}: {done}/{total}
            </li>
          )
        })}
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
        <li>Nós na trilha: {PATH_UNITS.reduce((n, u) => n + u.nodes.length, 0)}</li>
        <li>Domínios: localhost, harmusic.pages.dev, harmusic.hipercube.ia.br</li>
      </ul>
    </section>
  )
}
