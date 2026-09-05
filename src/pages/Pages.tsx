import {
  LESSONS,
  displayNote,
  type InstrumentId,
  type LessonDef,
} from '../catalog/lessons'
import {
  PATH_UNITS,
  nextAvailableNode,
  nextVoiceNode,
  nodeStatus,
  unitProgress,
  unlockedLessons,
  voicePathNodes,
  type PathNode,
} from '../catalog/path'
import { loadGame, levelFromXp, xpIntoLevel } from '../game/progress'
import { InstallPwaButton } from '../components/InstallPwa'
import type { AppRoute } from '../components/AppShell'
import './pages.css'
import './path.css'

export function HomePage({
  instrument,
  cleared,
  onOpenNode,
  onNavigate,
}: {
  instrument: InstrumentId
  cleared: string[]
  onOpenNode: (node: PathNode) => void
  onNavigate: (route: AppRoute) => void
}) {
  const next = nextAvailableNode(cleared)
  const nextVoice = nextVoiceNode(cleared)
  const game = loadGame()
  const isFresh = cleared.length === 0

  return (
    <section className="page page--home-hub" data-testid="home-path">
      <header className="hub-hero">
        <p className="page__kicker">aprender harmonia tocando</p>
        <h1 className="page__hero">
          {isFresh
            ? 'Comece pelo ouvido e pelo instrumento'
            : 'Continue sua prática'}
        </h1>
        <p className="page__lead page__lead--wide">
          {isFresh
            ? 'O Harmusic ensina graus e progressões no piano, violão ou baixo — e também com a voz. Uma lição por vez, no seu ritmo.'
            : `Próximo passo claro abaixo. Streak ${game.streakDays}d · nível ${levelFromXp(game.xp)} · ${xpIntoLevel(game.xp)}/100 XP.`}
        </p>

        <div className="hub-cta-row">
          {next ? (
            <button
              type="button"
              className="btn btn--lg"
              data-testid="cta-continue"
              onClick={() => onOpenNode(next)}
            >
              {isFresh ? 'Começar agora' : 'Continuar'}: {next.title}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--lg"
              onClick={() => onNavigate({ name: 'practice' })}
            >
              Revisar o que já aprendeu
            </button>
          )}
          <InstallPwaButton className="btn btn--ghost" label="Instalar app" />
        </div>
      </header>

      <div className="hub-doors" aria-label="Caminhos principais">
        <button
          type="button"
          className="hub-door"
          onClick={() =>
            next ? onOpenNode(next) : onNavigate({ name: 'practice' })
          }
        >
          <em>01 · instrumento</em>
          <strong>Aprender tocando</strong>
          <span>
            Lições guiadas no{' '}
            {instrument === 'piano'
              ? 'piano'
              : instrument === 'guitar'
                ? 'violão'
                : 'baixo'}
            : ver → ouvir → montar → tocar.
          </span>
        </button>
        <button
          type="button"
          className="hub-door"
          data-testid="hub-door-voice"
          onClick={() => onNavigate({ name: 'voice' })}
        >
          <em>02 · voz</em>
          <strong>Menu voz</strong>
          <span>
            {nextVoice
              ? `Afinador e karaoke · próximo: ${nextVoice.title}`
              : 'Só microfone: afinador de graus e karaoke da progressão.'}
          </span>
        </button>
        <button
          type="button"
          className="hub-door"
          data-testid="hub-door-midi"
          onClick={() => onNavigate({ name: 'midi' })}
        >
          <em>03 · suas músicas</em>
          <strong>Praticar com MIDI</strong>
          <span>
            Envie um arquivo ou use um exemplo e veja onde tocar no instrumento.
          </span>
        </button>
      </div>

      <div className="path path--relaxed" data-testid="learning-path">
        <div className="path-section-head">
          <h2>Sua trilha</h2>
          <p>Avance na ordem. Cadeado = ainda bloqueado.</p>
        </div>
        {PATH_UNITS.map((unit) => {
          const { done, total } = unitProgress(unit, cleared)
          return (
            <section key={unit.id} className="path-unit">
              <header className="path-unit__head">
                <h3>{unit.title}</h3>
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
                              : '·'}
                        </span>
                        <span className="path-node__body">
                          <strong>{node.title}</strong>
                          <em>
                            {node.kind === 'lesson'
                              ? `instrumento · ${instrument}`
                              : node.kind === 'voice-tune'
                                ? 'canto · afinador'
                                : 'canto · karaoke'}
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

export function VoicePage({
  cleared,
  onOpenNode,
}: {
  cleared: string[]
  onOpenNode: (node: PathNode) => void
}) {
  const nodes = voicePathNodes()
  const tuneNodes = nodes.filter((n) => n.kind === 'voice-tune')
  const karaokeNodes = nodes.filter((n) => n.kind === 'voice-karaoke')
  const next = nextVoiceNode(cleared)
  const nextTune = tuneNodes.find((n) => nodeStatus(n.id, cleared) !== 'locked')
  const nextKaraoke = karaokeNodes.find(
    (n) => nodeStatus(n.id, cleared) !== 'locked',
  )

  function renderList(list: PathNode[], empty: string) {
    if (list.length === 0) {
      return <p className="page__lead">{empty}</p>
    }
    return (
      <ul className="voice-list">
        {list.map((node) => {
          const status = nodeStatus(node.id, cleared)
          return (
            <li key={node.id}>
              <button
                type="button"
                className={`voice-card voice-card--${status}`}
                data-testid={`voice-node-${node.id}`}
                disabled={status === 'locked'}
                onClick={() => {
                  if (status === 'locked') return
                  onOpenNode(node)
                }}
              >
                <strong>{node.title}</strong>
                <span>
                  {node.kind === 'voice-tune'
                    ? 'Afinador de graus'
                    : 'Karaoke harmônico'}
                  {status === 'locked'
                    ? ' · bloqueado na trilha — avance no Início'
                    : status === 'cleared'
                      ? ' · concluído'
                      : ' · liberado'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <section className="page page--voice-hub" data-testid="voice-page">
      <header className="hub-hero">
        <p className="page__kicker">menu voz</p>
        <h1 className="page__hero">Só canto</h1>
        <p className="page__lead page__lead--wide">
          Aqui não há piano, violão nem baixo — só microfone. Escolha afinador
          ou karaoke.
        </p>
        {next ? (
          <button
            type="button"
            className="btn btn--lg"
            data-testid="cta-voice-next"
            onClick={() => onOpenNode(next)}
          >
            Continuar: {next.title}
          </button>
        ) : null}
      </header>

      <div className="voice-menu-doors" aria-label="Tipos de exercício">
        <button
          type="button"
          className="voice-menu-door"
          data-testid="voice-menu-open-tune"
          disabled={!nextTune}
          onClick={() => nextTune && onOpenNode(nextTune)}
        >
          <em>01</em>
          <strong>Afinador</strong>
          <span>
            {nextTune
              ? `Abrir: ${nextTune.title}`
              : 'Nenhum afinador liberado ainda — avance a trilha no Início.'}
          </span>
        </button>
        <button
          type="button"
          className="voice-menu-door"
          data-testid="voice-menu-open-karaoke"
          disabled={!nextKaraoke}
          onClick={() => nextKaraoke && onOpenNode(nextKaraoke)}
        >
          <em>02</em>
          <strong>Karaoke</strong>
          <span>
            {nextKaraoke
              ? `Abrir: ${nextKaraoke.title}`
              : 'Nenhum karaoke liberado ainda — conclua I–IV–V–I e o afinador.'}
          </span>
        </button>
      </div>

      <section id="voice-menu-afinador" className="voice-menu-section">
        <h2>Afinador</h2>
        <p>Cante um grau e segure no tom com o medidor.</p>
        {renderList(tuneNodes, 'Nenhum exercício de afinador no catálogo.')}
      </section>

      <section id="voice-menu-karaoke" className="voice-menu-section">
        <h2>Karaoke</h2>
        <p>A progressão toca; você canta a fundamental de cada acorde.</p>
        {renderList(karaokeNodes, 'Nenhum karaoke no catálogo.')}
      </section>

      <section id="voice-menu-todos" className="voice-menu-section">
        <h2>Todos</h2>
        <p>Lista completa do menu voz.</p>
        {renderList(nodes, 'Nenhum exercício de voz.')}
      </section>
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
      <p className="page__kicker">todas as lições</p>
      <h1>Catálogo</h1>
      <p className="page__lead page__lead--wide">
        Instrumento: <strong>{instrument}</strong>. Prefira a trilha no Início;
        aqui você só revisa o que já liberou.
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
                        : 'bloqueada'}
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
      <p className="page__kicker">revisão</p>
      <h1>Praticar</h1>
      <p className="page__lead page__lead--wide">
        Refaça escalas e progressões já liberadas — sem pular a trilha.
      </p>
      {drills.length === 0 ? (
        <p className="shell__muted">
          Complete a primeira lição no Início para liberar drills.
        </p>
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
      <p className="page__kicker">suas métricas</p>
      <h1>Progresso</h1>
      <p className="page__lead page__lead--wide" data-testid="progress-count">
        {cleared.length} nó(s) · streak {game.streakDays}d · nível{' '}
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
      <p className="page__kicker">administração</p>
      <h1>Admin</h1>
      <p className="page__lead">
        Área restrita a <code>klausqterra@gmail.com</code>.
      </p>
      <ul className="admin-list">
        <li>
          Projeto Firebase: <code>empreenderia</code> (app Harmusic)
        </li>
        <li>Auth: Google apenas</li>
        <li>Lições no catálogo: {LESSONS.length}</li>
        <li>
          Nós na trilha: {PATH_UNITS.reduce((n, u) => n + u.nodes.length, 0)}
        </li>
        <li>
          Domínios: localhost, harmusic.pages.dev, harmusic.hipercube.ia.br
        </li>
      </ul>
    </section>
  )
}
